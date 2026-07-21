const logger = require('../../utils/logger');
const AICache = require('./AICache');
const { getTextProvider, getImageProvider } = require('./AIProviderFactory');
const {
  normaliseTextRequest,
  buildTextGenerationRequest,
  parseGeneratedText,
} = require('./PromptBuilder');
const {
  resolveImageSize,
  resolveImageQuality,
  buildImagePrompt,
  createPlaceholderImage,
} = require('./ImageProvider');
const { normaliseLayoutRequest, generateLayoutSuggestion } = require('./LayoutSuggestion');

const cache = new AICache({ maxEntries: 250 });
const TEXT_CACHE_TTL_MS = 15 * 60 * 1000;
const LAYOUT_CACHE_TTL_MS = 30 * 60 * 1000;

function cacheScope(userId, operation, payload) {
  return cache.createKey(operation, { userId: String(userId), payload });
}

async function generateText(userId, payload, signal) {
  const request = normaliseTextRequest(payload);
  const key = cacheScope(userId, 'text', request);
  const cached = cache.get(key);
  if (cached) return { ...cached, meta: { ...cached.meta, cached: true } };

  const provider = getTextProvider();
  const generation = buildTextGenerationRequest(request);

  try {
    const providerResult = await provider.generateText({ ...generation, signal });
    const parsed = parseGeneratedText(providerResult.text, request);
    const result = {
      ...parsed,
      meta: {
        cached: false,
        provider: provider.name,
        blockType: request.blockType,
        field: request.field,
      },
    };
    cache.set(key, result, TEXT_CACHE_TTL_MS);
    return result;
  } catch (error) {
    logger.warn('AI text generation failed', {
      provider: provider.name,
      statusCode: error?.statusCode,
    });
    throw error;
  }
}

async function generateImage(userId, payload = {}, signal) {
  const mode = payload.mode === 'placeholder' ? 'placeholder' : 'generate';
  if (mode === 'placeholder') {
    const result = createPlaceholderImage(payload);
    return {
      ...result,
      meta: { cached: false, provider: 'local-placeholder', size: resolveImageSize(payload) },
    };
  }

  const provider = getImageProvider();
  const prompt = buildImagePrompt(payload);
  try {
    const providerResult = await provider.generateImage({
      prompt,
      size: resolveImageSize(payload),
      quality: resolveImageQuality(payload.size),
      signal,
    });
    return {
      imageUrl: providerResult.imageUrl,
      mimeType: providerResult.mimeType || 'image/png',
      alt: payload.alt || payload.prompt,
      source: 'ai',
      meta: {
        cached: false,
        provider: provider.name,
        size: resolveImageSize(payload),
      },
    };
  } catch (error) {
    logger.warn('AI image generation failed', {
      provider: provider.name,
      statusCode: error?.statusCode,
    });
    throw error;
  }
}

async function suggestLayout(userId, payload = {}) {
  const request = normaliseLayoutRequest(payload);
  const key = cacheScope(userId, 'layout', request);
  const cached = cache.get(key);
  if (cached) return { ...cached, meta: { ...cached.meta, cached: true } };

  // This is deterministic by design: users get an instant, inspectable layout
  // proposal even if a text/image provider is unavailable. Providers can be
  // introduced here later without changing the endpoint contract.
  const result = {
    suggestion: generateLayoutSuggestion(request),
    meta: { cached: false, provider: 'layout-rules' },
  };
  cache.set(key, result, LAYOUT_CACHE_TTL_MS);
  return result;
}

function __resetAICacheForTests() {
  cache.clear();
}

module.exports = {
  generateText,
  generateImage,
  suggestLayout,
  __resetAICacheForTests,
};

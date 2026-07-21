const AIProvider = require('./AIProvider');
const ApiError = require('../../utils/ApiError');

function normaliseBaseUrl(value) {
  return (value || 'https://api.openai.com/v1').replace(/\/+$/, '');
}

function outputTextFromResponse(payload) {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const chunks = (payload?.output || []).flatMap((item) =>
    (item?.content || [])
      .filter((content) => content?.type === 'output_text' && typeof content.text === 'string')
      .map((content) => content.text)
  );

  return chunks.join('\n').trim();
}

class OpenAIProvider extends AIProvider {
  constructor({ apiKey, textModel, imageModel, baseUrl, timeoutMs } = {}) {
    super('openai');
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
    this.textModel = textModel || process.env.OPENAI_TEXT_MODEL || 'gpt-4.1-mini';
    this.imageModel = imageModel || process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
    this.baseUrl = normaliseBaseUrl(baseUrl || process.env.OPENAI_API_BASE_URL);
    this.timeoutMs = Number(timeoutMs || process.env.AI_REQUEST_TIMEOUT_MS) || 30_000;
  }

  assertConfigured() {
    if (!this.apiKey) {
      throw new ApiError(
        503,
        'AI generation is not configured. Add server-side provider credentials before using this feature.'
      );
    }
  }

  async request(path, body, signal) {
    this.assertConfigured();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const forwardAbort = () => controller.abort();
    if (signal) {
      if (signal.aborted) controller.abort();
      else signal.addEventListener('abort', forwardAbort, { once: true });
    }

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        // Consume the provider response so connections can be reused, but do
        // not relay its wording because it can expose configuration details.
        await response.text().catch(() => '');
        if (response.status === 400) {
          throw ApiError.badRequest('The AI provider could not process this request. Please adjust the prompt and try again.');
        }
        if (response.status === 401 || response.status === 403) {
          throw new ApiError(503, 'The AI provider is unavailable due to a server configuration issue.');
        }
        if (response.status === 429) {
          throw ApiError.tooMany('The AI provider is busy. Please wait a moment and try again.');
        }
        throw new ApiError(502, 'The AI provider is temporarily unavailable. Please try again.');
      }

      return response.json();
    } catch (error) {
      if (error?.isOperational) throw error;
      if (controller.signal.aborted) {
        if (signal?.aborted) throw new ApiError(499, 'AI request was cancelled.');
        throw new ApiError(504, 'AI generation timed out. Please try again.');
      }
      throw new ApiError(502, 'The AI provider is temporarily unavailable. Please try again.');
    } finally {
      clearTimeout(timeout);
      if (signal) signal.removeEventListener('abort', forwardAbort);
    }
  }

  async generateText({ instructions, input, maxOutputTokens, signal }) {
    const payload = await this.request(
      '/responses',
      {
        model: this.textModel,
        instructions,
        input,
        max_output_tokens: maxOutputTokens,
        // Content is generated on demand and the application does not need a
        // persistent provider-side conversation for this interaction.
        store: false,
      },
      signal
    );

    const text = outputTextFromResponse(payload);
    if (!text) {
      throw new ApiError(502, 'The AI provider returned no usable text. Please try again.');
    }

    return {
      text,
      providerResponseId: payload.id,
    };
  }

  async generateImage({ prompt, size, quality, signal }) {
    const payload = await this.request(
      '/images/generations',
      {
        model: this.imageModel,
        prompt,
        n: 1,
        size,
        quality,
        output_format: 'png',
      },
      signal
    );

    const image = payload?.data?.[0];
    if (typeof image?.b64_json === 'string' && image.b64_json) {
      return {
        imageUrl: `data:image/png;base64,${image.b64_json}`,
        mimeType: 'image/png',
        providerResponseId: payload.created ? String(payload.created) : undefined,
      };
    }

    if (typeof image?.url === 'string' && image.url) {
      return {
        imageUrl: image.url,
        mimeType: 'image/png',
        providerResponseId: payload.created ? String(payload.created) : undefined,
      };
    }

    throw new ApiError(502, 'The AI provider returned no usable image. Please try again.');
  }
}

module.exports = OpenAIProvider;

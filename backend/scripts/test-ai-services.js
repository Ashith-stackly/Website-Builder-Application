/*
 * Lightweight, dependency-free Module 11 smoke tests.
 * Run with: npm run test:ai
 */
const assert = require('node:assert/strict');

process.env.AI_PROVIDER = 'mock';
process.env.IMAGE_PROVIDER = 'mock';

const aiService = require('../src/services/ai/aiService');

async function run() {
  aiService.__resetAICacheForTests();

  const textRequest = {
    blockType: 'hero',
    field: 'title',
    tone: 'friendly',
    length: 'short',
    businessType: 'Independent bakery',
    keywords: ['sourdough', 'neighbourhood'],
  };
  const text = await aiService.generateText('test-user', textRequest);
  assert.ok(text.generatedText.length > 0, 'text endpoint should return generated text');
  assert.equal(text.meta.cached, false);

  const cachedText = await aiService.generateText('test-user', textRequest);
  assert.equal(cachedText.meta.cached, true, 'identical text request should use its TTL cache');

  const section = await aiService.generateText('test-user', {
    ...textRequest,
    wholeSection: true,
    sectionFields: ['title', 'description', 'ctaLabel'],
  });
  assert.equal(typeof section.generatedFields?.title, 'string', 'section request should expose field data');
  assert.equal(typeof section.generatedFields?.ctaLabel, 'string', 'section response should retain flat field keys');

  const image = await aiService.generateImage('test-user', {
    prompt: 'A warm bakery counter at sunrise',
    style: 'editorial photography',
    aspectRatio: '16:9',
  });
  assert.ok(image.imageUrl.startsWith('data:image/'), 'mock image should return an importable data URL');
  assert.equal(image.source, 'ai');

  process.env.IMAGE_PROVIDER = 'disabled';
  const placeholder = await aiService.generateImage('test-user', {
    prompt: 'A florist arranging a bouquet',
    mode: 'placeholder',
  });
  assert.equal(placeholder.source, 'placeholder', 'placeholder mode must work without an external provider');
  assert.ok(placeholder.imageUrl.startsWith('data:image/svg+xml'), 'placeholder should be a portable SVG data URL');
  process.env.IMAGE_PROVIDER = 'mock';

  const layout = await aiService.suggestLayout('test-user', {
    businessType: 'SaaS startup',
    industry: 'productivity software',
    goal: 'drive trial signups',
    services: ['team planning', 'automations'],
    contentLength: 'medium',
  });
  assert.ok(layout.suggestion.sections.some((sectionItem) => sectionItem.type === 'hero'));
  assert.ok(layout.suggestion.components.length >= 5);
  assert.equal(typeof layout.suggestion.colorPalette.primary, 'string');

  console.log('AI service smoke tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

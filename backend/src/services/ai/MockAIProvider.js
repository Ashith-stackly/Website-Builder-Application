const AIProvider = require('./AIProvider');

/**
 * Deterministic local provider intended only for development and automated
 * smoke tests. It is opt-in via AI_PROVIDER=mock; production defaults to the
 * configured OpenAI provider and never silently falls back to mock content.
 */
class MockAIProvider extends AIProvider {
  constructor() {
    super('mock');
  }

  async generateText({ context = {} }) {
    const business = context.businessType || context.websiteName || 'your business';
    const field = String(context.field || 'content').toLowerCase();
    const tone = context.tone || 'professional';

    if (context.wholeSection) {
      return {
        text: JSON.stringify({
          title: `A clearer way to choose ${business}`,
          description: `Give visitors a ${tone}, confident introduction to ${business} and the value it delivers.`,
          ctaLabel: 'Get started',
        }),
      };
    }

    const text = field.includes('title') || field.includes('heading') || field.includes('label')
      ? `A smarter next step for ${business}`
      : `Create a ${tone} first impression that helps people understand why ${business} matters.`;
    return { text };
  }

  async generateImage({ prompt }) {
    const label = String(prompt || 'AI image').replace(/[<>&]/g, '').slice(0, 90);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="100%" height="100%" fill="#1e3a8a"/><circle cx="780" cy="240" r="180" fill="#60a5fa" opacity=".55"/><text x="72" y="860" fill="white" font-family="Arial" font-size="42" font-weight="700">${label}</text></svg>`;
    return {
      imageUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      mimeType: 'image/svg+xml',
    };
  }
}

module.exports = MockAIProvider;

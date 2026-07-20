/**
 * Provider contract for AI capabilities.
 *
 * Providers receive already-built, server-side prompts. They must never read
 * request data directly or expose credentials to callers. Adding another
 * provider only requires implementing this small interface and registering it
 * in AIProviderFactory.
 */
class AIProvider {
  constructor(name) {
    this.name = name || 'unknown';
  }

  async generateText(_request) {
    throw new Error('generateText() must be implemented by an AI provider');
  }

  async generateImage(_request) {
    throw new Error('generateImage() must be implemented by an AI provider');
  }
}

module.exports = AIProvider;

const AIProvider = require('./AIProvider');
const OpenAIProvider = require('./OpenAIProvider');
const MockAIProvider = require('./MockAIProvider');
const ApiError = require('../../utils/ApiError');

class UnavailableAIProvider extends AIProvider {
  constructor(name) {
    super(name || 'unavailable');
  }

  unavailable() {
    throw new ApiError(503, 'AI generation is not configured for this environment.');
  }

  async generateText() {
    return this.unavailable();
  }

  async generateImage() {
    return this.unavailable();
  }
}

function providerName(value) {
  return String(value || 'openai').trim().toLowerCase();
}

function createProvider(name) {
  switch (providerName(name)) {
    case 'openai':
      return new OpenAIProvider();
    case 'mock':
      return new MockAIProvider();
    case 'disabled':
    case 'none':
      return new UnavailableAIProvider('disabled');
    default:
      return new UnavailableAIProvider(providerName(name));
  }
}

function getTextProvider() {
  return createProvider(process.env.AI_PROVIDER || 'openai');
}

function getImageProvider() {
  return createProvider(process.env.IMAGE_PROVIDER || process.env.AI_PROVIDER || 'openai');
}

module.exports = {
  createProvider,
  getTextProvider,
  getImageProvider,
};

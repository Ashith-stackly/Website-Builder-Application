const aiService = require('../services/ai/aiService');

function requestAbortContext(req, res) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const onResponseClose = () => {
    if (!res.writableEnded) abort();
  };

  req.once('aborted', abort);
  res.once('close', onResponseClose);

  return {
    signal: controller.signal,
    disposed() {
      req.removeListener('aborted', abort);
      res.removeListener('close', onResponseClose);
    },
  };
}

async function runGeneration(req, res, next, handler) {
  const abortContext = requestAbortContext(req, res);
  try {
    const result = await handler(abortContext.signal);
    if (!req.destroyed && !res.headersSent) res.json(result);
  } catch (error) {
    // A disconnected client cannot consume an error response. The provider is
    // already aborted through the signal above, so ending here is intentional.
    if (!req.destroyed && !res.headersSent) next(error);
  } finally {
    abortContext.disposed();
  }
}

function generateText(req, res, next) {
  return runGeneration(req, res, next, (signal) =>
    aiService.generateText(req.user._id, req.body, signal)
  );
}

function generateImage(req, res, next) {
  return runGeneration(req, res, next, (signal) =>
    aiService.generateImage(req.user._id, req.body, signal)
  );
}

async function suggestLayout(req, res, next) {
  try {
    const result = await aiService.suggestLayout(req.user._id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generateText,
  generateImage,
  suggestLayout,
};

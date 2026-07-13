const logger = require('../utils/logger');

/**
 * Request timing middleware.
 * Logs method, path, status code, and duration for every request.
 * Slow requests (>300ms) are logged at warn level.
 */
function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e6;
    const durationMs = Math.round(duration * 100) / 100;
    const meta = {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration_ms: durationMs,
    };

    if (durationMs > 300) {
      logger.warn('Slow request', meta);
    } else {
      logger.info('Request', meta);
    }
  });

  next();
}

module.exports = requestLogger;

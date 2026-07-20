const ApiError = require('../utils/ApiError');

/**
 * Rate limiter middleware — in-memory sliding-window counter.
 *
 * Tracks request counts per key (default: IP address) within a configurable
 * time window and rejects excess requests with 429 Too Many Requests.
 *
 * Usage:
 *   router.post('/event', rateLimit({ windowMs: 60_000, max: 100 }), handler);
 *
 * Options:
 *   windowMs  — time window in milliseconds (default: 60 000 = 1 minute)
 *   max       — maximum requests per window per key (default: 100)
 *   keyFn     — function(req) returning the rate-limit key (default: req.ip)
 *   message   — error message on limit exceeded
 *
 * NOTE: This is a single-process limiter. For horizontally scaled deployments,
 * replace with a Redis-backed solution (e.g. rate-limit-redis).
 */
function rateLimit({ windowMs = 60_000, max = 100, keyFn, message } = {}) {
  const hits = new Map();     // key → { count, resetAt }
  const getKey = keyFn || ((req) => req.ip || req.connection?.remoteAddress || 'unknown');

  // Periodic cleanup to prevent memory leaks — runs every 5 minutes
  const CLEANUP_INTERVAL = 5 * 60 * 1000;
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (now >= entry.resetAt) hits.delete(key);
    }
  }, CLEANUP_INTERVAL);
  if (timer.unref) timer.unref(); // Don't keep the process alive

  return function rateLimitMiddleware(req, _res, next) {
    const key = getKey(req);
    const now = Date.now();
    let entry = hits.get(key);

    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    entry.count++;

    if (entry.count > max) {
      return next(
        ApiError.tooMany(message || `Rate limit exceeded. Try again in ${Math.ceil((entry.resetAt - now) / 1000)}s.`)
      );
    }

    next();
  };
}

module.exports = rateLimit;

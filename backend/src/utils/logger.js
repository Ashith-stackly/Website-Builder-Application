/**
 * Structured logger — zero external dependencies.
 *
 * Outputs JSON lines in production for machine parsing and
 * human-readable lines in development for quick debugging.
 */

const isProduction = process.env.NODE_ENV === 'production';

function timestamp() {
  return new Date().toISOString();
}

function formatLog(level, message, meta = {}) {
  if (isProduction) {
    const entry = { timestamp: timestamp(), level, message, ...meta };
    return JSON.stringify(entry);
  }

  const prefix = `[${timestamp()}] [${level.toUpperCase()}]`;
  const metaKeys = Object.keys(meta);
  const metaStr = metaKeys.length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `${prefix} ${message}${metaStr}`;
}

const logger = {
  info(message, meta) {
    console.log(formatLog('info', message, meta));
  },

  warn(message, meta) {
    console.warn(formatLog('warn', message, meta));
  },

  error(message, meta) {
    console.error(formatLog('error', message, meta));
  },

  debug(message, meta) {
    if (!isProduction) {
      console.debug(formatLog('debug', message, meta));
    }
  },

  /**
   * Start a timer and return a function that logs the elapsed time.
   * Usage:
   *   const end = logger.startTimer('db-query');
   *   await doQuery();
   *   end({ collection: 'users' });
   */
  startTimer(label) {
    const start = process.hrtime.bigint();
    return (meta = {}) => {
      const elapsed = Number(process.hrtime.bigint() - start) / 1e6; // ms
      logger.info(`${label} completed`, { ...meta, duration_ms: Math.round(elapsed * 100) / 100 });
      return elapsed;
    };
  },
};

module.exports = logger;

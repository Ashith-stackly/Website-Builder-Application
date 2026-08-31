const ApiError = require('../utils/ApiError');

function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || err.status || 500;
  const payload = {};

  // Only forward the raw message for operational (expected) errors.
  // Non-operational errors (bugs, config issues) get a generic message to
  // prevent leaking internal details like env-var names or file paths.
  if (err.isOperational) {
    payload.message = err.message || 'Internal server error';
  } else {
    payload.message = statusCode >= 500
      ? 'Internal server error'
      : (err.message || 'Internal server error');
  }

  if (err.errors?.length) {
    payload.errors = err.errors;
  }

  if (process.env.NODE_ENV !== 'production' && !err.isOperational) {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
}

module.exports = { notFound, errorHandler };

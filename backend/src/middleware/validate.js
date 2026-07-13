const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

function validate(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((error) => error.msg);
  next(ApiError.badRequest('Validation failed', errors));
}

module.exports = validate;

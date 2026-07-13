const ApiError = require('../utils/ApiError');

function requirePremium(req, _res, next) {
  if (req.user?.plan === 'premium' && req.user?.subscriptionStatus === 'active') {
    return next();
  }

  return next(ApiError.forbidden('Premium plan required'));
}

module.exports = requirePremium;

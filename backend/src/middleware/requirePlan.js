const ApiError = require('../utils/ApiError');

/**
 * Feature-access middleware — gates a route to one or more paid plans.
 *
 * Usage:
 *   router.get('/premium-thing', authenticate, requirePlan('basic','premium','business','advanced'), handler);
 *
 * Any plan listed as an argument (plus 'admin' role) passes the check.
 * If no arguments are provided, all non-free plans are allowed.
 */
function requirePlan(...allowedPlans) {
  if (allowedPlans.length === 0) {
    allowedPlans = ['basic', 'business', 'advanced', 'premium'];
  }

  return function (req, _res, next) {
    // Admins always pass
    if (req.user?.role === 'admin') return next();

    const userPlan = req.user?.plan || 'free';
    const subStatus = req.user?.subscriptionStatus || 'none';

    if (allowedPlans.includes(userPlan) && subStatus === 'active') {
      return next();
    }

    return next(
      ApiError.forbidden(
        `This feature requires one of: ${allowedPlans.join(', ')}. Your current plan is "${userPlan}".`
      )
    );
  };
}

module.exports = requirePlan;

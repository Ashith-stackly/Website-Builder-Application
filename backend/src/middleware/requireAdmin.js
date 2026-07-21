const ApiError = require('../utils/ApiError');

/**
 * Admin-only middleware — gates a route to users with role === 'admin'.
 *
 * Must be used AFTER the `authenticate` middleware so that `req.user` exists.
 *
 * Usage:
 *   router.get('/admin/stats', authenticate, requireAdmin, handler);
 */
function requireAdmin(req, _res, next) {
  if (req.user?.role === 'admin') return next();
  return next(ApiError.forbidden('This action requires administrator privileges.'));
}

module.exports = requireAdmin;

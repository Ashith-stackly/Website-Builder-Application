const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { verifyAdminToken } = require('../utils/jwt');

/**
 * Standalone admin-authentication middleware.
 *
 * 1. Extracts the Bearer token from the Authorization header.
 * 2. Verifies it using the admin-specific JWT secret (verifyAdminToken).
 * 3. Confirms the token carries type === 'admin'.
 * 4. Looks up the User and confirms role === 'admin'.
 * 5. Attaches the admin user to req.admin.
 *
 * Normal-user JWTs are automatically rejected because they are signed
 * with a different secret.
 *
 * Usage:
 *   router.get('/admin/stats', authenticateAdmin, handler);
 */
async function authenticateAdmin(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const [, token] = header.split(' ');

    if (!token) {
      throw ApiError.unauthorized('Missing admin authorization token.');
    }

    let decoded;
    try {
      decoded = verifyAdminToken(token);
    } catch {
      throw ApiError.unauthorized('Invalid or expired admin token.');
    }

    if (decoded.type !== 'admin') {
      throw ApiError.forbidden('This endpoint requires administrator credentials.');
    }

    const admin = await User.findById(decoded.sub).select('-password -resetPasswordToken -resetPasswordExpiry -__v');
    if (!admin) {
      throw ApiError.unauthorized('Admin account not found.');
    }

    if (admin.role !== 'admin') {
      throw ApiError.forbidden('This endpoint requires administrator privileges.');
    }

    req.admin = admin;
    next();
  } catch (err) {
    if (err.isOperational) return next(err);
    next(ApiError.unauthorized('Invalid or expired admin token.'));
  }
}

module.exports = authenticateAdmin;

const jwt = require('jsonwebtoken');
const ApiError = require('./ApiError');
const logger = require('./logger');

/**
 * Sign a JWT access token.
 */
function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/**
 * Sign a JWT refresh token.
 */
function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
}

/**
 * Verify a JWT access token — returns decoded payload or throws.
 */
function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

/**
 * Verify a JWT refresh token — returns decoded payload or throws.
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
}

/**
 * Sign a short-lived reset token (15 min).
 */
function signResetToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
}

/**
 * Admin JWT secret — must be explicitly configured via JWT_ADMIN_SECRET.
 * Throws at first use if the env var is missing so misconfiguration is caught
 * immediately rather than silently falling back to a derived value.
 */
function adminSecret() {
  const secret = process.env.JWT_ADMIN_SECRET;
  if (!secret) {
    // Log the diagnostic details server-side only — never expose to clients.
    logger.error(
      'JWT_ADMIN_SECRET is not set. Admin authentication requires an explicit secret. '
      + 'Add JWT_ADMIN_SECRET to backend/.env and restart the server.',
    );
    throw ApiError.internal('Admin authentication is temporarily unavailable.');
  }
  return secret;
}

/**
 * Sign an admin-only JWT access token.
 * Includes `type: 'admin'` so the middleware can distinguish it.
 */
function signAdminToken(payload) {
  return jwt.sign({ ...payload, type: 'admin' }, adminSecret(), {
    expiresIn: process.env.JWT_ADMIN_EXPIRES_IN || '8h',
  });
}

/**
 * Verify an admin-only JWT — returns decoded payload or throws.
 */
function verifyAdminToken(token) {
  return jwt.verify(token, adminSecret());
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  signResetToken,
  signAdminToken,
  verifyAdminToken,
};

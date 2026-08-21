const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { signAdminToken } = require('../utils/jwt');

/**
 * Authenticate an administrator.
 *
 * Uses the existing User model (role === 'admin') but issues a separate
 * admin JWT that is cryptographically distinct from normal-user tokens.
 */
async function login({ email, password }) {
  if (!email || !password) {
    throw ApiError.badRequest('Email and password are required.');
  }

  const user = await User.findOne({ email: email.toLowerCase(), role: 'admin' })
    .select('+password');

  if (!user || !(await user.comparePassword(password))) {
    // Generic message — do not reveal whether the email exists
    throw ApiError.unauthorized('Invalid admin credentials.');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signAdminToken({ sub: user._id.toString(), role: 'admin' });

  return {
    success: true,
    admin: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
}

module.exports = { login };

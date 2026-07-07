const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/jwt');

// Fields to exclude from the auth lookup (password is already select:false on schema)
const AUTH_USER_SELECT = '-resetPasswordToken -resetPasswordExpiry -__v';

async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const [, token] = header.split(' ');

    if (!token) {
      throw ApiError.unauthorized('Missing authorization token');
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.sub || decoded.id)
      .select(AUTH_USER_SELECT);
    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.isOperational) return next(err);
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}

module.exports = authenticate;

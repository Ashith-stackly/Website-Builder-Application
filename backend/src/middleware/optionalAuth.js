const User = require('../models/User');
const { verifyAccessToken } = require('../utils/jwt');

const AUTH_USER_SELECT = '-resetPasswordToken -resetPasswordExpiry -__v';

async function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const [, token] = header.split(' ');
    if (!token) return next();

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.sub || decoded.id)
      .select(AUTH_USER_SELECT);
    if (user) req.user = user;
    next();
  } catch {
    next();
  }
}

module.exports = optionalAuth;

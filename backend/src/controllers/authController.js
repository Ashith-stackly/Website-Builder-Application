const ApiError = require('../utils/ApiError');
const authService = require('../services/authService');

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    res.json(await authService.login(req.body));
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    res.json(await authService.forgotPassword(req.body.input));
  } catch (err) {
    next(err);
  }
}

async function sendEmailOtp(req, res, next) {
  try {
    res.json(await authService.sendEmailOtp(req.body.email));
  } catch (err) {
    next(err);
  }
}

async function sendMobileOtp(req, res, next) {
  try {
    res.json(await authService.sendMobileOtp(req.body.mobile));
  } catch (err) {
    next(err);
  }
}

async function verifyEmail(req, res, next) {
  try {
    res.json(await authService.verifyEmail(req.body));
  } catch (err) {
    if (typeof err.attemptsLeft === 'number') {
      return res.status(err.statusCode).json({ message: err.message, attemptsLeft: err.attemptsLeft });
    }
    next(err);
  }
}

async function verifyMobile(req, res, next) {
  try {
    res.json(await authService.verifyMobile(req.body));
  } catch (err) {
    if (typeof err.attemptsLeft === 'number') {
      return res.status(err.statusCode).json({ message: err.message, attemptsLeft: err.attemptsLeft });
    }
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const [, token] = (req.headers.authorization || '').split(' ');
    res.json(await authService.resetPassword(token, req.body.newPassword));
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Invalid or expired reset token'));
    }
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    res.json(await authService.refresh(req.body.refreshToken));
  } catch {
    next(ApiError.unauthorized('Invalid or expired refresh token'));
  }
}

async function googleCallback(req, res, next) {
  try {
    res.redirect(await authService.googleCallback(req.query.code));
  } catch (err) {
    next(err);
  }
}

function oauthSuccess(req, res) {
  res.redirect(authService.oauthRedirectUrl(req.user));
}

module.exports = {
  register,
  login,
  forgotPassword,
  sendEmailOtp,
  sendMobileOtp,
  verifyEmail,
  verifyMobile,
  resetPassword,
  refresh,
  googleCallback,
  oauthSuccess,
};

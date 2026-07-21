const axios = require('axios');
const User = require('../models/User');
const Otp = require('../models/Otp');
const ApiError = require('../utils/ApiError');
const { generateOtp, sanitizeUser } = require('../helpers');
const {
  signAccessToken,
  signRefreshToken,
  signResetToken,
  verifyAccessToken,
  verifyRefreshToken,
} = require('../utils/jwt');
const { sendOtpEmail } = require('./emailService');
const { sendSmsOtp } = require('./smsService');

function tokenPayload(user) {
  return { sub: user._id.toString(), role: user.role };
}

function authResponse(user, message = 'Login successful') {
  return {
    token: signAccessToken(tokenPayload(user)),
    refreshToken: signRefreshToken(tokenPayload(user)),
    message,
    userType: user.role,
    user: sanitizeUser(user),
  };
}

function oauthRedirectUrl(user) {
  const tokens = authResponse(user, 'OAuth login successful');
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const params = new URLSearchParams({
    token: tokens.token,
    refreshToken: tokens.refreshToken,
  });
  return `${frontendUrl}/landing?${params.toString()}`;
}

function isPlaceholder(value = '') {
  return !value || /your-|placeholder|xxxx/i.test(value);
}

async function issueOtp(contact, channel) {
  const otp = generateOtp(4);
  await Otp.deleteMany({ contact, channel });
  await Otp.create({
    contact,
    channel,
    otp,
    expiresAt: new Date(Date.now() + 60 * 1000),
  });

  if (channel === 'email') {
    await sendOtpEmail(contact, otp);
  } else {
    await sendSmsOtp(contact, otp);
  }

  return otp;
}

async function register({ name, email, mobile, password }) {
  const existing = await User.findOne({ $or: [{ email }, ...(mobile ? [{ mobile }] : [])] });
  if (existing) throw ApiError.conflict('A user with this email or mobile already exists');

  const user = await User.create({ name, email, mobile, password });
  const otp = await issueOtp(user.email, 'email');
  return {
    message: 'Registration successful. Please verify your email.',
    ...(process.env.NODE_ENV !== 'production' ? { otp } : {}),
  };
}

async function login({ email, mobile, password }) {
  const query = email ? { email: email.toLowerCase() } : { mobile };
  const user = await User.findOne(query).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid credentials');
  }
  user.lastLoginAt = new Date();
  await user.save();
  return authResponse(user);
}

async function forgotPassword(input) {
  const normalized = input.trim();
  const channel = normalized.includes('@') ? 'email' : 'mobile';
  const user = await User.findOne(channel === 'email' ? { email: normalized.toLowerCase() } : { mobile: normalized });
  if (!user) throw ApiError.notFound('No account found for this email or mobile');

  const contact = channel === 'email' ? user.email : user.mobile;
  const otp = await issueOtp(contact, channel);
  return {
    message: `OTP sent to your ${channel}`,
    moveToVerify: true,
    ...(process.env.NODE_ENV !== 'production' ? { otp } : {}),
  };
}

async function sendEmailOtp(email) {
  const normalized = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalized });
  if (!user) throw ApiError.notFound('No account found for this email');

  const otp = await issueOtp(normalized, 'email');
  return {
    message: 'OTP sent to your email',
    ...(process.env.NODE_ENV !== 'production' ? { otp } : {}),
  };
}

async function sendMobileOtp(mobile) {
  const normalized = mobile.trim();
  const user = await User.findOne({ mobile: normalized });
  if (!user) throw ApiError.notFound('No account found for this mobile');

  const otp = await issueOtp(normalized, 'mobile');
  return {
    message: 'OTP sent to your mobile',
    ...(process.env.NODE_ENV !== 'production' ? { otp } : {}),
  };
}

async function verifyOtp(contact, channel, otp) {
  const record = await Otp.findOne({ contact, channel });
  if (!record) throw ApiError.badRequest('OTP expired or not found');
  if (record.attempts >= record.maxAttempts) throw ApiError.tooMany('Too many incorrect OTP attempts');

  if (record.otp !== otp) {
    record.attempts += 1;
    await record.save();
    const error = ApiError.badRequest('Invalid OTP');
    error.attemptsLeft = Math.max(record.maxAttempts - record.attempts, 0);
    throw error;
  }

  await Otp.deleteOne({ _id: record._id });
}

async function verifyEmail({ email, otp, action }) {
  const user = await User.findOne({ email });
  if (!user) throw ApiError.notFound('User not found');

  if (action === 'resend') {
    const newOtp = await issueOtp(email, 'email');
    return {
      message: 'OTP resent',
      ...(process.env.NODE_ENV !== 'production' ? { otp: newOtp } : {}),
    };
  }

  await verifyOtp(email, 'email', otp);
  user.isEmailVerified = true;
  await user.save();
  return {
    token: signResetToken({ sub: user._id.toString(), purpose: 'reset-password' }),
    message: 'Email verified',
  };
}

async function verifyMobile({ mobile, otp, action }) {
  const user = await User.findOne({ mobile });
  if (!user) throw ApiError.notFound('User not found');

  if (action === 'resend') {
    const newOtp = await issueOtp(mobile, 'mobile');
    return {
      message: 'OTP resent',
      ...(process.env.NODE_ENV !== 'production' ? { otp: newOtp } : {}),
    };
  }

  await verifyOtp(mobile, 'mobile', otp);
  user.isMobileVerified = true;
  await user.save();
  return {
    token: signResetToken({ sub: user._id.toString(), purpose: 'reset-password' }),
    message: 'Mobile verified',
  };
}

async function resetPassword(resetToken, newPassword) {
  if (!resetToken) throw ApiError.unauthorized('Missing reset token');

  const decoded = verifyAccessToken(resetToken);
  if (decoded.purpose !== 'reset-password') throw ApiError.unauthorized('Invalid reset token');

  const user = await User.findById(decoded.sub);
  if (!user) throw ApiError.notFound('User not found');

  user.password = newPassword;
  user.authProvider = user.authProvider || 'local';
  await user.save();
  return { message: 'Password reset successful' };
}

async function refresh(refreshToken) {
  if (!refreshToken) throw ApiError.unauthorized('Missing refresh token');
  const decoded = verifyRefreshToken(refreshToken);
  const user = await User.findById(decoded.sub);
  if (!user) throw ApiError.unauthorized('User not found');
  user.lastLoginAt = new Date();
  await user.save();
  return authResponse(user, 'Token refreshed');
}

async function googleCallback(code) {
  if (!code) throw ApiError.badRequest('Missing Google authorization code');
  if (isPlaceholder(process.env.GOOGLE_CLIENT_ID) || isPlaceholder(process.env.GOOGLE_CLIENT_SECRET)) {
    throw ApiError.badRequest('Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env.');
  }

  const redirectUri = `${process.env.API_BASE_URL || 'http://localhost:5000/api'}/auth/google`;
  let tokenRes;
  try {
    tokenRes = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }));
  } catch (err) {
    const googleError = err.response?.data?.error_description || err.response?.data?.error || err.message;
    throw ApiError.unauthorized(`Google OAuth token exchange failed. Check client secret and authorized redirect URI (${redirectUri}). ${googleError}`);
  }

  const userInfo = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
  });

  const email = userInfo.data.email?.toLowerCase();
  if (!email) throw ApiError.badRequest('Google account did not provide an email');

  let user = await User.findOne({ $or: [{ googleId: userInfo.data.id }, { email }] });
  if (!user) {
    user = await User.create({
      name: userInfo.data.name || email.split('@')[0],
      email,
      googleId: userInfo.data.id,
      authProvider: 'google',
      avatar: userInfo.data.picture || '',
      isEmailVerified: true,
    });
  } else if (!user.googleId) {
    user.googleId = userInfo.data.id;
    user.isEmailVerified = true;
    await user.save();
  }

  user.lastLoginAt = new Date();
  await user.save();

  return oauthRedirectUrl(user);
}

module.exports = {
  authResponse,
  oauthRedirectUrl,
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
};

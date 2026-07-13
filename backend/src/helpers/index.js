const crypto = require('crypto');

/**
 * Generate a random numeric OTP of given length.
 */
function generateOtp(length = 4) {
  const digits = '0123456789';
  let otp = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[bytes[i] % 10];
  }
  return otp;
}

/**
 * Sanitize a user object for API responses (strip sensitive fields).
 */
function sanitizeUser(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpiry;
  delete obj.__v;
  return obj;
}

module.exports = { generateOtp, sanitizeUser };

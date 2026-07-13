const ApiError = require('../utils/ApiError');

async function sendSmsOtp(to, otp) {
  const provider = (process.env.SMS_PROVIDER || 'mock').toLowerCase();

  if (provider === 'mock') {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`Mock SMS OTP for ${to}: ${otp}`);
      return { provider, delivered: false, mocked: true };
    }
    throw ApiError.badRequest('SMS provider is not configured');
  }

  if (provider === 'twilio') {
    const required = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER'];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length) {
      throw ApiError.badRequest(`Twilio SMS is missing: ${missing.join(', ')}`);
    }
    throw ApiError.badRequest('Twilio SMS adapter is ready for credentials but not installed yet');
  }

  if (provider === 'textlocal') {
    const required = ['TEXTLOCAL_API_KEY', 'TEXTLOCAL_SENDER'];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length) {
      throw ApiError.badRequest(`TextLocal SMS is missing: ${missing.join(', ')}`);
    }
    throw ApiError.badRequest('TextLocal SMS adapter is ready for credentials but not installed yet');
  }

  throw ApiError.badRequest(`Unsupported SMS provider: ${provider}`);
}

module.exports = { sendSmsOtp };

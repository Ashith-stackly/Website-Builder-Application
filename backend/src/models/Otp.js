const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  contact: {
    type: String,
    required: true,
  },
  channel: {
    type: String,
    enum: ['email', 'mobile'],
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  maxAttempts: {
    type: Number,
    default: 3,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // TTL index — auto-delete after expiry
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for OTP lookups (every query filters by both)
otpSchema.index({ contact: 1, channel: 1 });

module.exports = mongoose.model('Otp', otpSchema);

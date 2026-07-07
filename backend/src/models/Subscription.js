const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  plan: {
    type: String,
    enum: ['free', 'basic', 'business', 'advanced', 'premium'],
    required: true,
  },
  paymentProvider: {
    type: String,
    enum: ['stripe', 'razorpay'],
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  subscriptionId: {
    type: String,
    default: '',
  },
  orderId: {
    type: String,
    default: '',
  },
  amount: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  startDate: Date,
  expiryDate: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for cancel queries (latest first)
subscriptionSchema.index({ userId: 1, createdAt: -1 });
// Razorpay order dedup
subscriptionSchema.index({ orderId: 1 }, { sparse: true });
// Stripe subscription lookup
subscriptionSchema.index({ subscriptionId: 1 }, { sparse: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);

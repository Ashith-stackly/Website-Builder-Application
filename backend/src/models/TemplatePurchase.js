const mongoose = require('mongoose');

const templatePurchaseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    templateId: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    templateName: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'failed', 'refunded'],
      default: 'completed',
      index: true,
    },
    amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },
    paymentProvider: {
      type: String,
      enum: ['razorpay', 'stripe', 'free', 'admin', 'none'],
      default: 'razorpay',
    },
    paymentId: {
      type: String,
      default: '',
      trim: true,
    },
    orderId: {
      type: String,
      default: '',
      trim: true,
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique entitlement checks per user + template
templatePurchaseSchema.index({ userId: 1, templateId: 1, status: 1 });
templatePurchaseSchema.index({ userId: 1, purchasedAt: -1 });

module.exports = mongoose.model('TemplatePurchase', templatePurchaseSchema);

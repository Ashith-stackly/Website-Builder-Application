const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  invoiceId: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  amount: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Paid', 'Free'],
    default: 'Paid',
  },
  planName: {
    type: String,
    default: '',
  },
  planTier: {
    type: String,
    default: '',
  },
  websiteLabel: {
    type: String,
    default: 'Stackly workspace subscription',
  },
  paymentMethodLabel: {
    type: String,
    default: '',
  },
  paymentDetail: {
    type: String,
    default: '',
  },
  buyerName: {
    type: String,
    default: '',
  },
  buyerEmail: {
    type: String,
    default: '',
  },
  buyerPhone: {
    type: String,
    default: '',
  },
  buyerAddress: {
    type: String,
    default: '',
  },
  generatedAt: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Prevent duplicate invoices for the same user
invoiceSchema.index({ userId: 1, invoiceId: 1 }, { unique: true });
// Fast lookup by user, newest first
invoiceSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);

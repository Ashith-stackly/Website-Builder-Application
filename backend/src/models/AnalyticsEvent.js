const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true,
  },
  eventType: {
    type: String,
    enum: ['page_view', 'click', 'form_submit', 'scroll', 'custom'],
    default: 'page_view',
  },
  path: {
    type: String,
    default: '/',
  },
  referrer: {
    type: String,
    default: '',
  },
  userAgent: {
    type: String,
    default: '',
  },
  ip: {
    type: String,
    default: '',
  },
  sessionId: {
    type: String,
    default: '',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Compound index for per-workspace daily aggregation queries
analyticsEventSchema.index({ workspaceId: 1, timestamp: -1 });
analyticsEventSchema.index({ workspaceId: 1, eventType: 1, timestamp: -1 });

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);

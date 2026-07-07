const mongoose = require('mongoose');

const deploymentSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    version: {
      type: Number,
      required: true,
      default: 1,
    },
    status: {
      type: String,
      enum: ['pending', 'building', 'deployed', 'failed', 'rolled_back'],
      default: 'pending',
    },
    htmlSnapshot: {
      type: String,
      default: '',
    },
    assetsManifest: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    s3Url: {
      type: String,
      default: '',
    },
    deployedAt: Date,
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

deploymentSchema.index({ workspaceId: 1, version: -1 });
deploymentSchema.index({ workspaceId: 1, status: 1 });

module.exports = mongoose.model('Deployment', deploymentSchema);

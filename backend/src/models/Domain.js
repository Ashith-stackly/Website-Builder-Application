const mongoose = require('mongoose');

const domainSchema = new mongoose.Schema(
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
      index: true,
    },
    subdomain: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    customDomain: {
      type: String,
      default: '',
      trim: true,
    },
    dnsVerified: {
      type: Boolean,
      default: false,
    },
    sslStatus: {
      type: String,
      enum: ['none', 'pending', 'active', 'failed'],
      default: 'none',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

domainSchema.index({ customDomain: 1 }, { sparse: true });

module.exports = mongoose.model('Domain', domainSchema);

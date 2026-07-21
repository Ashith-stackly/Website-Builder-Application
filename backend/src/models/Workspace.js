const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    projectName: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: 100,
    },
    category: {
      type: String,
      default: '',
    },
    style: {
      type: String,
      default: '',
    },
    sections: [
      {
        type: String,
      },
    ],
    description: {
      type: String,
      default: '',
    },
    thumbnail: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'deleted'],
      default: 'active',
    },
    settings: {
      domain: { type: String, default: '' },
      seo: {
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        keywords: { type: String, default: '' },
      },
      visibility: {
        type: String,
        enum: ['public', 'private', 'password'],
        default: 'public',
      },
    },
    components: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    designTokens: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Full builder blob { components, sections, designTokens, seo, canvasMode, projectName }
    // as sent by the frontend builder store on autosave.
    builderData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Rendered/export HTML for the current page.
    htmlContent: {
      type: String,
      default: '',
    },
    // Timestamp of the most recent successful publish/deployment.
    // Set by publishService when a deployment completes.
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient per-user queries
workspaceSchema.index({ userId: 1, status: 1, updatedAt: -1 });

module.exports = mongoose.model('Workspace', workspaceSchema);

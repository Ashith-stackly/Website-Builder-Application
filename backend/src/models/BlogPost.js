const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      default: '',
    },
    excerpt: {
      type: String,
      default: '',
      maxlength: 500,
    },
    coverImage: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: '',
    },
    tags: [{ type: String }],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    seo: {
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      keywords: { type: String, default: '' },
    },
    publishedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Slug must be unique within a workspace
blogPostSchema.index({ workspaceId: 1, slug: 1 }, { unique: true });
blogPostSchema.index({ workspaceId: 1, status: 1, publishedAt: -1 });

module.exports = mongoose.model('BlogPost', blogPostSchema);

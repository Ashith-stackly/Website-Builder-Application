const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['portfolio', 'blog', 'store', 'business', 'restaurant'],
    },
    description: {
      type: String,
      default: '',
    },
    thumbnail: {
      type: String,
      default: '',
    },
    previewUrl: {
      type: String,
      default: '',
    },
    components: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    designTokens: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    sections: [{ type: String }],
    style: {
      type: String,
      default: 'Modern',
    },
    tags: [{ type: String }],
    featured: {
      type: Boolean,
      default: false,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    premium: {
      type: Boolean,
      default: false,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

templateSchema.index({ category: 1, featured: -1 });

module.exports = mongoose.model('Template', templateSchema);

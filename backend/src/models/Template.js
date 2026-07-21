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
    // Canonical Builder document. The legacy top-level components and
    // designTokens remain for existing records and older consumers.
    builderData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Templates currently contain a single editable homepage, but storing
    // explicit page metadata keeps the public contract ready for multi-page
    // templates without changing the clone workflow later.
    pages: {
      type: [
        {
          id: { type: String, required: true },
          name: { type: String, required: true },
          path: { type: String, required: true },
        },
      ],
      default: () => [{ id: 'home', name: 'Home', path: '/' }],
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

const mongoose = require('mongoose');

const templateWishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Each user can wishlist a template only once
templateWishlistSchema.index({ userId: 1, templateId: 1 }, { unique: true });
// Fast lookup of all wishlisted templates for a user
templateWishlistSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('TemplateWishlist', templateWishlistSchema);

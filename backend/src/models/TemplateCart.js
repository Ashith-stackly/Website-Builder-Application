const mongoose = require('mongoose');

const templateCartSchema = new mongoose.Schema(
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

// Each user can add a template to cart only once
templateCartSchema.index({ userId: 1, templateId: 1 }, { unique: true });
// Fast lookup of cart items for a user
templateCartSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('TemplateCart', templateCartSchema);

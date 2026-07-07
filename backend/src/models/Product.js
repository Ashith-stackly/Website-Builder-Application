const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    images: [{ type: String }],
    category: {
      type: String,
      default: '',
    },
    inventory: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'active',
    },
    salePrice: {
      type: Number,
      default: null,
      min: 0,
    },
    sku: {
      type: String,
      default: '',
      trim: true,
    },
    variants: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    options: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ workspaceId: 1, slug: 1 }, { unique: true });
productSchema.index({ workspaceId: 1, status: 1, updatedAt: -1 });

module.exports = mongoose.model('Product', productSchema);

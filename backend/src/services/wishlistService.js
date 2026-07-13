const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const Workspace = require('../models/Workspace');
const ApiError = require('../utils/ApiError');

async function verifyWorkspaceExists(workspaceId) {
  const exists = await Workspace.exists({ _id: workspaceId, status: { $ne: 'deleted' } });
  if (!exists) throw ApiError.notFound('Workspace not found');
}

async function getWishlist(userId, workspaceId) {
  await verifyWorkspaceExists(workspaceId);

  const wishlist = await Wishlist.findOne({ userId, workspaceId })
    .populate('products', 'name slug price salePrice currency images status category inventory')
    .lean();

  if (!wishlist) {
    return { products: [] };
  }

  // Filter out deleted/archived products
  const activeProducts = (wishlist.products || []).filter(
    (p) => p && p.status === 'active'
  );

  return { products: activeProducts };
}

async function addToWishlist(userId, workspaceId, productId) {
  await verifyWorkspaceExists(workspaceId);

  const product = await Product.findOne({ _id: productId, workspaceId }).lean();
  if (!product) throw ApiError.notFound('Product not found');

  // Upsert wishlist and add product (only if not already present)
  await Wishlist.findOneAndUpdate(
    { userId, workspaceId },
    { $addToSet: { products: productId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return { added: true };
}

async function removeFromWishlist(userId, workspaceId, productId) {
  const result = await Wishlist.findOneAndUpdate(
    { userId, workspaceId },
    { $pull: { products: productId } }
  );

  if (!result) throw ApiError.notFound('Wishlist not found');
  return { removed: true };
}

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};

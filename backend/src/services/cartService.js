const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Workspace = require('../models/Workspace');
const ApiError = require('../utils/ApiError');

async function verifyWorkspaceExists(workspaceId) {
  const exists = await Workspace.exists({ _id: workspaceId, status: { $ne: 'deleted' } });
  if (!exists) throw ApiError.notFound('Workspace not found');
}

async function getCart(userId, workspaceId) {
  await verifyWorkspaceExists(workspaceId);

  const cart = await Cart.findOne({ userId, workspaceId })
    .populate('items.productId', 'name slug price salePrice currency images status inventory')
    .lean();

  if (!cart) {
    return { items: [], total: 0, currency: 'INR' };
  }

  // Filter out items whose product was deleted and calculate total
  const validItems = cart.items
    .filter((item) => item.productId && item.productId.status === 'active')
    .map((item) => ({
      _id: item._id,
      product: item.productId,
      quantity: item.quantity,
      addedAt: item.addedAt,
      lineTotal: (item.productId.salePrice ?? item.productId.price) * item.quantity,
    }));

  const total = validItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const currency = validItems[0]?.product?.currency || 'INR';

  return { items: validItems, total, currency };
}

async function addItem(userId, workspaceId, productId, quantity = 1) {
  await verifyWorkspaceExists(workspaceId);

  quantity = Math.floor(Number(quantity));
  if (!Number.isFinite(quantity) || quantity < 1) {
    throw ApiError.badRequest('Quantity must be at least 1');
  }

  const product = await Product.findOne({ _id: productId, workspaceId, status: 'active' }).lean();
  if (!product) throw ApiError.notFound('Product not found or not active');

  // Upsert cart document, then add or update item
  let cart = await Cart.findOne({ userId, workspaceId });
  if (!cart) {
    cart = await Cart.create({
      userId,
      workspaceId,
      items: [{ productId, quantity }],
    });
    return cart.toObject();
  }

  // Check if product already in cart
  const existingItem = cart.items.find(
    (item) => item.productId.toString() === productId.toString()
  );

  if (existingItem) {
    if (existingItem.quantity + quantity > product.inventory) {
      throw ApiError.badRequest(`Only ${product.inventory} item(s) are available`);
    }
    existingItem.quantity += quantity;
  } else {
    if (quantity > product.inventory) {
      throw ApiError.badRequest(`Only ${product.inventory} item(s) are available`);
    }
    cart.items.push({ productId, quantity });
  }

  await cart.save();
  return cart.toObject();
}

async function updateItem(userId, workspaceId, itemId, quantity) {
  await verifyWorkspaceExists(workspaceId);

  if (!Number.isFinite(quantity) || quantity < 1) {
    throw ApiError.badRequest('Quantity must be at least 1');
  }

  const cart = await Cart.findOne({ userId, workspaceId });
  if (!cart) throw ApiError.notFound('Cart not found');

  const item = cart.items.id(itemId);
  if (!item) throw ApiError.notFound('Cart item not found');

  const product = await Product.findOne({ _id: item.productId, workspaceId, status: 'active' }).lean();
  if (!product) throw ApiError.notFound('Product not found or not active');
  if (quantity > product.inventory) {
    throw ApiError.badRequest(`Only ${product.inventory} item(s) are available`);
  }

  item.quantity = quantity;
  await cart.save();
  return cart.toObject();
}

async function removeItem(userId, workspaceId, itemId) {
  await verifyWorkspaceExists(workspaceId);

  const cart = await Cart.findOne({ userId, workspaceId });
  if (!cart) throw ApiError.notFound('Cart not found');

  const item = cart.items.id(itemId);
  if (!item) throw ApiError.notFound('Cart item not found');

  cart.items.pull(itemId);
  await cart.save();
  return cart.toObject();
}

async function clearCart(userId, workspaceId) {
  await verifyWorkspaceExists(workspaceId);
  await Cart.findOneAndUpdate(
    { userId, workspaceId },
    { $set: { items: [] } }
  );
}

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
};

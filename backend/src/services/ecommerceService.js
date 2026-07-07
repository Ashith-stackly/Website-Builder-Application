const Product = require('../models/Product');
const Order = require('../models/Order');
const Workspace = require('../models/Workspace');
const ApiError = require('../utils/ApiError');

function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
}

async function verifyWorkspaceOwnership(userId, workspaceId) {
  const exists = await Workspace.exists({
    _id: workspaceId,
    userId,
    status: { $ne: 'deleted' },
  });
  if (!exists) throw ApiError.notFound('Workspace not found');
}

// ─── Products ────────────────────────────────────────────────

async function createProduct(userId, body) {
  await verifyWorkspaceOwnership(userId, body.workspaceId);

  let slug = generateSlug(body.name);
  let suffix = 1;
  while (await Product.exists({ workspaceId: body.workspaceId, slug })) {
    slug = `${generateSlug(body.name)}-${suffix}`;
    suffix++;
  }

  const product = await Product.create({
    workspaceId: body.workspaceId,
    userId,
    name: body.name,
    slug,
    description: body.description || '',
    price: body.price,
    currency: body.currency || 'INR',
    images: body.images || [],
    category: body.category || '',
    inventory: body.inventory || 0,
    status: body.status || 'active',
    salePrice: body.salePrice != null ? body.salePrice : null,
    sku: body.sku || '',
    variants: body.variants || [],
    options: body.options || [],
  });

  return product.toObject();
}

async function listProducts(userId, workspaceId, query = {}) {
  await verifyWorkspaceOwnership(userId, workspaceId);

  return queryProducts(workspaceId, query, false);
}

async function queryProducts(workspaceId, query = {}, publicOnly = true) {
  if (workspaceId === 'default') {
    workspaceId = process.env.ECOMMERCE_WORKSPACE_ID;
    if (!workspaceId) throw ApiError.notFound('Default storefront is not configured');
  }
  const workspace = await Workspace.exists({
    _id: workspaceId,
    status: { $ne: 'deleted' },
  });
  if (!workspace) throw ApiError.notFound('Workspace not found');

  const filter = { workspaceId };
  if (publicOnly) filter.status = 'active';
  else if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;

  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  return {
    workspaceId: workspaceId.toString(),
    products,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

async function listStoreProducts(workspaceId, query = {}) {
  return queryProducts(workspaceId, query, true);
}

async function getProduct(userId, productId) {
  const product = await Product.findById(productId).lean();
  if (!product) throw ApiError.notFound('Product not found');
  await verifyWorkspaceOwnership(userId, product.workspaceId);
  return product;
}

async function updateProduct(userId, productId, body) {
  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound('Product not found');
  await verifyWorkspaceOwnership(userId, product.workspaceId);

  const fields = ['name', 'description', 'price', 'salePrice', 'currency', 'images', 'category', 'inventory', 'status', 'sku', 'variants', 'options'];
  for (const key of fields) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      product[key] = body[key];
    }
  }
  await product.save();
  return product.toObject();
}

async function deleteProduct(userId, productId) {
  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound('Product not found');
  await verifyWorkspaceOwnership(userId, product.workspaceId);
  await Product.deleteOne({ _id: productId });
}

// ─── Orders ────────────────────────────────────────────────

async function createOrder(body) {
  const order = await Order.create({
    workspaceId: body.workspaceId,
    userId: body.userId || undefined,
    items: body.items || [],
    totalAmount: body.totalAmount,
    currency: body.currency || 'INR',
    customerEmail: body.customerEmail || '',
    customerName: body.customerName || '',
    shippingAddress: body.shippingAddress || {},
  });
  return order.toObject();
}

async function listOrders(userId, workspaceId, query = {}) {
  await verifyWorkspaceOwnership(userId, workspaceId);

  const filter = { workspaceId };
  if (query.status) filter.status = query.status;

  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

async function getOrder(userId, orderId) {
  const order = await Order.findById(orderId).lean();
  if (!order) throw ApiError.notFound('Order not found');
  await verifyWorkspaceOwnership(userId, order.workspaceId);
  return order;
}

async function updateOrderStatus(userId, orderId, body) {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  await verifyWorkspaceOwnership(userId, order.workspaceId);

  if (body.status) order.status = body.status;
  if (body.paymentStatus) order.paymentStatus = body.paymentStatus;
  if (body.paymentId) order.paymentId = body.paymentId;

  await order.save();
  return order.toObject();
}

module.exports = {
  createProduct,
  listProducts,
  listStoreProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  createOrder,
  listOrders,
  getOrder,
  updateOrderStatus,
};

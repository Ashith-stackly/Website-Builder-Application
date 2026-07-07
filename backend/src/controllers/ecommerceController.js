const ecommerceService = require('../services/ecommerceService');

// ─── Products ────────────────────────────────────────────────

async function createProduct(req, res, next) {
  try {
    const product = await ecommerceService.createProduct(req.user._id, req.body);
    res.status(201).json({ message: 'Product created', product });
  } catch (err) {
    next(err);
  }
}

async function listProducts(req, res, next) {
  try {
    res.json(await ecommerceService.listProducts(req.user._id, req.params.workspaceId, req.query));
  } catch (err) {
    next(err);
  }
}

async function listStoreProducts(req, res, next) {
  try {
    res.json(await ecommerceService.listStoreProducts(req.params.workspaceId, req.query));
  } catch (err) {
    next(err);
  }
}

async function getProduct(req, res, next) {
  try {
    const product = await ecommerceService.getProduct(req.user._id, req.params.id);
    res.json({ product });
  } catch (err) {
    next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const product = await ecommerceService.updateProduct(req.user._id, req.params.id, req.body);
    res.json({ message: 'Product updated', product });
  } catch (err) {
    next(err);
  }
}

async function deleteProduct(req, res, next) {
  try {
    await ecommerceService.deleteProduct(req.user._id, req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
}

// ─── Orders ────────────────────────────────────────────────

async function createOrder(req, res, next) {
  try {
    const order = await ecommerceService.createOrder(req.body);
    res.status(201).json({ message: 'Order created', order });
  } catch (err) {
    next(err);
  }
}

async function listOrders(req, res, next) {
  try {
    res.json(await ecommerceService.listOrders(req.user._id, req.params.workspaceId, req.query));
  } catch (err) {
    next(err);
  }
}

async function getOrder(req, res, next) {
  try {
    const order = await ecommerceService.getOrder(req.user._id, req.params.id);
    res.json({ order });
  } catch (err) {
    next(err);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const order = await ecommerceService.updateOrderStatus(req.user._id, req.params.id, req.body);
    res.json({ message: 'Order updated', order });
  } catch (err) {
    next(err);
  }
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

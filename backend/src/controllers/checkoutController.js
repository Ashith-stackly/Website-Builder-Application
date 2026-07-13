const checkoutService = require('../services/checkoutService');

async function createOrder(req, res, next) {
  try {
    const result = await checkoutService.createCheckoutOrder(req.user?._id, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function verifyPayment(req, res, next) {
  try {
    const result = await checkoutService.verifyCheckoutPayment(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function listOrders(req, res, next) {
  try {
    res.json(await checkoutService.getOrders(req.user._id, req.query));
  } catch (err) {
    next(err);
  }
}

async function getOrder(req, res, next) {
  try {
    const order = await checkoutService.getOrder(req.user._id, req.params.id);
    res.json({ order });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createOrder,
  verifyPayment,
  listOrders,
  getOrder,
};

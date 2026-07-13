const paymentService = require('../services/paymentService');

async function createCheckout(req, res, next) {
  try {
    res.json(await paymentService.createStripeCheckout(req.user, req.body));
  } catch (err) {
    next(err);
  }
}

async function stripeWebhook(req, res, next) {
  try {
    res.json(await paymentService.handleStripeWebhook(req.body, req.headers['stripe-signature']));
  } catch (err) {
    next(err);
  }
}

async function cancelSubscription(req, res, next) {
  try {
    res.json(await paymentService.cancelSubscription(req.user, req.body));
  } catch (err) {
    next(err);
  }
}

async function createRazorpayOrder(req, res, next) {
  try {
    res.json(await paymentService.createRazorpayOrder(req.user, req.body));
  } catch (err) {
    next(err);
  }
}

async function verifyRazorpay(req, res, next) {
  try {
    res.json(await paymentService.verifyRazorpay(req.user, req.body));
  } catch (err) {
    next(err);
  }
}

async function getSubscription(req, res, next) {
  try {
    res.json(await paymentService.getSubscription(req.user._id));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createCheckout,
  stripeWebhook,
  cancelSubscription,
  createRazorpayOrder,
  verifyRazorpay,
  getSubscription,
};

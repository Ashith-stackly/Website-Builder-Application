const express = require('express');
const authenticate = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const checkoutController = require('../controllers/checkoutController');

const router = express.Router();

// POST /api/checkout/create-order — create order + Razorpay order (auth required)
router.post('/create-order', authenticate, checkoutController.createOrder);

// POST /api/checkout/verify-payment — verify Razorpay payment (optional auth — guest checkout possible)
router.post('/verify-payment', optionalAuth, checkoutController.verifyPayment);

// GET  /api/orders — list user's orders (auth required)
router.get('/orders', authenticate, checkoutController.listOrders);

// GET  /api/orders/:id — get single order (auth required)
router.get('/orders/:id', authenticate, checkoutController.getOrder);

module.exports = router;

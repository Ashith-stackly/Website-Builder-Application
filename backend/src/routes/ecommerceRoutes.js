const express = require('express');
const authenticate = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const ecommerceController = require('../controllers/ecommerceController');

const router = express.Router();

// Public storefront catalog. Management endpoints below remain owner-only.
router.get('/store/:workspaceId/products', ecommerceController.listStoreProducts);

// Products (auth required)
router.post('/product', authenticate, ecommerceController.createProduct);
router.get('/products/:workspaceId', authenticate, ecommerceController.listProducts);
router.get('/product/:id', authenticate, ecommerceController.getProduct);
router.put('/product/:id', authenticate, ecommerceController.updateProduct);
router.delete('/product/:id', authenticate, ecommerceController.deleteProduct);

// Orders
// Keep the legacy storefront URL, but route it through the server-priced checkout
// flow. Logged-in shoppers are associated with their account; guests can submit
// direct product items and complete payment with /api/checkout/verify-payment.
router.post('/order', optionalAuth, ecommerceController.createOrder);
router.get('/orders/:workspaceId', authenticate, ecommerceController.listOrders);
router.get('/order/:id', authenticate, ecommerceController.getOrder);
router.put('/order/:id', authenticate, ecommerceController.updateOrderStatus);

module.exports = router;

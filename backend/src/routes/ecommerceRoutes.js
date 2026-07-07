const express = require('express');
const authenticate = require('../middleware/auth');
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
router.post('/order', ecommerceController.createOrder); // Public (checkout from published store)
router.get('/orders/:workspaceId', authenticate, ecommerceController.listOrders);
router.get('/order/:id', authenticate, ecommerceController.getOrder);
router.put('/order/:id', authenticate, ecommerceController.updateOrderStatus);

module.exports = router;

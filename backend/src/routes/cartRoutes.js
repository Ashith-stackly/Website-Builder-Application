const express = require('express');
const authenticate = require('../middleware/auth');
const cartController = require('../controllers/cartController');

const router = express.Router();

router.use(authenticate);

// GET    /api/cart/:workspaceId          — get cart with populated products
router.get('/:workspaceId', cartController.getCart);

// POST   /api/cart/:workspaceId/items    — add item to cart
router.post('/:workspaceId/items', cartController.addItem);

// PUT    /api/cart/:workspaceId/items/:itemId — update item quantity
router.put('/:workspaceId/items/:itemId', cartController.updateItem);

// DELETE /api/cart/:workspaceId/items/:itemId — remove item from cart
router.delete('/:workspaceId/items/:itemId', cartController.removeItem);

// DELETE /api/cart/:workspaceId          — clear entire cart
router.delete('/:workspaceId', cartController.clearCart);

module.exports = router;

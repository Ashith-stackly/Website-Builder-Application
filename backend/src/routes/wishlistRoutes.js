const express = require('express');
const authenticate = require('../middleware/auth');
const wishlistController = require('../controllers/wishlistController');

const router = express.Router();

router.use(authenticate);

// GET    /api/wishlist/:workspaceId                — get wishlist
router.get('/:workspaceId', wishlistController.getWishlist);

// POST   /api/wishlist/:workspaceId/:productId     — add product to wishlist
router.post('/:workspaceId/:productId', wishlistController.addToWishlist);

// DELETE /api/wishlist/:workspaceId/:productId     — remove product from wishlist
router.delete('/:workspaceId/:productId', wishlistController.removeFromWishlist);

module.exports = router;

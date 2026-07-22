const express = require('express');
const authenticate = require('../middleware/auth');
const templateController = require('../controllers/templateController');

const router = express.Router();

// Public template catalog.
router.get('/list', templateController.listTemplates);

// Authenticated template wishlist and cart routes must precede the dynamic
// template route below so their literal paths are never interpreted as slugs.
router.get('/wishlist', authenticate, templateController.getWishlist);
router.post('/wishlist/:templateId', authenticate, templateController.addToWishlist);
router.delete('/wishlist/:templateId', authenticate, templateController.removeFromWishlist);

router.get('/cart', authenticate, templateController.getCart);
router.post('/cart/:templateId', authenticate, templateController.addToCart);
router.delete('/cart/:templateId', authenticate, templateController.removeFromCart);

// The existing clone endpoint is canonical; no parallel clone route is kept.
router.post('/:id/use', authenticate, templateController.useTemplate);

// Public template details by Mongo id or slug. Keep this catch-all last.
router.get('/:idOrSlug', templateController.getTemplate);

module.exports = router;

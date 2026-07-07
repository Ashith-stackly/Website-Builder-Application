const express = require('express');
const authenticate = require('../middleware/auth');
const templateController = require('../controllers/templateController');

const router = express.Router();

// Public — template listing
router.get('/list', templateController.listTemplates);

// Auth required — template wishlist (must be before /:idOrSlug to avoid route conflict)
router.get('/wishlist', authenticate, templateController.getWishlist);
router.post('/wishlist/:templateId', authenticate, templateController.addToWishlist);
router.delete('/wishlist/:templateId', authenticate, templateController.removeFromWishlist);

// Auth required — template cart (must be before /:idOrSlug to avoid route conflict)
router.get('/cart', authenticate, templateController.getCart);
router.post('/cart/:templateId', authenticate, templateController.addToCart);
router.delete('/cart/:templateId', authenticate, templateController.removeFromCart);

// Public — get single template (catch-all parameterized route — must be last)
router.get('/:idOrSlug', templateController.getTemplate);

// Auth required — use template
router.post('/:id/use', authenticate, templateController.useTemplate);

module.exports = router;

const express = require('express');
const authenticate = require('../middleware/auth');
const blogController = require('../controllers/blogController');

const router = express.Router();

// Auth required
router.post('/post', authenticate, blogController.createPost);
router.get('/posts/:workspaceId', authenticate, blogController.listPosts);
router.get('/post/:id', authenticate, blogController.getPost);
router.put('/post/:id', authenticate, blogController.updatePost);
router.delete('/post/:id', authenticate, blogController.deletePost);

// Public (for SEO crawlers)
router.get('/sitemap/:workspaceId', blogController.generateSitemap);

module.exports = router;

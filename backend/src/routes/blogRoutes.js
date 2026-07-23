const express = require('express');
const authenticate = require('../middleware/auth');
const blogController = require('../controllers/blogController');

const router = express.Router();

// Public post delivery for the generated slug URL. Only published posts are exposed.
router.get('/public/:workspaceId', blogController.listPublicPosts);
router.get('/public/:workspaceId/:slug', blogController.getPublicPost);
router.get('/sitemap/:workspaceId', blogController.generateSitemap);
router.get('/all-slugs', blogController.listAllSlugs);

// Authenticated CMS management.
router.use(authenticate);
router.post('/post', blogController.createPost);
router.get('/posts/:workspaceId', blogController.listPosts);
router.get('/posts/:workspaceId/slug/:slug', blogController.getPostBySlug);
router.get('/post/:id', blogController.getPost);
router.put('/post/:id', blogController.updatePost);
router.delete('/post/:id', blogController.deletePost);

module.exports = router;

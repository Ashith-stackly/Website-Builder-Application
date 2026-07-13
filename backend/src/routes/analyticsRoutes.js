const express = require('express');
const authenticate = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

// Public — called from published sites (tracking pixel/script)
router.post('/event', analyticsController.ingestEvent);

// Auth required — dashboard analytics
router.get('/:workspaceId', authenticate, analyticsController.getProjectAnalytics);

module.exports = router;

const express = require('express');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const rateLimit = require('../middleware/rateLimit');
const analyticsController = require('../controllers/analyticsController');
const {
  ingestEventValidation,
  projectAnalyticsParam,
} = require('../validators/analyticsValidation');

const router = express.Router();

/**
 * POST /api/analytics/event
 *
 * Public endpoint called from published sites (tracking pixel/script).
 * Secured with:
 *   - Rate limiting (120 requests/minute per IP)
 *   - Input validation (workspaceId must be a valid MongoDB ObjectId)
 *   - Workspace existence check (in the service layer)
 */
router.post(
  '/event',
  rateLimit({ windowMs: 60_000, max: 120, message: 'Analytics rate limit exceeded. Try again later.' }),
  ingestEventValidation,
  validate,
  analyticsController.ingestEvent
);

// Auth required — dashboard analytics for a specific project
router.get(
  '/:workspaceId',
  authenticate,
  projectAnalyticsParam,
  validate,
  analyticsController.getProjectAnalytics
);

module.exports = router;

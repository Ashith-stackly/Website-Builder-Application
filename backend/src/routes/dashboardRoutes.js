const express = require('express');
const authenticate = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

router.use(authenticate);

/**
 * GET /api/dashboard/summary
 *
 * Returns all data needed by the dashboard page in a single call:
 *   - Project counts (total, active, archived, published)
 *   - Aggregate analytics (views, visitors — last 30 days)
 *   - Recent projects (last 5)
 *
 * Replaces the previous N+1 pattern where the frontend called
 * GET /api/analytics/:workspaceId once per project.
 */
router.get('/summary', dashboardController.getSummary);

module.exports = router;

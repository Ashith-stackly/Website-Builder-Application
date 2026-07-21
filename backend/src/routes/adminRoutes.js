const express = require('express');
const authenticate = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const adminDashboardController = require('../controllers/adminDashboardController');

const router = express.Router();

// Keep platform-wide data entirely separate from the user dashboard API.
router.use(authenticate, requireAdmin);
router.get('/dashboard/summary', adminDashboardController.getSummary);

module.exports = router;

const express = require('express');
const authenticateAdmin = require('../middleware/requireAdmin');
const adminAuthController = require('../controllers/adminAuthController');
const adminDashboardController = require('../controllers/adminDashboardController');
const validate = require('../middleware/validate');
const rateLimit = require('../middleware/rateLimit');
const { adminLoginValidation } = require('../validators/adminAuthValidation');

const router = express.Router();

// ── Admin Authentication ────────────────────────────────────────────────
// Public — no auth required for login
router.post(
  '/auth/login',
  rateLimit({ windowMs: 60_000, max: 10, message: 'Too many admin login attempts. Try again later.' }),
  adminLoginValidation,
  validate,
  adminAuthController.login,
);

// Protected — requires a valid admin JWT
router.get('/auth/me', authenticateAdmin, adminAuthController.me);

// ── Admin Dashboard ─────────────────────────────────────────────────────
// Keep platform-wide data entirely separate from the user dashboard API.
router.get('/dashboard/summary', authenticateAdmin, adminDashboardController.getSummary);

module.exports = router;

const adminDashboardService = require('../services/adminDashboardService');

async function getSummary(req, res, next) {
  try {
    const summary = await adminDashboardService.getAdminDashboardSummary({ days: req.query.days });
    res.json(summary);
  } catch (error) {
    next(error);
  }
}

module.exports = { getSummary };

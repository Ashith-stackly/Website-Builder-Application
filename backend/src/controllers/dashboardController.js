const dashboardService = require('../services/dashboardService');

async function getSummary(req, res, next) {
  try {
    const summary = await dashboardService.getDashboardSummary(req.user._id);
    res.json(summary);
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary };

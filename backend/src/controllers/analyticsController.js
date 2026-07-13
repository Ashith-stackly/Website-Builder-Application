const analyticsService = require('../services/analyticsService');

async function ingestEvent(req, res, next) {
  try {
    await analyticsService.ingestEvent(req.body);
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function getProjectAnalytics(req, res, next) {
  try {
    const data = await analyticsService.getProjectAnalytics(
      req.user._id,
      req.params.workspaceId,
      req.query
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { ingestEvent, getProjectAnalytics };

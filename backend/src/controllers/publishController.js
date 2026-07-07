const publishService = require('../services/publishService');

async function publishSite(req, res, next) {
  try {
    const deployment = await publishService.publishSite(req.user._id, req.params.workspaceId);
    res.status(201).json({ message: 'Site published', deployment });
  } catch (err) {
    next(err);
  }
}

async function getDeployments(req, res, next) {
  try {
    res.json(await publishService.getDeployments(req.user._id, req.params.workspaceId, req.query));
  } catch (err) {
    next(err);
  }
}

async function rollback(req, res, next) {
  try {
    const deployment = await publishService.rollback(req.user._id, req.params.workspaceId, req.params.deploymentId);
    res.json({ message: 'Rolled back successfully', deployment });
  } catch (err) {
    next(err);
  }
}

async function getActiveDeployment(req, res, next) {
  try {
    const deployment = await publishService.getActiveDeployment(req.user._id, req.params.workspaceId);
    res.json({ deployment });
  } catch (err) {
    next(err);
  }
}

module.exports = { publishSite, getDeployments, rollback, getActiveDeployment };

const workspaceService = require('../services/workspaceService');

async function createWorkspace(req, res, next) {
  try {
    const workspace = await workspaceService.createWorkspace(req.user._id, req.body);
    res.status(201).json({ message: 'Workspace created', workspace });
  } catch (err) {
    next(err);
  }
}

async function listWorkspaces(req, res, next) {
  try {
    res.json(await workspaceService.listWorkspaces(req.user._id, req.query));
  } catch (err) {
    next(err);
  }
}

async function getWorkspace(req, res, next) {
  try {
    const workspace = await workspaceService.findOwnedWorkspace(req.user._id, req.params.id);
    res.json({ workspace });
  } catch (err) {
    next(err);
  }
}

async function updateWorkspace(req, res, next) {
  try {
    const workspace = await workspaceService.updateWorkspace(req.user._id, req.params.id, req.body);
    res.json({ message: 'Workspace updated', workspace });
  } catch (err) {
    next(err);
  }
}

async function deleteWorkspace(req, res, next) {
  try {
    await workspaceService.deleteWorkspace(req.user._id, req.params.id);
    res.json({ message: 'Workspace deleted' });
  } catch (err) {
    next(err);
  }
}

async function duplicateWorkspace(req, res, next) {
  try {
    const workspace = await workspaceService.duplicateWorkspace(req.user._id, req.params.id);
    res.status(201).json({ message: 'Workspace duplicated', workspace });
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const workspace = await workspaceService.updateSettings(req.user._id, req.params.id, req.body);
    res.json({ message: 'Workspace settings updated', workspace });
  } catch (err) {
    next(err);
  }
}

async function getState(req, res, next) {
  try {
    const state = await workspaceService.getState(req.user._id, req.params.id);
    res.json({ state });
  } catch (err) {
    next(err);
  }
}

async function saveState(req, res, next) {
  try {
    const state = await workspaceService.saveState(req.user._id, req.params.id, req.body);
    res.json({ message: 'Workspace state saved', state });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createWorkspace,
  listWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  duplicateWorkspace,
  updateSettings,
  getState,
  saveState,
};

/**
 * DEPRECATED — Workspace routes.
 *
 * These routes operate on the same Workspace collection as /api/projects.
 * The /api/projects routes (projectRoutes.js) are the canonical API and
 * should be used by new frontend code.
 *
 * These routes are retained for backward compatibility with the builder
 * (which still uses workspace/:id/state). They should be consolidated
 * into projectRoutes in a future sprint.
 */
const express = require('express');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const workspaceController = require('../controllers/workspaceController');
const {
  mongoIdParam,
  createWorkspaceValidation,
  updateWorkspaceValidation,
  listWorkspaceValidation,
  settingsValidation,
} = require('../validators/workspaceValidation');

const router = express.Router();

router.use(authenticate);

router.post('/create', createWorkspaceValidation, validate, workspaceController.createWorkspace);
router.get('/list', listWorkspaceValidation, validate, workspaceController.listWorkspaces);
router.get('/:id', mongoIdParam, validate, workspaceController.getWorkspace);
router.put('/:id', updateWorkspaceValidation, validate, workspaceController.updateWorkspace);
router.delete('/:id', mongoIdParam, validate, workspaceController.deleteWorkspace);
router.post('/:id/duplicate', mongoIdParam, validate, workspaceController.duplicateWorkspace);
router.put('/:id/settings', settingsValidation, validate, workspaceController.updateSettings);
router.get('/:id/state', mongoIdParam, validate, workspaceController.getState);
router.put('/:id/state', mongoIdParam, validate, workspaceController.saveState);

module.exports = router;

const express = require('express');
const authenticate = require('../middleware/auth');
const publishController = require('../controllers/publishController');

const router = express.Router();

router.use(authenticate);

router.post('/:workspaceId', publishController.publishSite);
router.get('/:workspaceId/deployments', publishController.getDeployments);
router.get('/:workspaceId/active', publishController.getActiveDeployment);
router.post('/:workspaceId/rollback/:deploymentId', publishController.rollback);

module.exports = router;

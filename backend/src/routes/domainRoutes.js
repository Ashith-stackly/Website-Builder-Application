const express = require('express');
const authenticate = require('../middleware/auth');
const domainController = require('../controllers/domainController');

const router = express.Router();

router.use(authenticate);

router.post('/:workspaceId/subdomain', domainController.generateSubdomain);
router.put('/:workspaceId/custom', domainController.setCustomDomain);
router.post('/:workspaceId/verify-dns', domainController.verifyDns);
router.get('/:workspaceId', domainController.getDomain);

module.exports = router;

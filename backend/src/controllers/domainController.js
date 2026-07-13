const domainService = require('../services/domainService');

async function generateSubdomain(req, res, next) {
  try {
    const domain = await domainService.generateSubdomain(req.user._id, req.params.workspaceId);
    res.json({ domain });
  } catch (err) {
    next(err);
  }
}

async function setCustomDomain(req, res, next) {
  try {
    const domain = await domainService.setCustomDomain(req.user._id, req.params.workspaceId, req.body.customDomain);
    res.json({ message: 'Custom domain set', domain });
  } catch (err) {
    next(err);
  }
}

async function verifyDns(req, res, next) {
  try {
    res.json(await domainService.verifyDns(req.user._id, req.params.workspaceId));
  } catch (err) {
    next(err);
  }
}

async function getDomain(req, res, next) {
  try {
    const domain = await domainService.getDomain(req.user._id, req.params.workspaceId);
    res.json({ domain });
  } catch (err) {
    next(err);
  }
}

module.exports = { generateSubdomain, setCustomDomain, verifyDns, getDomain };

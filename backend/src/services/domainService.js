const Domain = require('../models/Domain');
const Workspace = require('../models/Workspace');
const ApiError = require('../utils/ApiError');

/**
 * Generate a unique subdomain for a workspace.
 */
async function generateSubdomain(userId, workspaceId) {
  const workspace = await Workspace.findOne({
    _id: workspaceId,
    userId,
    status: { $ne: 'deleted' },
  }).lean();
  if (!workspace) throw ApiError.notFound('Workspace not found');

  // Check if domain already exists
  const existing = await Domain.findOne({ workspaceId });
  if (existing?.subdomain) return existing;

  const baseName = workspace.projectName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 30);

  let subdomain = baseName;
  let suffix = 1;
  while (await Domain.exists({ subdomain })) {
    subdomain = `${baseName}-${suffix}`;
    suffix++;
  }

  const domain = await Domain.findOneAndUpdate(
    { workspaceId },
    {
      workspaceId,
      userId,
      subdomain,
      status: 'active',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return domain.toObject();
}

/**
 * Set a custom domain for a workspace.
 */
async function setCustomDomain(userId, workspaceId, customDomain) {
  const workspace = await Workspace.exists({
    _id: workspaceId,
    userId,
    status: { $ne: 'deleted' },
  });
  if (!workspace) throw ApiError.notFound('Workspace not found');

  const domain = await Domain.findOneAndUpdate(
    { workspaceId },
    {
      workspaceId,
      userId,
      customDomain,
      dnsVerified: false,
      sslStatus: 'none',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return domain.toObject();
}

/**
 * Verify DNS for a custom domain.
 * In dev mode, always returns mock success.
 */
async function verifyDns(userId, workspaceId) {
  const domain = await Domain.findOne({ workspaceId, userId });
  if (!domain) throw ApiError.notFound('No domain configured for this workspace');

  if (!domain.customDomain) {
    throw ApiError.badRequest('No custom domain set — nothing to verify');
  }

  if (process.env.NODE_ENV !== 'production') {
    // Mock DNS verification in development
    domain.dnsVerified = true;
    domain.sslStatus = 'active';
    domain.status = 'active';
    await domain.save();
    return {
      verified: true,
      message: 'DNS verification simulated (dev mode)',
      domain: domain.toObject(),
    };
  }

  // In production, this would call a real DNS lookup or cloud API
  // For now, return pending status
  return {
    verified: false,
    message: 'DNS verification requires production infrastructure. Configure your DNS provider to point to Stackly.',
    domain: domain.toObject(),
  };
}

/**
 * Get domain info for a workspace.
 */
async function getDomain(userId, workspaceId) {
  const workspace = await Workspace.exists({
    _id: workspaceId,
    userId,
    status: { $ne: 'deleted' },
  });
  if (!workspace) throw ApiError.notFound('Workspace not found');

  const domain = await Domain.findOne({ workspaceId }).lean();
  return domain || null;
}

module.exports = {
  generateSubdomain,
  setCustomDomain,
  verifyDns,
  getDomain,
};

const Deployment = require('../models/Deployment');
const Workspace = require('../models/Workspace');
const WorkspaceState = require('../models/WorkspaceState');
const ApiError = require('../utils/ApiError');

/**
 * Publish a site — converts workspace state to a deployment version.
 */
async function publishSite(userId, workspaceId) {
  const workspace = await Workspace.findOne({
    _id: workspaceId,
    userId,
    status: { $ne: 'deleted' },
  }).lean();
  if (!workspace) throw ApiError.notFound('Workspace not found');

  const state = await WorkspaceState.findOne({ workspaceId }).lean();
  if (!state) throw ApiError.badRequest('No builder state found — save your project first');

  // Get next version number
  const latestDeployment = await Deployment.findOne({ workspaceId })
    .sort({ version: -1 })
    .lean();
  const nextVersion = (latestDeployment?.version || 0) + 1;

  // Build HTML snapshot from workspace state
  // In production, this would generate full static HTML/CSS/assets and upload to S3
  const htmlSnapshot = JSON.stringify({
    components: state.builderData?.components || workspace.components || [],
    designTokens: workspace.designTokens || {},
    projectName: workspace.projectName,
  });

  const deployment = await Deployment.create({
    workspaceId,
    userId,
    version: nextVersion,
    status: process.env.AWS_S3_BUCKET ? 'building' : 'deployed',
    htmlSnapshot,
    deployedAt: new Date(),
    metadata: {
      projectName: workspace.projectName,
      category: workspace.category,
    },
  });

  return deployment.toObject();
}

/**
 * Get deployment history for a workspace.
 */
async function getDeployments(userId, workspaceId, query = {}) {
  const workspace = await Workspace.exists({
    _id: workspaceId,
    userId,
    status: { $ne: 'deleted' },
  });
  if (!workspace) throw ApiError.notFound('Workspace not found');

  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
  const skip = (page - 1) * limit;

  const [deployments, total] = await Promise.all([
    Deployment.find({ workspaceId })
      .select('-htmlSnapshot -__v')
      .sort({ version: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Deployment.countDocuments({ workspaceId }),
  ]);

  return {
    deployments,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

/**
 * Rollback to a previous deployment version.
 */
async function rollback(userId, workspaceId, deploymentId) {
  const workspace = await Workspace.exists({
    _id: workspaceId,
    userId,
    status: { $ne: 'deleted' },
  });
  if (!workspace) throw ApiError.notFound('Workspace not found');

  const target = await Deployment.findOne({
    _id: deploymentId,
    workspaceId,
  });
  if (!target) throw ApiError.notFound('Deployment not found');

  // Mark current active as rolled_back
  await Deployment.updateMany(
    { workspaceId, status: 'deployed' },
    { status: 'rolled_back' }
  );

  // Create new deployment from target snapshot
  const latestDeployment = await Deployment.findOne({ workspaceId })
    .sort({ version: -1 })
    .lean();
  const nextVersion = (latestDeployment?.version || 0) + 1;

  const rollbackDeploy = await Deployment.create({
    workspaceId,
    userId,
    version: nextVersion,
    status: 'deployed',
    htmlSnapshot: target.htmlSnapshot,
    deployedAt: new Date(),
    metadata: {
      ...target.metadata,
      rolledBackFrom: target.version,
    },
  });

  return rollbackDeploy.toObject();
}

/**
 * Get the latest active deployment.
 */
async function getActiveDeployment(userId, workspaceId) {
  const workspace = await Workspace.exists({
    _id: workspaceId,
    userId,
    status: { $ne: 'deleted' },
  });
  if (!workspace) throw ApiError.notFound('Workspace not found');

  const deployment = await Deployment.findOne({
    workspaceId,
    status: 'deployed',
  })
    .sort({ version: -1 })
    .select('-htmlSnapshot -__v')
    .lean();

  return deployment || null;
}

module.exports = {
  publishSite,
  getDeployments,
  rollback,
  getActiveDeployment,
};

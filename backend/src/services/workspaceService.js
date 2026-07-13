const Workspace = require('../models/Workspace');
const WorkspaceState = require('../models/WorkspaceState');
const ApiError = require('../utils/ApiError');

// Fields to exclude from list views (components/designTokens are large Mixed blobs)
const LIST_PROJECTION = '-components -designTokens -__v';

/**
 * Verify ownership and return a lean workspace (read-only).
 * For write operations, use findOwnedWorkspaceForWrite() instead.
 */
async function findOwnedWorkspace(userId, workspaceId) {
  const workspace = await Workspace.findOne(
    { _id: workspaceId, userId, status: { $ne: 'deleted' } }
  ).lean();
  if (!workspace) throw ApiError.notFound('Workspace not found');
  return workspace;
}

/**
 * Verify ownership only — returns true/false without loading the document.
 */
async function verifyOwnership(userId, workspaceId) {
  const exists = await Workspace.exists({
    _id: workspaceId,
    userId,
    status: { $ne: 'deleted' },
  });
  if (!exists) throw ApiError.notFound('Workspace not found');
  return true;
}

async function createWorkspace(userId, body) {
  const doc = await Workspace.create({
    userId,
    projectName: body.projectName,
    category: body.category || '',
    style: body.style || '',
    sections: body.sections || [],
    description: body.description || '',
    thumbnail: body.thumbnail || '',
    components: body.components || [],
    designTokens: body.designTokens || {},
  });
  return doc.toObject();
}

async function listWorkspaces(userId, query = {}) {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  const skip = (page - 1) * limit;
  const filter = { userId, status: { $ne: 'deleted' } };
  const [items, total] = await Promise.all([
    Workspace.find(filter)
      .select(LIST_PROJECTION)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Workspace.countDocuments(filter),
  ]);

  return {
    projects: items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

async function updateWorkspace(userId, workspaceId, body) {
  const fields = ['projectName', 'category', 'style', 'sections', 'description', 'thumbnail', 'status', 'components', 'designTokens'];
  const $set = {};
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(body, field) && typeof body[field] !== 'undefined') {
      $set[field] = body[field];
    }
  }

  const workspace = await Workspace.findOneAndUpdate(
    { _id: workspaceId, userId, status: { $ne: 'deleted' } },
    { $set },
    { new: true, lean: true }
  );
  if (!workspace) throw ApiError.notFound('Workspace not found');
  return workspace;
}

async function deleteWorkspace(userId, workspaceId) {
  const result = await Workspace.findOneAndUpdate(
    { _id: workspaceId, userId, status: { $ne: 'deleted' } },
    { $set: { status: 'deleted' } }
  );
  if (!result) throw ApiError.notFound('Workspace not found');
}

async function duplicateWorkspace(userId, workspaceId) {
  const workspace = await findOwnedWorkspace(userId, workspaceId);
  const { _id, createdAt, updatedAt, __v, ...source } = workspace;

  const copy = await Workspace.create({
    ...source,
    projectName: `${workspace.projectName} Copy`,
    userId,
    status: 'active',
  });

  const state = await WorkspaceState.findOne({ workspaceId: workspace._id }).lean();
  if (state) {
    await WorkspaceState.create({
      workspaceId: copy._id,
      pageData: state.pageData,
      builderData: state.builderData,
    });
  }
  return copy.toObject();
}

async function updateSettings(userId, workspaceId, body) {
  // Need to read current settings to merge, then atomic update
  const workspace = await findOwnedWorkspace(userId, workspaceId);
  const mergedSettings = {
    ...workspace.settings,
    ...body,
    seo: {
      ...workspace.settings?.seo,
      ...(body.seo || {}),
    },
  };

  const updated = await Workspace.findOneAndUpdate(
    { _id: workspaceId, userId },
    { $set: { settings: mergedSettings } },
    { new: true, lean: true }
  );
  return updated;
}

async function getState(userId, workspaceId) {
  await verifyOwnership(userId, workspaceId);
  const state = await WorkspaceState.findOne({ workspaceId }).lean();
  return state || { workspaceId, pageData: {}, builderData: {} };
}

async function saveState(userId, workspaceId, body) {
  await verifyOwnership(userId, workspaceId);

  const state = await WorkspaceState.findOneAndUpdate(
    { workspaceId },
    {
      pageData: body.pageData || {},
      builderData: body.builderData || {},
      updatedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, lean: true }
  );

  return state;
}

module.exports = {
  findOwnedWorkspace,
  verifyOwnership,
  createWorkspace,
  listWorkspaces,
  updateWorkspace,
  deleteWorkspace,
  duplicateWorkspace,
  updateSettings,
  getState,
  saveState,
};

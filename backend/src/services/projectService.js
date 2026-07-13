const Workspace = require('../models/Workspace');
const ApiError = require('../utils/ApiError');

// Fields to exclude from list views — builderData/htmlContent are large blobs the
// dashboard list does not need.
const LIST_PROJECTION = '-components -designTokens -builderData -htmlContent -__v';

const ACTIVE_FILTER = (userId, id) => ({ _id: id, userId, status: { $ne: 'deleted' } });

/**
 * Map a Workspace document to the frontend `ProjectApiProject` shape
 * (see frontend/lib/projectApi.ts). `builderData` falls back to top-level
 * components/designTokens for workspaces created before this field existed.
 */
function toProject(doc) {
  if (!doc) return null;
  const builderData =
    doc.builderData && Object.keys(doc.builderData).length > 0
      ? doc.builderData
      : {
          schemaVersion: 1,
          components: doc.components || [],
          sections: doc.components || [],
          designTokens: doc.designTokens || undefined,
          projectName: doc.projectName,
        };

  return {
    _id: doc._id,
    projectName: doc.projectName,
    description: doc.description || '',
    category: doc.category || '',
    style: doc.style || '',
    sections: doc.sections || [],
    status: doc.status || 'active',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    builderData,
    htmlContent: doc.htmlContent || '',
  };
}

/** Lightweight list projection — no large blobs. */
async function listProjects(userId) {
  const items = await Workspace.find({ userId, status: { $ne: 'deleted' } })
    .select(LIST_PROJECTION)
    .sort({ updatedAt: -1 })
    .lean();
  return items.map(toProject);
}

async function createProject(userId, body) {
  const doc = await Workspace.create({
    userId,
    projectName: body.projectName,
    category: body.category || '',
    style: body.style || '',
    sections: Array.isArray(body.sections) ? body.sections : [],
    description: body.description || '',
    components: [],
    designTokens: {},
    builderData: {},
    htmlContent: '',
  });
  return toProject(doc.toObject());
}

async function getProject(userId, id) {
  const doc = await Workspace.findOne(ACTIVE_FILTER(userId, id)).lean();
  if (!doc) throw ApiError.notFound('Project not found');
  return toProject(doc);
}

async function autosave(userId, id, { builderData, htmlContent }) {
  const $set = { builderData: builderData || {} };
  // Mirror the components/designTokens onto the top level so list/legacy
  // consumers and older tooling stay consistent.
  if (builderData && typeof builderData === 'object') {
    if (Array.isArray(builderData.components)) $set.components = builderData.components;
    if (builderData.designTokens) $set.designTokens = builderData.designTokens;
  }
  if (typeof htmlContent === 'string') $set.htmlContent = htmlContent;

  const doc = await Workspace.findOneAndUpdate(
    ACTIVE_FILTER(userId, id),
    { $set },
    { new: true, lean: true }
  );
  if (!doc) throw ApiError.notFound('Project not found');
  return { savedAt: doc.updatedAt };
}

async function saveHtml(userId, id, htmlContent) {
  const doc = await Workspace.findOneAndUpdate(
    ACTIVE_FILTER(userId, id),
    { $set: { htmlContent: typeof htmlContent === 'string' ? htmlContent : '' } },
    { new: true, lean: true }
  );
  if (!doc) throw ApiError.notFound('Project not found');
  return { savedAt: doc.updatedAt };
}

async function updateProject(userId, id, body) {
  const fields = ['projectName', 'description', 'category', 'style', 'sections', 'status', 'thumbnail'];
  const $set = {};
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(body, field) && typeof body[field] !== 'undefined') {
      $set[field] = body[field];
    }
  }

  const doc = await Workspace.findOneAndUpdate(
    ACTIVE_FILTER(userId, id),
    { $set },
    { new: true, lean: true }
  );
  if (!doc) throw ApiError.notFound('Project not found');
  return toProject(doc);
}

async function deleteProject(userId, id) {
  const doc = await Workspace.findOneAndUpdate(
    ACTIVE_FILTER(userId, id),
    { $set: { status: 'deleted' } }
  );
  if (!doc) throw ApiError.notFound('Project not found');
}

module.exports = {
  toProject,
  listProjects,
  createProject,
  getProject,
  autosave,
  saveHtml,
  updateProject,
  deleteProject,
};

const Workspace = require('../models/Workspace');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { getProjectLimit } = require('../constants/plans');

// Fields to exclude from list views — builderData/ecommerceData/htmlContent are large blobs the
// dashboard list does not need.
const LIST_PROJECTION = '-components -designTokens -builderData -ecommerceData -htmlContent -__v';

const ACTIVE_FILTER = (userId, id) => ({ _id: id, userId, status: { $ne: 'deleted' } });

/**
 * Enforce the same per-user project capacity for every project creation path.
 * Template cloning ultimately creates a Workspace too, so it must use this
 * canonical project-limit check rather than bypass it.
 */
async function assertProjectCapacity(userId, knownUser) {
  const user = knownUser || await User.findById(userId).select('plan role').lean();
  if (!user || user.role === 'admin') return;

  const plan = user.plan || 'free';
  const limit = getProjectLimit(plan);
  if (limit === -1) return;

  const currentCount = await Workspace.countDocuments({
    userId,
    status: { $ne: 'deleted' },
  });
  if (currentCount >= limit) {
    throw ApiError.forbidden(
      `Your "${plan}" plan allows a maximum of ${limit} projects. Upgrade your plan to create more.`
    );
  }
}

/**
 * Map a Workspace document to the frontend `ProjectApiProject` shape
 * (see frontend/lib/projectApi.ts). `builderData` falls back to top-level
 * components/designTokens for workspaces created before this field existed.
 */
function toProject(doc) {
  if (!doc) return null;
  const isEcommerce = doc.editorType === 'ecommerce' || doc.category === 'E-commerce';
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
    category: doc.category || (isEcommerce ? 'E-commerce' : ''),
    style: doc.style || '',
    sections: doc.sections || [],
    status: doc.status || 'active',
    editorType: doc.editorType || (isEcommerce ? 'ecommerce' : 'builder'),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    builderData,
    ecommerceData: doc.ecommerceData || {},
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
  // ── Plan-based project limit enforcement ────────────────────────────
  await assertProjectCapacity(userId);

  const isEcommerce = body.editorType === 'ecommerce' || body.category === 'E-commerce';
  const editorType = isEcommerce ? 'ecommerce' : (body.editorType || 'builder');

  const doc = await Workspace.create({
    userId,
    projectName: body.projectName,
    category: body.category || (isEcommerce ? 'E-commerce' : ''),
    style: body.style || '',
    sections: Array.isArray(body.sections) ? body.sections : [],
    description: body.description || '',
    editorType,
    components: [],
    designTokens: {},
    builderData: {},
    ecommerceData: body.ecommerceData || {},
    htmlContent: '',
  });
  return toProject(doc.toObject());
}

async function getProject(userId, id) {
  const doc = await Workspace.findOne(ACTIVE_FILTER(userId, id)).lean();
  if (!doc) throw ApiError.notFound('Project not found');
  return toProject(doc);
}

async function autosave(userId, id, { builderData, ecommerceData, editorType, htmlContent }) {
  const $set = {};

  if (editorType) {
    $set.editorType = editorType;
  }

  if (editorType === 'ecommerce' || ecommerceData) {
    $set.ecommerceData = ecommerceData || {};
  }

  if (editorType === 'builder' || builderData) {
    $set.builderData = builderData || {};
    // Mirror the components/designTokens onto the top level so list/legacy
    // consumers and older tooling stay consistent.
    if (builderData && typeof builderData === 'object') {
      if (Array.isArray(builderData.components)) $set.components = builderData.components;
      if (builderData.designTokens) $set.designTokens = builderData.designTokens;
    }
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
  const fields = ['projectName', 'description', 'category', 'style', 'sections', 'status', 'thumbnail', 'editorType'];
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
  assertProjectCapacity,
  listProjects,
  createProject,
  getProject,
  autosave,
  saveHtml,
  updateProject,
  deleteProject,
};

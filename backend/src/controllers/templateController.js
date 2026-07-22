const templateService = require('../services/templateService');

async function listTemplates(req, res, next) {
  try {
    res.json(await templateService.listTemplates(req.query));
  } catch (err) {
    next(err);
  }
}

async function getTemplate(req, res, next) {
  try {
    const template = await templateService.getTemplate(req.params.idOrSlug);
    res.json({ success: true, template });
  } catch (err) {
    next(err);
  }
}

async function useTemplate(req, res, next) {
  try {
    const result = await templateService.useTemplate(req.user._id, req.params.id);
    res.status(201).json({
      success: true,
      message: 'Project created from template',
      projectId: result.project._id,
      // A project is backed by the same Workspace record. Keep both names in
      // the public response while the legacy workspace API remains available.
      workspaceId: result.workspaceId,
      project: result.project,
      builderData: result.builderData,
      template: result.template,
    });
  } catch (err) {
    next(err);
  }
}

// ─── Template Wishlist ──────────────────────────────────────

async function getWishlist(req, res, next) {
  try {
    const templates = await templateService.getWishlist(req.user._id);
    res.json({ templates });
  } catch (err) {
    next(err);
  }
}

async function addToWishlist(req, res, next) {
  try {
    res.status(201).json(await templateService.addToWishlist(req.user._id, req.params.templateId));
  } catch (err) {
    next(err);
  }
}

async function removeFromWishlist(req, res, next) {
  try {
    res.json(await templateService.removeFromWishlist(req.user._id, req.params.templateId));
  } catch (err) {
    next(err);
  }
}

// ─── Template Cart ──────────────────────────────────────────

async function getCart(req, res, next) {
  try {
    const templates = await templateService.getCart(req.user._id);
    res.json({ templates });
  } catch (err) {
    next(err);
  }
}

async function addToCart(req, res, next) {
  try {
    res.status(201).json(await templateService.addToCart(req.user._id, req.params.templateId));
  } catch (err) {
    next(err);
  }
}

async function removeFromCart(req, res, next) {
  try {
    res.json(await templateService.removeFromCart(req.user._id, req.params.templateId));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listTemplates,
  getTemplate,
  useTemplate,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getCart,
  addToCart,
  removeFromCart,
};

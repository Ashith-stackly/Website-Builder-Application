const projectService = require('../services/projectService');

async function list(req, res, next) {
  try {
    const projects = await projectService.listProjects(req.user._id);
    res.json({ success: true, projects });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const project = await projectService.createProject(req.user._id, req.body);
    res.status(201).json({ success: true, project });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const project = await projectService.getProject(req.user._id, req.params.id);
    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const project = await projectService.updateProject(req.user._id, req.params.id, req.body);
    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await projectService.deleteProject(req.user._id, req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function autosave(req, res, next) {
  try {
    const { savedAt } = await projectService.autosave(req.user._id, req.params.id, req.body);
    res.json({ success: true, savedAt });
  } catch (err) {
    next(err);
  }
}

async function saveHtml(req, res, next) {
  try {
    const { savedAt } = await projectService.saveHtml(req.user._id, req.params.id, req.body.htmlContent);
    res.json({ success: true, savedAt });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  create,
  getOne,
  update,
  remove,
  autosave,
  saveHtml,
};

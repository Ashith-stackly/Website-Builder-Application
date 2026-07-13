const { body, param, query } = require('express-validator');

const mongoIdParam = [param('id').isMongoId().withMessage('Invalid workspace id')];

const createWorkspaceValidation = [
  body('projectName').trim().isLength({ min: 1, max: 100 }).withMessage('Project name is required'),
  body('category').optional({ values: 'falsy' }).trim().isLength({ max: 80 }).withMessage('Category is too long'),
  body('style').optional({ values: 'falsy' }).trim().isLength({ max: 80 }).withMessage('Style is too long'),
  body('sections').optional().isArray().withMessage('Sections must be an array'),
];

const updateWorkspaceValidation = [
  ...mongoIdParam,
  body('projectName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Project name is required'),
  body('status').optional().isIn(['active', 'archived', 'deleted']).withMessage('Invalid status'),
];

const listWorkspaceValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
];

const settingsValidation = [
  ...mongoIdParam,
  body('visibility').optional().isIn(['public', 'private', 'password']).withMessage('Invalid visibility'),
];

module.exports = {
  mongoIdParam,
  createWorkspaceValidation,
  updateWorkspaceValidation,
  listWorkspaceValidation,
  settingsValidation,
};

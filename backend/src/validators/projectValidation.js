const { body, param } = require('express-validator');

const mongoIdParam = [param('id').isMongoId().withMessage('Invalid project id')];

const createProjectValidation = [
  body('projectName').trim().isLength({ min: 1, max: 100 }).withMessage('Project name is required'),
  body('category').optional({ values: 'falsy' }).trim().isLength({ max: 80 }).withMessage('Category is too long'),
  body('style').optional({ values: 'falsy' }).trim().isLength({ max: 80 }).withMessage('Style is too long'),
  body('sections').optional().isArray().withMessage('Sections must be an array'),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('Description is too long'),
];

const updateProjectValidation = [
  ...mongoIdParam,
  body('projectName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Project name is required'),
  body('status').optional().isIn(['active', 'archived', 'deleted']).withMessage('Invalid status'),
  body('sections').optional().isArray().withMessage('Sections must be an array'),
];

const autosaveValidation = [
  ...mongoIdParam,
  body('builderData').optional().isObject().withMessage('builderData must be an object'),
  body('htmlContent').optional().isString().withMessage('htmlContent must be a string'),
];

const saveHtmlValidation = [
  ...mongoIdParam,
  body('htmlContent').isString().withMessage('htmlContent must be a string'),
];

module.exports = {
  mongoIdParam,
  createProjectValidation,
  updateProjectValidation,
  autosaveValidation,
  saveHtmlValidation,
};

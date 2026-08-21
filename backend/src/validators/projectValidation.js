const { body, param } = require('express-validator');

const mongoIdParam = [param('id').isMongoId().withMessage('Invalid project id')];

const createProjectValidation = [
  body('projectName').trim().isLength({ min: 1, max: 100 }).withMessage('Project name is required'),
  body('category').optional({ values: 'falsy' }).trim().isLength({ max: 80 }).withMessage('Category is too long'),
  body('style').optional({ values: 'falsy' }).trim().isLength({ max: 80 }).withMessage('Style is too long'),
  body('sections').optional().isArray().withMessage('Sections must be an array'),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('Description is too long'),
  body('editorType').optional().isIn(['builder', 'ecommerce', 'blockpages']).withMessage('Invalid editorType'),
];

const updateProjectValidation = [
  ...mongoIdParam,
  body('projectName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Project name is required'),
  body('status').optional().isIn(['active', 'archived', 'deleted']).withMessage('Invalid status'),
  body('sections').optional().isArray().withMessage('Sections must be an array'),
  body('editorType').optional().isIn(['builder', 'ecommerce', 'blockpages']).withMessage('Invalid editorType'),
];

const autosaveValidation = [
  ...mongoIdParam,
  body('editorType').optional().isIn(['builder', 'ecommerce', 'blockpages']).withMessage('Invalid editorType'),
  body('builderData').optional().isObject().withMessage('builderData must be an object'),
  body('ecommerceData').optional().isObject().withMessage('ecommerceData must be an object'),
  body('htmlContent').optional().isString().withMessage('htmlContent must be a string'),
  body('category').optional({ values: 'falsy' }).trim().isLength({ max: 80 }).withMessage('Category is too long'),
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

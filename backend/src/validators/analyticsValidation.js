const { body, param } = require('express-validator');

/**
 * Validation rules for analytics endpoints.
 */

const ingestEventValidation = [
  body('workspaceId')
    .notEmpty().withMessage('workspaceId is required')
    .isMongoId().withMessage('workspaceId must be a valid ID'),
  body('eventType')
    .optional()
    .isIn(['page_view', 'click', 'form_submit', 'scroll', 'custom'])
    .withMessage('Invalid eventType'),
  body('path')
    .optional()
    .isString().withMessage('path must be a string')
    .isLength({ max: 2048 }).withMessage('path is too long')
    .trim(),
  body('referrer')
    .optional()
    .isString().withMessage('referrer must be a string')
    .isLength({ max: 2048 }).withMessage('referrer is too long')
    .trim(),
  body('sessionId')
    .optional()
    .isString().withMessage('sessionId must be a string')
    .isLength({ max: 128 }).withMessage('sessionId is too long')
    .trim(),
  body('userAgent')
    .optional()
    .isString().withMessage('userAgent must be a string')
    .isLength({ max: 512 }).withMessage('userAgent is too long'),
  body('metadata')
    .optional()
    .isObject().withMessage('metadata must be an object'),
];

const projectAnalyticsParam = [
  param('workspaceId')
    .isMongoId().withMessage('Invalid workspace ID'),
];

module.exports = {
  ingestEventValidation,
  projectAnalyticsParam,
};

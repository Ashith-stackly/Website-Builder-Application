const { body } = require('express-validator');

const TONES = [
  'professional',
  'creative',
  'friendly',
  'corporate',
  'minimal',
  'luxury',
  'startup',
  'playful',
  'bold',
  'concise',
];

const LENGTHS = ['short', 'medium', 'long'];
const IMAGE_ASPECT_RATIOS = ['1:1', '4:3', '3:4', '16:9', '9:16', 'square', 'landscape', 'portrait'];
const IMAGE_SIZES = ['small', 'medium', 'large', '1024x1024', '1536x1024', '1024x1536'];

function optionalShortText(field, max) {
  return body(field)
    .optional({ values: 'falsy' })
    .isString().withMessage(`${field} must be a string`)
    .isLength({ max }).withMessage(`${field} is too long`)
    .trim();
}

const generateTextValidation = [
  body('blockType')
    .notEmpty().withMessage('blockType is required')
    .isString().withMessage('blockType must be a string')
    .matches(/^[a-zA-Z0-9-]+$/).withMessage('blockType contains invalid characters')
    .isLength({ max: 64 }).withMessage('blockType is too long')
    .trim(),
  body('field')
    .notEmpty().withMessage('field is required')
    .isString().withMessage('field must be a string')
    .matches(/^[a-zA-Z0-9_. -]+$/).withMessage('field contains invalid characters')
    .isLength({ max: 80 }).withMessage('field is too long')
    .trim(),
  body('tone')
    .optional({ values: 'falsy' })
    .isString().withMessage('tone must be a string')
    .trim()
    .toLowerCase()
    .isIn(TONES).withMessage(`tone must be one of: ${TONES.join(', ')}`),
  body('length')
    .optional({ values: 'falsy' })
    .isString().withMessage('length must be a string')
    .trim()
    .toLowerCase()
    .isIn(LENGTHS).withMessage(`length must be one of: ${LENGTHS.join(', ')}`),
  optionalShortText('businessType', 120),
  optionalShortText('websiteName', 160),
  optionalShortText('additionalInstructions', 1200),
  optionalShortText('currentText', 2000),
  body('keywords')
    .optional({ values: 'falsy' })
    .custom((value) => {
      if (typeof value === 'string' && value.length <= 512) return true;
      if (Array.isArray(value) && value.length <= 12 && value.every((item) => typeof item === 'string' && item.length <= 80)) return true;
      throw new Error('keywords must be a short comma-separated string or an array of up to 12 strings');
    }),
  body('wholeSection')
    .optional()
    .isBoolean().withMessage('wholeSection must be a boolean')
    .toBoolean(),
  body('sectionFields')
    .optional()
    .isArray({ max: 24 }).withMessage('sectionFields must contain no more than 24 fields'),
  body('sectionFields.*')
    .optional()
    .isString().withMessage('sectionFields entries must be strings')
    .isLength({ max: 80 }).withMessage('sectionFields entries are too long')
    .matches(/^[a-zA-Z0-9_. -]+$/).withMessage('sectionFields entries contain invalid characters')
    .trim(),
];

const generateImageValidation = [
  body('prompt')
    .notEmpty().withMessage('prompt is required')
    .isString().withMessage('prompt must be a string')
    .isLength({ max: 1000 }).withMessage('prompt is too long')
    .trim(),
  optionalShortText('style', 80),
  optionalShortText('alt', 200),
  body('aspectRatio')
    .optional({ values: 'falsy' })
    .isIn(IMAGE_ASPECT_RATIOS).withMessage('aspectRatio is not supported'),
  body('size')
    .optional({ values: 'falsy' })
    .isIn(IMAGE_SIZES).withMessage('size is not supported'),
  body('mode')
    .optional({ values: 'falsy' })
    .isString().withMessage('mode must be a string')
    .trim()
    .toLowerCase()
    .isIn(['generate', 'placeholder']).withMessage('mode must be generate or placeholder'),
];

const suggestLayoutValidation = [
  optionalShortText('businessType', 120),
  optionalShortText('industry', 120),
  optionalShortText('goal', 160),
  body('contentLength')
    .optional({ values: 'falsy' })
    .isString().withMessage('contentLength must be a string')
    .trim()
    .toLowerCase()
    .isIn(LENGTHS).withMessage(`contentLength must be one of: ${LENGTHS.join(', ')}`),
  body('services')
    .optional({ values: 'falsy' })
    .custom((value) => {
      if (typeof value === 'string' && value.length <= 512) return true;
      if (Array.isArray(value) && value.length <= 12 && value.every((item) => typeof item === 'string' && item.length <= 80)) return true;
      throw new Error('services must be a short comma-separated string or an array of up to 12 strings');
    }),
];

module.exports = {
  generateTextValidation,
  generateImageValidation,
  suggestLayoutValidation,
};

const { body } = require('express-validator');

const updateProfileValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('avatar')
    .optional({ values: 'falsy' })
    .trim()
    .custom((value) => {
      if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(value)) return true;
      if (/^https?:\/\//i.test(value)) return true;
      throw new Error('Avatar must be a valid image URL or uploaded image');
    }),
];

module.exports = { updateProfileValidation };

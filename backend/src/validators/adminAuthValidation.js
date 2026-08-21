const { body } = require('express-validator');

const adminLoginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.'),
  body('password')
    .notEmpty().withMessage('Password is required.'),
];

module.exports = { adminLoginValidation };

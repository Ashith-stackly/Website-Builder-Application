const { body } = require('express-validator');

const passwordRule = body('password')
  .isLength({ min: 8, max: 60 })
  .withMessage('Password must be 8-60 characters')
  .matches(/[a-z]/)
  .withMessage('Password must include a lowercase letter')
  .matches(/[A-Z]/)
  .withMessage('Password must include an uppercase letter')
  .matches(/\d/)
  .withMessage('Password must include a number')
  .matches(/[^A-Za-z0-9]/)
  .withMessage('Password must include a symbol');

const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('mobile').optional({ values: 'falsy' }).trim().isLength({ min: 7, max: 20 }).withMessage('Valid mobile is required'),
  passwordRule,
  body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match'),
];

const loginValidation = [
  body().custom((value) => {
    if (!value.email && !value.mobile) throw new Error('Email or mobile is required');
    return true;
  }),
  body('email').optional({ values: 'falsy' }).trim().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('mobile').optional({ values: 'falsy' }).trim().isLength({ min: 7, max: 20 }).withMessage('Valid mobile is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordValidation = [
  body('input').trim().notEmpty().withMessage('Email or mobile is required'),
];

const sendEmailOtpValidation = [
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required'),
];

const sendMobileOtpValidation = [
  body('mobile').trim().isLength({ min: 7, max: 20 }).withMessage('Valid mobile is required'),
];

const verifyEmailValidation = [
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('action').optional().isIn(['resend']).withMessage('Invalid action'),
  body('otp').if(body('action').not().equals('resend')).isLength({ min: 4, max: 6 }).withMessage('OTP is required'),
];

const verifyMobileValidation = [
  body('mobile').trim().isLength({ min: 7, max: 20 }).withMessage('Valid mobile is required'),
  body('action').optional().isIn(['resend']).withMessage('Invalid action'),
  body('otp').if(body('action').not().equals('resend')).isLength({ min: 4, max: 6 }).withMessage('OTP is required'),
];

const resetPasswordValidation = [
  body('newPassword')
    .isLength({ min: 8, max: 60 })
    .withMessage('Password must be 8-60 characters')
    .matches(/[a-z]/)
    .withMessage('Password must include a lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must include an uppercase letter')
    .matches(/\d/)
    .withMessage('Password must include a number')
    .matches(/[^A-Za-z0-9]/)
    .withMessage('Password must include a symbol'),
  body('confirmPassword').custom((value, { req }) => value === req.body.newPassword).withMessage('Passwords do not match'),
];

module.exports = {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  sendEmailOtpValidation,
  sendMobileOtpValidation,
  verifyEmailValidation,
  verifyMobileValidation,
  resetPasswordValidation,
};

const express = require('express');
const validate = require('../middleware/validate');
const authController = require('../controllers/authController');
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  sendEmailOtpValidation,
  sendMobileOtpValidation,
  verifyEmailValidation,
  verifyMobileValidation,
  resetPasswordValidation,
} = require('../validators/authValidation');

const router = express.Router();

router.post('/register', registerValidation, validate, authController.register);
router.post('/login', loginValidation, validate, authController.login);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', forgotPasswordValidation, validate, authController.forgotPassword);
router.post('/send-email-otp', sendEmailOtpValidation, validate, authController.sendEmailOtp);
router.post('/send-mobile-otp', sendMobileOtpValidation, validate, authController.sendMobileOtp);
router.post('/verify-email', verifyEmailValidation, validate, authController.verifyEmail);
router.post('/verify-mobile', verifyMobileValidation, validate, authController.verifyMobile);
router.post('/reset-password', resetPasswordValidation, validate, authController.resetPassword);

router.get('/google', authController.googleCallback);
router.get('/oauth-failed', (_req, res) => res.status(401).json({ message: 'OAuth login failed' }));

module.exports = router;

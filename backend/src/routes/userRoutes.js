const express = require('express');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const userController = require('../controllers/userController');
const { updateProfileValidation } = require('../validators/userValidation');

const router = express.Router();

router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, updateProfileValidation, validate, userController.updateProfile);

module.exports = router;

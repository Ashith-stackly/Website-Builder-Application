const express = require('express');
const authenticate = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

router.post('/create-checkout', authenticate, paymentController.createCheckout);
router.post('/cancel', authenticate, paymentController.cancelSubscription);
router.get('/subscription', authenticate, paymentController.getSubscription);

module.exports = router;

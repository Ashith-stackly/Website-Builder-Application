const express = require('express');
const paymentController = require('../controllers/paymentController');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.post('/create-order', authenticate, paymentController.createRazorpayOrder);
router.post('/verify', authenticate, paymentController.verifyRazorpay);
router.get('/invoices', authenticate, paymentController.getInvoices);
router.post('/invoices', authenticate, paymentController.saveInvoice);

module.exports = router;

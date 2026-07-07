const Razorpay = require("razorpay");
const logger = require("../utils/logger");

// Initialize Razorpay with key and secret from environment variables
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

logger.info("Razorpay client initialized");

module.exports = razorpay;

const express = require('express');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const rateLimit = require('../middleware/rateLimit');
const aiController = require('../controllers/aiController');
const {
  generateTextValidation,
  generateImageValidation,
  suggestLayoutValidation,
} = require('../validators/aiValidation');

const router = express.Router();

function positiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function aiRateLimit(max, message) {
  return rateLimit({
    windowMs: positiveInt(process.env.AI_RATE_LIMIT_WINDOW_MS, 60_000),
    max,
    // Binding a limit to the authenticated account prevents a single user
    // from cycling IPs, while retaining IP data for support diagnostics.
    keyFn: (req) => `${req.user?._id?.toString() || 'anonymous'}:${req.ip || 'unknown'}`,
    message,
  });
}

const textRateLimit = aiRateLimit(
  positiveInt(process.env.AI_TEXT_RATE_LIMIT_MAX, 20),
  'AI text generation limit reached. Please try again shortly.'
);
const imageRateLimit = aiRateLimit(
  positiveInt(process.env.AI_IMAGE_RATE_LIMIT_MAX, 6),
  'AI image generation limit reached. Please try again shortly.'
);
const layoutRateLimit = aiRateLimit(
  positiveInt(process.env.AI_LAYOUT_RATE_LIMIT_MAX, 30),
  'AI layout suggestion limit reached. Please try again shortly.'
);

router.use(authenticate);

router.post('/generate-text', textRateLimit, generateTextValidation, validate, aiController.generateText);
router.post('/generate-image', imageRateLimit, generateImageValidation, validate, aiController.generateImage);
router.post('/suggest-layout', layoutRateLimit, suggestLayoutValidation, validate, aiController.suggestLayout);

module.exports = router;

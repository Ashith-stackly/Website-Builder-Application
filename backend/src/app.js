const express = require('express');
const cors = require('cors');
const passport = require('passport');
const configurePassport = require('./config/passport');
const requestLogger = require('./middleware/requestLogger');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');
const projectRoutes = require('./routes/projectRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const razorpayRoutes = require('./routes/razorpayRoutes');
const templateRoutes = require('./routes/templateRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const blogRoutes = require('./routes/blogRoutes');
const domainRoutes = require('./routes/domainRoutes');
const publishRoutes = require('./routes/publishRoutes');
const ecommerceRoutes = require('./routes/ecommerceRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const paymentController = require('./controllers/paymentController');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

const allowedOrigins = new Set(
  [
    ...(process.env.CORS_ORIGINS || '').split(','),
    process.env.FRONTEND_URL,
    ...(process.env.NODE_ENV !== 'production'
      ? ['http://localhost:3000', 'http://127.0.0.1:3000']
      : []),
  ]
    .map((origin) => (origin || '').trim())
    .filter(Boolean)
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.options(/.*/, cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(requestLogger);

configurePassport();
app.use(passport.initialize());

logger.info('Stackly backend initializing', {
  env: process.env.NODE_ENV || 'development',
  cors: [...allowedOrigins],
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'stackly-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/razorpay', razorpayRoutes);
app.use('/api/template', templateRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/domain', domainRoutes);
app.use('/api/publish', publishRoutes);
app.use('/api/ecommerce', ecommerceRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/checkout', checkoutRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

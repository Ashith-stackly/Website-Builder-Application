const crypto = require('crypto');
const Stripe = require('stripe');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { sanitizeUser } = require('../helpers');

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw ApiError.badRequest('Stripe is not configured');
  return Stripe(process.env.STRIPE_SECRET_KEY);
}

function buildExpiryDate(billingPeriod = 'Monthly') {
  const expiry = new Date();
  const normalized = String(billingPeriod).toLowerCase();
  if (normalized.includes('year')) {
    expiry.setFullYear(expiry.getFullYear() + 1);
  } else {
    expiry.setMonth(expiry.getMonth() + 1);
  }
  return expiry;
}

function isPlaceholderRazorpayValue(value) {
  return !value || /xxxx|your[_-]|placeholder|demo/i.test(value);
}

function hasRazorpayConfig() {
  return !isPlaceholderRazorpayValue(process.env.RAZORPAY_KEY_ID)
    && !isPlaceholderRazorpayValue(process.env.RAZORPAY_KEY_SECRET);
}

function normalizePlanName(planName = 'premium') {
  const normalized = String(planName).toLowerCase();
  if (normalized.includes('advanced')) return 'advanced';
  if (normalized.includes('business')) return 'business';
  if (normalized.includes('basic')) return 'basic';
  if (normalized.includes('free')) return 'free';
  return 'premium';
}

async function createStripeCheckout(user, body = {}) {
  const stripe = getStripe();
  const price = body.priceId || process.env.STRIPE_PRICE_ID;
  if (!price) throw ApiError.badRequest('Stripe price id is required');

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    customer_email: user.email,
    success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/settings?checkout=success`,
    cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/planning?checkout=cancelled`,
    metadata: { userId: user._id.toString() },
  });

  return { checkoutUrl: session.url, sessionId: session.id };
}

async function syncStripeCheckout(session) {
  await Subscription.findOneAndUpdate(
    { userId: session.metadata.userId, subscriptionId: session.subscription },
    {
      userId: session.metadata.userId,
      plan: 'premium',
      paymentProvider: 'stripe',
      paymentStatus: 'completed',
      subscriptionId: session.subscription,
      currency: session.currency?.toUpperCase() || 'USD',
      startDate: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await User.findByIdAndUpdate(session.metadata.userId, {
    plan: 'premium',
    subscriptionStatus: 'active',
    stripeCustomerId: session.customer || '',
  });
}

async function handleStripeWebhook(rawBody, signature) {
  const stripe = getStripe();
  const event = process.env.STRIPE_WEBHOOK_SECRET
    ? stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET)
    : rawBody;

  if (event.type === 'checkout.session.completed') {
    await syncStripeCheckout(event.data.object);
  }

  return { received: true };
}

async function cancelSubscription(user, body = {}) {
  const subscriptionId = body.subscriptionId;
  if (subscriptionId && process.env.STRIPE_SECRET_KEY) {
    const stripe = getStripe();
    await stripe.subscriptions.cancel(subscriptionId);
  }

  await Subscription.findOneAndUpdate(
    { userId: user._id, ...(subscriptionId ? { subscriptionId } : {}) },
    { paymentStatus: 'failed', expiryDate: new Date() },
    { sort: { createdAt: -1 } }
  );

  user.plan = 'free';
  user.subscriptionStatus = 'cancelled';
  await user.save();

  return { message: 'Subscription cancelled', user: sanitizeUser(user) };
}

async function createRazorpayOrder(user, body = {}) {
  const amount = Number(body.amountPaise);
  if (!Number.isFinite(amount) || amount <= 0) throw ApiError.badRequest('Valid amountPaise is required');

  if (!hasRazorpayConfig()) {
    if (process.env.NODE_ENV === 'production') throw ApiError.badRequest('Razorpay is not configured');
    return {
      orderId: `order_demo_${Date.now()}`,
      amount,
      currency: 'INR',
      keyId: 'rzp_test_demo',
    };
  }

  const Razorpay = require('razorpay');
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  const order = await razorpay.orders.create({
    amount,
    currency: 'INR',
    receipt: `stackly_${Date.now()}`,
    notes: {
      userId: user?._id?.toString() || '',
      planName: body.planName || '',
      billingPeriod: body.billingPeriod || '',
    },
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  };
}

async function verifyRazorpay(user, body = {}) {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    amount,
    currency = 'INR',
    planName = 'Premium',
    billingPeriod = 'Monthly',
    paymentMethod,
    bankName,
    cardNetwork,
    upiApp,
    walletName,
  } = body;

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    throw ApiError.badRequest('Razorpay payment payload is incomplete');
  }

  let verified = false;
  if (!hasRazorpayConfig()) {
    verified = process.env.NODE_ENV !== 'production';
  } else {
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    verified = expected === razorpay_signature;
  }

  if (!verified) return { verified: false };

  let instrumentLabel = paymentMethod || '';
  let bank = bankName || '';
  let cardNet = cardNetwork || '';
  let upi = upiApp || '';
  let wallet = walletName || '';

  if (hasRazorpayConfig() && razorpay_payment_id && !razorpay_payment_id.startsWith('pay_demo')) {
    try {
      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      const p = await razorpay.payments.fetch(razorpay_payment_id);
      if (p) {
        if (p.method === 'card' && p.card) {
          cardNet = p.card.network || p.card.type || 'Visa';
          bank = p.card.issuer || p.bank || '';
          instrumentLabel = bank ? `Card – ${cardNet} (${bank})` : `Card – ${cardNet}`;
        } else if (p.method === 'netbanking') {
          bank = p.bank || 'Bank';
          instrumentLabel = `Net Banking – ${bank}`;
        } else if (p.method === 'upi') {
          upi = p.vpa || 'Google Pay';
          instrumentLabel = `UPI – ${upi}`;
        } else if (p.method === 'wallet') {
          wallet = p.wallet || 'Wallet';
          instrumentLabel = `Wallet – ${wallet}`;
        }
      }
    } catch {
      /* ignore fetch error */
    }
  }

  if (!instrumentLabel || instrumentLabel === 'Razorpay') {
    if (bank) instrumentLabel = `Net Banking – ${bank}`;
    else if (cardNet) instrumentLabel = `Card – ${cardNet}${bank ? ` (${bank})` : ''}`;
    else if (upi) instrumentLabel = `UPI – ${upi}`;
    else if (wallet) instrumentLabel = `Wallet – ${wallet}`;
    else instrumentLabel = 'Card – Visa / MasterCard';
  }

  const startDate = new Date();
  const expiryDate = buildExpiryDate(billingPeriod);
  const plan = normalizePlanName(planName);

  if (user) {
    await Subscription.findOneAndUpdate(
      { userId: user._id, orderId: razorpay_order_id },
      {
        userId: user._id,
        plan,
        paymentProvider: 'razorpay',
        paymentStatus: 'completed',
        subscriptionId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: Number(amount) || 0,
        currency,
        startDate,
        expiryDate,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    user.plan = plan;
    user.subscriptionStatus = 'active';
    await user.save();
  }

  const cleanPayId = (razorpay_payment_id || '').replace(/^pay_/, '').toUpperCase();
  const invoiceId = `INV-${cleanPayId.substring(0, 10) || Math.floor(100000 + Math.random() * 899999)}`;
  const sanitized = user ? sanitizeUser(user) : null;

  return {
    verified: true,
    user: sanitized,
    subscription: {
      plan,
      paymentProvider: 'razorpay',
      paymentStatus: 'completed',
      planName,
      startDate,
      expiryDate,
    },
    paymentDetails: {
      invoiceId,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      paymentDate: startDate.toISOString(),
      paymentMethodLabel: instrumentLabel,
      bankName: bank,
      cardNetwork: cardNet,
      upiApp: upi,
      walletName: wallet,
      amount: Number(amount) || 0,
      currency,
      customerName: user?.name || 'Customer',
      customerEmail: user?.email || '',
      customerPhone: user?.mobile || user?.phone || '',
      customerAddress: user?.address || '',
    },
  };
}

async function getSubscription(userId) {
  const subscription = await Subscription.findOne({ userId })
    .sort({ createdAt: -1 })
    .lean();

  const user = await User.findById(userId)
    .select('plan subscriptionStatus')
    .lean();

  return {
    subscription: subscription || null,
    plan: user?.plan || 'free',
    subscriptionStatus: user?.subscriptionStatus || 'none',
  };
}

module.exports = {
  createStripeCheckout,
  handleStripeWebhook,
  cancelSubscription,
  createRazorpayOrder,
  verifyRazorpay,
  getSubscription,
};

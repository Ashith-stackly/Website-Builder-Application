const crypto = require('crypto');
const Stripe = require('stripe');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
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

function normalizePlanName(planName = '') {
  const normalized = String(planName).toLowerCase();
  if (normalized.includes('advanced')) return 'advanced';
  if (normalized.includes('business')) return 'business';
  if (normalized.includes('basic')) return 'basic';
  if (normalized.includes('free')) return 'free';
  if (normalized.includes('premium')) return 'premium';
  return 'free';
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
    planName = '',
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

  let resolvedPlanName = planName;
  if (hasRazorpayConfig() && razorpay_order_id && !String(razorpay_order_id).startsWith('order_demo')) {
    try {
      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      const order = await razorpay.orders.fetch(razorpay_order_id);
      if (order?.notes?.planName) resolvedPlanName = order.notes.planName;
    } catch {
      /* keep planName from request body */
    }
  }

  const plan = normalizePlanName(resolvedPlanName);

  const rawAmount = Number(amount) || 0;
  const amountRupees = (rawAmount >= 100 && currency === 'INR') ? Math.round(rawAmount / 100) : (rawAmount >= 100 ? rawAmount / 100 : rawAmount);

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
        amount: amountRupees,
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

  // Persist invoice to MongoDB so it is available across all sessions/devices
  if (user) {
    const amountDisplay = currency === 'INR'
      ? `₹${amountRupees}`
      : `$${amountRupees.toFixed(2)}`;
    const dateDisplay = startDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).replace(',', '');
    try {
      await Invoice.findOneAndUpdate(
        { userId: user._id, invoiceId },
        {
          userId: user._id,
          invoiceId,
          date: dateDisplay,
          amount: amountDisplay,
          status: rawAmount === 0 ? 'Free' : 'Paid',
          planName: planName || '',
          planTier: plan,
          websiteLabel: 'Stackly workspace subscription',
          paymentMethodLabel: instrumentLabel,
          paymentDetail: razorpay_payment_id
            ? `Payment ${razorpay_payment_id}${razorpay_order_id ? ` · Order ${razorpay_order_id}` : ''}`
            : '',
          buyerName: user.name || 'Customer',
          buyerEmail: user.email || '',
          buyerPhone: user.mobile || user.phone || '',
          buyerAddress: user.address || '',
          generatedAt: startDate.toISOString(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (invoiceErr) {
      // Non-critical — log but don't fail the payment verification
      console.error('Failed to persist invoice:', invoiceErr.message);
    }
  }

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
      amount: amountRupees,
      amountPaise: rawAmount,
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

async function getInvoices(userId) {
  const invoices = await Invoice.find({ userId })
    .sort({ createdAt: -1 })
    .lean();
  return invoices.map((inv) => ({
    date: inv.date,
    invoiceId: inv.invoiceId,
    amount: inv.amount,
    status: inv.status,
    planName: inv.planName || '',
    planTier: inv.planTier || '',
    websiteLabel: inv.websiteLabel || '',
    paymentMethodLabel: inv.paymentMethodLabel || '',
    paymentDetail: inv.paymentDetail || '',
    buyerName: inv.buyerName || '',
    buyerEmail: inv.buyerEmail || '',
    buyerPhone: inv.buyerPhone || '',
    buyerAddress: inv.buyerAddress || '',
    generatedAt: inv.generatedAt || '',
  }));
}

async function saveInvoice(userId, invoiceData) {
  if (!invoiceData || !invoiceData.invoiceId) {
    throw ApiError.badRequest('invoiceId is required');
  }
  const doc = await Invoice.findOneAndUpdate(
    { userId, invoiceId: invoiceData.invoiceId },
    {
      userId,
      invoiceId: invoiceData.invoiceId,
      date: invoiceData.date || '',
      amount: invoiceData.amount || '',
      status: invoiceData.status || 'Paid',
      planName: invoiceData.planName || '',
      planTier: invoiceData.planTier || '',
      websiteLabel: invoiceData.websiteLabel || 'Stackly workspace subscription',
      paymentMethodLabel: invoiceData.paymentMethodLabel || '',
      paymentDetail: invoiceData.paymentDetail || '',
      buyerName: invoiceData.buyerName || '',
      buyerEmail: invoiceData.buyerEmail || '',
      buyerPhone: invoiceData.buyerPhone || '',
      buyerAddress: invoiceData.buyerAddress || '',
      generatedAt: invoiceData.generatedAt || '',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return doc;
}

async function activateFreePlan(user, body = {}) {
  const plan = normalizePlanName(body.plan || 'basic');
  if (plan !== 'basic' && plan !== 'free') {
    throw ApiError.badRequest('Free activation is only available for the Basic/Free plan');
  }

  const amount = Number(body.amount);
  if (amount !== 0) {
    throw ApiError.badRequest('Amount must be 0 for free plan activation');
  }

  const startDate = new Date();
  const expiryDate = buildExpiryDate('Monthly');

  await Subscription.findOneAndUpdate(
    { userId: user._id, plan: 'basic', paymentProvider: 'none' },
    {
      userId: user._id,
      plan: 'basic',
      paymentProvider: 'none',
      paymentStatus: 'completed',
      subscriptionId: '',
      orderId: '',
      amount: 0,
      currency: 'INR',
      startDate,
      expiryDate,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  user.plan = 'basic';
  user.subscriptionStatus = 'active';
  await user.save();

  const sanitized = sanitizeUser(user);

  const invoiceId = `INV-FREE-${Date.now().toString(36).toUpperCase()}`;
  const dateDisplay = startDate
    .toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    .replace(',', '');
  try {
    await Invoice.findOneAndUpdate(
      { userId: user._id, invoiceId },
      {
        userId: user._id,
        invoiceId,
        date: dateDisplay,
        amount: '₹0',
        status: 'Free',
        planName: 'Basic (Free)',
        planTier: 'basic',
        websiteLabel: 'Stackly workspace subscription',
        paymentMethodLabel: 'Complimentary',
        paymentDetail: 'No charge — complimentary activation.',
        buyerName: user.name || 'Customer',
        buyerEmail: user.email || '',
        buyerPhone: user.mobile || user.phone || '',
        buyerAddress: user.address || '',
        generatedAt: startDate.toISOString(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (invoiceErr) {
    console.error('Failed to persist free plan invoice:', invoiceErr.message);
  }

  return {
    success: true,
    message: 'Free plan activated successfully',
    user: sanitized,
    subscription: {
      plan: 'basic',
      paymentProvider: 'none',
      paymentStatus: 'completed',
      planName: 'Basic (Free)',
      startDate,
      expiryDate,
    },
  };
}

module.exports = {
  createStripeCheckout,
  handleStripeWebhook,
  cancelSubscription,
  createRazorpayOrder,
  verifyRazorpay,
  getSubscription,
  getInvoices,
  saveInvoice,
  activateFreePlan,
};

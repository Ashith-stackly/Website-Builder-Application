const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Subscription = require('../src/models/Subscription');
const Invoice = require('../src/models/Invoice');
const Workspace = require('../src/models/Workspace');
const { signAccessToken } = require('../src/utils/jwt');

const BASE_URL = 'http://localhost:5000/api';

async function runFullRegression() {
  console.log('================================================================');
  console.log('STARTING FINAL COMPREHENSIVE REGRESSION SUITE');
  console.log('================================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB directly for verification.\n');

  const createdUserIds = [];

  try {
    // -------------------------------------------------------------
    // 1. BUSINESS PLAN COMPLETE FLOW
    // -------------------------------------------------------------
    console.log('--- [1. BUSINESS PLAN FLOW] ---');
    const userBiz = await User.create({
      name: 'Business Test User',
      email: `biz_regression_${Date.now()}@example.com`,
      password: 'Password123!',
      plan: 'free',
      subscriptionStatus: 'none',
    });
    createdUserIds.push(userBiz._id);
    const tokenBiz = signAccessToken({ sub: userBiz._id.toString(), role: userBiz.role });

    // 1a. Create Razorpay order for Business
    console.log('1a. POST /api/razorpay/create-order for Business...');
    const orderBizRes = await fetch(`${BASE_URL}/razorpay/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenBiz}`,
      },
      body: JSON.stringify({
        amountPaise: 15000,
        currency: 'INR',
        planName: 'Business',
        billingPeriod: 'Monthly',
      }),
    });
    const orderBizData = await orderBizRes.json();
    console.log('Create order status:', orderBizRes.status, 'OrderId:', orderBizData.orderId);
    if (orderBizRes.status !== 200 || !orderBizData.orderId) {
      throw new Error(`Business order creation failed: ${JSON.stringify(orderBizData)}`);
    }

    // 1b. Generate test payment & signature
    const payBizId = `pay_biz_${Date.now()}`;
    const signBiz = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderBizData.orderId}|${payBizId}`)
      .digest('hex');

    // 1c. POST /api/razorpay/verify
    console.log('1b. POST /api/razorpay/verify for Business payment...');
    const verifyBizRes = await fetch(`${BASE_URL}/razorpay/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenBiz}`,
      },
      body: JSON.stringify({
        razorpay_order_id: orderBizData.orderId,
        razorpay_payment_id: payBizId,
        razorpay_signature: signBiz,
        planName: 'Business',
        amount: 15000,
        currency: 'INR',
        billingPeriod: 'Monthly',
        paymentMethod: 'Card – Visa',
      }),
    });
    const verifyBizData = await verifyBizRes.json();
    console.log('Verify status:', verifyBizRes.status, 'Verified:', verifyBizData.verified);
    if (verifyBizRes.status !== 200 || !verifyBizData.verified) {
      throw new Error(`Business payment verification failed: ${JSON.stringify(verifyBizData)}`);
    }

    // 1d. Verify MongoDB Subscription & User
    const subBizDoc = await Subscription.findOne({ userId: userBiz._id }).sort({ createdAt: -1 }).lean();
    if (!subBizDoc || subBizDoc.plan !== 'business' || subBizDoc.paymentStatus !== 'completed') {
      throw new Error(`MongoDB Business subscription mismatch: ${JSON.stringify(subBizDoc)}`);
    }
    const userBizDoc = await User.findById(userBiz._id).lean();
    if (userBizDoc.plan !== 'business' || userBizDoc.subscriptionStatus !== 'active') {
      throw new Error(`MongoDB Business user mismatch: ${JSON.stringify(userBizDoc)}`);
    }
    console.log('MongoDB Subscription & User confirmed: plan = business, status = active');

    // 1e. Verify Invoice in MongoDB
    const invBizDoc = await Invoice.findOne({ userId: userBiz._id }).lean();
    if (!invBizDoc || invBizDoc.planTier !== 'business') {
      throw new Error(`MongoDB Business invoice mismatch: ${JSON.stringify(invBizDoc)}`);
    }
    console.log('MongoDB Invoice confirmed:', invBizDoc.invoiceId, invBizDoc.amount);

    // 1f. Verify GET /api/payment/subscription
    const subApiBizRes = await fetch(`${BASE_URL}/payment/subscription`, {
      headers: { 'Authorization': `Bearer ${tokenBiz}` },
    });
    const subApiBizData = await subApiBizRes.json();
    if (subApiBizData.plan !== 'business' || subApiBizData.subscriptionStatus !== 'active') {
      throw new Error(`GET /api/payment/subscription mismatch: ${JSON.stringify(subApiBizData)}`);
    }
    console.log('PASS: Business Plan complete paid flow verified.\n');

    // -------------------------------------------------------------
    // 2. ADVANCED PLAN COMPLETE FLOW
    // -------------------------------------------------------------
    console.log('--- [2. ADVANCED PLAN FLOW] ---');
    const userAdv = await User.create({
      name: 'Advanced Test User',
      email: `adv_regression_${Date.now()}@example.com`,
      password: 'Password123!',
      plan: 'free',
      subscriptionStatus: 'none',
    });
    createdUserIds.push(userAdv._id);
    const tokenAdv = signAccessToken({ sub: userAdv._id.toString(), role: userAdv.role });

    // 2a. Create Razorpay order for Advanced
    console.log('2a. POST /api/razorpay/create-order for Advanced...');
    const orderAdvRes = await fetch(`${BASE_URL}/razorpay/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenAdv}`,
      },
      body: JSON.stringify({
        amountPaise: 29000,
        currency: 'INR',
        planName: 'Advanced',
        billingPeriod: 'Monthly',
      }),
    });
    const orderAdvData = await orderAdvRes.json();
    console.log('Create order status:', orderAdvRes.status, 'OrderId:', orderAdvData.orderId);
    if (orderAdvRes.status !== 200 || !orderAdvData.orderId) {
      throw new Error(`Advanced order creation failed: ${JSON.stringify(orderAdvData)}`);
    }

    // 2b. Generate test payment & signature
    const payAdvId = `pay_adv_${Date.now()}`;
    const signAdv = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderAdvData.orderId}|${payAdvId}`)
      .digest('hex');

    // 2c. POST /api/razorpay/verify
    console.log('2b. POST /api/razorpay/verify for Advanced payment...');
    const verifyAdvRes = await fetch(`${BASE_URL}/razorpay/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenAdv}`,
      },
      body: JSON.stringify({
        razorpay_order_id: orderAdvData.orderId,
        razorpay_payment_id: payAdvId,
        razorpay_signature: signAdv,
        planName: 'Advanced',
        amount: 29000,
        currency: 'INR',
        billingPeriod: 'Monthly',
        paymentMethod: 'UPI – GPay',
      }),
    });
    const verifyAdvData = await verifyAdvRes.json();
    console.log('Verify status:', verifyAdvRes.status, 'Verified:', verifyAdvData.verified);
    if (verifyAdvRes.status !== 200 || !verifyAdvData.verified) {
      throw new Error(`Advanced payment verification failed: ${JSON.stringify(verifyAdvData)}`);
    }

    // 2d. Verify MongoDB Subscription, User, Invoice
    const subAdvDoc = await Subscription.findOne({ userId: userAdv._id }).sort({ createdAt: -1 }).lean();
    if (!subAdvDoc || subAdvDoc.plan !== 'advanced' || subAdvDoc.paymentStatus !== 'completed') {
      throw new Error(`MongoDB Advanced subscription mismatch: ${JSON.stringify(subAdvDoc)}`);
    }
    const invAdvDoc = await Invoice.findOne({ userId: userAdv._id }).lean();
    if (!invAdvDoc || invAdvDoc.planTier !== 'advanced') {
      throw new Error(`MongoDB Advanced invoice mismatch: ${JSON.stringify(invAdvDoc)}`);
    }

    // 2e. Verify GET /api/payment/subscription
    const subApiAdvRes = await fetch(`${BASE_URL}/payment/subscription`, {
      headers: { 'Authorization': `Bearer ${tokenAdv}` },
    });
    const subApiAdvData = await subApiAdvRes.json();
    if (subApiAdvData.plan !== 'advanced' || subApiAdvData.subscriptionStatus !== 'active') {
      throw new Error(`GET /api/payment/subscription mismatch: ${JSON.stringify(subApiAdvData)}`);
    }
    console.log('PASS: Advanced Plan complete paid flow verified.\n');

    // -------------------------------------------------------------
    // 3. FREE PLAN FLOW (NO RAZORPAY)
    // -------------------------------------------------------------
    console.log('--- [3. FREE PLAN FLOW] ---');
    const userFree = await User.create({
      name: 'Free Test User',
      email: `free_regression_${Date.now()}@example.com`,
      password: 'Password123!',
      plan: 'free',
      subscriptionStatus: 'none',
    });
    createdUserIds.push(userFree._id);
    const tokenFree = signAccessToken({ sub: userFree._id.toString(), role: userFree.role });

    console.log('3a. POST /api/payment/activate-free...');
    const freeRes = await fetch(`${BASE_URL}/payment/activate-free`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenFree}`,
      },
      body: JSON.stringify({ plan: 'Basic', amount: 0 }),
    });
    const freeData = await freeRes.json();
    console.log('Activate free status:', freeRes.status, 'Message:', freeData.message);
    if (freeRes.status !== 200 || !freeData.success) {
      throw new Error(`Free activation failed: ${JSON.stringify(freeData)}`);
    }

    const subFreeDoc = await Subscription.findOne({ userId: userFree._id }).sort({ createdAt: -1 }).lean();
    if (!subFreeDoc || subFreeDoc.plan !== 'basic' || subFreeDoc.paymentStatus !== 'completed') {
      throw new Error(`MongoDB Free subscription mismatch: ${JSON.stringify(subFreeDoc)}`);
    }
    const subApiFreeRes = await fetch(`${BASE_URL}/payment/subscription`, {
      headers: { 'Authorization': `Bearer ${tokenFree}` },
    });
    const subApiFreeData = await subApiFreeRes.json();
    if (subApiFreeData.plan !== 'basic' || subApiFreeData.subscriptionStatus !== 'active') {
      throw new Error(`GET /api/payment/subscription mismatch: ${JSON.stringify(subApiFreeData)}`);
    }
    console.log('PASS: Free Plan flow verified (active, bypassed Razorpay).\n');

    // -------------------------------------------------------------
    // 4. PROJECT CREATION, AUTOSAVE, PERSISTENCE & ISOLATION
    // -------------------------------------------------------------
    console.log('--- [4. PROJECT CREATION, AUTOSAVE & SECURITY] ---');
    // User A creates project
    const createProjRes = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenBiz}`,
      },
      body: JSON.stringify({
        projectName: 'Biz Portfolio Site',
        category: 'Portfolio',
        style: 'Minimal',
        sections: ['navigation', 'hero', 'gallery', 'contact', 'footer'],
      }),
    });
    const createProjData = await createProjRes.json();
    const projId = createProjData.project?._id;
    console.log('Created project for User Biz:', projId);
    if (!projId) throw new Error('Project ID not returned');

    // User A autosaves changes
    console.log('Autosaving project changes...');
    const autosaveRes = await fetch(`${BASE_URL}/projects/${projId}/autosave`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenBiz}`,
      },
      body: JSON.stringify({
        builderData: {
          schemaVersion: 1,
          components: [{ id: 'hero-custom', type: 'hero', title: 'Updated Hero' }],
        },
        htmlContent: '<section>Updated Hero</section>',
      }),
    });
    console.log('Autosave status:', autosaveRes.status);
    if (autosaveRes.status !== 200) throw new Error('Autosave failed');

    // Verify persistence in MongoDB
    const checkDoc = await Workspace.findById(projId).lean();
    if (checkDoc.htmlContent !== '<section>Updated Hero</section>') {
      throw new Error('Workspace persistence failed');
    }
    console.log('Workspace autosave verified in MongoDB.');

    // User Adv (User B) attempts to read/modify User Biz (User A) project -> Must return 404
    console.log('Testing User B cross-tenant isolation on User A project...');
    const isolGetRes = await fetch(`${BASE_URL}/projects/${projId}`, {
      headers: { 'Authorization': `Bearer ${tokenAdv}` },
    });
    console.log('Cross-tenant GET status:', isolGetRes.status);
    if (isolGetRes.status !== 404) throw new Error(`Expected 404, got ${isolGetRes.status}`);

    const isolPutRes = await fetch(`${BASE_URL}/projects/${projId}/autosave`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenAdv}`,
      },
      body: JSON.stringify({ htmlContent: '<hacked>bad</hacked>' }),
    });
    console.log('Cross-tenant PUT status:', isolPutRes.status);
    if (isolPutRes.status !== 404) throw new Error(`Expected 404, got ${isolPutRes.status}`);
    console.log('PASS: Strict cross-user tenant security confirmed.\n');

    console.log('================================================================');
    console.log('ALL REGRESSION TESTS PASSED (100%)');
    console.log('================================================================');
  } finally {
    if (createdUserIds.length > 0) {
      await Workspace.deleteMany({ userId: { $in: createdUserIds } });
      await Invoice.deleteMany({ userId: { $in: createdUserIds } });
      await Subscription.deleteMany({ userId: { $in: createdUserIds } });
      await User.deleteMany({ _id: { $in: createdUserIds } });
    }
    await mongoose.disconnect();
  }
}

runFullRegression().catch((err) => {
  console.error('REGRESSION TEST FAILED:', err);
  process.exit(1);
});

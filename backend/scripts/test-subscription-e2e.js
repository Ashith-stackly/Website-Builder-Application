/**
 * Comprehensive E2E Verification Script for Subscription Persistence,
 * API Contracts, MongoDB State, User Scenarios, and Flow Verification.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Subscription = require('../src/models/Subscription');
const { signAccessToken } = require('../src/utils/jwt');

const API_BASE = 'http://localhost:5000/api';

// Frontend utility reproductions to verify behavior with real data
function normalizePlanForComparison(name) {
  return name.toLowerCase().replace(/\s+plan$/i, '').trim();
}

function deriveBillingCycle(startDate, expiryDate) {
  if (!startDate || !expiryDate) return 'Monthly';
  const start = new Date(startDate);
  const expiry = new Date(expiryDate);
  if (isNaN(start.getTime()) || isNaN(expiry.getTime())) return 'Monthly';
  const diffDays = (expiry.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > 180 ? 'Annual' : 'Monthly';
}

function formatSubscriptionDate(isoDate) {
  if (!isoDate) return '—';
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function isCurrentPlan(planName, activeSubscription) {
  if (!activeSubscription || activeSubscription.subscriptionStatus !== 'active') return false;
  return normalizePlanForComparison(planName) === normalizePlanForComparison(activeSubscription.plan);
}

async function runTests() {
  console.log('================================================================');
  console.log('STARTING FULL SUBSCRIPTION E2E VERIFICATION SUITE');
  console.log('================================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB successfully.');

  const results = {};

  // -------------------------------------------------------------
  // TEST 1: Endpoint Identification & Discrepancy Investigation
  // -------------------------------------------------------------
  console.log('\n--- [TEST 1: API Endpoint Investigation] ---');
  
  // Test /api/subscriptions/my-subscription
  try {
    const resMySub = await fetch(`${API_BASE}/subscriptions/my-subscription`);
    console.log(`GET /api/subscriptions/my-subscription status: ${resMySub.status}`);
    results.mySubEndpointExists = resMySub.status !== 404;
  } catch (err) {
    results.mySubEndpointExists = false;
  }

  // Test /api/payment/subscription
  try {
    const resPaySub = await fetch(`${API_BASE}/payment/subscription`);
    console.log(`GET /api/payment/subscription status without auth: ${resPaySub.status} (${resPaySub.status === 401 ? '401 Unauthorized as expected' : resPaySub.status})`);
    results.paySubEndpointExists = resPaySub.status === 401;
  } catch (err) {
    results.paySubEndpointExists = false;
  }

  console.log(`Summary: /api/subscriptions/my-subscription exists? ${results.mySubEndpointExists}`);
  console.log(`Summary: /api/payment/subscription exists? ${results.paySubEndpointExists}`);

  // -------------------------------------------------------------
  // TEST 2: JWT Authentication Verification
  // -------------------------------------------------------------
  console.log('\n--- [TEST 2: JWT Authentication Verification] ---');
  
  // 2a. No token
  const resNoToken = await fetch(`${API_BASE}/payment/subscription`);
  console.log(`No token status: ${resNoToken.status} (Expected: 401)`);
  results.noToken401 = resNoToken.status === 401;

  // 2b. Invalid token
  const resBadToken = await fetch(`${API_BASE}/payment/subscription`, {
    headers: { Authorization: 'Bearer invalid.token.string' }
  });
  console.log(`Invalid token status: ${resBadToken.status} (Expected: 401)`);
  results.invalidToken401 = resBadToken.status === 401;

  // -------------------------------------------------------------
  // TEST 3: User Scenarios (Basic, Business, Advanced, No Sub, Expired)
  // -------------------------------------------------------------
  console.log('\n--- [TEST 3: User Scenarios across DB + API + UI Logic] ---');

  // Helper to setup a test user
  async function setupUserWithSubscription({ email, name, plan, status, provider, daysOffset }) {
    await User.deleteMany({ email });
    const user = await User.create({
      name,
      email,
      password: 'TestPassword123!',
      role: 'user',
      plan: plan || 'free',
      subscriptionStatus: status || 'none',
      isEmailVerified: true,
    });

    await Subscription.deleteMany({ userId: user._id });
    let subDoc = null;
    if (status === 'active' || status === 'cancelled') {
      const now = new Date();
      const expiry = new Date(now.getTime() + (daysOffset || 30) * 24 * 60 * 60 * 1000);
      subDoc = await Subscription.create({
        userId: user._id,
        plan: plan,
        paymentProvider: provider || 'none',
        paymentStatus: 'completed',
        amount: plan === 'basic' ? 0 : 150,
        currency: 'INR',
        startDate: now,
        expiryDate: expiry,
      });
    }

    const token = signAccessToken({ sub: user._id.toString(), role: user.role });
    return { user, subDoc, token };
  }

  // Scenario A: User A - Basic (Free) Plan
  console.log('\n-> Scenario A: User with Active Basic (Free) Plan');
  const userA = await setupUserWithSubscription({
    email: 'user_a_basic@stackly.test',
    name: 'User A Basic',
    plan: 'basic',
    status: 'active',
    provider: 'none',
    daysOffset: 30,
  });

  const resA = await fetch(`${API_BASE}/payment/subscription`, {
    headers: { Authorization: `Bearer ${userA.token}` }
  });
  const dataA = await resA.json();
  console.log('API Response for User A:', JSON.stringify(dataA, null, 2));

  const isBasicCurrent = isCurrentPlan('Basic', dataA);
  const isBusinessCurrentForA = isCurrentPlan('Business Plan', dataA);
  const isAdvancedCurrentForA = isCurrentPlan('Advanced', dataA);
  const cycleA = deriveBillingCycle(dataA.subscription?.startDate, dataA.subscription?.expiryDate);

  console.log(`User A UI Checks -> Basic: ${isBasicCurrent} (Expected: true), Business: ${isBusinessCurrentForA} (Expected: false), Advanced: ${isAdvancedCurrentForA} (Expected: false)`);
  console.log(`User A Billing Cycle: ${cycleA} (Expected: Monthly)`);
  results.scenarioA = isBasicCurrent && !isBusinessCurrentForA && !isAdvancedCurrentForA && cycleA === 'Monthly' && dataA.subscription?.paymentProvider === 'none';

  // Scenario B: User B - Business Plan (Annual)
  console.log('\n-> Scenario B: User with Active Business Plan (Annual)');
  const userB = await setupUserWithSubscription({
    email: 'user_b_business@stackly.test',
    name: 'User B Business',
    plan: 'business',
    status: 'active',
    provider: 'razorpay',
    daysOffset: 365,
  });

  const resB = await fetch(`${API_BASE}/payment/subscription`, {
    headers: { Authorization: `Bearer ${userB.token}` }
  });
  const dataB = await resB.json();
  const isBasicForB = isCurrentPlan('Basic', dataB);
  const isBusinessForB = isCurrentPlan('Business Plan', dataB);
  const isAdvancedForB = isCurrentPlan('Advanced', dataB);
  const cycleB = deriveBillingCycle(dataB.subscription?.startDate, dataB.subscription?.expiryDate);

  console.log(`User B UI Checks -> Basic: ${isBasicForB} (Expected: false), Business: ${isBusinessForB} (Expected: true), Advanced: ${isAdvancedForB} (Expected: false)`);
  console.log(`User B Billing Cycle: ${cycleB} (Expected: Annual)`);
  results.scenarioB = !isBasicForB && isBusinessForB && !isAdvancedForB && cycleB === 'Annual';

  // Scenario C: User C - Advanced Plan (Monthly)
  console.log('\n-> Scenario C: User with Active Advanced Plan (Monthly)');
  const userC = await setupUserWithSubscription({
    email: 'user_c_advanced@stackly.test',
    name: 'User C Advanced',
    plan: 'advanced',
    status: 'active',
    provider: 'razorpay',
    daysOffset: 30,
  });

  const resC = await fetch(`${API_BASE}/payment/subscription`, {
    headers: { Authorization: `Bearer ${userC.token}` }
  });
  const dataC = await resC.json();
  const isBasicForC = isCurrentPlan('Basic', dataC);
  const isBusinessForC = isCurrentPlan('Business Plan', dataC);
  const isAdvancedForC = isCurrentPlan('Advanced', dataC);
  const cycleC = deriveBillingCycle(dataC.subscription?.startDate, dataC.subscription?.expiryDate);

  console.log(`User C UI Checks -> Basic: ${isBasicForC} (Expected: false), Business: ${isBusinessForC} (Expected: false), Advanced: ${isAdvancedForC} (Expected: true)`);
  console.log(`User C Billing Cycle: ${cycleC} (Expected: Monthly)`);
  results.scenarioC = !isBasicForC && !isBusinessForC && isAdvancedForC && cycleC === 'Monthly';

  // Scenario D: User D - No Active Subscription
  console.log('\n-> Scenario D: User with No Active Subscription');
  const userD = await setupUserWithSubscription({
    email: 'user_d_none@stackly.test',
    name: 'User D None',
    plan: 'free',
    status: 'none',
  });

  const resD = await fetch(`${API_BASE}/payment/subscription`, {
    headers: { Authorization: `Bearer ${userD.token}` }
  });
  const dataD = await resD.json();
  const isBasicForD = isCurrentPlan('Basic', dataD);
  const isBusinessForD = isCurrentPlan('Business Plan', dataD);
  const isAdvancedForD = isCurrentPlan('Advanced', dataD);
  const hasSubCardD = dataD.subscriptionStatus === 'active' && dataD.subscription !== null;

  console.log(`User D UI Checks -> Any plan current? ${isBasicForD || isBusinessForD || isAdvancedForD} (Expected: false), Sub card shown? ${hasSubCardD} (Expected: false)`);
  results.scenarioD = !isBasicForD && !isBusinessForD && !isAdvancedForD && !hasSubCardD;

  // Scenario E: User E - Cancelled / Expired Subscription
  console.log('\n-> Scenario E: User with Cancelled/Expired Subscription');
  const userE = await setupUserWithSubscription({
    email: 'user_e_cancelled@stackly.test',
    name: 'User E Cancelled',
    plan: 'business',
    status: 'cancelled',
    provider: 'razorpay',
    daysOffset: -5,
  });

  const resE = await fetch(`${API_BASE}/payment/subscription`, {
    headers: { Authorization: `Bearer ${userE.token}` }
  });
  const dataE = await resE.json();
  const isBusinessForE = isCurrentPlan('Business Plan', dataE);
  const hasSubCardE = dataE.subscriptionStatus === 'active' && dataE.subscription !== null;

  console.log(`User E UI Checks -> Business current? ${isBusinessForE} (Expected: false), Sub card shown? ${hasSubCardE} (Expected: false)`);
  results.scenarioE = !isBusinessForE && !hasSubCardE;

  // -------------------------------------------------------------
  // TEST 4: Logout / Login Persistence
  // -------------------------------------------------------------
  console.log('\n--- [TEST 4: Logout / Login Persistence] ---');
  // First session token
  const tokenSession1 = signAccessToken({ sub: userB.user._id.toString(), role: userB.user.role });
  const resSession1 = await fetch(`${API_BASE}/payment/subscription`, {
    headers: { Authorization: `Bearer ${tokenSession1}` }
  });
  const dataSession1 = await resSession1.json();

  // Simulate logout (token discarded) and login again after time passes
  const tokenSession2 = signAccessToken({ sub: userB.user._id.toString(), role: userB.user.role });
  const resSession2 = await fetch(`${API_BASE}/payment/subscription`, {
    headers: { Authorization: `Bearer ${tokenSession2}` }
  });
  const dataSession2 = await resSession2.json();

  const persistentMatch = dataSession1.plan === dataSession2.plan &&
                          dataSession1.subscriptionStatus === dataSession2.subscriptionStatus &&
                          dataSession1.subscription?._id?.toString() === dataSession2.subscription?._id?.toString();

  console.log(`Session 1 Plan: ${dataSession1.plan}, Session 2 Plan: ${dataSession2.plan}, Persistent match: ${persistentMatch}`);
  results.logoutLoginPersistence = persistentMatch;

  // -------------------------------------------------------------
  // TEST 5: Free Plan Flow & Razorpay Bypass
  // -------------------------------------------------------------
  console.log('\n--- [TEST 5: Free Plan Flow & Razorpay Bypass Verification] ---');
  const userFree = await setupUserWithSubscription({
    email: 'user_free_flow@stackly.test',
    name: 'Free Flow User',
    plan: 'free',
    status: 'none',
  });

  const activateRes = await fetch(`${API_BASE}/payment/activate-free`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userFree.token}`,
    },
    body: JSON.stringify({ plan: 'Basic', amount: 0 }),
  });
  const activateData = await activateRes.json();
  console.log('Activate Free Plan Response:', JSON.stringify(activateData, null, 2));

  // Verify MongoDB after activation
  const userAfterFree = await User.findById(userFree.user._id).lean();
  const subAfterFree = await Subscription.findOne({ userId: userFree.user._id }).lean();

  const freeDbValid = userAfterFree.plan === 'basic' &&
                      userAfterFree.subscriptionStatus === 'active' &&
                      subAfterFree.plan === 'basic' &&
                      subAfterFree.paymentProvider === 'none' &&
                      subAfterFree.amount === 0 &&
                      subAfterFree.paymentStatus === 'completed';

  console.log(`Free Plan DB Validated: ${freeDbValid}`);
  results.freePlanFlow = activateRes.status === 200 && activateData.success && freeDbValid;

  // -------------------------------------------------------------
  // TEST 6: Paid Plan Razorpay Route Availability
  // -------------------------------------------------------------
  console.log('\n--- [TEST 6: Paid Plan Razorpay Endpoints Verification] ---');
  const razorpayOrderRes = await fetch(`${API_BASE}/razorpay/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userB.token}`,
    },
    body: JSON.stringify({
      amountPaise: 15000,
      currency: 'INR',
      planName: 'Business Plan',
      billingPeriod: 'Monthly',
    }),
  });

  console.log(`POST /api/razorpay/create-order status: ${razorpayOrderRes.status}`);
  const razorpayOrderData = await razorpayOrderRes.json();
  console.log('Create order response:', JSON.stringify(razorpayOrderData, null, 2));
  results.razorpayCreateOrder = razorpayOrderRes.status === 200 || (razorpayOrderData && razorpayOrderData.orderId);

  // Clean up test users
  await User.deleteMany({ email: { $regex: /@stackly\.test$/ } });
  console.log('\n🧹 Cleaned up test accounts.');

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB.');

  console.log('\n================================================================');
  console.log('TEST SUITE RESULTS SUMMARY:');
  console.log(JSON.stringify(results, null, 2));
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('Test Suite Failed with Error:', err);
  process.exit(1);
});

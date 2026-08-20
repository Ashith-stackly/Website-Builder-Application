const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Subscription = require('../src/models/Subscription');
const Invoice = require('../src/models/Invoice');
const { signAccessToken } = require('../src/utils/jwt');

async function runTests() {
  console.log('--- STARTING LIVE TESTS ---');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB directly for verification');

  const testEmail = `test_free_plan_${Date.now()}@example.com`;
  const testUser = await User.create({
    name: 'Test Free User',
    email: testEmail,
    password: 'Password123!',
    plan: 'free',
    subscriptionStatus: 'none',
  });
  console.log('Created test user:', testUser._id.toString(), testUser.email);
  console.log('Initial user state:', { plan: testUser.plan, subscriptionStatus: testUser.subscriptionStatus });

  const validToken = signAccessToken({ sub: testUser._id.toString(), role: testUser.role });
  const BASE_URL = 'http://localhost:5000/api';

  // 1. Missing Token Test
  console.log('\n[TEST 1] Missing token request...');
  const res1 = await fetch(`${BASE_URL}/payment/activate-free`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan: 'Basic', amount: 0 }),
  });
  const data1 = await res1.json();
  console.log('Status:', res1.status, 'Response:', data1);
  if (res1.status !== 401) throw new Error(`Expected 401, got ${res1.status}`);

  // 2. Invalid Token Test
  console.log('\n[TEST 2] Invalid token request...');
  const res2 = await fetch(`${BASE_URL}/payment/activate-free`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer invalid.token.value',
    },
    body: JSON.stringify({ plan: 'Basic', amount: 0 }),
  });
  const data2 = await res2.json();
  console.log('Status:', res2.status, 'Response:', data2);
  if (res2.status !== 401) throw new Error(`Expected 401, got ${res2.status}`);

  // 3. Invalid Plan Test
  console.log('\n[TEST 3] Invalid plan request (Business for free)...');
  const res3 = await fetch(`${BASE_URL}/payment/activate-free`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${validToken}`,
    },
    body: JSON.stringify({ plan: 'Business', amount: 0 }),
  });
  const data3 = await res3.json();
  console.log('Status:', res3.status, 'Response:', data3);
  if (res3.status !== 400) throw new Error(`Expected 400, got ${res3.status}`);

  // 4. Non-zero Amount Test
  console.log('\n[TEST 4] Non-zero amount request...');
  const res4 = await fetch(`${BASE_URL}/payment/activate-free`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${validToken}`,
    },
    body: JSON.stringify({ plan: 'Basic', amount: 100 }),
  });
  const data4 = await res4.json();
  console.log('Status:', res4.status, 'Response:', data4);
  if (res4.status !== 400) throw new Error(`Expected 400, got ${res4.status}`);

  // 5. Valid Free Plan Activation Test
  console.log('\n[TEST 5] Valid Free Plan Activation request...');
  const res5 = await fetch(`${BASE_URL}/payment/activate-free`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${validToken}`,
    },
    body: JSON.stringify({ plan: 'Basic', amount: 0 }),
  });
  const data5 = await res5.json();
  console.log('Status:', res5.status, 'Response:', JSON.stringify(data5, null, 2));
  if (res5.status !== 200 || !data5.success) throw new Error(`Expected 200 success, got ${res5.status}`);

  // 6. Direct MongoDB Verification
  console.log('\n[TEST 6] Querying MongoDB directly...');
  const updatedUser = await User.findById(testUser._id).lean();
  console.log('MongoDB User Document:');
  console.log({
    _id: updatedUser._id,
    plan: updatedUser.plan,
    subscriptionStatus: updatedUser.subscriptionStatus,
  });
  if (updatedUser.plan !== 'basic' || updatedUser.subscriptionStatus !== 'active') {
    throw new Error('User in MongoDB not updated correctly');
  }

  const subscriptions = await Subscription.find({ userId: testUser._id }).lean();
  console.log(`MongoDB Subscriptions found (${subscriptions.length}):`);
  subscriptions.forEach(s => console.log({
    _id: s._id,
    plan: s.plan,
    paymentProvider: s.paymentProvider,
    paymentStatus: s.paymentStatus,
    amount: s.amount,
    currency: s.currency,
    startDate: s.startDate,
    expiryDate: s.expiryDate,
  }));
  if (subscriptions.length !== 1 || subscriptions[0].plan !== 'basic' || subscriptions[0].paymentProvider !== 'none' || subscriptions[0].amount !== 0) {
    throw new Error('Subscription in MongoDB not created/structured correctly');
  }

  const invoices = await Invoice.find({ userId: testUser._id }).lean();
  console.log(`MongoDB Invoices found (${invoices.length}):`);
  invoices.forEach(i => console.log({
    invoiceId: i.invoiceId,
    amount: i.amount,
    status: i.status,
    planName: i.planName,
    paymentMethodLabel: i.paymentMethodLabel,
  }));
  if (invoices.length < 1 || invoices[0].amount !== '₹0' || invoices[0].status !== 'Free') {
    throw new Error('Invoice in MongoDB not created/structured correctly');
  }

  // 7. Idempotency Test (repeated activation)
  console.log('\n[TEST 7] Repeated activation (Idempotency check)...');
  const res7 = await fetch(`${BASE_URL}/payment/activate-free`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${validToken}`,
    },
    body: JSON.stringify({ plan: 'Basic', amount: 0 }),
  });
  const data7 = await res7.json();
  console.log('Repeated call status:', res7.status, 'success:', data7.success);

  const subscriptionsAfter = await Subscription.find({ userId: testUser._id }).lean();
  console.log(`MongoDB Subscriptions count after repeated activation: ${subscriptionsAfter.length}`);
  if (subscriptionsAfter.length !== 1) {
    throw new Error(`Expected exactly 1 subscription document due to upsert, found ${subscriptionsAfter.length}`);
  }

  // 8. GET /api/payment/subscription check
  console.log('\n[TEST 8] Checking GET /api/payment/subscription...');
  const res8 = await fetch(`${BASE_URL}/payment/subscription`, {
    headers: { 'Authorization': `Bearer ${validToken}` },
  });
  const data8 = await res8.json();
  console.log('Subscription status endpoint response:', data8);
  if (data8.plan !== 'basic' || data8.subscriptionStatus !== 'active') {
    throw new Error('GET /api/payment/subscription returned incorrect plan');
  }

  // Cleanup test user and documents
  await User.deleteOne({ _id: testUser._id });
  await Subscription.deleteMany({ userId: testUser._id });
  await Invoice.deleteMany({ userId: testUser._id });
  console.log('\nCleaned up test data.');
  await mongoose.disconnect();
  console.log('\n--- ALL LIVE BACKEND + MONGODB TESTS PASSED! ---');
}

runTests().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});

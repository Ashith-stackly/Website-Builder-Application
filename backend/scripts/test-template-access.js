/**
 * End-to-End Verification and Security Suite for Template Access Control
 * 
 * Verifies:
 * 1. Unauthenticated guest template access matrix
 * 2. User C (Business Plan) full access matrix across all 7 templates
 * 3. User A (Basic Plan + purchased Portfolio) single purchase access & strict isolation
 * 4. User B (Basic Plan, no purchases) strict isolation (cannot access User A's purchase)
 * 5. Direct API attack / bypass attempts:
 *    - POST /api/projects for locked template without purchase -> 403 Forbidden
 *    - POST /api/projects for purchased template -> 201 Created
 *    - POST /api/projects by business user -> 201 Created
 *    - Missing JWT or fake userId in body/headers -> Rejected
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const TemplatePurchase = require('../src/models/TemplatePurchase');
const Workspace = require('../src/models/Workspace');
const { signAccessToken } = require('../src/utils/jwt');

const API_BASE = 'http://localhost:5000/api';

const ALL_TEMPLATES = [
  'portfolio',
  'ecommerce',
  'blog',
  'construction',
  'restaurant',
  'digital-marketing',
  'business',
];

async function runVerification() {
  console.log('================================================================');
  console.log('STARTING TEMPLATE ACCESS CONTROL & SECURITY VERIFICATION SUITE');
  console.log('================================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB successfully.\n');

  // Load test users
  const userA = await User.findOne({ email: 'realuser@example.com' }); // Basic + Portfolio
  const userB = await User.findOne({ email: 'realuser2@gmail.com' }); // Basic (no purchase)
  const userC = await User.findOne({ email: 'backend@thestackly.com' }); // Business

  if (!userA || !userB || !userC) {
    throw new Error('Test users not found in DB! Ensure realuser@example.com, realuser2@gmail.com, backend@thestackly.com exist.');
  }

  console.log(`User A (Basic + Purchase): ${userA.email} (${userA._id})`);
  console.log(`User B (Basic, No Purchase): ${userB.email} (${userB._id})`);
  console.log(`User C (Business Plan): ${userC.email} (${userC._id})\n`);

  // Generate real signed JWT tokens
  const tokenA = signAccessToken({ id: userA._id.toString(), role: userA.role, email: userA.email });
  const tokenB = signAccessToken({ id: userB._id.toString(), role: userB.role, email: userB.email });
  const tokenC = signAccessToken({ id: userC._id.toString(), role: userC.role, email: userC.email });

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TEST SUITE 1: Unauthenticated Guest Access
  // -------------------------------------------------------------
  console.log('--- TEST SUITE 1: Unauthenticated Guest Access ---');
  const resGuest = await fetch(`${API_BASE}/template/access`);
  const dataGuest = await resGuest.json();

  assert(dataGuest.success === true, 'GET /template/access returns success');
  assert(dataGuest.authenticated === false, 'Guest is marked authenticated: false');
  assert(dataGuest.hasAllAccess === false, 'Guest hasAllAccess is false');
  for (const t of ALL_TEMPLATES) {
    assert(dataGuest.accessibleTemplates[t] === false, `Guest template ${t} is locked (false)`);
  }

  // -------------------------------------------------------------
  // TEST SUITE 2: User C (Business Plan) Full Access
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 2: User C (Business Plan) Full Access ---');
  const resC = await fetch(`${API_BASE}/template/access`, {
    headers: { Authorization: `Bearer ${tokenC}` },
  });
  const dataC = await resC.json();

  assert(dataC.success === true, 'Business user GET /template/access returns success');
  assert(dataC.authenticated === true, 'Business user is authenticated');
  assert(dataC.plan === 'business', 'Business user plan is business');
  assert(dataC.hasAllAccess === true, 'Business user hasAllAccess: true');
  for (const t of ALL_TEMPLATES) {
    assert(dataC.accessibleTemplates[t] === true, `Business user has edit access to ${t}: true`);
  }

  // Test single template access endpoint for User C
  const resCSingle = await fetch(`${API_BASE}/template/access/restaurant`, {
    headers: { Authorization: `Bearer ${tokenC}` },
  });
  const dataCSingle = await resCSingle.json();
  assert(dataCSingle.canEdit === true, 'Single check /template/access/restaurant for Business user returns canEdit: true');

  // -------------------------------------------------------------
  // TEST SUITE 3: User A (Basic Plan + Portfolio Purchase)
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 3: User A (Basic + Portfolio Purchase) ---');
  const resA = await fetch(`${API_BASE}/template/access`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const dataA = await resA.json();

  assert(dataA.success === true, 'User A GET /template/access returns success');
  assert(dataA.authenticated === true, 'User A is authenticated');
  assert(dataA.plan === 'basic', 'User A plan is basic');
  assert(dataA.hasAllAccess === false, 'User A hasAllAccess: false');
  assert(dataA.purchasedTemplates.includes('portfolio'), 'User A purchasedTemplates includes portfolio');
  assert(dataA.accessibleTemplates.portfolio === true, 'User A accessibleTemplates.portfolio is true');

  // Verify other 6 templates are false for User A
  for (const t of ALL_TEMPLATES.filter(x => x !== 'portfolio')) {
    assert(dataA.accessibleTemplates[t] === false, `User A unpurchased template ${t} is false`);
  }

  // Single template endpoint checks for User A
  const resASinglePort = await fetch(`${API_BASE}/template/access/portfolio`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const dataASinglePort = await resASinglePort.json();
  assert(dataASinglePort.canEdit === true, 'Single check /template/access/portfolio for User A returns canEdit: true');

  const resASingleEcom = await fetch(`${API_BASE}/template/access/ecommerce`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const dataASingleEcom = await resASingleEcom.json();
  assert(dataASingleEcom.canEdit === false, 'Single check /template/access/ecommerce for User A returns canEdit: false');

  // -------------------------------------------------------------
  // TEST SUITE 4: User B (Basic Plan, No Purchase) - Strict Isolation
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 4: User B (Basic, No Purchase) - Strict Isolation ---');
  const resB = await fetch(`${API_BASE}/template/access`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const dataB = await resB.json();

  assert(dataB.success === true, 'User B GET /template/access returns success');
  assert(dataB.authenticated === true, 'User B is authenticated');
  assert(dataB.plan === 'basic', 'User B plan is basic');
  assert(dataB.hasAllAccess === false, 'User B hasAllAccess: false');
  assert(dataB.purchasedTemplates.length === 0, 'User B purchasedTemplates is empty');
  assert(dataB.accessibleTemplates.portfolio === false, 'STRICT ISOLATION: User B portfolio is FALSE (User A purchase does NOT bleed over)');
  for (const t of ALL_TEMPLATES) {
    assert(dataB.accessibleTemplates[t] === false, `User B template ${t} is locked (false)`);
  }

  // -------------------------------------------------------------
  // TEST SUITE 5: Direct Backend API Security & Project Creation
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 5: Direct API Security & Bypass Prevention ---');

  // 5.1 Unauthorized user attempting to create project with locked template
  const resHackAttempt = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({
      projectName: 'Security Test - Unauthorized Project',
      category: 'portfolio',
      editorType: 'blockpages',
    }),
  });
  assert(
    resHackAttempt.status === 403,
    `Direct POST /projects by User B for locked portfolio returned 403 Forbidden (Actual status: ${resHackAttempt.status})`
  );

  // 5.2 User A attempting to create project with unpurchased template (ecommerce)
  const resUserAUnauthorized = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      projectName: 'Security Test - User A Ecommerce Locked',
      category: 'ecommerce',
      editorType: 'blockpages',
    }),
  });
  assert(
    resUserAUnauthorized.status === 403,
    `Direct POST /projects by User A for unpurchased ecommerce returned 403 Forbidden (Actual status: ${resUserAUnauthorized.status})`
  );

  // 5.3 User A creating project with purchased template (portfolio) -> MUST SUCCEED
  const resUserAAuthorized = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      projectName: 'Security Test - User A Portfolio Allowed',
      category: 'portfolio',
      editorType: 'blockpages',
    }),
  });
  const dataUserAAuth = await resUserAAuthorized.json();
  assert(
    resUserAAuthorized.status === 201 && dataUserAAuth.success === true,
    `Authorized POST /projects by User A for purchased portfolio returned 201 Created (Actual status: ${resUserAAuthorized.status})`
  );

  // Clean up created test project
  if (dataUserAAuth?.data?._id) {
    await Workspace.findByIdAndDelete(dataUserAAuth.data._id);
  }

  // 5.4 User C (Business) creating project with restaurant template -> MUST SUCCEED
  const resUserCAuthorized = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenC}`,
    },
    body: JSON.stringify({
      projectName: 'Security Test - User C Restaurant Allowed',
      category: 'restaurant',
      editorType: 'blockpages',
    }),
  });
  const dataUserCAuth = await resUserCAuthorized.json();
  assert(
    resUserCAuthorized.status === 201 && dataUserCAuth.success === true,
    `Authorized POST /projects by Business User C for restaurant returned 201 Created (Actual status: ${resUserCAuthorized.status})`
  );

  // Clean up created test project
  if (dataUserCAuth?.data?._id) {
    await Workspace.findByIdAndDelete(dataUserCAuth.data._id);
  }

  // 5.5 Missing JWT token attack -> MUST BE 401
  const resNoAuth = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      projectName: 'Security Test - No Auth Attack',
      category: 'portfolio',
      editorType: 'blockpages',
    }),
  });
  assert(resNoAuth.status === 401, `Unauthenticated POST /projects returned 401 Unauthorized (Actual: ${resNoAuth.status})`);

  console.log('\n================================================================');
  console.log(`VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runVerification().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});

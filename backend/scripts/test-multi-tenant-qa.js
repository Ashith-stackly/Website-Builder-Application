const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const app = require('../src/app');
const connectDB = require('../src/database/connection');
const User = require('../src/models/User');
const Workspace = require('../src/models/Workspace');

async function runQA() {
  console.log('=== STARTING LIVE MULTI-TENANT QA SUITE ===');
  await connectDB();

  // Start in-process server on ephemeral port
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`Live test server listening on ${baseUrl}`);

  const results = {
    passed: [],
    failed: []
  };

  function record(testName, success, details) {
    if (success) {
      console.log(`[PASS] ${testName}`);
      results.passed.push({ testName, details });
    } else {
      console.error(`[FAIL] ${testName}:`, details);
      results.failed.push({ testName, details });
    }
  }

  try {
    // Setup test users
    const emailA = 'qa_usera_isolation@stackly.test';
    const emailB = 'qa_userb_isolation@stackly.test';

    await User.deleteMany({ email: { $in: [emailA, emailB] } });

    const userA = await User.create({
      name: 'QA User A',
      email: emailA,
      password: 'Password123!',
      plan: 'free',
      subscriptionStatus: 'active'
    });

    const userB = await User.create({
      name: 'QA User B',
      email: emailB,
      password: 'Password123!',
      plan: 'business',
      subscriptionStatus: 'active'
    });

    const tokenA = jwt.sign({ id: userA._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const tokenB = jwt.sign({ id: userB._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const clientA = axios.create({
      baseURL: baseUrl,
      headers: { Authorization: `Bearer ${tokenA}` },
      validateStatus: () => true
    });

    const clientB = axios.create({
      baseURL: baseUrl,
      headers: { Authorization: `Bearer ${tokenB}` },
      validateStatus: () => true
    });

    // 1. Create Projects
    const createResA = await clientA.post('/projects', {
      projectName: 'USER_A_PRIVATE_PROJECT',
      category: 'portfolio',
      editorType: 'builder'
    });
    record('User A Project Creation', createResA.status === 201 && createResA.data.project?.projectName === 'USER_A_PRIVATE_PROJECT', createResA.data);
    const projectAId = createResA.data.project._id;

    const createResB = await clientB.post('/projects', {
      projectName: 'USER_B_PRIVATE_PROJECT',
      category: 'ecommerce',
      editorType: 'ecommerce'
    });
    record('User B Project Creation', createResB.status === 201 && createResB.data.project?.projectName === 'USER_B_PRIVATE_PROJECT', createResB.data);
    const projectBId = createResB.data.project._id;

    // 2. Direct MongoDB Ownership Inspection
    const dbProjectA = await Workspace.findById(projectAId);
    const dbProjectB = await Workspace.findById(projectBId);

    record(
      'MongoDB Ownership Check (User A)',
      dbProjectA && dbProjectA.userId.toString() === userA._id.toString() && dbProjectA.userId instanceof mongoose.Types.ObjectId,
      { expected: userA._id.toString(), actual: dbProjectA?.userId?.toString() }
    );

    record(
      'MongoDB Ownership Check (User B)',
      dbProjectB && dbProjectB.userId.toString() === userB._id.toString() && dbProjectB.userId instanceof mongoose.Types.ObjectId,
      { expected: userB._id.toString(), actual: dbProjectB?.userId?.toString() }
    );

    // 3. Project List Isolation (GET /api/projects)
    const listA = await clientA.get('/projects');
    const hasOnlyA = listA.status === 200 &&
      listA.data.projects.some(p => p._id === projectAId) &&
      !listA.data.projects.some(p => p._id === projectBId);
    record('GET /api/projects for User A returns ONLY User A projects', hasOnlyA, { count: listA.data?.projects?.length });

    const listB = await clientB.get('/projects');
    const hasOnlyB = listB.status === 200 &&
      listB.data.projects.some(p => p._id === projectBId) &&
      !listB.data.projects.some(p => p._id === projectAId);
    record('GET /api/projects for User B returns ONLY User B projects', hasOnlyB, { count: listB.data?.projects?.length });

    // 4. Cross-Tenant Access: User B trying to access User A's project
    const crossGet = await clientB.get(`/projects/${projectAId}`);
    record('Cross-Tenant GET /projects/:id rejection', crossGet.status === 404, { status: crossGet.status, body: crossGet.data });

    const crossPut = await clientB.put(`/projects/${projectAId}`, { projectName: 'Hacked by B' });
    record('Cross-Tenant PUT /projects/:id rejection', crossPut.status === 404, { status: crossPut.status });

    const crossAutosave = await clientB.put(`/projects/${projectAId}/autosave`, {
      projectName: 'Autosave hack',
      builderData: { hacked: true }
    });
    record('Cross-Tenant Autosave rejection', crossAutosave.status === 404, { status: crossAutosave.status });

    const crossDuplicate = await clientB.post(`/projects/${projectAId}/duplicate`);
    record('Cross-Tenant Duplicate rejection', crossDuplicate.status === 404, { status: crossDuplicate.status });

    const crossDelete = await clientB.delete(`/projects/${projectAId}`);
    record('Cross-Tenant Delete rejection', crossDelete.status === 404, { status: crossDelete.status });

    const crossPublish = await clientB.post(`/publish/${projectAId}`);
    record('Cross-Tenant Publish rejection', crossPublish.status === 404, { status: crossPublish.status });

    const crossDeployments = await clientB.get(`/publish/${projectAId}/deployments`);
    record('Cross-Tenant Get Deployments rejection', crossDeployments.status === 404, { status: crossDeployments.status });

    const crossAnalytics = await clientB.get(`/analytics/${projectAId}`);
    record('Cross-Tenant Analytics rejection', crossAnalytics.status === 404, { status: crossAnalytics.status });

    const crossDomain = await clientB.post(`/domain/${projectAId}/subdomain`);
    record('Cross-Tenant Subdomain rejection', crossDomain.status === 404, { status: crossDomain.status });

    const crossEcom = await clientB.get(`/ecommerce/products/${projectAId}`);
    record('Cross-Tenant Ecommerce Products rejection', crossEcom.status === 404, { status: crossEcom.status });

    const crossBlog = await clientB.get(`/blog/posts/${projectAId}`);
    record('Cross-Tenant Blog Posts rejection', crossBlog.status === 404, { status: crossBlog.status });

    // Verify User A's project was unaffected by User B's attempts
    const dbProjectAAfter = await Workspace.findById(projectAId);
    record(
      "User A's Project Integrity intact after cross-tenant attack",
      dbProjectAAfter.projectName === 'USER_A_PRIVATE_PROJECT' && dbProjectAAfter.status === 'active',
      dbProjectAAfter
    );

    // 5. User ID Tampering: User A specifies User B's ID in body / query
    const tamperCreate = await clientA.post('/projects', {
      projectName: 'Tampering Test',
      userId: userB._id.toString()
    });
    const tamperProjectId = tamperCreate.data?.project?._id;
    const dbTamperProject = await Workspace.findById(tamperProjectId);
    record(
      'UserId Tampering in POST body ignored (owned by User A)',
      tamperCreate.status === 201 && dbTamperProject && dbTamperProject.userId.toString() === userA._id.toString(),
      { expectedOwner: userA._id.toString(), actualOwner: dbTamperProject?.userId?.toString() }
    );

    const tamperQuery = await clientA.get(`/projects?userId=${userB._id.toString()}`);
    const tamperQuerySafe = tamperQuery.status === 200 &&
      !tamperQuery.data.projects.some(p => p._id === projectBId);
    record('UserId Tampering in GET query ignored', tamperQuerySafe, { returnedCount: tamperQuery.data?.projects?.length });

    // 6. Dashboard Summary Isolation
    const dashA = await clientA.get('/dashboard/summary');
    const dashB = await clientB.get('/dashboard/summary');
    const dashAOk = dashA.status === 200 && dashA.data.recentProjects?.every(p => p._id !== projectBId);
    const dashBOk = dashB.status === 200 && dashB.data.recentProjects?.every(p => p._id !== projectAId && p._id !== tamperProjectId);
    record('Dashboard Summary Isolation (User A & B)', dashAOk && dashBOk, {
      dashARecentCount: dashA.data?.recentProjects?.length,
      dashBRecentCount: dashB.data?.recentProjects?.length
    });

    // 7. Admin Regression Test
    const userCallingAdmin = await clientA.get('/admin/dashboard/summary');
    record('User JWT rejected by Admin API', userCallingAdmin.status === 401 || userCallingAdmin.status === 403, { status: userCallingAdmin.status });

    const adminEmail = 'qa_admin_isolation@stackly.test';
    await User.deleteMany({ email: adminEmail });
    const adminUser = await User.create({
      name: 'QA Admin',
      email: adminEmail,
      password: 'AdminPassword123!',
      role: 'admin',
    });

    const { signAdminToken } = require('../src/utils/jwt');
    const adminToken = signAdminToken({ sub: adminUser._id.toString(), email: adminUser.email });

    const adminClient = axios.create({
      baseURL: baseUrl,
      headers: { Authorization: `Bearer ${adminToken}` },
      validateStatus: () => true
    });
    const adminCallingAdmin = await adminClient.get('/admin/dashboard/summary');
    record('Admin JWT accepted by Admin API', adminCallingAdmin.status === 200, { status: adminCallingAdmin.status });

    const adminCallingUserApi = await adminClient.get('/projects');
    record('Admin JWT rejected by User API', adminCallingUserApi.status === 401, { status: adminCallingUserApi.status });

    // 8. Subscription Regression Test
    const userAProfile = await clientA.get('/user/profile');
    const userBProfile = await clientB.get('/user/profile');
    record('User A & B Subscriptions isolated',
      userAProfile.data.user?.plan === 'free' && userBProfile.data.user?.plan === 'business',
      { planA: userAProfile.data.user?.plan, planB: userBProfile.data.user?.plan }
    );

    // 9. Clean up test records
    await Workspace.deleteMany({ _id: { $in: [projectAId, projectBId, tamperProjectId] } });
    await User.deleteMany({ email: { $in: [emailA, emailB, adminEmail] } });
    console.log('Cleanup completed successfully.');

  } catch (err) {
    console.error('Test execution error:', err);
    record('Execution Error', false, err.message);
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log('\n=== QA SUMMARY ===');
    console.log(`Passed: ${results.passed.length}`);
    console.log(`Failed: ${results.failed.length}`);
  }
}

runQA();

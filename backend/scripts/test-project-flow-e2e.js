const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Workspace = require('../src/models/Workspace');
const { signAccessToken } = require('../src/utils/jwt');

async function runProjectTests() {
  console.log('=== RUNNING PROJECT CREATION & NAVIGATION E2E TESTS ===\n');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB directly for validation.\n');

  const BASE_URL = 'http://localhost:5000/api';

  // 1. Create two test users
  const user1 = await User.create({
    name: 'Wizard Test User 1',
    email: `wizard_user1_${Date.now()}@example.com`,
    password: 'Password123!',
    plan: 'free',
    subscriptionStatus: 'active',
  });
  const token1 = signAccessToken({ sub: user1._id.toString(), role: user1.role });

  const user2 = await User.create({
    name: 'Wizard Test User 2',
    email: `wizard_user2_${Date.now()}@example.com`,
    password: 'Password123!',
    plan: 'free',
    subscriptionStatus: 'active',
  });
  const token2 = signAccessToken({ sub: user2._id.toString(), role: user2.role });

  try {
    // 2. Test unauthenticated creation (should fail 401)
    console.log('[TEST 1] POST /api/projects without token...');
    const unauthRes = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectName: 'Unauthorized Site' }),
    });
    console.log('Status:', unauthRes.status);
    if (unauthRes.status !== 401) throw new Error(`Expected 401, got ${unauthRes.status}`);
    console.log('PASS: Unauthenticated project creation is rejected.\n');

    // 3. Test creating project for User 1 (Simulating Wizard completion)
    console.log('[TEST 2] POST /api/projects with wizard payload (User 1)...');
    const wizardPayload = {
      projectName: 'Acme Restaurant Website',
      category: 'Restaurant',
      style: 'Modern',
      sections: ['navigation', 'hero', 'gallery', 'features', 'testimonial', 'contact', 'footer'],
    };

    const createRes = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token1}`,
      },
      body: JSON.stringify(wizardPayload),
    });
    const createData = await createRes.json();
    console.log('Status:', createRes.status, 'Project ID:', createData.project?._id);
    if (createRes.status !== 201 || !createData.project?._id) {
      throw new Error(`Failed to create project: ${JSON.stringify(createData)}`);
    }
    const projectId = createData.project._id;

    // Verify MongoDB state directly
    const savedDoc = await Workspace.findById(projectId).lean();
    if (!savedDoc || savedDoc.projectName !== 'Acme Restaurant Website' || savedDoc.category !== 'Restaurant') {
      throw new Error(`MongoDB document does not match: ${JSON.stringify(savedDoc)}`);
    }
    console.log('PASS: Project created and verified in MongoDB.\n');

    // 4. Test listing projects (User 1 should see 1 project)
    console.log('[TEST 3] GET /api/projects for User 1...');
    const listRes1 = await fetch(`${BASE_URL}/projects`, {
      headers: { 'Authorization': `Bearer ${token1}` },
    });
    const listData1 = await listRes1.json();
    console.log('Status:', listRes1.status, 'Count:', listData1.projects?.length);
    if (listData1.projects.length !== 1 || listData1.projects[0]._id !== projectId) {
      throw new Error(`Expected 1 project for User 1, got ${listData1.projects?.length}`);
    }
    console.log('PASS: User 1 sees created project in dashboard list.\n');

    // 5. Test isolation (User 2 should see 0 projects and cannot access User 1's project)
    console.log('[TEST 4] Isolation test - User 2 list and getOne...');
    const listRes2 = await fetch(`${BASE_URL}/projects`, {
      headers: { 'Authorization': `Bearer ${token2}` },
    });
    const listData2 = await listRes2.json();
    if (listData2.projects.length !== 0) {
      throw new Error(`User 2 should have 0 projects, got ${listData2.projects.length}`);
    }

    const accessRes = await fetch(`${BASE_URL}/projects/${projectId}`, {
      headers: { 'Authorization': `Bearer ${token2}` },
    });
    console.log('User 2 access to User 1 project status:', accessRes.status);
    if (accessRes.status !== 404) {
      throw new Error(`Expected 404 for cross-user project access, got ${accessRes.status}`);
    }
    console.log('PASS: Strict cross-user tenant isolation verified.\n');

    // 6. Test autosaving builder data (simulating user editing on Canvas)
    console.log('[TEST 5] PUT /api/projects/:id/autosave from Canvas...');
    const autosaveRes = await fetch(`${BASE_URL}/projects/${projectId}/autosave`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token1}`,
      },
      body: JSON.stringify({
        builderData: {
          schemaVersion: 1,
          components: [
            { id: 'nav-1', type: 'navigation', children: [] },
            { id: 'hero-1', type: 'hero', children: [] },
          ],
          projectName: 'Acme Restaurant Website',
        },
        htmlContent: '<header>Acme Restaurant</header>',
      }),
    });
    const autosaveData = await autosaveRes.json();
    console.log('Autosave status:', autosaveRes.status, 'savedAt:', autosaveData.savedAt);
    if (autosaveRes.status !== 200 || !autosaveData.success) {
      throw new Error(`Autosave failed: ${JSON.stringify(autosaveData)}`);
    }

    const updatedDoc = await Workspace.findById(projectId).lean();
    if (updatedDoc.htmlContent !== '<header>Acme Restaurant</header>') {
      throw new Error('MongoDB document htmlContent was not updated.');
    }
    console.log('PASS: Autosave from Canvas successfully persisted to MongoDB.\n');

    console.log('=== ALL E2E PROJECT CREATION & ISOLATION TESTS PASSED ===');
  } finally {
    // Cleanup test users and workspaces
    await Workspace.deleteMany({ userId: { $in: [user1._id, user2._id] } });
    await User.deleteMany({ _id: { $in: [user1._id, user2._id] } });
    await mongoose.disconnect();
  }
}

runProjectTests().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});

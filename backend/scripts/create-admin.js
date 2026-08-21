/**
 * Bootstrap an initial admin account.
 *
 * Usage:
 *   node scripts/create-admin.js
 *
 * Reads ADMIN_EMAIL and ADMIN_PASSWORD from the backend .env file.
 * The password is hashed by the User model's pre-save hook (bcrypt).
 * This script is idempotent — it will not create duplicate accounts.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../src/database/connection');
const User = require('../src/models/User');

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be set in backend/.env');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('ERROR: ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  await connectDB();

  const existing = await User.findOne({ email: email.toLowerCase() });

  if (existing) {
    if (existing.role === 'admin') {
      console.log(`Admin account already exists: ${existing.email}`);
    } else {
      // Promote existing user to admin
      existing.role = 'admin';
      await existing.save();
      console.log(`Existing user promoted to admin: ${existing.email}`);
    }
  } else {
    await User.create({
      name: 'Admin',
      email: email.toLowerCase(),
      password,
      role: 'admin',
      isEmailVerified: true,
      authProvider: 'local',
    });
    console.log('Admin account created successfully.');
  }

  await mongoose.disconnect();
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error('Failed to create admin account:', err.message);
  process.exit(1);
});

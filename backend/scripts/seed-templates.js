/**
 * Seed base templates into MongoDB.
 * Usage: node scripts/seed-templates.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../src/database/connection');
const { seedTemplates } = require('../src/services/templateService');

async function main() {
  await connectDB();
  console.log('Seeding templates...');
  const result = await seedTemplates();
  console.log(`Seeded ${result.seeded} of ${result.total} templates.`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});

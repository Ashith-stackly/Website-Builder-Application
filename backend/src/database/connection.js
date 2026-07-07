const mongoose = require('mongoose');
const dns = require('node:dns');

function configureMongoDns() {
  const servers = process.env.MONGODB_DNS_SERVERS;
  if (!servers) {
    return;
  }

  const dnsServers = servers
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);

  if (dnsServers.length === 0) {
    return;
  }

  dns.setServers(dnsServers);
}

/**
 * Connect to MongoDB with retry logic.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in environment variables');
    process.exit(1);
  }

  try {
    configureMongoDns();
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB runtime error:', err.message);
  });
}

module.exports = connectDB;

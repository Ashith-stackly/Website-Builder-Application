const { sanitizeUser } = require('../helpers');

function getProfile(user) {
  return sanitizeUser(user);
}

async function updateProfile(user, updates) {
  const allowed = ['name', 'email', 'avatar', 'mobile'];
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      user[key] = updates[key];
    }
  }

  await user.save();
  return sanitizeUser(user);
}

module.exports = { getProfile, updateProfile };

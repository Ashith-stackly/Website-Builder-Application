const userService = require('../services/userService');

async function getProfile(req, res) {
  res.json({ user: userService.getProfile(req.user) });
}

async function updateProfile(req, res, next) {
  try {
    const user = await userService.updateProfile(req.user, req.body);
    res.json({ message: 'Profile updated', user });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile };

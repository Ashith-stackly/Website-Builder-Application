const adminAuthService = require('../services/adminAuthService');

async function login(req, res, next) {
  try {
    const result = await adminAuthService.login(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/auth/me — return the current admin profile.
 * Relies on authenticateAdmin middleware having set req.admin.
 */
function me(req, res) {
  const admin = req.admin;
  res.json({
    success: true,
    admin: {
      id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  });
}

module.exports = { login, me };

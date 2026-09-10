const TemplatePurchase = require('../models/TemplatePurchase');
const User = require('../models/User');

const CANONICAL_TEMPLATES = [
  'portfolio',
  'ecommerce',
  'blog',
  'construction',
  'restaurant',
  'digital-marketing',
  'business',
];

const TEMPLATE_ALIASES = {
  // Portfolio
  portfolio: 'portfolio',
  'classic portfolio': 'portfolio',
  'creative portfolio': 'portfolio',
  'creative-portfolio': 'portfolio',
  'portfolio website': 'portfolio',

  // E-Commerce
  ecommerce: 'ecommerce',
  'e-commerce': 'ecommerce',
  'ecommerce-store': 'ecommerce',
  'e-commerce templates': 'ecommerce',
  'ecommerce store': 'ecommerce',
  store: 'ecommerce',
  shop: 'ecommerce',

  // Blog
  blog: 'blog',
  'personal blog': 'blog',
  'personal-blog': 'blog',
  'modern blog': 'blog',
  'modern-blog': 'blog',
  'blogging page': 'blog',
  blogging: 'blog',
  'blogging website': 'blog',

  // Construction
  construction: 'construction',
  'construction & building': 'construction',
  'construction-building': 'construction',
  'construction building': 'construction',
  'construction themes': 'construction',
  building: 'construction',

  // Restaurant
  restaurant: 'restaurant',
  'restaurant & cafe': 'restaurant',
  'restaurant & café': 'restaurant',
  'restaurant-cafe': 'restaurant',
  'restaurant cafe': 'restaurant',
  cafe: 'restaurant',
  café: 'restaurant',

  // Digital Marketing
  'digital-marketing': 'digital-marketing',
  'digital marketing': 'digital-marketing',
  'digital-marketing-business': 'digital-marketing',
  'digital marketing & business': 'digital-marketing',
  'digital marketing business': 'digital-marketing',
  marketing: 'digital-marketing',

  // Business
  business: 'business',
  'business-professional': 'business',
  'business professional': 'business',
  'business & services': 'business',
};

/**
 * Normalizes any template identifier (slug, name, category, or alias)
 * into the canonical Block Pages template ID.
 */
function normalizeTemplateId(identifier) {
  if (!identifier) return '';
  const key = String(identifier).trim().toLowerCase();
  return TEMPLATE_ALIASES[key] || key;
}

/**
 * Determine if a user plan qualifies for full access to all templates.
 * Business, Advanced, and Premium plans grant full access.
 */
function hasFullTemplatePlan(plan) {
  const normalized = String(plan || '').trim().toLowerCase();
  return ['business', 'advanced', 'premium'].includes(normalized);
}

/**
 * Authoritative check: can the given user edit the specified template?
 *
 * @param {Object} user - User document or plain object with _id, plan, role
 * @param {string} templateIdentifier - Slug, title, category, or canonical template ID
 * @returns {Promise<boolean>}
 */
async function canUserEditTemplate(user, templateIdentifier) {
  if (!user || !user._id) {
    return false;
  }

  // Admins always have edit access
  if (user.role === 'admin') {
    return true;
  }

  // Business / Advanced / Premium users have full access to ALL templates
  if (hasFullTemplatePlan(user.plan)) {
    return true;
  }

  const canonicalId = normalizeTemplateId(templateIdentifier);
  if (!canonicalId) {
    return false;
  }

  // Basic / Free users must have purchased the specific template
  const purchase = await TemplatePurchase.exists({
    userId: user._id,
    templateId: canonicalId,
    status: 'completed',
  });

  return Boolean(purchase);
}

/**
 * Returns the complete template access status for a user, including
 * plan, entitlement flags, and per-template access map.
 *
 * @param {Object|null} user - Authenticated user or null for guests
 * @returns {Promise<Object>}
 */
async function getUserTemplateAccess(user) {
  if (!user || !user._id) {
    const accessibleTemplates = {};
    CANONICAL_TEMPLATES.forEach((id) => {
      accessibleTemplates[id] = false;
    });

    return {
      authenticated: false,
      plan: 'none',
      role: 'guest',
      hasAllAccess: false,
      purchasedTemplates: [],
      accessibleTemplates,
    };
  }

  // Ensure we have current user plan and role
  let currentUser = user;
  if (!currentUser.plan || !currentUser.role) {
    currentUser = await User.findById(user._id).select('plan role subscriptionStatus').lean();
  }

  const plan = String(currentUser?.plan || 'free').toLowerCase();
  const isAdmin = currentUser?.role === 'admin';
  const hasAllAccess = isAdmin || hasFullTemplatePlan(plan);

  // Fetch all completed purchases for this user
  const purchases = await TemplatePurchase.find({
    userId: user._id,
    status: 'completed',
  })
    .select('templateId')
    .lean();

  const purchasedTemplates = Array.from(
    new Set(purchases.map((p) => normalizeTemplateId(p.templateId)).filter(Boolean))
  );

  const accessibleTemplates = {};
  CANONICAL_TEMPLATES.forEach((id) => {
    accessibleTemplates[id] = hasAllAccess || purchasedTemplates.includes(id);
  });

  return {
    authenticated: true,
    userId: String(user._id),
    plan,
    role: currentUser?.role || 'user',
    hasAllAccess,
    purchasedTemplates,
    accessibleTemplates,
  };
}

module.exports = {
  CANONICAL_TEMPLATES,
  TEMPLATE_ALIASES,
  normalizeTemplateId,
  hasFullTemplatePlan,
  canUserEditTemplate,
  getUserTemplateAccess,
};

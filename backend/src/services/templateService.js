const Template = require('../models/Template');
const TemplateWishlist = require('../models/TemplateWishlist');
const TemplateCart = require('../models/TemplateCart');
const Workspace = require('../models/Workspace');
const WorkspaceState = require('../models/WorkspaceState');
const ApiError = require('../utils/ApiError');

async function listTemplates(query = {}) {
  const filter = {};
  if (query.category) filter.category = query.category.toLowerCase();
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
      { tags: { $regex: query.search, $options: 'i' } },
    ];
  }

  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  const skip = (page - 1) * limit;

  const [templates, total] = await Promise.all([
    Template.find(filter)
      .select('-components -designTokens -__v')
      .sort({ featured: -1, usageCount: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Template.countDocuments(filter),
  ]);

  return {
    templates,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

async function getTemplate(idOrSlug) {
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
  const template = await Template.findOne(
    isMongoId ? { _id: idOrSlug } : { slug: idOrSlug }
  ).lean();
  if (!template) throw ApiError.notFound('Template not found');
  return template;
}

async function useTemplate(userId, templateId) {
  const template = await Template.findById(templateId);
  if (!template) throw ApiError.notFound('Template not found');

  // Create workspace from template
  const workspace = await Workspace.create({
    userId,
    projectName: `${template.name}`,
    category: template.category,
    style: template.style || 'Modern',
    sections: template.sections || [],
    description: template.description || '',
    thumbnail: template.thumbnail || '',
    components: template.components || [],
    designTokens: template.designTokens || {},
  });

  // Create initial workspace state from template components
  if (template.components && template.components.length > 0) {
    await WorkspaceState.create({
      workspaceId: workspace._id,
      pageData: {},
      builderData: { components: template.components },
    });
  }

  // Increment usage count
  template.usageCount = (template.usageCount || 0) + 1;
  await template.save();

  return workspace.toObject();
}

/**
 * Seed base templates into the database.
 * Skips templates that already exist (by slug).
 */
async function seedTemplates() {
  const baseTemplates = [
    {
      name: 'E-Commerce Store',
      slug: 'ecommerce-store',
      category: 'store',
      description: 'A modern online store template with product showcase, pricing, testimonials, and checkout-ready sections.',
      style: 'Modern',
      sections: ['navigation', 'hero', 'features', 'gallery', 'pricing-table', 'testimonial', 'contact', 'footer'],
      tags: ['store', 'shop', 'products', 'ecommerce'],
      featured: true,
      components: [],
    },
    {
      name: 'Creative Portfolio',
      slug: 'creative-portfolio',
      category: 'portfolio',
      description: 'Showcase your best work with a clean portfolio layout, project gallery, testimonials, and inquiry form.',
      style: 'Modern',
      sections: ['navigation', 'hero', 'gallery', 'features', 'testimonial', 'form', 'footer'],
      tags: ['portfolio', 'creative', 'freelance', 'agency'],
      featured: true,
      components: [],
    },
    {
      name: 'Personal Blog',
      slug: 'personal-blog',
      category: 'blog',
      description: 'A clean blog template with featured content, categories, newsletter subscription, and reader engagement sections.',
      style: 'Minimal',
      sections: ['navigation', 'hero', 'features', 'gallery', 'tabs', 'contact', 'footer'],
      tags: ['blog', 'writing', 'articles', 'newsletter'],
      featured: true,
      components: [],
    },
    {
      name: 'Business Professional',
      slug: 'business-professional',
      category: 'business',
      description: 'Professional business website with service highlights, pricing packages, client testimonials, and lead capture.',
      style: 'Modern',
      sections: ['navigation', 'hero', 'features', 'pricing-table', 'testimonial', 'form', 'footer'],
      tags: ['business', 'corporate', 'services', 'professional'],
      featured: true,
      components: [],
    },
    {
      name: 'Restaurant & Café',
      slug: 'restaurant-cafe',
      category: 'restaurant',
      description: 'Appetizing restaurant template with menu highlights, gallery, reviews, map, and reservation form.',
      style: 'Bold',
      sections: ['navigation', 'hero', 'gallery', 'features', 'testimonial', 'map', 'contact', 'footer'],
      tags: ['restaurant', 'food', 'cafe', 'menu', 'dining'],
      featured: true,
      components: [],
    },
  ];

  let seeded = 0;
  for (const tpl of baseTemplates) {
    const exists = await Template.findOne({ slug: tpl.slug });
    if (!exists) {
      await Template.create(tpl);
      seeded++;
    }
  }
  return { seeded, total: baseTemplates.length };
}

// ─── Template Wishlist ──────────────────────────────────────

async function getWishlist(userId) {
  const entries = await TemplateWishlist.find({ userId })
    .sort({ createdAt: -1 })
    .populate('templateId', '-components -designTokens -__v')
    .lean();

  return entries
    .filter((e) => e.templateId)
    .map((e) => ({ ...e.templateId, wishlistedAt: e.createdAt }));
}

async function addToWishlist(userId, templateId) {
  const template = await Template.findById(templateId).select('_id').lean();
  if (!template) throw ApiError.notFound('Template not found');

  await TemplateWishlist.findOneAndUpdate(
    { userId, templateId },
    { userId, templateId },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return { added: true };
}

async function removeFromWishlist(userId, templateId) {
  const result = await TemplateWishlist.deleteOne({ userId, templateId });
  if (result.deletedCount === 0) throw ApiError.notFound('Wishlist entry not found');
  return { removed: true };
}

// ─── Template Cart ──────────────────────────────────────────

async function getCart(userId) {
  const entries = await TemplateCart.find({ userId })
    .sort({ createdAt: -1 })
    .populate('templateId', '-components -designTokens -__v')
    .lean();

  return entries
    .filter((e) => e.templateId)
    .map((e) => ({ ...e.templateId, addedToCartAt: e.createdAt }));
}

async function addToCart(userId, templateId) {
  const template = await Template.findById(templateId).select('_id').lean();
  if (!template) throw ApiError.notFound('Template not found');

  await TemplateCart.findOneAndUpdate(
    { userId, templateId },
    { userId, templateId },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return { added: true };
}

async function removeFromCart(userId, templateId) {
  const result = await TemplateCart.deleteOne({ userId, templateId });
  if (result.deletedCount === 0) throw ApiError.notFound('Cart entry not found');
  return { removed: true };
}

module.exports = {
  listTemplates,
  getTemplate,
  useTemplate,
  seedTemplates,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getCart,
  addToCart,
  removeFromCart,
};

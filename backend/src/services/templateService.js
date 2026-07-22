const Template = require('../models/Template');
const TemplateWishlist = require('../models/TemplateWishlist');
const TemplateCart = require('../models/TemplateCart');
const Workspace = require('../models/Workspace');
const WorkspaceState = require('../models/WorkspaceState');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { assertProjectCapacity, toProject } = require('./projectService');

const DEFAULT_PAGES = [{ id: 'home', name: 'Home', path: '/' }];

const CATEGORY_ALIASES = {
  ecommerce: 'store',
  'e-commerce': 'store',
  shop: 'store',
  café: 'restaurant',
  cafe: 'restaurant',
};

const TEMPLATE_COPY = {
  portfolio: {
    primary: '#1d4ed8',
    surface: '#eff6ff',
    heroTitle: 'Showcase work that speaks for itself',
    heroDescription: 'Turn selected projects into a focused portfolio that makes it easy for the right clients to get in touch.',
    cta: 'View selected work',
    links: ['Work', 'About', 'Services', 'Contact'],
    featureHeading: 'Built to tell your story',
    features: [
      { title: 'Focused case studies', description: 'Guide visitors through the work and the thinking behind it.' },
      { title: 'A memorable point of view', description: 'Bring your personal brand, process, and strengths into view.' },
      { title: 'Easy next steps', description: 'Give prospective clients a clear way to start a conversation.' },
    ],
    gallery: [
      ['/landing-optimized/port.webp', 'Signature portfolio homepage'],
      ['/landing-optimized/portfolio03.webp', 'Agency case study'],
      ['/landing-optimized/portfolio04.webp', 'Selected project grid'],
    ],
    contactTitle: 'Start a project together',
    contactDescription: 'Share a little about the work you have in mind and we will be in touch.',
    contactCta: 'Send an inquiry',
    footerTagline: 'Selected work, thoughtful process, and clear contact.',
  },
  blog: {
    primary: '#7c3aed',
    surface: '#faf5ff',
    heroTitle: 'A home for ideas worth returning to',
    heroDescription: 'Publish essays, guides, and updates in a readable layout that helps visitors discover more of your work.',
    cta: 'Start reading',
    links: ['Stories', 'Topics', 'Guides', 'Subscribe'],
    featureHeading: 'An editorial foundation',
    features: [
      { title: 'Featured stories', description: 'Lead with the pieces you want readers to discover first.' },
      { title: 'Clear topic paths', description: 'Make it easy to browse related ideas and useful guides.' },
      { title: 'A subscriber path', description: 'Invite returning readers to receive your next update.' },
    ],
    gallery: [
      ['/landing-optimized/bloggg.webp', 'Editorial homepage'],
      ['/landing-optimized/blog1.webp', 'Featured story layout'],
      ['/landing-optimized/blog2.webp', 'Guide collection'],
    ],
    contactTitle: 'Get the next story',
    contactDescription: 'Invite readers to subscribe for new essays, guides, and field notes.',
    contactCta: 'Subscribe',
    footerTagline: 'Ideas, essays, and practical guides for curious readers.',
  },
  store: {
    primary: '#0f766e',
    surface: '#f0fdfa',
    heroTitle: 'A storefront customers can trust',
    heroDescription: 'Highlight collections, guide customers to the right products, and create a confident path to checkout.',
    cta: 'Explore products',
    links: ['Shop', 'Collections', 'Reviews', 'Contact'],
    featureHeading: 'Made for a smoother sale',
    features: [
      { title: 'Curated collections', description: 'Organize products into clear shopping paths.' },
      { title: 'Trust-first storytelling', description: 'Pair offers with proof, reviews, and practical details.' },
      { title: 'Mobile-ready browsing', description: 'Keep products and calls to action easy to reach on every screen.' },
    ],
    gallery: [
      ['/landing-optimized/ecommerce.webp', 'Storefront preview'],
      ['/landing-optimized/store11.webp', 'Featured collection'],
      ['/landing-optimized/fashion06.webp', 'Seasonal product range'],
    ],
    contactTitle: 'Ready to welcome your next customer?',
    contactDescription: 'Collect early interest, launch updates, or customer questions in one clear place.',
    contactCta: 'Keep me posted',
    footerTagline: 'A polished storefront built for discovery and repeat customers.',
  },
  business: {
    primary: '#0b1d40',
    surface: '#f7f9fc',
    heroTitle: 'Build confidence in your business',
    heroDescription: 'Explain what you do, show the value you bring, and make it simple for the right people to contact your team.',
    cta: 'Book a consultation',
    links: ['Services', 'Results', 'Pricing', 'Contact'],
    featureHeading: 'A clearer path to trust',
    features: [
      { title: 'Service clarity', description: 'Describe your offer in sections visitors can scan quickly.' },
      { title: 'Credibility signals', description: 'Use helpful proof points to support a confident decision.' },
      { title: 'Lead-ready contact', description: 'Turn interest into a focused business conversation.' },
    ],
    gallery: [
      ['/landing-optimized/business09.webp', 'Professional business homepage'],
      ['/landing-optimized/business03.webp', 'Service overview'],
      ['/landing-optimized/business07.webp', 'Client-ready presentation'],
    ],
    contactTitle: 'Talk with our team',
    contactDescription: 'Tell us what you are working on and we will help you find the right next step.',
    contactCta: 'Request a consultation',
    footerTagline: 'Professional services, clear outcomes, and practical next steps.',
  },
  restaurant: {
    primary: '#991b1b',
    surface: '#fff5f5',
    heroTitle: 'Give guests a taste before they arrive',
    heroDescription: 'Showcase signature dishes, share your story, and make reservations or enquiries effortless on every device.',
    cta: 'View the menu',
    links: ['Menu', 'About', 'Reservations', 'Contact'],
    featureHeading: 'Everything guests need to know',
    features: [
      { title: 'Signature dishes', description: 'Put popular plates, specials, and seasonal favourites front and centre.' },
      { title: 'A sense of place', description: 'Help future guests picture the food, people, and atmosphere.' },
      { title: 'Simple reservations', description: 'Make hours, directions, and booking details easy to find.' },
    ],
    gallery: [
      ['/landing-optimized/foodd03.webp', 'Restaurant homepage'],
      ['/landing-optimized/foodd01.webp', 'Signature dish'],
      ['/landing-optimized/foodd02.webp', 'Dining atmosphere'],
    ],
    contactTitle: 'Reserve your table',
    contactDescription: 'Invite guests to book, ask about private dining, or get in touch with the team.',
    contactCta: 'Reserve now',
    footerTagline: 'Fresh flavours, welcoming tables, and effortless reservations.',
  },
};

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function deepClone(value) {
  if (typeof value === 'undefined') return value;
  return JSON.parse(JSON.stringify(value));
}

function toPlainTemplate(template) {
  return template && typeof template.toObject === 'function'
    ? template.toObject()
    : template;
}

function normalizeCategory(category) {
  const value = String(category || '').trim().toLowerCase();
  return CATEGORY_ALIASES[value] || value || 'business';
}

function normalizePages(pages) {
  if (!Array.isArray(pages) || pages.length === 0) return deepClone(DEFAULT_PAGES);
  const normalized = pages
    .filter((page) => isRecord(page) && typeof page.name === 'string')
    .map((page, index) => ({
      id: typeof page.id === 'string' && page.id ? page.id : 'page-' + (index + 1),
      name: page.name.trim() || 'Page ' + (index + 1),
      path: typeof page.path === 'string' && page.path ? page.path : '/',
    }));
  return normalized.length > 0 ? normalized : deepClone(DEFAULT_PAGES);
}

function countComponents(components) {
  if (!Array.isArray(components)) return 0;
  return components.reduce((total, component) => (
    total
      + 1
      + countComponents(Array.isArray(component && component.children) ? component.children : [])
  ), 0);
}

function hasRenderableComponents(builderData) {
  return Boolean(
    isRecord(builderData)
      && Array.isArray(builderData.components)
      && builderData.components.length > 0
  );
}

function buildComponent(id, type, order, styles, props, content = '') {
  return {
    id,
    type,
    content,
    props,
    styles,
    children: [],
    order,
  };
}

/**
 * Seed-quality Builder JSON for the shared templates. It is intentionally
 * serializable plain data: the regular Builder remains the only editor and
 * renderer, while templates provide its initial document.
 */
function createBaseTemplateBuilderData(template) {
  const source = toPlainTemplate(template) || {};
  const category = normalizeCategory(source.category);
  const copy = TEMPLATE_COPY[category] || TEMPLATE_COPY.business;
  const slug = String(source.slug || category || 'template')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-');
  const name = String(source.name || 'Stackly Template');
  const thumbnail = String(source.thumbnail || source.previewUrl || copy.gallery[0][0]);
  const baseStyles = {
    margin: '0 0 16px',
    borderRadius: '16px',
    width: '100%',
  };

  const components = [
    buildComponent(
      slug + '-navigation',
      'navigation',
      0,
      {
        ...baseStyles,
        color: '#0B1D40',
        backgroundColor: '#ffffff',
        padding: '16px 20px',
      },
      {
        schemaVersion: 1,
        brand: name,
        logoUrl: '',
        logoAssetId: '',
        links: copy.links.map((label) => ({ label, href: '#' + label.toLowerCase() })),
        cta: { label: copy.cta, href: '#contact' },
        variant: 'default',
        sticky: false,
        mobileMenu: { enabled: false, breakpoint: 'md' },
      },
    ),
    buildComponent(
      slug + '-hero',
      'hero',
      1,
      {
        ...baseStyles,
        color: '#ffffff',
        backgroundColor: copy.primary,
        padding: '56px 40px',
        textAlign: 'left',
      },
      {
        schemaVersion: 1,
        title: copy.heroTitle,
        description: copy.heroDescription,
        cta: { label: copy.cta, href: '#contact' },
        layout: 'split',
        align: 'left',
        media: { type: 'image', src: thumbnail, alt: name + ' preview' },
      },
    ),
    buildComponent(
      slug + '-features',
      'features',
      2,
      {
        ...baseStyles,
        color: '#0B1D40',
        backgroundColor: copy.surface,
        padding: '36px',
      },
      {
        schemaVersion: 1,
        heading: copy.featureHeading,
        items: copy.features,
        layout: 'grid',
        columns: 3,
      },
    ),
    buildComponent(
      slug + '-gallery',
      'gallery',
      3,
      {
        ...baseStyles,
        color: '#0B1D40',
        backgroundColor: '#ffffff',
        padding: '28px',
      },
      undefined,
      copy.gallery.map(([src, caption]) => src + '|' + caption).join('\n'),
    ),
    buildComponent(
      slug + '-contact',
      'contact',
      4,
      {
        ...baseStyles,
        color: '#0B1D40',
        backgroundColor: copy.surface,
        padding: '32px',
      },
      {
        schemaVersion: 1,
        title: copy.contactTitle,
        description: copy.contactDescription,
        inputPlaceholder: 'you@example.com',
        cta: { label: copy.contactCta, href: '#contact' },
        form: {
          method: 'POST',
          successMessage: 'Thanks! We will be in touch soon.',
        },
      },
    ),
    buildComponent(
      slug + '-footer',
      'footer',
      5,
      {
        ...baseStyles,
        color: '#ffffff',
        backgroundColor: '#0B1D40',
        padding: '0',
        margin: '0',
      },
      {
        brand: name,
        tagline: copy.footerTagline,
        columns: [
          {
            title: 'Explore',
            links: copy.links.slice(0, 3).map((label) => ({
              label,
              href: '#' + label.toLowerCase(),
            })),
          },
          {
            title: 'Connect',
            links: [{ label: 'Contact', href: '#contact' }],
          },
        ],
        copyright: 'Copyright ' + new Date().getFullYear() + ' ' + name + '. All rights reserved.',
        socials: [],
      },
    ),
  ];

  return {
    schemaVersion: 1,
    projectName: name,
    canvasMode: 'flow',
    components,
    designTokens: {
      colors: {
        primary: copy.primary,
        secondary: '#3b82f6',
        accent: '#f59e0b',
        background: '#ffffff',
        text: '#0B1D40',
      },
      typography: {
        fontFamily: 'Inter, system-ui, sans-serif',
        baseFontSize: '16px',
        headingScale: 1.25,
      },
      buttons: {
        borderRadius: '8px',
        fontWeight: '700',
      },
      spacing: {
        base: 8,
      },
    },
    seo: {
      title: name,
      description: String(source.description || ''),
      ogTitle: name,
      ogDescription: String(source.description || ''),
      ogImage: thumbnail,
    },
  };
}

/**
 * Read the canonical Builder payload, supporting legacy template records that
 * stored components and tokens at the top level. Empty legacy seed records
 * receive a real starter document so preview and cloning work immediately.
 */
function normalizeTemplateBuilderData(template) {
  const source = toPlainTemplate(template) || {};
  const stored = isRecord(source.builderData) ? deepClone(source.builderData) : {};
  const legacyComponents = Array.isArray(source.components)
    ? deepClone(source.components)
    : [];
  const storedComponents = Array.isArray(stored.components)
    ? stored.components
    : [];

  if (storedComponents.length === 0 && legacyComponents.length === 0) {
    return createBaseTemplateBuilderData(source);
  }

  const components = storedComponents.length > 0
    ? storedComponents
    : legacyComponents;
  const designTokens = isRecord(stored.designTokens)
    ? stored.designTokens
    : (isRecord(source.designTokens) ? deepClone(source.designTokens) : undefined);

  return {
    schemaVersion: Number.isInteger(stored.schemaVersion) ? stored.schemaVersion : 1,
    projectName: typeof stored.projectName === 'string' && stored.projectName.trim()
      ? stored.projectName
      : String(source.name || 'Untitled Project'),
    canvasMode: stored.canvasMode === 'freeform' ? 'freeform' : 'flow',
    components,
    ...(designTokens ? { designTokens } : {}),
    ...(isRecord(stored.seo) ? { seo: stored.seo } : {}),
  };
}

function serializeTemplate(template, { includeBuilderData = false } = {}) {
  const source = toPlainTemplate(template) || {};
  const base = {
    _id: String(source._id || ''),
    name: String(source.name || ''),
    slug: String(source.slug || ''),
    category: normalizeCategory(source.category),
    style: String(source.style || 'Modern'),
    description: String(source.description || ''),
    thumbnail: String(source.thumbnail || source.previewUrl || ''),
    isPremium: Boolean(source.premium),
    tags: Array.isArray(source.tags) ? source.tags.map(String) : [],
    usageCount: Number(source.usageCount || 0),
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };

  if (!includeBuilderData) return base;

  const builderData = normalizeTemplateBuilderData(source);
  return {
    ...base,
    sections: Array.isArray(source.sections) ? source.sections.map(String) : [],
    pages: normalizePages(source.pages),
    builderData,
    componentCount: countComponents(builderData.components),
  };
}

function parsePremiumFilter(value) {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return undefined;
}

async function listTemplates(query = {}) {
  const filter = {};
  if (query.category && String(query.category).toLowerCase() !== 'all') {
    filter.category = normalizeCategory(query.category);
  }
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
      { tags: { $regex: query.search, $options: 'i' } },
    ];
  }
  const premium = parsePremiumFilter(query.isPremium);
  if (typeof premium === 'boolean') filter.premium = premium;

  const requestedPage = Number(query.page || 1);
  const requestedLimit = Number(query.limit || 20);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
    ? Math.min(requestedLimit, 100)
    : 20;
  const skip = (page - 1) * limit;

  const [templates, total] = await Promise.all([
    Template.find(filter)
      .select('-components -designTokens -builderData -__v')
      .sort({ featured: -1, usageCount: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Template.countDocuments(filter),
  ]);

  return {
    success: true,
    templates: templates.map((template) => serializeTemplate(template)),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

async function findTemplate(idOrSlug, { lean = true } = {}) {
  const value = String(idOrSlug || '').trim();
  if (!value) throw ApiError.notFound('Template not found');

  const filter = /^[0-9a-fA-F]{24}$/.test(value)
    ? { _id: value }
    : { slug: value.toLowerCase() };
  const query = Template.findOne(filter);
  const template = lean ? await query.lean() : await query;
  if (!template) throw ApiError.notFound('Template not found');
  return template;
}

async function getTemplate(idOrSlug) {
  const template = await findTemplate(idOrSlug);
  return serializeTemplate(template, { includeBuilderData: true });
}

async function assertTemplateAccess(userId, template) {
  const user = await User.findById(userId).select('plan role').lean();
  if (!user) throw ApiError.unauthorized('Your session is no longer valid. Please log in again.');

  if (template.premium && user.role !== 'admin' && user.plan !== 'premium') {
    throw ApiError.forbidden('This premium template requires a Premium plan.');
  }

  await assertProjectCapacity(userId, user);
}

async function useTemplate(userId, templateId) {
  const templateDocument = await findTemplate(templateId, { lean: false });
  const template = templateDocument.toObject();
  await assertTemplateAccess(userId, template);

  const builderData = deepClone(normalizeTemplateBuilderData(template));
  const pages = normalizePages(template.pages);
  const components = deepClone(builderData.components || []);
  const designTokens = deepClone(builderData.designTokens || template.designTokens || {});
  let workspace;

  try {
    workspace = await Workspace.create({
      userId,
      projectName: template.name,
      category: normalizeCategory(template.category),
      style: template.style || 'Modern',
      sections: Array.isArray(template.sections) ? deepClone(template.sections) : [],
      description: template.description || '',
      thumbnail: template.thumbnail || template.previewUrl || '',
      components,
      designTokens,
      builderData,
      htmlContent: '',
    });

    // The builder opens through the canonical projects API, while publishing
    // reads WorkspaceState. Persist the same full JSON to both records.
    await WorkspaceState.create({
      workspaceId: workspace._id,
      pageData: { pages },
      builderData: deepClone(builderData),
    });
  } catch (error) {
    if (workspace) {
      await Workspace.deleteOne({ _id: workspace._id, userId }).catch(() => undefined);
    }
    throw error;
  }

  // Analytics should never make an already-created private project appear to
  // fail. A retry can safely increment usage later without cloning twice.
  await Template.updateOne({ _id: templateDocument._id }, { $inc: { usageCount: 1 } })
    .catch(() => undefined);

  const project = toProject(workspace.toObject());
  return {
    project,
    workspaceId: String(workspace._id),
    builderData: deepClone(project.builderData),
    template: serializeTemplate({
      ...template,
      usageCount: Number(template.usageCount || 0) + 1,
    }),
  };
}

/**
 * Seed five base templates with editable Builder JSON. Existing records are
 * backfilled only when their original insert-only seed left them without a
 * Builder document, so shared templates are never overwritten once authored.
 */
async function seedTemplates() {
  const baseTemplates = [
    {
      name: 'E-Commerce Store',
      slug: 'ecommerce-store',
      category: 'store',
      description: 'A modern online store template with product showcase, clear calls to action, and customer-ready sections.',
      thumbnail: '/landing-optimized/ecommerce.webp',
      previewUrl: '/landing-optimized/ecommerce.webp',
      style: 'Modern',
      sections: ['navigation', 'hero', 'features', 'gallery', 'contact', 'footer'],
      pages: DEFAULT_PAGES,
      tags: ['store', 'shop', 'products', 'ecommerce'],
      featured: true,
    },
    {
      name: 'Creative Portfolio',
      slug: 'creative-portfolio',
      category: 'portfolio',
      description: 'Showcase your best work with a focused portfolio layout, project gallery, and inquiry section.',
      thumbnail: '/landing-optimized/port.webp',
      previewUrl: '/landing-optimized/port.webp',
      style: 'Modern',
      sections: ['navigation', 'hero', 'features', 'gallery', 'contact', 'footer'],
      pages: DEFAULT_PAGES,
      tags: ['portfolio', 'creative', 'freelance', 'agency'],
      featured: true,
    },
    {
      name: 'Personal Blog',
      slug: 'personal-blog',
      category: 'blog',
      description: 'A clean blog template with featured content, categories, newsletter subscription, and reader engagement sections.',
      thumbnail: '/landing-optimized/bloggg.webp',
      previewUrl: '/landing-optimized/bloggg.webp',
      style: 'Minimal',
      sections: ['navigation', 'hero', 'features', 'gallery', 'contact', 'footer'],
      pages: DEFAULT_PAGES,
      tags: ['blog', 'writing', 'articles', 'newsletter'],
      featured: true,
    },
    {
      name: 'Business Professional',
      slug: 'business-professional',
      category: 'business',
      description: 'Professional business website with service highlights, trust-building content, and qualified lead capture.',
      thumbnail: '/landing-optimized/business09.webp',
      previewUrl: '/landing-optimized/business09.webp',
      style: 'Modern',
      sections: ['navigation', 'hero', 'features', 'gallery', 'contact', 'footer'],
      pages: DEFAULT_PAGES,
      tags: ['business', 'corporate', 'services', 'professional'],
      featured: true,
    },
    {
      name: 'Restaurant & Cafe',
      slug: 'restaurant-cafe',
      category: 'restaurant',
      description: 'Restaurant template with menu highlights, food gallery, guest information, and reservations.',
      thumbnail: '/landing-optimized/foodd03.webp',
      previewUrl: '/landing-optimized/foodd03.webp',
      style: 'Bold',
      sections: ['navigation', 'hero', 'features', 'gallery', 'contact', 'footer'],
      pages: DEFAULT_PAGES,
      tags: ['restaurant', 'food', 'cafe', 'menu', 'dining'],
      featured: true,
    },
  ];

  let seeded = 0;
  let backfilled = 0;

  for (const baseTemplate of baseTemplates) {
    const existing = await Template.findOne({ slug: baseTemplate.slug });
    const starterBuilderData = createBaseTemplateBuilderData(baseTemplate);

    if (!existing) {
      await Template.create({
        ...baseTemplate,
        pages: deepClone(baseTemplate.pages),
        builderData: starterBuilderData,
        components: deepClone(starterBuilderData.components),
        designTokens: deepClone(starterBuilderData.designTokens),
      });
      seeded += 1;
      continue;
    }

    const current = existing.toObject();
    const updates = {};
    if (!hasRenderableComponents(current.builderData)) {
      const normalizedBuilderData = normalizeTemplateBuilderData(current);
      updates.builderData = normalizedBuilderData;
      if (!Array.isArray(current.components) || current.components.length === 0) {
        updates.components = deepClone(normalizedBuilderData.components);
      }
      if (!isRecord(current.designTokens) || Object.keys(current.designTokens).length === 0) {
        updates.designTokens = deepClone(normalizedBuilderData.designTokens || {});
      }
    }
    if (!current.thumbnail) updates.thumbnail = baseTemplate.thumbnail;
    if (!current.previewUrl) updates.previewUrl = baseTemplate.previewUrl;
    if (!Array.isArray(current.pages) || current.pages.length === 0) {
      updates.pages = deepClone(baseTemplate.pages);
    }

    if (Object.keys(updates).length > 0) {
      Object.assign(existing, updates);
      await existing.save();
      backfilled += 1;
    }
  }

  return { seeded, backfilled, total: baseTemplates.length };
}

async function getWishlist(userId) {
  const entries = await TemplateWishlist.find({ userId })
    .sort({ createdAt: -1 })
    .populate('templateId', '-components -designTokens -builderData -__v')
    .lean();

  return entries
    .filter((entry) => entry.templateId)
    .map((entry) => ({
      ...serializeTemplate(entry.templateId),
      wishlistedAt: entry.createdAt,
    }));
}

async function addToWishlist(userId, templateId) {
  await findTemplate(templateId);
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

async function getCart(userId) {
  const entries = await TemplateCart.find({ userId })
    .sort({ createdAt: -1 })
    .populate('templateId', '-components -designTokens -builderData -__v')
    .lean();

  return entries
    .filter((entry) => entry.templateId)
    .map((entry) => ({
      ...serializeTemplate(entry.templateId),
      addedToCartAt: entry.createdAt,
    }));
}

async function addToCart(userId, templateId) {
  await findTemplate(templateId);
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
  normalizeTemplateBuilderData,
  serializeTemplate,
  createBaseTemplateBuilderData,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getCart,
  addToCart,
  removeFromCart,
};

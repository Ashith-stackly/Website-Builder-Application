const BlogPost = require('../models/BlogPost');
const Workspace = require('../models/Workspace');
const Domain = require('../models/Domain');
const ApiError = require('../utils/ApiError');

function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
}

async function ensureUniqueSlug(workspaceId, slug, excludeId = null) {
  let candidate = slug;
  let suffix = 1;
  const filter = { workspaceId, slug: candidate };
  if (excludeId) filter._id = { $ne: excludeId };

  while (await BlogPost.exists(filter)) {
    candidate = `${slug}-${suffix}`;
    filter.slug = candidate;
    suffix++;
  }
  return candidate;
}

async function verifyWorkspaceOwnership(userId, workspaceId) {
  const exists = await Workspace.exists({
    _id: workspaceId,
    userId,
    status: { $ne: 'deleted' },
  });
  if (!exists) throw ApiError.notFound('Workspace not found');
}

async function verifyPublicWorkspace(workspaceId) {
  const exists = await Workspace.exists({
    _id: workspaceId,
    status: { $ne: 'deleted' },
    'settings.visibility': 'public',
  });
  if (!exists) throw ApiError.notFound('Workspace not found');
}

function getPagination(query = {}, defaultLimit = 20) {
  const rawPage = Number(query.page || 1);
  const rawLimit = Number(query.limit || defaultLimit);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.floor(rawLimit), 1), 100)
    : defaultLimit;

  return { page, limit, skip: (page - 1) * limit };
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeHost(value) {
  return String(value || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .toLowerCase();
}

async function getWorkspaceBlogBaseUrl(workspaceId) {
  const domain = await Domain.findOne({ workspaceId, status: 'active' })
    .sort({ customDomain: -1, updatedAt: -1 })
    .lean();

  if (domain?.customDomain) {
    return `https://${normalizeHost(domain.customDomain)}`;
  }

  if (domain?.subdomain) {
    const appDomain = normalizeHost(process.env.PUBLIC_APP_DOMAIN || process.env.APP_DOMAIN || '');
    if (appDomain) return `https://${domain.subdomain}.${appDomain}`;
  }

  return normalizeHost(process.env.FRONTEND_URL || 'http://localhost:3000').startsWith('localhost')
    ? `http://${normalizeHost(process.env.FRONTEND_URL || 'http://localhost:3000')}`
    : process.env.FRONTEND_URL || 'http://localhost:3000';
}

async function createPost(userId, body) {
  await verifyWorkspaceOwnership(userId, body.workspaceId);

  const baseSlug = generateSlug(body.title);
  const slug = await ensureUniqueSlug(body.workspaceId, baseSlug);

  const post = await BlogPost.create({
    workspaceId: body.workspaceId,
    author: userId,
    title: body.title,
    slug,
    content: body.content || '',
    excerpt: body.excerpt || '',
    coverImage: body.coverImage || '',
    category: body.category || '',
    tags: body.tags || [],
    status: body.status || 'draft',
    seo: body.seo || {},
    publishedAt: body.status === 'published' ? new Date() : undefined,
  });

  return post.toObject();
}

async function listPosts(userId, workspaceId, query = {}) {
  await verifyWorkspaceOwnership(userId, workspaceId);

  const filter = { workspaceId };
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;
  if (query.search) {
    const search = String(query.search).trim();
    if (search) {
      const regex = new RegExp(escapeRegExp(search), 'i');
      filter.$or = [
        { title: regex },
        { excerpt: regex },
        { tags: regex },
      ];
    }
  }

  const { page, limit, skip } = getPagination(query);

  const [posts, total] = await Promise.all([
    BlogPost.find(filter)
      .select('-content -__v')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    BlogPost.countDocuments(filter),
  ]);

  return {
    posts,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

async function listPublishedPosts(workspaceId, query = {}) {
  await verifyPublicWorkspace(workspaceId);

  const filter = { workspaceId, status: 'published' };
  if (query.category) filter.category = query.category;
  if (query.search) {
    const search = String(query.search).trim();
    if (search) {
      const regex = new RegExp(escapeRegExp(search), 'i');
      filter.$or = [
        { title: regex },
        { excerpt: regex },
        { tags: regex },
      ];
    }
  }

  const { page, limit, skip } = getPagination(query, 12);

  const [posts, total] = await Promise.all([
    BlogPost.find(filter)
      .select('-content -__v')
      .populate('author', 'name')
      .sort({ publishedAt: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    BlogPost.countDocuments(filter),
  ]);

  return {
    posts,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

async function getPost(userId, postId) {
  const post = await BlogPost.findById(postId).lean();
  if (!post) throw ApiError.notFound('Post not found');
  await verifyWorkspaceOwnership(userId, post.workspaceId);
  return post;
}

async function getPostBySlug(userId, workspaceId, slug) {
  await verifyWorkspaceOwnership(userId, workspaceId);
  const post = await BlogPost.findOne({ workspaceId, slug }).lean();
  if (!post) throw ApiError.notFound('Post not found');
  return post;
}

async function getPublishedPost(workspaceId, slug) {
  await verifyPublicWorkspace(workspaceId);
  const post = await BlogPost.findOne({ workspaceId, slug, status: 'published' })
    .populate('author', 'name')
    .lean();
  if (!post) throw ApiError.notFound('Published post not found');
  return post;
}

async function updatePost(userId, postId, body) {
  const post = await BlogPost.findById(postId);
  if (!post) throw ApiError.notFound('Post not found');
  await verifyWorkspaceOwnership(userId, post.workspaceId);

  const titleChanged = typeof body.title === 'string' && body.title !== post.title;
  const allowedFields = ['title', 'content', 'excerpt', 'coverImage', 'category', 'tags', 'status', 'seo'];
  for (const key of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      post[key] = body[key];
    }
  }

  // Regenerate slug if title changed
  if (titleChanged) {
    const baseSlug = generateSlug(body.title);
    post.slug = await ensureUniqueSlug(post.workspaceId, baseSlug, post._id);
  }

  // Set publishedAt when first published
  if (body.status === 'published' && !post.publishedAt) {
    post.publishedAt = new Date();
  }

  await post.save();
  return post.toObject();
}

async function deletePost(userId, postId) {
  const post = await BlogPost.findById(postId);
  if (!post) throw ApiError.notFound('Post not found');
  await verifyWorkspaceOwnership(userId, post.workspaceId);
  await BlogPost.deleteOne({ _id: postId });
}

async function generateSitemap(workspaceId) {
  await verifyPublicWorkspace(workspaceId);

  const posts = await BlogPost.find({
    workspaceId,
    status: 'published',
  })
    .select('slug publishedAt updatedAt')
    .sort({ publishedAt: -1 })
    .lean();

  const baseUrl = (await getWorkspaceBlogBaseUrl(workspaceId)).replace(/\/$/, '');
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const post of posts) {
    const lastmod = (post.updatedAt || post.publishedAt || new Date()).toISOString().split('T')[0];
    const loc = `${baseUrl}/blog/post?workspaceId=${encodeURIComponent(workspaceId)}&slug=${encodeURIComponent(post.slug)}`;
    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(loc)}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `  </url>\n`;
  }

  xml += '</urlset>';
  return xml;
}

async function listAllSlugs() {
  const posts = await BlogPost.find({}).select('slug').lean();
  return { slugs: posts.map((p) => p.slug).filter(Boolean) };
}

module.exports = {
  createPost,
  listPosts,
  listPublishedPosts,
  getPost,
  getPostBySlug,
  getPublishedPost,
  updatePost,
  deletePost,
  generateSitemap,
  listAllSlugs,
};

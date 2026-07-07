const BlogPost = require('../models/BlogPost');
const Workspace = require('../models/Workspace');
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

  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  const skip = (page - 1) * limit;

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

async function getPost(userId, postId) {
  const post = await BlogPost.findById(postId).lean();
  if (!post) throw ApiError.notFound('Post not found');
  await verifyWorkspaceOwnership(userId, post.workspaceId);
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
  const posts = await BlogPost.find({
    workspaceId,
    status: 'published',
  })
    .select('slug publishedAt updatedAt')
    .sort({ publishedAt: -1 })
    .lean();

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const post of posts) {
    const lastmod = (post.updatedAt || post.publishedAt || new Date()).toISOString().split('T')[0];
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/blog/${post.slug}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `  </url>\n`;
  }

  xml += '</urlset>';
  return xml;
}

module.exports = {
  createPost,
  listPosts,
  getPost,
  updatePost,
  deletePost,
  generateSitemap,
};

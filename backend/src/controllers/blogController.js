const blogService = require('../services/blogService');

async function createPost(req, res, next) {
  try {
    const post = await blogService.createPost(req.user._id, req.body);
    res.status(201).json({ message: 'Post created', post });
  } catch (err) {
    next(err);
  }
}

async function listPosts(req, res, next) {
  try {
    res.json(await blogService.listPosts(req.user._id, req.params.workspaceId, req.query));
  } catch (err) {
    next(err);
  }
}

async function getPost(req, res, next) {
  try {
    const post = await blogService.getPost(req.user._id, req.params.id);
    res.json({ post });
  } catch (err) {
    next(err);
  }
}

async function updatePost(req, res, next) {
  try {
    const post = await blogService.updatePost(req.user._id, req.params.id, req.body);
    res.json({ message: 'Post updated', post });
  } catch (err) {
    next(err);
  }
}

async function deletePost(req, res, next) {
  try {
    await blogService.deletePost(req.user._id, req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
}

async function generateSitemap(req, res, next) {
  try {
    const xml = await blogService.generateSitemap(req.params.workspaceId);
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    next(err);
  }
}

module.exports = { createPost, listPosts, getPost, updatePost, deletePost, generateSitemap };

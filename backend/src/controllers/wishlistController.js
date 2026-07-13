const wishlistService = require('../services/wishlistService');

async function getWishlist(req, res, next) {
  try {
    const wishlist = await wishlistService.getWishlist(req.user._id, req.params.workspaceId);
    res.json(wishlist);
  } catch (err) {
    next(err);
  }
}

async function addToWishlist(req, res, next) {
  try {
    res.status(201).json(
      await wishlistService.addToWishlist(req.user._id, req.params.workspaceId, req.params.productId)
    );
  } catch (err) {
    next(err);
  }
}

async function removeFromWishlist(req, res, next) {
  try {
    res.json(
      await wishlistService.removeFromWishlist(req.user._id, req.params.workspaceId, req.params.productId)
    );
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};

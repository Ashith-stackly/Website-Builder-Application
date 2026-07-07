const cartService = require('../services/cartService');

async function getCart(req, res, next) {
  try {
    const cart = await cartService.getCart(req.user._id, req.params.workspaceId);
    res.json(cart);
  } catch (err) {
    next(err);
  }
}

async function addItem(req, res, next) {
  try {
    const cart = await cartService.addItem(
      req.user._id,
      req.params.workspaceId,
      req.body.productId,
      req.body.quantity
    );
    res.status(201).json({ message: 'Item added to cart', cart });
  } catch (err) {
    next(err);
  }
}

async function updateItem(req, res, next) {
  try {
    const cart = await cartService.updateItem(
      req.user._id,
      req.params.workspaceId,
      req.params.itemId,
      req.body.quantity
    );
    res.json({ message: 'Cart item updated', cart });
  } catch (err) {
    next(err);
  }
}

async function removeItem(req, res, next) {
  try {
    const cart = await cartService.removeItem(
      req.user._id,
      req.params.workspaceId,
      req.params.itemId
    );
    res.json({ message: 'Item removed from cart', cart });
  } catch (err) {
    next(err);
  }
}

async function clearCart(req, res, next) {
  try {
    await cartService.clearCart(req.user._id, req.params.workspaceId);
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
};

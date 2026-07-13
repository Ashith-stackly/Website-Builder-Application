const crypto = require('crypto');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Workspace = require('../models/Workspace');
const ApiError = require('../utils/ApiError');

function isPlaceholderRazorpayValue(value) {
  return !value || /xxxx|your[_-]|placeholder|demo/i.test(value);
}

function hasRazorpayConfig() {
  return (
    !isPlaceholderRazorpayValue(process.env.RAZORPAY_KEY_ID) &&
    !isPlaceholderRazorpayValue(process.env.RAZORPAY_KEY_SECRET)
  );
}

async function verifyWorkspaceExists(workspaceId) {
  const exists = await Workspace.exists({ _id: workspaceId, status: { $ne: 'deleted' } });
  if (!exists) throw ApiError.notFound('Workspace not found');
}

/**
 * Create a checkout order:
 * 1. Snapshot cart items (or accept items directly)
 * 2. Calculate totals
 * 3. Create Razorpay order
 * 4. Persist order in DB with "pending" status
 * 5. Return order + Razorpay payment info to frontend
 */
async function createCheckoutOrder(userId, body = {}) {
  const { workspaceId, items: directItems, billingDetails, shippingAddress, customerEmail, customerName, orderNotes } = body;

  if (!workspaceId) throw ApiError.badRequest('workspaceId is required');
  await verifyWorkspaceExists(workspaceId);

  let orderItems = [];
  let subtotal = 0;
  let currency = '';

  function addProduct(product, quantity) {
    const qty = Math.max(1, Math.floor(Number(quantity) || 1));
    if (product.inventory < qty) {
      throw ApiError.badRequest(`${product.name} only has ${product.inventory} item(s) available`);
    }
    if (currency && currency !== product.currency) {
      throw ApiError.badRequest('All checkout items must use the same currency');
    }
    currency = product.currency || 'INR';
    const unitPrice = product.salePrice ?? product.price;
    orderItems.push({
      productId: product._id,
      name: product.name,
      price: unitPrice,
      quantity: qty,
    });
    subtotal += unitPrice * qty;
  }

  if (directItems && Array.isArray(directItems) && directItems.length > 0) {
    // Items provided directly in request body
    for (const item of directItems) {
      const product = await Product.findOne({
        _id: item.productId,
        workspaceId,
        status: 'active',
      }).lean();

      if (!product) {
        throw ApiError.badRequest(`Product ${item.productId} not found or not active`);
      }

      addProduct(product, item.quantity);
    }
  } else {
    // Fall back to user's cart
    const cart = await Cart.findOne({ userId, workspaceId }).populate(
      'items.productId',
      'name price salePrice currency inventory status'
    );

    if (!cart || !cart.items || cart.items.length === 0) {
      throw ApiError.badRequest('Cart is empty');
    }

    for (const ci of cart.items) {
      if (!ci.productId || ci.productId.status !== 'active') continue;
      addProduct(ci.productId, ci.quantity);
    }

    if (orderItems.length === 0) {
      throw ApiError.badRequest('No active products in cart');
    }
  }

  const taxRate = Math.max(0, Number(process.env.ECOMMERCE_TAX_RATE) || 0);
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const shippingCost = Math.max(0, Number(process.env.ECOMMERCE_SHIPPING_COST) || 0);
  const totalAmount = subtotal + tax + shippingCost;

  if (totalAmount <= 0) throw ApiError.badRequest('Order total must be greater than 0');

  // Amount in paise for Razorpay (INR smallest unit)
  const amountPaise = Math.round(totalAmount * 100);

  // Create Razorpay order
  let razorpayOrderId = '';
  let razorpayKeyId = '';

  if (!hasRazorpayConfig()) {
    // Dev/demo mode
    if (process.env.NODE_ENV === 'production') {
      throw ApiError.badRequest('Razorpay is not configured');
    }
    razorpayOrderId = `order_demo_${Date.now()}`;
    razorpayKeyId = 'rzp_test_demo';
  } else {
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const rpOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency,
      receipt: `stackly_order_${Date.now()}`,
      notes: {
        userId: userId?.toString() || '',
        workspaceId: workspaceId.toString(),
      },
    });

    razorpayOrderId = rpOrder.id;
    razorpayKeyId = process.env.RAZORPAY_KEY_ID;
  }

  // Persist order in DB
  const order = await Order.create({
    workspaceId,
    userId: userId || undefined,
    items: orderItems,
    subtotal,
    tax,
    shippingCost,
    totalAmount,
    currency,
    paymentProvider: 'razorpay',
    razorpayOrderId,
    paymentStatus: 'pending',
    status: 'pending',
    billingDetails: billingDetails || {},
    shippingAddress: shippingAddress || {},
    customerEmail: customerEmail || '',
    customerName: customerName || '',
    orderNotes: orderNotes || '',
  });

  return {
    order: order.toObject(),
    payment: {
      orderId: razorpayOrderId,
      amount: amountPaise,
      currency,
      keyId: razorpayKeyId,
    },
  };
}

/**
 * Verify Razorpay payment and finalize order:
 * 1. Verify signature
 * 2. Mark order as paid
 * 3. Clear cart if applicable
 * 4. Prevent duplicate finalization
 */
async function verifyCheckoutPayment(body = {}) {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    orderId, // our DB order _id
  } = body;

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    throw ApiError.badRequest('Razorpay payment payload is incomplete');
  }

  // Find the order
  const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
  if (!order) throw ApiError.notFound('Order not found');

  // Prevent duplicate finalization
  if (order.paymentStatus === 'completed') {
    return {
      verified: true,
      message: 'Payment already verified',
      order: order.toObject(),
    };
  }

  // Verify signature
  let verified = false;
  if (!hasRazorpayConfig()) {
    // Demo mode — auto-verify in non-production
    verified = process.env.NODE_ENV !== 'production';
  } else {
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    verified = expected === razorpay_signature;
  }

  if (!verified) {
    // Mark as failed
    order.paymentStatus = 'failed';
    await order.save();
    return { verified: false, message: 'Payment verification failed' };
  }

  // Atomically claim finalization so concurrent callbacks cannot decrement stock twice.
  const claimedOrder = await Order.findOneAndUpdate(
    { _id: order._id, paymentStatus: { $in: ['pending', 'failed'] } },
    { $set: { paymentStatus: 'processing' } },
    { new: true }
  );
  if (!claimedOrder) {
    const finalized = await Order.findById(order._id).lean();
    return {
      verified: finalized?.paymentStatus === 'completed',
      message: finalized?.paymentStatus === 'completed' ? 'Payment already verified' : 'Payment is being processed',
      order: finalized,
    };
  }

  const decremented = [];
  try {
    for (const item of claimedOrder.items) {
      const result = await Product.updateOne(
        { _id: item.productId, status: 'active', inventory: { $gte: item.quantity } },
        { $inc: { inventory: -item.quantity } }
      );
      if (result.modifiedCount !== 1) {
        throw ApiError.conflict(`${item.name || 'A product'} is no longer available in the requested quantity`);
      }
      decremented.push(item);
    }

    claimedOrder.razorpayPaymentId = razorpay_payment_id;
    claimedOrder.razorpaySignature = razorpay_signature;
    claimedOrder.paymentStatus = 'completed';
    claimedOrder.status = 'confirmed';
    claimedOrder.paymentId = razorpay_payment_id;
    await claimedOrder.save();
  } catch (err) {
    await Promise.all(decremented.map((item) => Product.updateOne(
      { _id: item.productId },
      { $inc: { inventory: item.quantity } }
    )));
    claimedOrder.paymentStatus = 'failed';
    await claimedOrder.save();
    throw err;
  }

  // Clear user's cart for this workspace after successful payment
  if (claimedOrder.userId && claimedOrder.workspaceId) {
    await Cart.findOneAndUpdate(
      { userId: claimedOrder.userId, workspaceId: claimedOrder.workspaceId },
      { $set: { items: [] } }
    );
  }

  return {
    verified: true,
    message: 'Payment verified successfully',
    order: claimedOrder.toObject(),
  };
}

/**
 * List orders for a user.
 */
async function getOrders(userId, query = {}) {
  const filter = { userId };
  if (query.workspaceId) filter.workspaceId = query.workspaceId;
  if (query.status) filter.status = query.status;
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;

  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

/**
 * Get a single order by ID (with ownership check).
 */
async function getOrder(userId, orderId) {
  const order = await Order.findById(orderId).lean();
  if (!order) throw ApiError.notFound('Order not found');

  // Allow access if user owns the order or owns the workspace
  if (!order.userId) {
    const ownsWorkspace = await Workspace.exists({
      _id: order.workspaceId,
      userId,
      status: { $ne: 'deleted' },
    });
    if (!ownsWorkspace) throw ApiError.notFound('Order not found');
  } else if (order.userId.toString() !== userId.toString()) {
    const ownsWorkspace = await Workspace.exists({
      _id: order.workspaceId,
      userId,
      status: { $ne: 'deleted' },
    });
    if (!ownsWorkspace) throw ApiError.notFound('Order not found');
  }

  return order;
}

module.exports = {
  createCheckoutOrder,
  verifyCheckoutPayment,
  getOrders,
  getOrder,
};

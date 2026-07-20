export interface Product {
  _id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency: string;
  images: string[];
  category?: string;
  inventory: number;
  status: "active" | "draft" | "archived";
  salePrice?: number | null;
  sku?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductBody {
  workspaceId: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  images?: string[];
  category?: string;
  inventory?: number;
  status?: "active" | "draft" | "archived";
  salePrice?: number | null;
  sku?: string;
}

export interface UpdateProductBody {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  images?: string[];
  category?: string;
  inventory?: number;
  status?: "active" | "draft" | "archived";
  salePrice?: number | null;
  sku?: string;
}

export interface OrderItem {
  _id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  _id: string;
  workspaceId: string;
  userId?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  totalAmount: number;
  currency: string;
  paymentProvider: "razorpay" | "stripe" | "cod" | "";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentStatus: "pending" | "processing" | "completed" | "failed" | "refunded";
  paymentId?: string;
  shippingAddress?: any;
  billingDetails?: any;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  customerEmail: string;
  customerName: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrderStatusBody {
  status?: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus?: "pending" | "processing" | "completed" | "failed" | "refunded";
  paymentId?: string;
}

export interface OrderListResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

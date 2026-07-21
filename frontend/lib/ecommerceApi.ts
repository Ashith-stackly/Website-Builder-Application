import type {
  Product,
  CreateProductBody,
  UpdateProductBody,
  Order,
  UpdateOrderStatusBody,
  OrderListResponse,
} from "@/types/ecommerce";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("stackly-auth-token");
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function ecommerceRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...init.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.message || "E-commerce request failed.";
    throw new Error(message);
  }

  return data as T;
}

export async function createProduct(body: CreateProductBody): Promise<Product> {
  const data = await ecommerceRequest<{ product: Product }>("/ecommerce/product", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return data.product;
}

export async function listProducts(workspaceId: string): Promise<Product[]> {
  const data = await ecommerceRequest<{ products: Product[] }>(`/ecommerce/products/${encodeURIComponent(workspaceId)}`, {
    method: "GET",
  });
  return Array.isArray(data.products) ? data.products : [];
}

export async function getProduct(id: string): Promise<Product> {
  const data = await ecommerceRequest<{ product: Product }>(`/ecommerce/product/${encodeURIComponent(id)}`, {
    method: "GET",
  });
  return data.product;
}

export async function updateProduct(id: string, body: UpdateProductBody): Promise<Product> {
  const data = await ecommerceRequest<{ product: Product }>(`/ecommerce/product/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return data.product;
}

export async function deleteProduct(id: string): Promise<void> {
  await ecommerceRequest<void>(`/ecommerce/product/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function listOrders(
  workspaceId: string,
  params: { status?: string; page?: number; limit?: number } = {}
): Promise<OrderListResponse> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const queryString = query.toString();
  const path = `/ecommerce/orders/${encodeURIComponent(workspaceId)}${queryString ? `?${queryString}` : ""}`;
  return ecommerceRequest<OrderListResponse>(path, {
    method: "GET",
  });
}

export async function getOrder(id: string): Promise<Order> {
  const data = await ecommerceRequest<{ order: Order }>(`/ecommerce/order/${encodeURIComponent(id)}`, {
    method: "GET",
  });
  return data.order;
}

export async function updateOrderStatus(id: string, body: UpdateOrderStatusBody): Promise<Order> {
  const data = await ecommerceRequest<{ order: Order }>(`/ecommerce/order/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return data.order;
}

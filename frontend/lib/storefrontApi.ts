import type { Order, Product } from "@/types/ecommerce";
import type { RazorpayOrderResponse, RazorpayPaymentSuccess } from "@/lib/razorpayClient";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

export type StorefrontProductsResponse = {
  workspaceId: string;
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type StoreCartItem = {
  _id: string;
  product: Product;
  quantity: number;
  addedAt?: string;
  lineTotal: number;
};

export type StoreCart = {
  items: StoreCartItem[];
  total: number;
  currency: string;
};

type CheckoutResponse = {
  order: Order;
  payment: RazorpayOrderResponse;
};

type VerifyPaymentResponse = {
  verified: boolean;
  message?: string;
  order?: Order;
};

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("stackly-auth-token");
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function storefrontRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { authenticated?: boolean } = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(options.authenticated ? authHeaders() : {}),
      ...init.headers,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Storefront request failed.");
  }

  return data as T;
}

export function hasStorefrontSession(): boolean {
  return Boolean(getAuthToken());
}

export function getPublicStoreProducts(
  workspaceId: string,
  signal?: AbortSignal,
): Promise<StorefrontProductsResponse> {
  return storefrontRequest<StorefrontProductsResponse>(
    `/ecommerce/store/${encodeURIComponent(workspaceId)}/products`,
    { method: "GET", signal },
  );
}

export function getStoreCart(workspaceId: string, signal?: AbortSignal): Promise<StoreCart> {
  return storefrontRequest<StoreCart>(
    `/cart/${encodeURIComponent(workspaceId)}`,
    { method: "GET", signal },
    { authenticated: true },
  );
}

export async function addStoreCartItem(
  workspaceId: string,
  productId: string,
  quantity: number,
): Promise<void> {
  await storefrontRequest<{ message: string }>(
    `/cart/${encodeURIComponent(workspaceId)}/items`,
    {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    },
    { authenticated: true },
  );
}

export async function updateStoreCartItem(
  workspaceId: string,
  itemId: string,
  quantity: number,
): Promise<void> {
  await storefrontRequest<{ message: string }>(
    `/cart/${encodeURIComponent(workspaceId)}/items/${encodeURIComponent(itemId)}`,
    {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    },
    { authenticated: true },
  );
}

export async function removeStoreCartItem(workspaceId: string, itemId: string): Promise<void> {
  await storefrontRequest<{ message: string }>(
    `/cart/${encodeURIComponent(workspaceId)}/items/${encodeURIComponent(itemId)}`,
    { method: "DELETE" },
    { authenticated: true },
  );
}

export async function clearStoreCart(workspaceId: string): Promise<void> {
  await storefrontRequest<{ message: string }>(
    `/cart/${encodeURIComponent(workspaceId)}`,
    { method: "DELETE" },
    { authenticated: true },
  );
}

export function createStoreCheckout(body: {
  workspaceId: string;
  items: Array<{ productId: string; quantity: number }>;
  customerName?: string;
  customerEmail?: string;
}): Promise<CheckoutResponse> {
  return storefrontRequest<CheckoutResponse>(
    "/checkout/create-order",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    { authenticated: true },
  );
}

export function verifyStoreCheckoutPayment(
  payment: RazorpayPaymentSuccess & { orderId: string },
): Promise<VerifyPaymentResponse> {
  return storefrontRequest<VerifyPaymentResponse>(
    "/checkout/verify-payment",
    {
      method: "POST",
      body: JSON.stringify(payment),
    },
    { authenticated: true },
  );
}

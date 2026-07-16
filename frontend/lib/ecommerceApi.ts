import type { Product, CreateProductBody, UpdateProductBody } from "@/types/ecommerce";

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
  return ecommerceRequest<Product[]>(`/ecommerce/products/${encodeURIComponent(workspaceId)}`, {
    method: "GET",
  });
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

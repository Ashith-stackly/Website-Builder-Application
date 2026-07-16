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

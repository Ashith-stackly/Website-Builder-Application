/**
 * Blog type definitions for Stackly Blog & SEO module.
 * Used by blog API layer, management pages, and public blog view.
 */

export interface Blog {
  _id: string;
  workspaceId: string;
  title: string;
  slug: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  status: "draft" | "published";
  featuredImage?: string;
  createdAt: string;
  updatedAt: string;
}

/** Shape returned by GET /api/blog (list endpoint). */
export interface BlogListItem {
  _id: string;
  workspaceId: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  createdAt: string;
}

/** Body for POST /api/blog/create */
export interface CreateBlogBody {
  workspaceId: string;
  title: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  status?: "draft" | "published";
  featuredImage?: string;
}

/** Fields entered in the blog form; the page supplies the workspace context. */
export type BlogFormData = Omit<CreateBlogBody, "workspaceId">;

/** Body for PUT /api/blog/:id */
export interface UpdateBlogBody {
  title?: string;
  content?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  status?: "draft" | "published";
  featuredImage?: string;
}

/**
 * Blog type definitions for Stackly Blog & SEO module.
 * Used by blog API layer, management pages, and public blog view.
 */

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  status: "Draft" | "Published";
  featuredImage?: string;
  createdAt: string;
  updatedAt: string;
}

/** Shape returned by GET /api/blog (list endpoint). */
export interface BlogListItem {
  _id: string;
  title: string;
  slug: string;
  status: "Draft" | "Published";
  createdAt: string;
}

/** Body for POST /api/blog/create */
export interface CreateBlogBody {
  title: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  status?: "Draft" | "Published";
  featuredImage?: string;
}

/** Body for PUT /api/blog/:id */
export interface UpdateBlogBody {
  title?: string;
  content?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  status?: "Draft" | "Published";
  featuredImage?: string;
}

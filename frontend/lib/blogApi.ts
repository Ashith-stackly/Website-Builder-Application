import type {
  Blog,
  BlogListItem,
  CreateBlogBody,
  UpdateBlogBody,
} from "@/types/blog";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

/* ─── Helpers ──────────────────────────────────────────────────────────── */

type ApiErrorBody = {
  message?: string;
  errors?: string[];
};

type ApiBlog = {
  _id: string;
  workspaceId: string;
  title: string;
  slug: string;
  content?: string;
  status: "draft" | "published" | "archived";
  coverImage?: string;
  seo?: { title?: string; description?: string; keywords?: string | string[] };
  createdAt: string;
  updatedAt: string;
};

function mapBlog(blog: ApiBlog): Blog {
  const keywords = Array.isArray(blog.seo?.keywords)
    ? blog.seo.keywords
    : blog.seo?.keywords?.split(",").map((keyword) => keyword.trim()).filter(Boolean);
  return {
    _id: blog._id,
    workspaceId: blog.workspaceId,
    title: blog.title,
    slug: blog.slug,
    content: blog.content ?? "",
    status: blog.status === "archived" ? "draft" : blog.status,
    featuredImage: blog.coverImage || undefined,
    seoTitle: blog.seo?.title || undefined,
    seoDescription: blog.seo?.description || undefined,
    seoKeywords: keywords?.length ? keywords : undefined,
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt,
  };
}

function toApiBody(body: CreateBlogBody | UpdateBlogBody) {
  const { featuredImage, seoTitle, seoDescription, seoKeywords, ...rest } = body;
  return {
    ...rest,
    coverImage: featuredImage,
    seo: {
      title: seoTitle,
      description: seoDescription,
      keywords: seoKeywords?.join(", "),
    },
  };
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("stackly-auth-token");
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function blogRequest<T>(
  path: string,
  init: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...init.headers,
    },
  });

  const data = (await response.json().catch(() => ({}))) as ApiErrorBody & T;

  if (!response.ok) {
    const message =
      data.message || data.errors?.join(", ") || getDefaultErrorMessage(response.status);
    throw new Error(message);
  }

  return data as T;
}

function getDefaultErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return "Invalid request. Please check your input.";
    case 401:
      return "You must be logged in to perform this action.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The requested blog was not found.";
    case 500:
      return "Server error. Please try again later.";
    default:
      return "An unexpected error occurred.";
  }
}

/** Check if an error is a network/connection failure. */
export function isBlogConnectionError(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    (error instanceof Error &&
      (error.message === "Failed to fetch" ||
        error.message.includes("NetworkError") ||
        error.message.includes("load failed")))
  );
}

/* ─── API Functions ────────────────────────────────────────────────────── */

/** POST /api/blog/post */
export async function createBlog(
  body: CreateBlogBody
): Promise<{ message?: string; blog?: Blog }> {
  const result = await blogRequest<{ message?: string; post: ApiBlog }>("/blog/post", {
    method: "POST",
    body: JSON.stringify(toApiBody(body)),
  });
  return { message: result.message, blog: mapBlog(result.post) };
}

/** GET /api/blog/posts/:workspaceId */
export async function getBlogs(
  workspaceId: string,
  signal?: AbortSignal
): Promise<BlogListItem[]> {
  const result = await blogRequest<{ posts: ApiBlog[] }>(
    `/blog/posts/${encodeURIComponent(workspaceId)}`,
    { method: "GET", signal }
  );
  return (result.posts ?? []).map(mapBlog);
}

/** Authenticated CMS lookup by workspace + slug. */
export async function getBlogBySlug(
  workspaceId: string,
  slug: string,
  signal?: AbortSignal
): Promise<Blog> {
  const result = await blogRequest<{ post: ApiBlog }>(`/blog/posts/${encodeURIComponent(workspaceId)}/slug/${encodeURIComponent(slug)}`, {
    method: "GET",
    signal,
  });
  return mapBlog(result.post);
}

/** Public published post lookup for the slug URL. */
export async function getPublishedBlog(workspaceId: string, slug: string, signal?: AbortSignal): Promise<Blog> {
  const result = await blogRequest<{ post: ApiBlog }>(`/blog/public/${encodeURIComponent(workspaceId)}/${encodeURIComponent(slug)}`, {
    method: "GET",
    signal,
  });
  return mapBlog(result.post);
}

/** PUT /api/blog/:id */
export async function updateBlog(
  id: string,
  body: UpdateBlogBody
): Promise<{ message?: string; blog?: Blog }> {
  const result = await blogRequest<{ message?: string; post: ApiBlog }>(`/blog/post/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(toApiBody(body)),
  });
  return { message: result.message, blog: mapBlog(result.post) };
}

/** DELETE /api/blog/:id */
export async function deleteBlog(
  id: string
): Promise<{ message?: string }> {
  return blogRequest(`/blog/post/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

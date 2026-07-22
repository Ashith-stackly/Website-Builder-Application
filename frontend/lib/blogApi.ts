import type {
  Blog,
  BlogListItem,
  BlogListResponse,
  CreateBlogBody,
  UpdateBlogBody,
} from "@/types/blog";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

type ApiErrorBody = {
  message?: string;
  errors?: string[];
};

type ApiBlog = {
  _id: string;
  workspaceId: string;
  title: string;
  slug: string;
  content?: unknown;
  excerpt?: string;
  author?: string | { name?: string };
  category?: string;
  tags?: string[];
  status: "draft" | "published" | "archived";
  coverImage?: string;
  seo?: { title?: string; description?: string; keywords?: string | string[] };
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

type ApiListResponse = {
  posts: ApiBlog[];
  pagination?: BlogListResponse["pagination"];
};

export interface BlogListQuery {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  status?: "draft" | "published" | "archived";
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("stackly-auth-token");
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
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

async function parseResponse<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as ApiErrorBody & T;

  if (!response.ok) {
    const message =
      data.message || data.errors?.join(", ") || getDefaultErrorMessage(response.status);
    throw new Error(message);
  }

  return data as T;
}

async function blogRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...init.headers,
    },
  });

  return parseResponse<T>(response);
}

async function publicBlogRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: init.headers,
  });

  return parseResponse<T>(response);
}

function buildQuery(query: BlogListQuery = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const search = params.toString();
  return search ? `?${search}` : "";
}

function contentToString(content: unknown): string {
  if (typeof content === "string") return content;
  if (content === null || content === undefined) return "";
  if (Array.isArray(content)) {
    return content
      .map((item) =>
        typeof item === "string"
          ? item
          : typeof item === "object" && item && "text" in item
            ? String((item as { text?: unknown }).text ?? "")
            : ""
      )
      .filter(Boolean)
      .join("\n\n");
  }
  return String(content);
}

function normalizeKeywords(keywords?: string | string[]): string[] | undefined {
  const normalized = Array.isArray(keywords)
    ? keywords
    : keywords?.split(",").map((keyword) => keyword.trim()).filter(Boolean);
  return normalized?.length ? normalized : undefined;
}

function normalizeAuthor(author?: ApiBlog["author"]): string | undefined {
  if (typeof author === "string") return author;
  return author?.name || undefined;
}

function mapBlog(blog: ApiBlog): Blog {
  return {
    _id: blog._id,
    workspaceId: blog.workspaceId,
    title: blog.title,
    slug: blog.slug,
    content: contentToString(blog.content),
    excerpt: blog.excerpt || undefined,
    author: normalizeAuthor(blog.author),
    category: blog.category || undefined,
    tags: blog.tags?.filter(Boolean),
    status: blog.status,
    featuredImage: blog.coverImage || undefined,
    seoTitle: blog.seo?.title || undefined,
    seoDescription: blog.seo?.description || undefined,
    seoKeywords: normalizeKeywords(blog.seo?.keywords),
    publishedAt: blog.publishedAt || undefined,
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

export function isAbortError(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof DOMException && error.name === "AbortError") return true;
  if (error instanceof Error) {
    if (error.name === "AbortError") return true;
    if (
      error.message.includes("aborted") ||
      error.message.includes("AbortError") ||
      error.message.includes("signal is aborted")
    ) {
      return true;
    }
  }
  return false;
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

export function getPublicBlogPath(workspaceId: string, slug: string): string {
  const params = new URLSearchParams({ workspaceId, slug });
  return `/blog/post?${params.toString()}`;
}

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
export async function getBlogsPage(
  workspaceId: string,
  query: BlogListQuery = {},
  signal?: AbortSignal
): Promise<BlogListResponse> {
  const result = await blogRequest<ApiListResponse>(
    `/blog/posts/${encodeURIComponent(workspaceId)}${buildQuery(query)}`,
    { method: "GET", signal }
  );
  const posts = (result.posts ?? []).map(mapBlog);
  return {
    posts,
    pagination: result.pagination ?? {
      page: query.page ?? 1,
      limit: query.limit ?? posts.length,
      total: posts.length,
      pages: posts.length ? 1 : 0,
    },
  };
}

/** Backward-compatible helper used by existing management pages. */
export async function getBlogs(
  workspaceId: string,
  signal?: AbortSignal
): Promise<BlogListItem[]> {
  const result = await getBlogsPage(workspaceId, { limit: 100 }, signal);
  return result.posts;
}

/** Public published post listing for /blog. */
export async function getPublishedBlogs(
  workspaceId: string,
  query: BlogListQuery = {},
  signal?: AbortSignal
): Promise<BlogListResponse> {
  const result = await publicBlogRequest<ApiListResponse>(
    `/blog/public/${encodeURIComponent(workspaceId)}${buildQuery(query)}`,
    { method: "GET", signal }
  );
  const posts = (result.posts ?? []).map(mapBlog);
  return {
    posts,
    pagination: result.pagination ?? {
      page: query.page ?? 1,
      limit: query.limit ?? posts.length,
      total: posts.length,
      pages: posts.length ? 1 : 0,
    },
  };
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

/** Public published post lookup for static-safe post URLs. */
export async function getPublishedBlog(workspaceId: string, slug: string, signal?: AbortSignal): Promise<Blog> {
  const result = await publicBlogRequest<{ post: ApiBlog }>(`/blog/public/${encodeURIComponent(workspaceId)}/${encodeURIComponent(slug)}`, {
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

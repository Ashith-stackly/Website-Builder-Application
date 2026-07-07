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

/** POST /api/blog/create */
export async function createBlog(
  body: CreateBlogBody
): Promise<{ message?: string; blog?: Blog }> {
  return blogRequest("/blog/create", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** GET /api/blog */
export async function getBlogs(
  signal?: AbortSignal
): Promise<BlogListItem[]> {
  const result = await blogRequest<BlogListItem[] | { blogs: BlogListItem[] }>(
    "/blog",
    { method: "GET", signal }
  );
  // Handle both array response and { blogs: [...] } wrapper
  return Array.isArray(result) ? result : (result as { blogs: BlogListItem[] }).blogs ?? [];
}

/** GET /api/blog/:slug */
export async function getBlogBySlug(
  slug: string,
  signal?: AbortSignal
): Promise<Blog> {
  return blogRequest<Blog>(`/blog/${encodeURIComponent(slug)}`, {
    method: "GET",
    signal,
  });
}

/** PUT /api/blog/:id */
export async function updateBlog(
  id: string,
  body: UpdateBlogBody
): Promise<{ message?: string; blog?: Blog }> {
  return blogRequest(`/blog/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

/** DELETE /api/blog/:id */
export async function deleteBlog(
  id: string
): Promise<{ message?: string }> {
  return blogRequest(`/blog/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

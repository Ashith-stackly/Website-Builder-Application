import type {
  TemplateListItem,
  Template,
  TemplateListResponse,
  TemplateDetailResponse,
  CloneTemplateResponse,
  TemplateQueryParams,
} from "@/types/template";

// ── Base URL ───────────────────────────────────────────────────────────

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

// ── Helpers ────────────────────────────────────────────────────────────

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

function getDefaultErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return "Invalid request. Please check your input.";
    case 401:
      return "You must be logged in to perform this action.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The requested template was not found.";
    case 500:
      return "Server error. Please try again later.";
    default:
      return "An unexpected error occurred.";
  }
}

async function templateRequest<T>(
  path: string,
  init: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
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

/** Check if an error is a network/connection failure. */
export function isTemplateConnectionError(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    (error instanceof Error &&
      (error.message === "Failed to fetch" ||
        error.message.includes("NetworkError") ||
        error.message.includes("load failed")))
  );
}

// ── API Functions ──────────────────────────────────────────────────────

/**
 * GET /api/templates
 * Fetches the template list, optionally filtered by category, search, or premium status.
 */
export async function getTemplates(
  params?: TemplateQueryParams,
  signal?: AbortSignal
): Promise<TemplateListItem[]> {
  const query = new URLSearchParams();
  if (params?.category && params.category !== "All") {
    query.set("category", params.category);
  }
  if (params?.search) {
    query.set("search", params.search);
  }
  if (params?.isPremium !== undefined) {
    query.set("isPremium", String(params.isPremium));
  }
  const qs = query.toString();
  const path = `/templates${qs ? `?${qs}` : ""}`;

  const result = await templateRequest<TemplateListResponse>(path, {
    method: "GET",
    signal,
  });

  return Array.isArray(result.templates) ? result.templates : [];
}

/**
 * GET /api/templates/:id
 * Fetches a single template with its full builderData (components, tokens, SEO).
 */
export async function getTemplate(
  id: string,
  signal?: AbortSignal
): Promise<Template> {
  const result = await templateRequest<TemplateDetailResponse>(
    `/templates/${encodeURIComponent(id)}`,
    { method: "GET", signal }
  );

  return result.template;
}

/**
 * POST /api/templates/:id/clone
 * Clones a template into a new user project. Requires authentication.
 * Returns the new project ID on success.
 */
export async function cloneTemplate(
  id: string,
  signal?: AbortSignal
): Promise<CloneTemplateResponse> {
  return templateRequest<CloneTemplateResponse>(
    `/templates/${encodeURIComponent(id)}/clone`,
    {
      method: "POST",
      headers: authHeaders(),
      signal,
    }
  );
}

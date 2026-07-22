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
    case 409:
      return "This template is temporarily unavailable. Please try again.";
    case 422:
      return "The template request could not be completed. Please try again.";
    case 429:
      return "Too many template requests were made. Please wait a moment and try again.";
    case 500:
    case 503:
      return "The template service is temporarily unavailable. Please try again later.";
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
 * GET /api/template/list
 * Fetches the template list, optionally filtered by category, search, or premium status.
 */
export async function getTemplates(
  params?: TemplateQueryParams,
  signal?: AbortSignal
): Promise<TemplateListItem[]> {
  const query = new URLSearchParams();
  if (params?.category && params.category !== "all") {
    query.set("category", params.category);
  }
  if (params?.search) {
    query.set("search", params.search);
  }
  if (params?.isPremium !== undefined) {
    query.set("isPremium", String(params.isPremium));
  }
  const qs = query.toString();
  const path = `/template/list${qs ? `?${qs}` : ""}`;

  const result = await templateRequest<TemplateListResponse>(path, {
    method: "GET",
    signal,
  });

  return Array.isArray(result.templates) ? result.templates : [];
}

/**
 * GET /api/template/:idOrSlug
 * Fetches a single template with its full builderData (components, tokens, SEO).
 */
export async function getTemplate(
  id: string,
  signal?: AbortSignal
): Promise<Template> {
  const result = await templateRequest<TemplateDetailResponse>(
    `/template/${encodeURIComponent(id)}`,
    { method: "GET", signal }
  );

  return result.template;
}

/**
 * POST /api/template/:id/use
 * Clones a template into a new user-owned project. Requires authentication.
 * The response contains canonical project and workspace IDs (the same record),
 * the stored Builder JSON, and template metadata for an immediate handoff.
 */
export async function cloneTemplate(
  id: string,
  signal?: AbortSignal
): Promise<CloneTemplateResponse> {
  return templateRequest<CloneTemplateResponse>(
    `/template/${encodeURIComponent(id)}/use`,
    {
      method: "POST",
      headers: authHeaders(),
      signal,
    }
  );
}

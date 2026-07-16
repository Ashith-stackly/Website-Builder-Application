import type { BuilderComponent, SEOMetadata } from "@/types/builder";
import type { DesignTokens } from "@/store/designStore";
import type { AnalyticsData } from "@/types/analytics";


const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

export interface ProjectBuilderData {
  schemaVersion?: number;
  components?: BuilderComponent[];
  sections?: BuilderComponent[];
  designTokens?: DesignTokens;
  seo?: SEOMetadata;
  canvasMode?: "flow" | "freeform";
  projectName?: string;
}

export interface ProjectApiProject {
  _id: string;
  projectName: string;
  description?: string;
  builderData?: ProjectBuilderData | null;
  htmlContent?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  category?: string;
  style?: string;
  sections?: string[];
}

type ProjectListResponse = {
  success: boolean;
  projects: ProjectApiProject[];
};

type ProjectResponse = {
  success: boolean;
  project: ProjectApiProject;
};

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
      return "The project request is invalid. Please check your changes and try again.";
    case 401:
      return "Please log in again to access your projects.";
    case 403:
      return "You do not have permission to access this project.";
    case 404:
      return "This project could not be found.";
    case 500:
      return "The project service is having trouble. Please try again shortly.";
    default:
      return "Something went wrong while talking to the project service.";
  }
}

async function projectRequest<T>(path: string, init: RequestInit): Promise<T> {
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

export function isProjectConnectionError(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    (error instanceof Error &&
      (error.message === "Failed to fetch" ||
        error.message.includes("NetworkError") ||
        error.message.includes("load failed")))
  );
}

export async function getProjects(signal?: AbortSignal): Promise<ProjectApiProject[]> {
  const data = await projectRequest<ProjectListResponse>("/projects", {
    method: "GET",
    signal,
  });

  return Array.isArray(data.projects) ? data.projects : [];
}

export async function getProject(id: string, signal?: AbortSignal): Promise<ProjectApiProject> {
  const data = await projectRequest<ProjectResponse>(`/projects/${encodeURIComponent(id)}`, {
    method: "GET",
    signal,
  });

  return data.project;
}

export interface CreateProjectInput {
  projectName: string;
  category?: string;
  style?: string;
  sections?: string[];
  description?: string;
}

export async function createProject(
  input: CreateProjectInput,
  signal?: AbortSignal,
): Promise<ProjectApiProject> {
  const data = await projectRequest<ProjectResponse>("/projects", {
    method: "POST",
    body: JSON.stringify(input),
    signal,
  });

  return data.project;
}

export async function updateProject(
  id: string,
  updates: Partial<Pick<ProjectApiProject, "projectName" | "description" | "category" | "style" | "sections" | "status">>,
  signal?: AbortSignal,
): Promise<ProjectApiProject> {
  const data = await projectRequest<ProjectResponse>(`/projects/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(updates),
    signal,
  });

  return data.project;
}

export async function deleteProject(id: string, signal?: AbortSignal): Promise<{ success: boolean }> {
  return projectRequest(`/projects/${encodeURIComponent(id)}`, {
    method: "DELETE",
    signal,
  });
}

export async function autosaveProject(
  id: string,
  data: { builderData: ProjectBuilderData | Record<string, unknown>; htmlContent?: string },
  signal?: AbortSignal,
): Promise<{ success: boolean; savedAt?: string }> {
  return projectRequest(`/projects/${encodeURIComponent(id)}/autosave`, {
    method: "PUT",
    body: JSON.stringify(data),
    signal,
  });
}

export async function saveHtml(
  id: string,
  htmlContent: string,
  signal?: AbortSignal,
): Promise<{ success: boolean; savedAt?: string }> {
  return projectRequest(`/projects/${encodeURIComponent(id)}/save-html`, {
    method: "PUT",
    body: JSON.stringify({ htmlContent }),
    signal,
  });
}

export async function getProjectAnalytics(
  workspaceId: string,
  days: number,
  signal?: AbortSignal,
): Promise<AnalyticsData> {
  return projectRequest<AnalyticsData>(`/analytics/${encodeURIComponent(workspaceId)}?days=${days}`, {
    method: "GET",
    signal,
  });
}


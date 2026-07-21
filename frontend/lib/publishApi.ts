import type { ProjectBuilderData } from "@/lib/projectApi";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

export type DeploymentStatus = "pending" | "building" | "deployed" | "failed" | "rolled_back";

export interface Deployment {
  _id: string;
  workspaceId?: string;
  version: number;
  status: DeploymentStatus;
  s3Url?: string;
  deployedAt?: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

export interface DeploymentHistory {
  deployments: Deployment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

type ApiErrorBody = {
  message?: string;
  errors?: string[];
};

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("stackly-auth-token");
}

function getErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return "Your site needs a saved builder state before it can be published.";
    case 401:
      return "Your session has expired. Please log in again, then publish your site.";
    case 403:
      return "You do not have permission to publish this workspace.";
    case 404:
      return "This workspace could not be found. It may have been deleted or you no longer have access.";
    case 409:
      return "A publish is already in progress. Refresh the deployment status and try again.";
    default:
      return "The publishing service could not complete your request. Please try again.";
  }
}

async function publishRequest<T>(path: string, init: RequestInit): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  const body = (await response.json().catch(() => ({}))) as ApiErrorBody & T;
  if (!response.ok) {
    throw new Error(
      body.message || body.errors?.join(", ") || getErrorMessage(response.status),
    );
  }

  return body as T;
}

/**
 * The established publish service reads WorkspaceState. The builder's normal
 * draft endpoint saves the same data on Workspace, so publishing syncs this
 * compatibility state immediately before POST /publish. This guarantees that
 * the deployment receives the most recent canvas snapshot.
 */
export async function saveWorkspaceState(
  workspaceId: string,
  data: { builderData: ProjectBuilderData; htmlContent: string },
  signal?: AbortSignal,
): Promise<void> {
  await publishRequest(`/workspace/${encodeURIComponent(workspaceId)}/state`, {
    method: "PUT",
    body: JSON.stringify({
      builderData: data.builderData,
      pageData: { htmlContent: data.htmlContent },
    }),
    signal,
  });
}

export async function publishSite(workspaceId: string, signal?: AbortSignal): Promise<Deployment> {
  const response = await publishRequest<{ message: string; deployment: Deployment }>(
    `/publish/${encodeURIComponent(workspaceId)}`,
    { method: "POST", signal },
  );
  return response.deployment;
}

export async function getDeployments(
  workspaceId: string,
  signal?: AbortSignal,
): Promise<DeploymentHistory> {
  return publishRequest<DeploymentHistory>(
    `/publish/${encodeURIComponent(workspaceId)}/deployments?limit=10`,
    { method: "GET", signal },
  );
}

export async function getActiveDeployment(
  workspaceId: string,
  signal?: AbortSignal,
): Promise<Deployment | null> {
  const response = await publishRequest<{ deployment: Deployment | null }>(
    `/publish/${encodeURIComponent(workspaceId)}/active`,
    { method: "GET", signal },
  );
  return response.deployment;
}

/** A deployment URL is optional until a hosting provider attaches one. */
export function getDeploymentUrl(deployment?: Deployment | null): string | null {
  if (!deployment) return null;
  if (typeof deployment.s3Url === "string" && deployment.s3Url.trim()) {
    return deployment.s3Url.trim();
  }

  const metadata = deployment.metadata;
  if (!metadata) return null;
  for (const key of ["url", "deploymentUrl", "siteUrl", "domain"]) {
    const value = metadata[key];
    if (typeof value !== "string" || !value.trim()) continue;
    const url = value.trim();
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
  }
  return null;
}

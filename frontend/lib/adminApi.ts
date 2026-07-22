const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

export type AdminDashboardSummary = {
  range: { days: number; since: string };
  users: {
    total: number;
    verified: number;
    active: number;
    new: number;
    byPlan: Record<string, number>;
  };
  workspaces: { total: number; published: number };
  content: { templates: number; blogs: { total: number; published: number; drafts: number } };
  commerce: { paidOrders: number; paidRevenue: number; subscriptions: number; subscriptionRevenue: number };
  deployments: { deployed: number; pending: number; failed: number };
  analytics: { views: number; visitors: number; daily: Array<{ date: string; views: number; visitors: number }> };
  topWorkspaces: Array<{ workspaceId: string; projectName: string; views: number; visitors: number }>;
  recentUsers: Array<{ id: string; name: string; email: string; plan: string; role: string; createdAt: string; lastLoginAt: string | null }>;
  recentDeployments: Array<{ id: string; workspace: string; user: string; version: number; status: string; deployedAt: string; url: string }>;
  observability: { storage: null; apiUsage: null; errors: null; note: string };
};

export class AdminApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "AdminApiError";
  }
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("stackly-auth-token");
}

export async function getAdminDashboardSummary(
  days = 30,
  signal?: AbortSignal,
): Promise<AdminDashboardSummary> {
  const token = getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/admin/dashboard/summary?days=${encodeURIComponent(String(days))}`,
    {
      method: "GET",
      signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new AdminApiError(
      typeof data.message === "string" ? data.message : "Unable to load platform metrics.",
      response.status,
    );
  }
  return data as AdminDashboardSummary;
}

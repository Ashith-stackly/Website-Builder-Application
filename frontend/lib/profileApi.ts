import { getAuthToken } from "@/lib/authToken";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

export type UserProfile = {
  _id?: string;
  name: string;
  email: string;
  mobile?: string;
  address?: string;
  plan?: string;
  subscriptionStatus?: string;
  avatar?: string;
};

export type UpdateProfilePayload = {
  name?: string;
  email?: string;
  mobile?: string;
  address?: string;
  avatar?: string;
};

export const PROFILE_UPDATED_EVENT = "stackly-profile-updated";

export function normalizePlanKey(plan?: string): string {
  const normalized = String(plan || "free").toLowerCase().trim();
  if (normalized.includes("advanced")) return "advanced";
  if (normalized.includes("business")) return "business";
  if (normalized.includes("basic")) return "basic";
  if (normalized.includes("premium")) return "premium";
  if (normalized.includes("free")) return "free";
  return "free";
}

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  basic: "Basic",
  business: "Business",
  advanced: "Advanced",
  premium: "Premium",
};

export function formatPlanLabel(plan?: string): string {
  return PLAN_LABELS[normalizePlanKey(plan)] || "Free";
}

/** Prefer a specific purchased plan when the profile still has a generic tier. */
export function resolveActivePlan(userPlan?: string, recentPurchasePlan?: string): string {
  const userKey = normalizePlanKey(userPlan);
  const purchaseKey = normalizePlanKey(recentPurchasePlan);
  if (userKey === "premium" && purchaseKey !== "free" && purchaseKey !== "premium") {
    return purchaseKey;
  }
  return userKey;
}

export function notifyProfileUpdated(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT, { detail: profile }));
}

/**
 * GET /api/auth/profile
 * Fetches current authenticated user profile from backend MongoDB.
 */
export async function fetchProfile(signal?: AbortSignal): Promise<UserProfile> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("401: Unauthorized - No authentication token found");
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      signal,
    });
    // Fallback to /user/profile if /auth/profile returns 404
    if (res.status === 404) {
      res = await fetch(`${API_BASE_URL}/user/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        signal,
      });
    }
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new Error("Unable to connect to the server. Please check your network connection.");
  }

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    throw new Error("401: Unauthorized - Session expired. Please log in again.");
  }

  if (!res.ok) {
    const msg = data.message || (Array.isArray(data.errors) ? data.errors.join(", ") : null) || "Failed to fetch profile";
    throw new Error(msg);
  }

  const user: UserProfile = data.user || data;
  return {
    _id: user._id,
    name: user.name || "",
    email: user.email || "",
    mobile: user.mobile || "",
    address: user.address || "",
    plan: user.plan || "free",
    subscriptionStatus: user.subscriptionStatus || "none",
    avatar: user.avatar || "/profile.webp",
  };
}

/**
 * PUT /api/auth/profile
 * Updates user profile in backend MongoDB.
 */
export async function updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("401: Unauthorized - No authentication token found");
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    // Fallback to /user/profile if /auth/profile returns 404
    if (res.status === 404) {
      res = await fetch(`${API_BASE_URL}/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    }
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new Error("Unable to connect to the server. Please check your network connection.");
  }

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    throw new Error("401: Unauthorized - Session expired. Please log in again.");
  }

  if (!res.ok) {
    const msg = data.message || (Array.isArray(data.errors) ? data.errors.join(", ") : null) || "Failed to update profile";
    throw new Error(msg);
  }

  const updatedUser: UserProfile = data.user || data;
  const normalized: UserProfile = {
    _id: updatedUser._id,
    name: updatedUser.name || payload.name || "",
    email: updatedUser.email || payload.email || "",
    mobile: updatedUser.mobile || payload.mobile || "",
    address: updatedUser.address || payload.address || "",
    plan: updatedUser.plan || "free",
    subscriptionStatus: updatedUser.subscriptionStatus || "none",
    avatar: updatedUser.avatar || payload.avatar || "/profile.webp",
  };

  notifyProfileUpdated(normalized);
  return normalized;
}

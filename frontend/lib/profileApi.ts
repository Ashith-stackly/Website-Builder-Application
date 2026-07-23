const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

export type UserProfile = {
  _id?: string;
  name: string;
  email: string;
  mobile?: string;
  plan?: string;
  subscriptionStatus?: string;
  avatar?: string;
};

export type UpdateProfilePayload = {
  name?: string;
  email?: string;
  mobile?: string;
  avatar?: string;
};

export const PROFILE_UPDATED_EVENT = "stackly-profile-updated";

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("stackly-auth-token");
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
    plan: updatedUser.plan || "free",
    subscriptionStatus: updatedUser.subscriptionStatus || "none",
    avatar: updatedUser.avatar || payload.avatar || "/profile.webp",
  };

  notifyProfileUpdated(normalized);
  return normalized;
}

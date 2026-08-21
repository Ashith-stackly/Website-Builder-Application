import { getUserProfile, isApiConnectionError, type UserProfile } from "@/lib/api";
import { clearAuthToken, getAuthToken } from "@/lib/authToken";
import { DEMO_AUTH_TOKEN } from "@/lib/demoAuth";
import {
  defaultUserSettings,
  saveUserSettings,
  USER_SETTINGS_EVENT,
} from "@/lib/userSettings";

export type AuthBootstrapResult = "restored" | "missing" | "invalid" | "offline";

export function isProtectedAuthPath(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const protectedPrefixes = ["/dashboard", "/blog/manage", "/builder"];
  return protectedPrefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

/** Check if the path belongs to the admin portal (excluding /admin/login). */
export function isAdminPath(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (path === "/admin/login") return false; // login page is public
  return path === "/admin" || path.startsWith("/admin/");
}

function persistUserFromProfile(user: UserProfile): void {
  saveUserSettings({
    name: user.name?.trim() || defaultUserSettings.name,
    email: user.email?.trim() || defaultUserSettings.email,
    avatar:
      typeof user.avatar === "string" && user.avatar.trim()
        ? user.avatar
        : defaultUserSettings.avatar,
  });
  window.dispatchEvent(new Event(USER_SETTINGS_EVENT));
}

/** Validate stored JWT via GET /user/profile and hydrate UI user settings. */
export async function restoreAuthSession(): Promise<AuthBootstrapResult> {
  const token = getAuthToken();
  if (!token) {
    return "missing";
  }

  if (token === DEMO_AUTH_TOKEN) {
    return "restored";
  }

  try {
    const { user } = await getUserProfile(token);
    persistUserFromProfile(user);
    return "restored";
  } catch (error) {
    if (isApiConnectionError(error)) {
      return "offline";
    }
    clearAuthToken();
    return "invalid";
  }
}

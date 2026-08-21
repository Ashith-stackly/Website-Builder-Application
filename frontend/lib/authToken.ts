/** JWT storage key shared across session (tab) and persistent (Remember Me) stores. */
export const AUTH_TOKEN_STORAGE_KEY = "stackly-auth-token";

/** Read token from session first, then persistent storage, with legacy fallbacks. */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ??
    window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ??
    window.localStorage.getItem("token") ??
    window.localStorage.getItem("stackly_token") ??
    window.localStorage.getItem("authToken")
  );
}

/**
 * Persist login token to both localStorage and sessionStorage so
 * the authenticated session survives new tabs, page refreshes, and redirects.
 */
export function setAuthToken(token: string, _remember?: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  } catch {
    // Ignore storage quota errors
  }
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("stackly_token");
    window.localStorage.removeItem("authToken");
  } catch {
    // Ignore storage errors
  }
}

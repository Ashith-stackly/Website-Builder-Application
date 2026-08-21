/**
 * Admin-specific JWT storage — completely isolated from normal-user tokens.
 *
 * Normal users use `stackly-auth-token` via authToken.ts.
 * Admin tokens use `stackly-admin-token` via this module.
 */

export const ADMIN_TOKEN_STORAGE_KEY = "stackly-admin-token";

/** Read admin token from sessionStorage first, then localStorage. */
export function getAdminAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) ??
    window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)
  );
}

/**
 * Persist admin login token.
 * Always stored in sessionStorage (cleared when tab/session ends) for security.
 * Pass remember=true to persist across browser restarts.
 */
export function setAdminAuthToken(token: string, remember = false): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
  if (remember) {
    window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
  } else {
    window.sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
  }
}

/** Clear admin token from both stores. */
export function clearAdminAuthToken(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
}

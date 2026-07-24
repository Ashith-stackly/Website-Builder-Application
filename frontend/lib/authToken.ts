/** JWT storage key shared across session (tab) and persistent (Remember Me) stores. */
export const AUTH_TOKEN_STORAGE_KEY = "stackly-auth-token";

/** Read token from session first, then persistent storage. */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ??
    window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
  );
}

/**
 * Persist login token.
 * Remember Me → localStorage (survives browser restart).
 * Otherwise → sessionStorage (cleared when the tab/session ends).
 */
export function setAuthToken(token: string, remember: boolean): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  if (remember) {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  } else {
    window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  }
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

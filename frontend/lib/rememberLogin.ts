const REMEMBERED_LOGIN_KEY = "stackly-remembered-login";

/** Keys that must survive logout (login form recall when Remember Me was used). */
export const LOGOUT_PRESERVED_STORAGE_KEYS = new Set([REMEMBERED_LOGIN_KEY]);

export type RememberedLogin = {
  email: string;
  password: string;
};

export function saveRememberedLogin(contact: string, password: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    REMEMBERED_LOGIN_KEY,
    JSON.stringify({
      email: contact.trim(),
      password,
    }),
  );
}

export function clearRememberedLogin(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(REMEMBERED_LOGIN_KEY);
}

export function readRememberedLogin(): RememberedLogin | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(REMEMBERED_LOGIN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RememberedLogin>;
    if (typeof parsed.email !== "string" || !parsed.email.trim()) {
      return null;
    }
    return {
      email: parsed.email.trim(),
      password: typeof parsed.password === "string" ? parsed.password : "",
    };
  } catch {
    return null;
  }
}

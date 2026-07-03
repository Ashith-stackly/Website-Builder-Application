/**
 * Demo (frontend-only) login credentials.
 *
 * There is no backend connected yet, so this lets a tester sign in with a fixed
 * account and get a default active subscription. That way the "Edit" buttons on
 * the landing/template pages route straight into the builder instead of the
 * planning/upgrade page.
 *
 * The subscription flag is stored in sessionStorage (per-tab), so it only works
 * in the tab where the login happened. Opening the same page in a NEW tab starts
 * fresh with no subscription, so "Edit" will not work there.
 *
 * REMOVE or replace this once the real auth + subscription backend is wired up.
 */

export const DEMO_LOGIN_EMAIL = "sukesh@gmail.com";
export const DEMO_LOGIN_PASSWORD = "Frontend123@";

const DEMO_AUTH_TOKEN = "demo-frontend-token";
const DEMO_SESSION_KEY = "stackly-demo-session";
const DEMO_SUBSCRIPTION_KEY = "stackly-demo-subscription";

function normalize(email: string): string {
  return email.replace(/\s/g, "").trim().toLowerCase();
}

/** True when the entered email/password match the demo tester account. */
export function isDemoLoginCredentials(email: string, password: string): boolean {
  return (
    normalize(email) === DEMO_LOGIN_EMAIL &&
    password.trim() === DEMO_LOGIN_PASSWORD
  );
}

/**
 * Marks the demo tester as logged in with an active subscription.
 *
 * The subscription flag lives in sessionStorage so it is scoped to the current
 * tab only. A new tab will not inherit it, so "Edit" won't work there.
 */
export function activateDemoSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("stackly-auth-token", DEMO_AUTH_TOKEN);
  window.sessionStorage.setItem(DEMO_SESSION_KEY, DEMO_LOGIN_EMAIL);
  window.sessionStorage.setItem(DEMO_SUBSCRIPTION_KEY, "active");
}

/**
 * True when the current tab has the demo subscription active.
 * Uses sessionStorage, so this is false in a freshly opened tab.
 */
export function hasDemoSubscription(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(DEMO_SUBSCRIPTION_KEY) === "active";
}

/** Clears the demo session + subscription flags for the current tab. */
export function clearDemoSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(DEMO_SESSION_KEY);
  window.sessionStorage.removeItem(DEMO_SUBSCRIPTION_KEY);
}

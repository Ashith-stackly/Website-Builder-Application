/**
 * Google OAuth (frontend).
 *
 * Flow:
 * 1. User clicks the button → browser opens Google consent.
 * 2. Google redirects to backend `GET /api/auth/google?code=...&state=login|signup`.
 * 3. Backend exchanges the code, creates/finds the user, issues a session/JWT.
 * 4. Backend redirects to the app (e.g. `/landing?token=...`); store token like email login.
 *
 * Configure: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_API_BASE_URL`
 * (redirect URI = `{API_BASE_URL}/auth/google`, must match Google Cloud console).
 */

export type GoogleAuthIntent = "login" | "signup";

const DEFAULT_GOOGLE_CLIENT_ID =
  "703831654489-m34p97it8cppn924006cgt8u6jgk9tsa.apps.googleusercontent.com";

function getGoogleRedirectUri(): string {
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
  return `${apiBase.replace(/\/$/, "")}/auth/google`;
}

/** Full Google OAuth authorize URL for login or signup. */
export function buildGoogleOAuthUrl(intent: GoogleAuthIntent): string {
  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state: intent,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
 
type ApiErrorBody = {
  message?: string;
  errors?: string[];
  attemptsLeft?: number;
  redirectToForgot?: boolean;
  redirectDelay?: number;
};

 
export type LoginBody = {
  email?: string;
  mobile?: string;
  password: string;
};
 
export type RegisterBody = {
  name: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
};
 
export type ForgotPasswordBody = {
  input: string;
  isChange?: boolean;
  primaryUser?: string;
};
export type CheckOtpPreviewBody = {
  input: string;
  otp: string;
};

export type VerifyEmailOtpBody = {
  email: string;
  otp?: string;
  action?: "resend";
};
 
export type VerifyMobileOtpBody = {
  mobile: string;
  otp?: string;
  action?: "resend";
};
 
export type ResetPasswordBody = {
  newPassword: string;
  confirmPassword: string;
  token: string;
};

export type UserProfile = {
  _id?: string;
  name: string;
  email: string;
  mobile?: string;
  address?: string;
  avatar?: string;
  userType?: string;
};

async function apiRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
 
  const data = (await response.json().catch(() => ({}))) as ApiErrorBody;
 
if (!response.ok) {
  const message =
    data.message || data.errors?.join(", ") || "Request failed";

  const err = new Error(message) as Error & {
    attemptsLeft?: number;
    redirectToForgot?: boolean;
    redirectDelay?: number;
  };

  if (typeof data.attemptsLeft === "number") {
    err.attemptsLeft = data.attemptsLeft;
  }

  if (typeof data.redirectToForgot === "boolean") {
    err.redirectToForgot = data.redirectToForgot;
  }

  if (typeof data.redirectDelay === "number") {
    err.redirectDelay = data.redirectDelay;
  }

  throw err;
}

 
  return data as T;
}
 
export function isApiConnectionError(error: unknown) {
  return (
    error instanceof TypeError ||
    (error instanceof Error &&
      (error.message === "Failed to fetch" ||
        error.message.includes("NetworkError") ||
        error.message.includes("load failed")))
  );
}
 
/** POST /api/auth/register */
export async function register(body: RegisterBody): Promise<unknown> {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
 
/** POST /api/auth/login */
export async function login(body: LoginBody): Promise<{ token?: string; message?: string; userType?: string }> {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** GET /api/user/profile */
export async function getUserProfile(token: string): Promise<{ user: UserProfile }> {
  return apiRequest("/user/profile", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/** POST /api/auth/forgot-password */
export async function forgotPassword(body: ForgotPasswordBody): Promise<{ message?: string; otp?: string; moveToVerify?: boolean }> {
  return apiRequest("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
/** POST /api/auth/check Otp Preview */
export async function checkOtpPreview(
  body: CheckOtpPreviewBody
): Promise<{ valid: boolean }> {
  return apiRequest("/auth/check-otp-preview", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** POST /api/auth/verify-email */
export async function verifyEmailOtp(body: VerifyEmailOtpBody): Promise<{ token?: string; message?: string; otp?: string }> {
  return apiRequest("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
 
/** POST /api/auth/verify-mobile */
export async function verifyMobileOtp(body: VerifyMobileOtpBody): Promise<{ token?: string; message?: string; otp?: string }> {
  return apiRequest("/auth/verify-mobile", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
 
/** POST /api/auth/reset-password */
export async function resetPassword(body: ResetPasswordBody): Promise<{ message?: string }> {
  const { token, ...payload } = body;
 
  return apiRequest("/auth/reset-password", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}
 
// ── Contact API Types ──────────────────────────────────────────────────
 
/** Payload sent to POST /api/contact */
export type ContactPayload = {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
};
 
/** Response returned from POST /api/contact */
export type ContactResponse = {
  success: boolean;
  message: string;
  contact?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    message: string;
    createdAt: string;
    updatedAt: string;
  };
};
 
// ── Contact API Endpoint ───────────────────────────────────────────────
 
/** POST /api/contact — Submit a contact form enquiry */
export async function submitContact(
  body: ContactPayload
): Promise<ContactResponse> {
  return apiRequest<ContactResponse>("/contact", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
 
// ── Template Rating API Types ──────────────────────────────────────────
 
/** Payload sent to POST /api/templates/rating */
export type RateTemplatePayload = {
  templateId: string;
  rating: number;
};
 
/** Response returned from POST /api/templates/rating */
export type RateTemplateResponse = {
  success: boolean;
  message: string;
  rating?: {
    templateId: string;
    rating: number;
    updatedAt: string;
  };
};
 
// ── Template Rating API Endpoint ───────────────────────────────────────
 
/** POST /api/templates/rating — Submit a product rating to the backend */
export async function rateTemplate(
  body: RateTemplatePayload
): Promise<RateTemplateResponse> {
  return apiRequest<RateTemplateResponse>("/templates/rating", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
 
 
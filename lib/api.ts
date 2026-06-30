const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

type ApiErrorBody = {
  message?: string;
  errors?: string[];
  attemptsLeft?: number;
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
    const err = new Error(message);
    // OTP verify endpoints may include `attemptsLeft` in error responses.
    if (typeof data.attemptsLeft === "number") {
      (err as unknown as { attemptsLeft: number }).attemptsLeft = data.attemptsLeft;
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

/** POST /api/auth/forgot-password */
export async function forgotPassword(body: ForgotPasswordBody): Promise<{ message?: string; otp?: string; moveToVerify?: boolean }> {
  return apiRequest("/auth/forgot-password", {
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

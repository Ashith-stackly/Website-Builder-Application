import { getAuthToken } from "@/lib/authToken";

const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api").replace(/\/$/, "");

/**
 * Shape of the subscription document returned by the backend.
 * Matches the Mongoose Subscription model fields.
 */
export type BackendSubscription = {
  _id: string;
  plan: string;
  paymentProvider: string;
  paymentStatus: string;
  subscriptionId: string;
  orderId: string;
  amount: number;
  currency: string;
  startDate: string;
  expiryDate: string;
  createdAt: string;
};

/**
 * Response from `GET /api/payment/subscription`.
 *
 * - `subscription` — the latest Subscription document (or `null`).
 * - `plan` — the user's current plan from the User model (`"free"`, `"basic"`, `"business"`, `"advanced"`).
 * - `subscriptionStatus` — `"active"` | `"none"` from the User model.
 */
export type MySubscriptionResponse = {
  subscription: BackendSubscription | null;
  plan: string;
  subscriptionStatus: string;
};

/**
 * Fetch the authenticated user's current subscription from the backend.
 *
 * Uses `GET /api/payment/subscription` with JWT auth.
 * Returns `null` on any error (401, 404, 500, network) so the Planning page
 * degrades gracefully without crashing.
 */
export async function fetchMySubscription(): Promise<MySubscriptionResponse | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/payment/subscription`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return null;

    const data: MySubscriptionResponse = await res.json();
    return data;
  } catch {
    return null;
  }
}

/**
 * Normalize a plan name for safe comparison between frontend display names
 * (e.g. `"Business Plan"`, `"Basic"`, `"Advanced"`) and backend plan values
 * (e.g. `"business"`, `"basic"`, `"advanced"`).
 */
export function normalizePlanForComparison(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+plan$/i, "")
    .trim();
}

/**
 * Derive a user-friendly billing cycle label from subscription dates.
 *
 * If the gap between start and expiry is > 180 days, treat it as Annual;
 * otherwise Monthly.
 */
export function deriveBillingCycle(
  startDate: string | undefined,
  expiryDate: string | undefined,
): string {
  if (!startDate || !expiryDate) return "Monthly";
  const start = new Date(startDate);
  const expiry = new Date(expiryDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(expiry.getTime())) return "Monthly";
  const diffDays = (expiry.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > 180 ? "Annual" : "Monthly";
}

/**
 * Format an ISO date string into a user-friendly display date.
 * Example: `"2026-09-20T14:29:14.027Z"` → `"20 September 2026"`.
 */
export function formatSubscriptionDate(isoDate: string | undefined): string {
  if (!isoDate) return "—";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

import { getAuthToken } from "@/lib/authToken";
import type { BillingHistoryEntryLike } from "@/lib/planningInvoiceHtml";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

/**
 * GET /api/razorpay/invoices
 * Fetches all invoices for the authenticated user from the backend database.
 */
export async function fetchInvoices(signal?: AbortSignal): Promise<BillingHistoryEntryLike[]> {
  const token = getAuthToken();
  if (!token) return [];

  try {
    const res = await fetch(`${API_BASE_URL}/razorpay/invoices`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      signal,
    });

    if (!res.ok) return [];

    const data = await res.json();
    return Array.isArray(data.invoices) ? data.invoices : [];
  } catch {
    return [];
  }
}

/**
 * POST /api/razorpay/invoices
 * Saves a single invoice entry to the backend database.
 * This is a fire-and-forget helper — failures are silently ignored to avoid
 * blocking the UI after a successful payment.
 */
export async function saveInvoiceToBackend(entry: BillingHistoryEntryLike): Promise<void> {
  const token = getAuthToken();
  if (!token) return;

  try {
    await fetch(`${API_BASE_URL}/razorpay/invoices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(entry),
    });
  } catch {
    // Non-critical — invoice was already saved by verifyRazorpay on the backend
    // This is a fallback for edge cases (demo mode, free plans, etc.)
  }
}

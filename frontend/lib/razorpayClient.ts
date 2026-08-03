import { getAuthToken } from "@/lib/authToken";

/** Client-side Razorpay Checkout — communicates with backend Express API. */
 
export type RazorpayPaymentSuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};
 
export type RazorpayOrderResponse = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
};
 
export type RazorpayStatus = {
  ready: boolean;
  error?: string;
};
 
export type RazorpayVerifyResponse = {
  verified: boolean;
  user?: {
    _id?: string;
    name?: string;
    email?: string;
    mobile?: string;
    address?: string;
    plan?: string;
    subscriptionStatus?: string;
  };
  subscription?: {
    plan?: string;
    paymentProvider?: string;
    paymentStatus?: string;
    planName?: string;
    startDate?: string;
    expiryDate?: string;
  };
  paymentDetails?: {
    invoiceId?: string;
    paymentId?: string;
    orderId?: string;
    paymentDate?: string;
    paymentMethodLabel?: string;
    bankName?: string;
    cardNetwork?: string;
    upiApp?: string;
    walletName?: string;
    amount?: number;
    currency?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    customerAddress?: string;
  };
};
 
type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpayPaymentSuccess) => void;
  modal?: { ondismiss?: () => void };
};
 
type RazorpayConstructor = new (options: RazorpayCheckoutOptions) => { open: () => void };
 
declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}
 
const PLACEHOLDER_KEY_RE = /xxxx|your_secret|placeholder|rzp_test_demo/i;

export function getRazorpayConfigError(): string | null {
  // Checkout key can come from the backend create-order response; public env is optional.
  if (isRazorpayDemoMode()) {
    return "Razorpay is in demo mode (NEXT_PUBLIC_RAZORPAY_DEMO=true). Set it to false and redeploy for live checkout.";
  }
  return null;
}

/**
 * Demo checkout is opt-in only.
 * Previously a missing NEXT_PUBLIC_RAZORPAY_KEY_ID forced demo mode, which made
 * production/server builds complete fake payments even when the backend was live.
 */
export function isRazorpayDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_RAZORPAY_DEMO === "true";
}

export function getRazorpaySetupHint(): string | null {
  if (!isRazorpayDemoMode()) return null;
  return "Demo mode: payment completes locally. Set NEXT_PUBLIC_RAZORPAY_DEMO=false and redeploy for Razorpay Checkout.";
}
 
/** Backend API base URL for Razorpay payment routes (/api/razorpay). */
export function getRazorpayApiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return "http://localhost:5000/api";
}
 
function razorpayApiUrl(path: string): string {
  const base = getRazorpayApiBase();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (base.endsWith("/api") && cleanPath.startsWith("/api/")) {
    return `${base}${cleanPath.slice(4)}`;
  }
  return `${base}${cleanPath}`;
}
 
export function parseDisplayPriceToPaise(price: string): number {
  const n = Number.parseFloat(price.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}
 
export function formatInrFromDisplayPrice(price: string): string {
  const paise = parseDisplayPriceToPaise(price);
  if (paise <= 0) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}
 
export function loadRazorpayCheckoutScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Razorpay script failed to load")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay script failed to load"));
    document.body.appendChild(script);
  });
}

async function postRazorpayApi<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getAuthToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  try {
    res = await fetch(razorpayApiUrl(path), {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      `Backend Payment API not reachable (${getRazorpayApiBase()}). Check NEXT_PUBLIC_API_BASE_URL and that the backend is running.`,
    );
  }
  const data = (await res.json()) as T & { error?: string; message?: string };
  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Payment request failed");
  }
  return data;
}
 
export async function createRazorpayOrder(payload: {
  amountPaise: number;
  planName: string;
  billingPeriod: string;
}): Promise<RazorpayOrderResponse> {
  if (isRazorpayDemoMode()) {
    return {
      orderId: `order_demo_${Math.random().toString(36).substring(2, 9)}`,
      amount: payload.amountPaise,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
    };
  }
  return postRazorpayApi<RazorpayOrderResponse>("/razorpay/create-order", payload);
}
 
export async function verifyRazorpayPayment(
  payload: RazorpayPaymentSuccess & {
    amount?: number;
    planName?: string;
    billingPeriod?: string;
  },
): Promise<RazorpayVerifyResponse> {
  if (isRazorpayDemoMode()) {
    return { verified: true };
  }
  return postRazorpayApi<RazorpayVerifyResponse>("/razorpay/verify", payload);
}
 
export function openRazorpayCheckout(options: {
  order: RazorpayOrderResponse;
  planLabel: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  onSuccess: (response: RazorpayPaymentSuccess) => void;
  onDismiss?: () => void;
}): void {
  let completed = false;
  let hasOpened = false;
  let observer: MutationObserver | null = null;
 
  const cleanup = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  };
 
  const handleSuccess = (response: RazorpayPaymentSuccess) => {
    if (completed) return;
    completed = true;
    cleanup();
    options.onSuccess(response);
  };
 
  const handleDismiss = () => {
    if (completed) return;
    completed = true;
    cleanup();
    if (options.onDismiss) options.onDismiss();
  };
 
  if (isRazorpayDemoMode()) {
    // Simulated demo checkout!
    const confirmed = window.confirm(`[Demo Checkout] Proceed with payment for ${options.planLabel}?`);
    if (confirmed) {
      setTimeout(() => {
        handleSuccess({
          razorpay_payment_id: `pay_demo_${Math.random().toString(36).substring(2, 9)}`,
          razorpay_order_id: options.order.orderId,
          razorpay_signature: "signature_demo",
        });
      }, 500);
    } else {
      handleDismiss();
    }
    return;
  }
 
  const Razorpay = window.Razorpay;
  if (!Razorpay) {
    throw new Error("Razorpay checkout is not loaded");
  }

  // Prefer key from backend order; fall back to public env for older API responses.
  const keyId = (options.order.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "").trim();
  if (!keyId || PLACEHOLDER_KEY_RE.test(keyId)) {
    throw new Error(
      "Razorpay key missing from create-order response. Set backend RAZORPAY_KEY_ID (and matching NEXT_PUBLIC_RAZORPAY_KEY_ID), then retry.",
    );
  }
  if (!options.order.orderId || String(options.order.orderId).startsWith("order_demo_")) {
    throw new Error(
      "Invalid Razorpay order from backend (demo/empty order id). Check server Razorpay keys and create-order.",
    );
  }
 
  const rzp = new Razorpay({
    key: keyId,
    amount: options.order.amount,
    currency: options.order.currency,
    name: "Stackly",
    description: options.planLabel,
    order_id: options.order.orderId,
    prefill: {
      name: options.customerName,
      email: options.customerEmail,
      contact: options.customerPhone.replace(/\D/g, "").slice(-10),
    },
    theme: { color: "#002147" },
    handler: handleSuccess,
    modal: { ondismiss: handleDismiss },
  });
 
  // Watch the DOM for .razorpay-container presence/removal as a robust fallback
  if (typeof window !== "undefined" && typeof MutationObserver !== "undefined") {
    observer = new MutationObserver(() => {
      const container = document.querySelector(".razorpay-container");
      if (container) {
        hasOpened = true;
      } else if (hasOpened && !container) {
        handleDismiss();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
 
  rzp.open();
}
 
 
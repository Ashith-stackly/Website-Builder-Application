/** Client-side Razorpay Checkout — WBA uses static export + razorpay-api on :3001 in dev. */

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

const PLACEHOLDER_KEY_RE = /xxxx|your_secret|placeholder/i;

export function getRazorpayConfigError(): string | null {
  const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";
  if (!key.trim()) {
    return "Add NEXT_PUBLIC_RAZORPAY_KEY_ID to .env.local (Razorpay Dashboard → Test keys), then restart npm run dev.";
  }
  if (PLACEHOLDER_KEY_RE.test(key)) {
    return null; // demo mode — see isRazorpayDemoMode()
  }
  return null;
}

/** True when Razorpay keys are missing/placeholder — use demo checkout for local UI testing. */
export function isRazorpayDemoMode(): boolean {
  if (process.env.NEXT_PUBLIC_RAZORPAY_DEMO === "true") return true;
  const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";
  if (!key.trim()) return true;
  return PLACEHOLDER_KEY_RE.test(key);
}

export function getRazorpaySetupHint(): string | null {
  if (!isRazorpayDemoMode()) return null;
  return "Demo mode: payment completes locally without Razorpay keys. Add real Test keys to .env.local for live checkout.";
}

/** Static export: payment API runs on port 3001 (npm run razorpay-api). */
export function getRazorpayApiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_RAZORPAY_API_BASE?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:3001";
  }
  return "";
}

function razorpayApiUrl(path: string): string {
  const base = getRazorpayApiBase();
  return base ? `${base}${path}` : path;
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
  try {
    res = await fetch(razorpayApiUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "Payment API not running. In a second terminal run: npm run razorpay-api (and keep npm run dev running).",
    );
  }
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "Payment request failed");
  }
  return data;
}

export async function createRazorpayOrder(payload: {
  amountPaise: number;
  planName: string;
  billingPeriod: string;
}): Promise<RazorpayOrderResponse> {
  return postRazorpayApi<RazorpayOrderResponse>("/api/razorpay/create-order", payload);
}

export async function verifyRazorpayPayment(payload: RazorpayPaymentSuccess): Promise<boolean> {
  const data = await postRazorpayApi<{ verified?: boolean }>("/api/razorpay/verify", payload);
  return Boolean(data.verified);
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
  const Razorpay = window.Razorpay;
  if (!Razorpay) {
    throw new Error("Razorpay checkout is not loaded");
  }
  const rzp = new Razorpay({
    key: options.order.keyId,
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
    handler: options.onSuccess,
    modal: { ondismiss: options.onDismiss },
  });
  rzp.open();
}

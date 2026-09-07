/**
 * Centralized subscription-based edit access control.
 *
 * Every place in the app that opens a project for editing should use
 * `useSubscriptionAccess()` to determine whether the user's plan allows
 * editing.  The hook fetches the user's subscription via the existing
 * `GET /api/payment/subscription` endpoint and caches the result for
 * the lifetime of the session (cleared on logout).
 *
 * Business rule:
 *   Free     → edit restricted  → redirect to /planning
 *   Basic    → edit restricted  → redirect to /planning
 *   Business → edit allowed     → open editor directly
 *   Advanced → edit allowed     → open editor directly
 *   Premium  → edit allowed     → open editor directly  (Stripe equivalent)
 *   Unknown  → edit restricted  → fail closed
 *   Expired  → edit restricted  → follow existing restriction behavior
 */

import { useEffect, useRef, useState } from "react";
import { fetchMySubscription, type MySubscriptionResponse } from "@/lib/subscriptionApi";
import { normalizePlanKey } from "@/lib/profileApi";

// ── Allowed plans (explicit allowlist — fail closed for unknowns) ─────────

const EDIT_ALLOWED_PLANS: ReadonlySet<string> = new Set([
  "business",
  "advanced",
  "premium",
]);

/**
 * Determine whether a given plan + subscription status permits project editing.
 *
 * Uses an explicit allowlist — unknown or malformed plans are denied.
 * An expired or cancelled subscription is also denied even if the plan
 * name would normally be allowed.
 */
export function canEditWithPlan(
  plan: string | undefined,
  subscriptionStatus: string | undefined,
): boolean {
  const normalizedPlan = normalizePlanKey(plan);

  if (!EDIT_ALLOWED_PLANS.has(normalizedPlan)) {
    return false;
  }

  // Expired or cancelled subscriptions deny edit access even if the plan
  // name is on the allowlist.
  const status = (subscriptionStatus || "").toLowerCase().trim();
  if (status === "cancelled" || status === "expired") {
    return false;
  }

  return true;
}

// ── Module-level subscription cache ──────────────────────────────────────

let cachedSubscription: MySubscriptionResponse | null = null;
let cachePromise: Promise<MySubscriptionResponse | null> | null = null;

/**
 * Clear the module-level subscription cache.
 * Must be called on logout so the next user starts fresh.
 */
export function clearSubscriptionCache(): void {
  cachedSubscription = null;
  cachePromise = null;
}

/**
 * Fetch the subscription, using a shared in-flight promise to avoid
 * duplicate requests when multiple components mount simultaneously.
 */
async function fetchAndCache(): Promise<MySubscriptionResponse | null> {
  if (cachedSubscription) return cachedSubscription;

  if (!cachePromise) {
    cachePromise = fetchMySubscription().then((result) => {
      cachedSubscription = result;
      cachePromise = null;
      return result;
    }).catch(() => {
      cachePromise = null;
      return null;
    });
  }

  return cachePromise;
}

// ── React hook ───────────────────────────────────────────────────────────

export type SubscriptionAccess = {
  /** Normalized plan name (`"free"`, `"basic"`, `"business"`, `"advanced"`, `"premium"`). */
  plan: string;
  /** Subscription status from the User model (`"active"`, `"none"`, `"cancelled"`, `"expired"`). */
  subscriptionStatus: string;
  /** Whether the user's current plan allows project editing. */
  canEdit: boolean;
  /** True while the subscription API call is in flight. */
  isLoading: boolean;
};

/**
 * Hook that provides the current user's edit-access status.
 *
 * - Fetches the subscription once and caches it for the session.
 * - Returns `isLoading = true` until the authoritative response arrives.
 * - `canEdit` is `false` while loading (callers should check `isLoading` to
 *   decide whether to show a spinner vs. redirect).
 * - The cache is cleared automatically on logout via `clearSubscriptionCache()`.
 */
export function useSubscriptionAccess(): SubscriptionAccess {
  const [state, setState] = useState<SubscriptionAccess>(() => {
    // If we already have a cached result (e.g. navigating between pages),
    // use it immediately so there's no flash of "loading".
    if (cachedSubscription) {
      const plan = normalizePlanKey(cachedSubscription.plan);
      const subscriptionStatus = cachedSubscription.subscriptionStatus || "none";
      return {
        plan,
        subscriptionStatus,
        canEdit: canEditWithPlan(plan, subscriptionStatus),
        isLoading: false,
      };
    }

    return {
      plan: "free",
      subscriptionStatus: "none",
      canEdit: false,
      isLoading: true,
    };
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // If already cached, no need to fetch
    if (cachedSubscription) {
      const plan = normalizePlanKey(cachedSubscription.plan);
      const subscriptionStatus = cachedSubscription.subscriptionStatus || "none";
      setState({
        plan,
        subscriptionStatus,
        canEdit: canEditWithPlan(plan, subscriptionStatus),
        isLoading: false,
      });
      return;
    }

    void fetchAndCache().then((result) => {
      if (!mountedRef.current) return;

      if (result) {
        const plan = normalizePlanKey(result.plan);
        const subscriptionStatus = result.subscriptionStatus || "none";
        setState({
          plan,
          subscriptionStatus,
          canEdit: canEditWithPlan(plan, subscriptionStatus),
          isLoading: false,
        });
      } else {
        // API failed — fail closed (no edit access)
        setState({
          plan: "free",
          subscriptionStatus: "none",
          canEdit: false,
          isLoading: false,
        });
      }
    });

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return state;
}

/**
 * Helper to use in onClick handlers: routes to the editor if allowed,
 * or to `/planning` if not.
 */
export function editOrUpgrade(
  canEdit: boolean,
  editorRoute: string,
  routerPush: (url: string) => void,
): void {
  if (canEdit) {
    routerPush(editorRoute);
  } else {
    routerPush("/planning");
  }
}

/**
 * Shared logout utilities.
 *
 * Centralises the store-reset + storage-clearing logic that must run on every
 * logout path (NavBar, Topbar, blog header, etc.) so the application never
 * leaks one user's project state into another user's session.
 */

import { clearAuthToken } from "@/lib/authToken";
import { clearDemoSession } from "@/lib/demoAuth";
import { LOGOUT_PRESERVED_STORAGE_KEYS } from "@/lib/rememberLogin";

// ── Storage keys that should be cleared on logout ────────────────────────

const LOGOUT_STORAGE_KEYS = new Set([
  "cartItems",
  "cartCount",
  "wishlistItems",
  "buyscreenCartItemsV1",
  "buyscreenFavoriteIdsV1",
  "portfolioVideoData",
]);

/** Event dispatched after storage is cleared so other components can re-sync. */
export const STORAGE_SYNC_EVENT = "stackly-storage-change";

function shouldClearOnLogout(key: string): boolean {
  if (LOGOUT_PRESERVED_STORAGE_KEYS.has(key)) {
    return false;
  }
  return key.toLowerCase().startsWith("stackly") || LOGOUT_STORAGE_KEYS.has(key);
}

/** Remove all project/user-scoped keys from a Storage instance. */
export function clearLogoutStorage(storage: Storage): void {
  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index);
    if (key && shouldClearOnLogout(key)) {
      storage.removeItem(key);
    }
  }
}

// ── Full logout sequence ─────────────────────────────────────────────────

/**
 * Performs a complete logout: resets all Zustand stores, clears auth tokens,
 * clears project/user-scoped storage, and dispatches a sync event.
 *
 * Stores are imported dynamically to avoid pulling the full builder runtime
 * into every page that imports this module.
 */
export async function performFullLogout(): Promise<void> {
  // 1. Reset all user-scoped Zustand stores
  const [
    { useProjectStore },
    { useBuilderStore },
    { useDesignStore },
    { useAssetStore },
  ] = await Promise.all([
    import("@/store/projectStore"),
    import("@/store/builderStore"),
    import("@/store/designStore"),
    import("@/store/assetStore"),
  ]);

  useBuilderStore.getState().resetBuilder();
  useProjectStore.getState().resetProjects();
  useDesignStore.getState().resetDesignStore();
  await useAssetStore.getState().resetAssets();

  // 2. Clear auth tokens and demo session
  clearAuthToken();
  clearDemoSession();

  // 3. Clear project/user-scoped localStorage and sessionStorage
  if (typeof window !== "undefined") {
    clearLogoutStorage(window.localStorage);
    clearLogoutStorage(window.sessionStorage);
    window.dispatchEvent(new Event(STORAGE_SYNC_EVENT));
  }
}

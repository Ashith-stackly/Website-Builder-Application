"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getAuthToken } from "@/lib/authToken";

const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api").replace(/\/$/, "");

export const STORAGE_SYNC_EVENT = "stackly-storage-change";

export type TemplateAccessResponse = {
  authenticated: boolean;
  userId?: string;
  plan: string;
  role: string;
  hasAllAccess: boolean;
  purchasedTemplates: string[];
  accessibleTemplates: Record<string, boolean>;
};

const DEFAULT_UNAUTHENTICATED_ACCESS: TemplateAccessResponse = {
  authenticated: false,
  plan: "none",
  role: "guest",
  hasAllAccess: false,
  purchasedTemplates: [],
  accessibleTemplates: {
    portfolio: false,
    ecommerce: false,
    blog: false,
    construction: false,
    restaurant: false,
    "digital-marketing": false,
    business: false,
  },
};

// ── Module-level cache ───────────────────────────────────────────────────

let cachedAccess: TemplateAccessResponse | null = null;
let cachePromise: Promise<TemplateAccessResponse> | null = null;

export function clearTemplateAccessCache(): void {
  cachedAccess = null;
  cachePromise = null;
}

/**
 * Fetch the authenticated user's template access matrix from the backend.
 * Uses GET /api/template/access with JWT auth if available.
 */
export async function fetchTemplateAccess(
  signal?: AbortSignal,
  forceRefresh = false,
): Promise<TemplateAccessResponse> {
  if (!forceRefresh && cachedAccess) {
    return cachedAccess;
  }

  const token = typeof window !== "undefined" ? getAuthToken() : null;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/template/access`, {
      method: "GET",
      headers,
      signal,
    });

    if (!res.ok) {
      return DEFAULT_UNAUTHENTICATED_ACCESS;
    }

    const data = await res.json();
    if (data && data.success) {
      const result: TemplateAccessResponse = {
        authenticated: Boolean(data.authenticated),
        userId: data.userId,
        plan: data.plan || "none",
        role: data.role || "user",
        hasAllAccess: Boolean(data.hasAllAccess),
        purchasedTemplates: Array.isArray(data.purchasedTemplates) ? data.purchasedTemplates : [],
        accessibleTemplates: data.accessibleTemplates || {},
      };
      cachedAccess = result;
      return result;
    }

    return DEFAULT_UNAUTHENTICATED_ACCESS;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    return DEFAULT_UNAUTHENTICATED_ACCESS;
  }
}

/**
 * Check single template access directly from backend.
 */
export async function checkSingleTemplateAccess(
  templateId: string,
  signal?: AbortSignal,
): Promise<boolean> {
  const token = typeof window !== "undefined" ? getAuthToken() : null;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/template/access/${encodeURIComponent(templateId)}`, {
      method: "GET",
      headers,
      signal,
    });

    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data && data.canEdit);
  } catch {
    return false;
  }
}

/**
 * Hook providing reactive access control for Block Pages templates.
 */
export function useTemplateAccess() {
  const [access, setAccess] = useState<TemplateAccessResponse>(
    () => cachedAccess || DEFAULT_UNAUTHENTICATED_ACCESS
  );
  const [isLoading, setIsLoading] = useState<boolean>(!cachedAccess);
  const mountedRef = useRef(true);

  const loadAccess = useCallback(async (force = false) => {
    setIsLoading(true);
    try {
      const data = await fetchTemplateAccess(undefined, force);
      if (mountedRef.current) {
        setAccess(data);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void loadAccess(false);

    const handleStorageSync = () => {
      clearTemplateAccessCache();
      void loadAccess(true);
    };

    window.addEventListener(STORAGE_SYNC_EVENT, handleStorageSync);
    window.addEventListener("storage", handleStorageSync);

    return () => {
      mountedRef.current = false;
      window.removeEventListener(STORAGE_SYNC_EVENT, handleStorageSync);
      window.removeEventListener("storage", handleStorageSync);
    };
  }, [loadAccess]);

  const canEditTemplate = useCallback(
    (templateId: string): boolean => {
      if (!access.authenticated) return false;
      if (access.hasAllAccess) return true;
      const key = templateId.toLowerCase().trim();
      return Boolean(access.accessibleTemplates[key]);
    },
    [access]
  );

  const refresh = useCallback(() => loadAccess(true), [loadAccess]);

  return {
    access,
    isLoading,
    canEditTemplate,
    refresh,
  };
}

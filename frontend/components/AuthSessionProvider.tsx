"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { getAuthToken } from "@/lib/authToken";
import { getAdminAuthToken } from "@/lib/adminAuthToken";
import { isAdminPath, isProtectedAuthPath, restoreAuthSession } from "@/lib/authSession";

function AuthSessionProviderInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [bootstrapped, setBootstrapped] = useState(false);
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void restoreAuthSession().finally(() => {
      if (!cancelled) {
        bootstrappedRef.current = true;
        setBootstrapped(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleAuthCheck = () => {
      // Do not redirect while auth restoration is still in progress.
      // The token may be valid in storage but the async bootstrap hasn't
      // finished confirming it yet — redirecting now would be premature.
      if (!bootstrappedRef.current) return;

      const path = window.location.pathname.replace(/\/+$/, "") || "/";
      if (isAdminPath(path) && !getAdminAuthToken()) {
        window.location.replace("/admin/login");
        return;
      }
      if (!getAuthToken() && isProtectedAuthPath(path)) {
        window.location.replace("/login");
      }
    };

    window.addEventListener("pageshow", handleAuthCheck);
    window.addEventListener("popstate", handleAuthCheck);
    return () => {
      window.removeEventListener("pageshow", handleAuthCheck);
      window.removeEventListener("popstate", handleAuthCheck);
    };
  }, []);

  useEffect(() => {
    if (!bootstrapped) return;

    const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
    const query = searchParams.toString();
    const fullPath = query ? `${path}?${query}` : path;

    // Admin paths use their own token namespace
    if (isAdminPath(path) && !getAdminAuthToken()) {
      router.replace("/admin/login");
      return;
    }

    const token = getAuthToken();
    if (!token && isProtectedAuthPath(path)) {
      router.replace(`/login?redirect=${encodeURIComponent(fullPath)}`);
      return;
    }

    if (token && (path === "/login" || path === "/signup")) {
      const redirectTarget = searchParams.get("redirect");
      router.replace(
        redirectTarget && redirectTarget.startsWith("/") ? redirectTarget : "/landing",
      );
    }
  }, [bootstrapped, pathname, router, searchParams]);

  return <>{children}</>;
}

export default function AuthSessionProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AuthSessionProviderInner>{children}</AuthSessionProviderInner>
    </Suspense>
  );
}

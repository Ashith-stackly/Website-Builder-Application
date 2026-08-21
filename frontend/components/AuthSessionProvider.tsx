"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { getAuthToken } from "@/lib/authToken";
import { getAdminAuthToken } from "@/lib/adminAuthToken";
import { isAdminPath, isProtectedAuthPath, restoreAuthSession } from "@/lib/authSession";

function AuthSessionProviderInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void restoreAuthSession().finally(() => {
      if (!cancelled) setBootstrapped(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handlePageShow = () => {
      const path = window.location.pathname.replace(/\/+$/, "") || "/";
      if (isAdminPath(path) && !getAdminAuthToken()) {
        window.location.replace("/admin/login");
        return;
      }
      if (!getAuthToken() && isProtectedAuthPath(path)) {
        window.location.replace("/login");
      }
    };

    const handlePopState = () => {
      const path = window.location.pathname.replace(/\/+$/, "") || "/";
      if (isAdminPath(path) && !getAdminAuthToken()) {
        window.location.replace("/admin/login");
        return;
      }
      if (!getAuthToken() && isProtectedAuthPath(path)) {
        window.location.replace("/login");
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("popstate", handlePopState);
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

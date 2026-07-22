"use client";
 
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type ComponentType } from "react";
 
const navbarHiddenRoutes = new Set([
  "/",
  "/login",
  "/signup",
  "/backend-error",
  "/create-new-password",
  "/forgot-password",
  "/page-not-found",
  "/verify-email",
  "/verify-mobile",
  "/verified",
]);
 
function NavBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [NavBar, setNavBar] = useState<ComponentType<{ keepVisible?: boolean }> | null>(null);
  const normalizedPathname = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const shouldRenderNav = !(
    navbarHiddenRoutes.has(normalizedPathname) ||
    normalizedPathname.startsWith("/dashboard") ||
    searchParams.get("mode") === "iframe"
  );

  // A top-level dynamic() declaration is still preloaded by Next for every
  // route that uses this shell. Import only after confirming this is a route
  // that actually renders marketing navigation.
  useEffect(() => {
    if (!shouldRenderNav || NavBar) return;
    let active = true;
    void import("@/components/navBar").then(({ default: LoadedNavBar }) => {
      if (active) setNavBar(() => LoadedNavBar);
    });
    return () => {
      active = false;
    };
  }, [NavBar, shouldRenderNav]);

  if (!shouldRenderNav || !NavBar) {
    return null;
  }
 
  return <NavBar keepVisible={normalizedPathname.startsWith("/blockpages")} />;
}
 
export default function NavBarShell() {
  return (
    <Suspense fallback={null}>
      <NavBarInner />
    </Suspense>
  );
}
 
 

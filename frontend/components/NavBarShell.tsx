"use client";
 
import { usePathname, useSearchParams } from "next/navigation";
import NavBar from "@/components/navBar";
import { Suspense } from "react";
 
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
  const normalizedPathname = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
 
  if (
    navbarHiddenRoutes.has(normalizedPathname) ||
    normalizedPathname.startsWith("/dashboard") ||
    searchParams.get("mode") === "iframe"
  ) {
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
 
 
 
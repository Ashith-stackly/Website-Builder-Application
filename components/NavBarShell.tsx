"use client";

import { usePathname } from "next/navigation";
import NavBar from "@/components/navBar";

const navbarHiddenRoutes = new Set([
  "/",
  "/aboutus",
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

export default function NavBarShell() {
  const pathname = usePathname();
  const normalizedPathname = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

  if (navbarHiddenRoutes.has(normalizedPathname)) {
    return null;
  }

  return <NavBar />;
}

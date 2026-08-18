"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const PAGE_TITLE_MAP: Record<string, string> = {
  "/": "Home - Stackly Drag and Drop Website Builder",
  "/login": "Login Page",
  "/signup": "Sign Up Page",
  "/forgot-password": "Forgot Password Page",
  "/verify-email": "Verify Email Page",
  "/verify-mobile": "Verify Mobile Page",
  "/create-new-password": "Create New Password Page",
  "/verified": "Account Verified Page",
  "/dashboard": "Dashboard",
  "/dashboard/analytics": "Dashboard Analytics",
  "/dashboard/orders": "Dashboard Orders",
  "/dashboard/products": "Dashboard Products",
  "/dashboard/projects": "Dashboard Projects",
  "/dashboard/settings": "Dashboard Settings",
  "/templates": "Website Templates",
  "/templates/preview": "Template Preview",
  "/builder": "Website Builder",
  "/aboutus": "About Us",
  "/contact": "Contact Us",
  "/blog": "Blog",
  "/blog/manage": "Manage Blog",
  "/blog/post": "Blog Post",
  "/portfolio": "Portfolio",
  "/digital-marketing": "Digital Marketing",
  "/e-commerce": "E-Commerce",
  "/restaurant": "Restaurant",
  "/construction": "Construction",
  "/coming-soon": "Coming Soon",
  "/backend-error": "Backend Error Page",
};

export default function RouteAnnouncer() {
  const pathname = usePathname();
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (!pathname) return;

    let title = PAGE_TITLE_MAP[pathname];
    if (!title) {
      if (pathname.startsWith("/blog/manage/edit")) {
        title = "Edit Blog Post Page";
      } else if (pathname.startsWith("/blog/")) {
        title = "Blog Article Page";
      } else {
        const segments = pathname.split("/").filter(Boolean);
        const lastSegment = segments[segments.length - 1] || "Page";
        title =
          lastSegment
            .replace(/-/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase()) + " Page";
      }
    }

    if (typeof document !== "undefined") {
      const pageHeading = document.querySelector("h1")?.textContent?.trim();
      const newTitle = pageHeading
        ? `${pageHeading} | Stackly`
        : title.includes("Stackly")
        ? title
        : `${title} | Stackly`;
      document.title = newTitle;
    }

    setAnnouncement(`Navigated to ${title}`);
  }, [pathname]);

  return (
    <div
      role="status"
      aria-live="assertive"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}

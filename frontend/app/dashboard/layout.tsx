import type { Metadata } from "next";
import AppShell from "@/components/app-shell/AppShell";

export const metadata: Metadata = {
  title: "Dashboard | Stackly",
  description: "Manage your Stackly projects, view analytics, and create new websites.",
};

/**
 * Dashboard layout — wraps every authenticated dashboard route in the unified
 * App Shell (animated sidebar + glass topbar + command palette), and hides the
 * marketing NavBar/Footer so the app feels like one product.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="stackly-dashboard-layout">
      <style>{`
        /* Hide global NavBar + Footer on dashboard pages */
        .stackly-dashboard-layout ~ footer,
        .stackly-site-layout > nav,
        .stackly-site-layout > header:not(.stackly-dashboard-layout *) {
          display: none !important;
        }
        body:has(.stackly-dashboard-layout) .stackly-global-nav {
          display: none !important;
        }
      `}</style>
      <AppShell>{children}</AppShell>
    </div>
  );
}

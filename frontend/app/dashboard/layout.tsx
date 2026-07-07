import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Stackly",
  description: "Manage your Stackly projects, view analytics, and create new websites.",
};

/**
 * Dashboard layout — hides the global NavBar and Footer for dashboard pages.
 * The dashboard has its own header (DashboardHeader).
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
        /* Let NavBarShell know we're in dashboard mode */
        body:has(.stackly-dashboard-layout) .stackly-global-nav {
          display: none !important;
        }
      `}</style>
      {children}
    </div>
  );
}

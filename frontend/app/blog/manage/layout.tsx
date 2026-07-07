import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog Management | Stackly",
  description: "Create, edit, and manage your Stackly blog posts.",
};

/**
 * Layout for blog management pages (/blog/manage, /blog/manage/create, etc.).
 * Hides the global navbar to provide a dashboard-style experience,
 * following the same pattern as the dashboard layout.
 */
export default function BlogManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="stackly-blog-manage-layout">
      <style>{`
        /* Hide global NavBar + Footer on blog management pages */
        body:has(.stackly-blog-manage-layout) .stackly-global-nav {
          display: none !important;
        }
        .stackly-blog-manage-layout ~ footer,
        .stackly-site-layout > nav,
        .stackly-site-layout > header:not(.stackly-blog-manage-layout *) {
          display: none !important;
        }
      `}</style>
      {children}
    </div>
  );
}

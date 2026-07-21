import type { ReactNode } from "react";

/** A deliberately separate shell for cross-account administrator operations. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="stackly-admin-layout min-h-screen bg-slate-950 text-slate-100">
      <style>{`
        body:has(.stackly-admin-layout) .stackly-global-nav,
        .stackly-admin-layout ~ footer,
        .stackly-site-layout > header:not(.stackly-admin-layout *) { display: none !important; }
      `}</style>
      {children}
    </div>
  );
}

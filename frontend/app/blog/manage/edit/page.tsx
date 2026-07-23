"use client";

import { Suspense } from "react";
import EditBlogPage from "./[slug]/page";

export default function StaticEditBlogPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
        </main>
      }
    >
      <EditBlogPage />
    </Suspense>
  );
}

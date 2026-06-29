"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BlogViewPage } from "../[slug]/page";

function ClientBlogPost() {
  const searchParams = useSearchParams();
  return <BlogViewPage slugOverride={searchParams.get("slug") || ""} />;
}

export default function ClientBlogPostPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-white">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
        </main>
      }
    >
      <ClientBlogPost />
    </Suspense>
  );
}

"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BlogViewPage } from "../[slug]/page";

function ClientBlogPost() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") || "";
  const workspaceId = searchParams.get("workspaceId") || "";

  return (
    <BlogViewPage
      key={`${workspaceId}-${slug}`}
      slugOverride={slug}
      workspaceIdOverride={workspaceId}
    />
  );
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

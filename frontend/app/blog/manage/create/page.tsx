"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { BlogFormData } from "@/types/blog";
import { createBlog, isBlogConnectionError } from "@/lib/blogApi";
import { notifyBlogChanged } from "@/lib/blogEvents";
import BlogForm from "@/components/blog/BlogForm";

export default function CreateBlogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("workspaceId") || "";
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (data: BlogFormData) => {
      setIsSubmitting(true);

      try {
        if (!workspaceId) throw new Error("Select a project before creating a blog post.");
        await createBlog({ ...data, workspaceId });
        notifyBlogChanged(workspaceId);
        router.push(`/blog/manage?workspaceId=${encodeURIComponent(workspaceId)}&created=1`);
      } catch (err) {
        setIsSubmitting(false);
        if (isBlogConnectionError(err)) {
          throw new Error(
            "Unable to connect to the server. Please check your connection."
          );
        }
        throw err;
      }
    },
    [router, workspaceId]
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <Link
            href={workspaceId ? `/blog/manage?workspaceId=${encodeURIComponent(workspaceId)}` : "/blog/manage"}
            className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors no-underline"
          >
            ← Blog Management
          </Link>
          <span className="text-slate-300">/</span>
          <h1 className="text-xl font-bold text-slate-900 m-0">
            Create Blog Post
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        {!workspaceId ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-red-700 font-semibold text-base">Select a project before creating a blog post.</p>
            <Link href="/blog/manage" className="mt-4 inline-flex rounded-lg bg-slate-600 px-4 py-2 text-sm font-bold text-white no-underline">Back to Blog Management</Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <BlogForm
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              submitLabel="Create Blog Post"
            />
          </div>
        )}
      </div>
    </main>
  );
}

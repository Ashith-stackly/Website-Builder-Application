"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import type { Blog, BlogFormData } from "@/types/blog";
import {
  getBlogBySlug,
  updateBlog,
  isBlogConnectionError,
} from "@/lib/blogApi";
import { notifyBlogChanged } from "@/lib/blogEvents";
import BlogForm from "@/components/blog/BlogForm";

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams<{ slug?: string }>();
  const searchParams = useSearchParams();
  const slug = params?.slug || searchParams.get("slug") || "";
  const workspaceId = searchParams.get("workspaceId") || "";

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!slug || !workspaceId) {
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    getBlogBySlug(workspaceId, slug, controller.signal)
      .then((data) => {
        setBlog(data);
      })
      .catch((err) => {
        if ((err as Error).name === "AbortError") return;
        if (isBlogConnectionError(err)) {
          setFetchError(
            "Unable to connect to the server. Please check your connection."
          );
        } else {
          setFetchError(
            err instanceof Error ? err.message : "Failed to load blog post."
          );
        }
      })
      .finally(() => setLoading(false));

    return () => {
      controller.abort();
    };
  }, [slug, workspaceId]);

  const handleSubmit = useCallback(
    async (data: BlogFormData) => {
      if (!blog) return;
      setIsSubmitting(true);

      try {
        await updateBlog(blog._id, data);
        notifyBlogChanged(workspaceId);
        router.push(`/blog/manage?workspaceId=${encodeURIComponent(workspaceId)}&updated=1`);
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
    [blog, router, workspaceId]
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
          <h1 className="text-xl font-bold text-slate-900 m-0 truncate">
            {loading ? "Edit Blog Post" : blog ? `Edit: ${blog.title}` : "Blog Not Found"}
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        {(!workspaceId || !slug) && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-red-700 font-semibold text-base">
              {!workspaceId ? "Select a project before editing a blog post." : "Select a valid blog post to edit."}
            </p>
            <Link href="/blog/manage" className="mt-4 inline-flex rounded-lg bg-slate-600 px-4 py-2 text-sm font-bold text-white no-underline">Back to Blog Management</Link>
          </div>
        )}
        {/* Loading State */}
        {workspaceId && slug && loading && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 animate-pulse">
            <div className="h-5 w-1/3 bg-slate-200 rounded" />
            <div className="h-10 w-full bg-slate-100 rounded-lg" />
            <div className="h-5 w-1/4 bg-slate-200 rounded" />
            <div className="h-40 w-full bg-slate-100 rounded-lg" />
            <div className="h-5 w-1/3 bg-slate-200 rounded" />
            <div className="h-10 w-full bg-slate-100 rounded-lg" />
          </div>
        )}

        {/* Error State */}
        {workspaceId && slug && !loading && fetchError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-red-700 font-semibold text-base">{fetchError}</p>
            <Link
              href={workspaceId ? `/blog/manage?workspaceId=${encodeURIComponent(workspaceId)}` : "/blog/manage"}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-600 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 transition-colors no-underline cursor-pointer"
            >
              Back to Blog Management
            </Link>
          </div>
        )}

        {/* Form */}
        {workspaceId && slug && !loading && !fetchError && blog && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <BlogForm
              initialData={blog}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              submitLabel="Save Changes"
            />
          </div>
        )}
      </div>
    </main>
  );
}

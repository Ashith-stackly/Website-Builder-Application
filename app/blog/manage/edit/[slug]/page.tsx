"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import type { Blog, CreateBlogBody } from "@/types/blog";
import {
  getBlogBySlug,
  updateBlog,
  isBlogConnectionError,
} from "@/lib/blogApi";
import BlogForm from "@/components/blog/BlogForm";
import BlogToast from "@/components/blog/BlogToast";

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!slug) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setFetchError(null);

    getBlogBySlug(slug, controller.signal)
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
  }, [slug]);

  const handleSubmit = useCallback(
    async (data: CreateBlogBody) => {
      if (!blog) return;
      setIsSubmitting(true);

      try {
        await updateBlog(blog._id, data);
        setToast({
          message: "Blog post updated successfully!",
          type: "success",
        });
        // Redirect after a brief delay so the user sees the toast
        window.setTimeout(() => {
          router.push("/blog/manage");
        }, 1200);
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
    [blog, router]
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <Link
            href="/blog/manage"
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
        {/* Loading State */}
        {loading && (
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
        {!loading && fetchError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-red-700 font-semibold text-base">{fetchError}</p>
            <Link
              href="/blog/manage"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-600 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 transition-colors no-underline cursor-pointer"
            >
              Back to Blog Management
            </Link>
          </div>
        )}

        {/* Form */}
        {!loading && !fetchError && blog && (
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

      {/* Toast */}
      <BlogToast
        message={toast?.message ?? null}
        type={toast?.type}
        onDismiss={() => setToast(null)}
      />
    </main>
  );
}

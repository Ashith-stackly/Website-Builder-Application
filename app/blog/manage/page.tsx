"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BlogListItem } from "@/types/blog";
import { getBlogs, deleteBlog, isBlogConnectionError } from "@/lib/blogApi";
import BlogDeleteDialog from "@/components/blog/BlogDeleteDialog";
import BlogToast from "@/components/blog/BlogToast";

/* ─── Blog Listing / Management Page ──────────────────────────────────── */

export default function BlogManagePage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<BlogListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<BlogListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const fetchBlogs = useCallback(async () => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const data = await getBlogs(controller.signal);
      setBlogs(data);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      if (isBlogConnectionError(err)) {
        setError(
          "Unable to connect to the server. Please check your connection and try again."
        );
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to load blog posts."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchBlogs]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      await deleteBlog(deleteTarget._id);
      setDeleteTarget(null);
      setToast({ message: "Blog post deleted successfully.", type: "success" });
      // Optimistic refresh
      setBlogs((prev) => prev.filter((b) => b._id !== deleteTarget._id));
    } catch (err) {
      setToast({
        message:
          err instanceof Error ? err.message : "Failed to delete blog post.",
        type: "error",
      });
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget]);

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors no-underline"
            >
              ← Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <h1 className="text-xl font-bold text-slate-900 m-0">
              Blog Management
            </h1>
          </div>
          <Link
            href="/blog/manage/create"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 hover:shadow-md transition-all no-underline cursor-pointer"
          >
            <span aria-hidden>+</span>
            New Blog Post
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-5 animate-pulse"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-2/5 bg-slate-200 rounded" />
                    <div className="h-4 w-1/4 bg-slate-100 rounded" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-16 bg-slate-100 rounded" />
                    <div className="h-8 w-16 bg-slate-100 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-red-700 font-semibold text-base">{error}</p>
            <button
              type="button"
              onClick={fetchBlogs}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 transition-colors cursor-pointer border-none"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && blogs.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="text-4xl mb-4">📝</div>
            <h2 className="text-lg font-bold text-slate-800 m-0">
              No blog posts yet
            </h2>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
              Create your first blog post to get started. You can save drafts
              and publish when you&apos;re ready.
            </p>
            <Link
              href="/blog/manage/create"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-all no-underline cursor-pointer"
            >
              Create Your First Blog Post
            </Link>
          </div>
        )}

        {/* Blog List */}
        {!loading && !error && blogs.length > 0 && (
          <div className="space-y-3">
            {blogs.map((blog) => (
              <article
                key={blog._id}
                className="group rounded-xl border border-slate-200 bg-white p-5 hover:border-blue-200 hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 m-0 truncate">
                        {blog.title}
                      </h3>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold shrink-0 ${
                          blog.status === "Published"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {blog.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400 m-0">
                      Created {formatDate(blog.createdAt)}
                      {blog.slug && (
                        <>
                          {" · "}
                          <span className="text-slate-400">/{blog.slug}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {blog.status === "Published" && (
                      <Link
                        href={`/blog/${blog.slug}`}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors no-underline cursor-pointer"
                        target="_blank"
                      >
                        View
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/blog/manage/edit/${blog.slug}`)
                      }
                      className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(blog)}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <BlogDeleteDialog
          blogTitle={deleteTarget.title}
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Toast */}
      <BlogToast
        message={toast?.message ?? null}
        type={toast?.type}
        onDismiss={() => setToast(null)}
      />
    </main>
  );
}

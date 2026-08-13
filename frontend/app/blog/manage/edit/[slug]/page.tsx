"use client";
 
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  Edit3,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react";
import type { Blog, BlogFormData } from "@/types/blog";
import {
  getBlogBySlug,
  updateBlog,
  isBlogConnectionError,
} from "@/lib/blogApi";
import { notifyBlogChanged } from "@/lib/blogEvents";
import { getAuthToken } from "@/lib/authToken";
import { DEMO_AUTH_TOKEN } from "@/lib/demoAuth";
import { useThemeStore } from "@/lib/theme";
import BlogForm from "@/components/blog/BlogForm";
import ThemeToggle from "@/components/blog/ThemeToggle";
 
export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams<{ slug?: string }>();
  const searchParams = useSearchParams();
  const slug = params?.slug || searchParams.get("slug") || "";
  const workspaceId = searchParams.get("workspaceId") || "";
 
  // Theme integration from lib/theme.ts
  const resolved = useThemeStore((s) => s.resolved);
  const hydrate = useThemeStore((s) => s.hydrate);
 
  useEffect(() => {
    hydrate();
  }, [hydrate]);
 
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
 
  const abortRef = useRef<AbortController | null>(null);
 
  useEffect(() => {
    const token = typeof window !== "undefined" ? getAuthToken() : null;
    if (!token || token === DEMO_AUTH_TOKEN) {
      router.push(
        `/login?redirect=${encodeURIComponent(
          `/blog/manage/edit/${slug}${workspaceId ? `?workspaceId=${workspaceId}` : ""}`
        )}`
      );
      return;
    }

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
        router.push(
          `/blog/manage?workspaceId=${encodeURIComponent(
            workspaceId
          )}&updated=1`
        );
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
    <motion.main
      data-theme={resolved}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen transition-colors duration-200 bg-gradient-to-b from-slate-50 via-white to-blue-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden"
    >
      {/* Soft Ambient Background */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-100/40 dark:from-indigo-950/20 via-blue-50/20 dark:via-blue-950/10 to-transparent blur-3xl -z-10" />
 
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap min-w-0">
            <Link
              href={
                workspaceId
                  ? `/blog/manage?workspaceId=${encodeURIComponent(
                      workspaceId
                    )}`
                  : "/blog/manage"
              }
              className="inline-flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors no-underline shrink-0 group"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Blog Management</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-700 shrink-0" />
            <span className="font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
              <Edit3 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{loading ? "Edit Post" : blog ? `Edit: ${blog.title}` : "Blog Post"}</span>
            </span>
          </div>
 
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-start sm:justify-end mt-2 sm:mt-0">
            <ThemeToggle />
          </div>
        </div>
      </header>
 
      {/* Content Container */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-3.5 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/60 mb-3 shadow-2xs">
            <FileText className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Editing Post</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight m-0 truncate">
            {loading ? "Loading Blog Post…" : blog ? blog.title : "Edit Blog Post"}
          </h1>
          {blog?.slug && (
            <p className="mt-1 text-xs font-mono text-slate-400 dark:text-slate-500 m-0">
              Slug: /{blog.slug}
            </p>
          )}
        </motion.div>
 
        {(!workspaceId || !slug) && (
          <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/60 p-8 text-center backdrop-blur-xl">
            <AlertCircle className="h-8 w-8 text-rose-600 dark:text-rose-400 mx-auto mb-3" />
            <p className="text-rose-700 dark:text-rose-300 font-bold text-sm m-0">
              {!workspaceId
                ? "Select a project workspace before editing a blog post."
                : "Select a valid blog post to edit."}
            </p>
            <Link
              href="/blog/manage"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-800 dark:bg-slate-700 px-4 py-2 text-xs font-bold text-white no-underline"
            >
              Back to Blog Management
            </Link>
          </div>
        )}
 
        {/* Loading Skeleton */}
        {workspaceId && slug && loading && (
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-8 space-y-6 shadow-xl animate-pulse">
            <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-11 w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            <div className="h-6 w-1/4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-44 w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
          </div>
        )}
 
        {/* Error State */}
        {workspaceId && slug && !loading && fetchError && (
          <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/60 p-8 text-center shadow-sm">
            <AlertCircle className="h-8 w-8 text-rose-600 dark:text-rose-400 mx-auto mb-3" />
            <p className="text-rose-700 dark:text-rose-300 font-bold text-sm m-0">{fetchError}</p>
            <Link
              href={
                workspaceId
                  ? `/blog/manage?workspaceId=${encodeURIComponent(
                      workspaceId
                    )}`
                  : "/blog/manage"
              }
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-800 dark:bg-slate-700 px-4 py-2 text-xs font-bold text-white no-underline"
            >
              Back to Blog Management
            </Link>
          </div>
        )}
 
        {/* Edit Form */}
        {workspaceId && slug && !loading && !fetchError && blog && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-xl shadow-slate-200/40 dark:shadow-slate-950/40 p-4 sm:p-9"
          >
            <BlogForm
              initialData={blog}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              submitLabel="Save Changes"
            />
          </motion.div>
        )}
      </div>
    </motion.main>
  );
}
 
 
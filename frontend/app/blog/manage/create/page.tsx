"use client";
 
import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Layers,
  ChevronRight,
  FilePlus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { BlogFormData } from "@/types/blog";
import { createBlog, isBlogConnectionError } from "@/lib/blogApi";
import { getProjects, createProject } from "@/lib/projectApi";
import { notifyBlogChanged } from "@/lib/blogEvents";
import { getAuthToken } from "@/lib/authToken";
import { useThemeStore } from "@/lib/theme";
import BlogForm from "@/components/blog/BlogForm";
import ThemeToggle from "@/components/blog/ThemeToggle";
 
export default function CreateBlogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialWorkspaceId = searchParams.get("workspaceId") || "";
 
  // Theme integration from lib/theme.ts
  const resolved = useThemeStore((s) => s.resolved);
  const hydrate = useThemeStore((s) => s.hydrate);
 
  useEffect(() => {
    hydrate();
  }, [hydrate]);
 
  const [workspaceId, setWorkspaceId] = useState(initialWorkspaceId);
  const [loadingProject, setLoadingProject] = useState(!initialWorkspaceId);
  const [isSubmitting, setIsSubmitting] = useState(false);
 
  useEffect(() => {
    const token = typeof window !== "undefined" ? getAuthToken() : null;
    if (!token) {
      router.push(
        `/login?redirect=${encodeURIComponent(
          `/blog/manage/create${workspaceId ? `?workspaceId=${workspaceId}` : ""}`
        )}`
      );
      return;
    }
 
    if (workspaceId) return;
 
    const controller = new AbortController();
    setLoadingProject(true);
 
    getProjects(controller.signal)
      .then(async (projects) => {
        if (projects[0]?._id) {
          setWorkspaceId(projects[0]._id);
          router.replace(
            `/blog/manage/create?workspaceId=${encodeURIComponent(
              projects[0]._id
            )}`
          );
        } else {
          try {
            const newProj = await createProject(
              { projectName: "My Blog Website", category: "blog" },
              controller.signal
            );
            if (newProj._id) {
              setWorkspaceId(newProj._id);
              router.replace(
                `/blog/manage/create?workspaceId=${encodeURIComponent(
                  newProj._id
                )}`
              );
            }
          } catch {
            // Keep loadingProject false so user can retry or navigate
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProject(false));
 
    return () => controller.abort();
  }, [router, workspaceId]);
 
  const handleSubmit = useCallback(
    async (data: BlogFormData) => {
      setIsSubmitting(true);
 
      try {
        const token = typeof window !== "undefined" ? getAuthToken() : null;
        if (!token) {
          router.push(
            `/login?redirect=${encodeURIComponent(
              `/blog/manage/create${workspaceId ? `?workspaceId=${workspaceId}` : ""}`
            )}`
          );
          throw new Error("Please log in to publish a blog post.");
        }
        if (!workspaceId)
          throw new Error("Select a project before creating a blog post.");
        await createBlog({ ...data, workspaceId });
        notifyBlogChanged(workspaceId);
        router.push(
          `/blog/manage?workspaceId=${encodeURIComponent(
            workspaceId
          )}&created=1`
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
    [router, workspaceId]
  );
 
  return (
    <motion.main
      data-theme={resolved}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen transition-colors duration-200 bg-gradient-to-b from-slate-50 via-white to-blue-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden"
    >
      {/* Soft Ambient Background Elements */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-100/40 dark:from-blue-950/20 via-indigo-50/20 dark:via-indigo-950/10 to-transparent blur-3xl -z-10" />
 
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap min-w-0">
            <Link
              href={
                workspaceId
                  ? `/blog/manage?workspaceId=${encodeURIComponent(
                      workspaceId
                    )}`
                  : "/blog/manage"
              }
              className="inline-flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors no-underline group"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Blog Management</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-700" />
            <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <FilePlus className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              Create Blog Post
            </span>
          </div>
 
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-start sm:justify-end mt-2 sm:mt-0">
            <ThemeToggle />
            {workspaceId && (
              <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60">
                <Layers className="h-3 w-3" />
                <span>Workspace Connected</span>
              </div>
            )}
          </div>
        </div>
      </header>
 
      {/* Main Content Area */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Title Hero */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/60 dark:to-indigo-950/60 px-3.5 py-1 text-xs font-bold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 mb-3 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 animate-pulse" />
            <span>Blog Workspace Editor</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight m-0">
            Create a New Blog Post
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xl m-0 leading-relaxed">
            Craft engaging content for your audience. Save as draft or publish immediately to your live site.
          </p>
        </motion.div>
 
        {/* Form Container */}
        {loadingProject ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-12 text-center shadow-sm flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 m-0">Preparing workspace session...</p>
          </div>
        ) : !workspaceId ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/60 p-8 text-center shadow-sm backdrop-blur-xl"
          >
            <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400 mx-auto mb-3" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 m-0">No active website project found</h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 max-w-md mx-auto m-0 leading-relaxed">
              Please return to Blog Management to select or create a project workspace before adding a blog post.
            </p>
            <Link
              href="/blog/manage"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 dark:bg-blue-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 dark:hover:bg-blue-600 transition-all no-underline"
            >
              Open Blog Management
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-xl shadow-slate-200/40 dark:shadow-slate-950/40 p-4 sm:p-9"
          >
            <BlogForm
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              submitLabel="Create Blog Post"
            />
          </motion.div>
        )}
      </div>
    </motion.main>
  );
}
 
 
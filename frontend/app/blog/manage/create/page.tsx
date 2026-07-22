"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { BlogFormData } from "@/types/blog";
import { createBlog, isBlogConnectionError } from "@/lib/blogApi";
import { getProjects, createProject } from "@/lib/projectApi";
import { notifyBlogChanged } from "@/lib/blogEvents";
import BlogForm from "@/components/blog/BlogForm";

export default function CreateBlogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialWorkspaceId = searchParams.get("workspaceId") || "";
  const [workspaceId, setWorkspaceId] = useState(initialWorkspaceId);
  const [loadingProject, setLoadingProject] = useState(!initialWorkspaceId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("stackly-auth-token") : null;
    if (!token) {
      router.push(`/login?redirect=${encodeURIComponent(`/blog/manage/create${workspaceId ? `?workspaceId=${workspaceId}` : ""}`)}`);
      return;
    }

    if (workspaceId) return;

    const controller = new AbortController();
    setLoadingProject(true);

    getProjects(controller.signal)
      .then(async (projects) => {
        if (projects[0]?._id) {
          setWorkspaceId(projects[0]._id);
          router.replace(`/blog/manage/create?workspaceId=${encodeURIComponent(projects[0]._id)}`);
        } else {
          try {
            const newProj = await createProject(
              { projectName: "My Blog Website", category: "blog" },
              controller.signal
            );
            if (newProj._id) {
              setWorkspaceId(newProj._id);
              router.replace(`/blog/manage/create?workspaceId=${encodeURIComponent(newProj._id)}`);
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
        const token = typeof window !== "undefined" ? window.localStorage.getItem("stackly-auth-token") : null;
        if (!token) {
          router.push(`/login?redirect=${encodeURIComponent(`/blog/manage/create${workspaceId ? `?workspaceId=${workspaceId}` : ""}`)}`);
          throw new Error("Please log in to publish a blog post.");
        }
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
        {loadingProject ? (
          <div className="flex justify-center items-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          </div>
        ) : !workspaceId ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-slate-700 font-semibold text-base">No active website project found.</p>
            <p className="text-xs text-slate-500 mt-1">Please open Blog Management or create a project first.</p>
            <Link href="/blog/manage" className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white no-underline">Open Blog Management</Link>
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

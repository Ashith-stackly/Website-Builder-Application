"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CreateBlogBody } from "@/types/blog";
import { createBlog, isBlogConnectionError } from "@/lib/blogApi";
import BlogForm from "@/components/blog/BlogForm";
import BlogToast from "@/components/blog/BlogToast";

export default function CreateBlogPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const handleSubmit = useCallback(
    async (data: CreateBlogBody) => {
      setIsSubmitting(true);

      try {
        await createBlog(data);
        setToast({ message: "Blog post created successfully!", type: "success" });
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
    [router]
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
          <h1 className="text-xl font-bold text-slate-900 m-0">
            Create Blog Post
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <BlogForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitLabel="Create Blog Post"
          />
        </div>
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

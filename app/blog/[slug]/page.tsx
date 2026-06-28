"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Blog } from "@/types/blog";
import { getBlogBySlug, isBlogConnectionError } from "@/lib/blogApi";
import BlogSeoHead from "@/components/blog/BlogSeoHead";
import Footer from "@/components/Footer";

export default function BlogViewPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notPublished, setNotPublished] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!slug) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setNotPublished(false);

    getBlogBySlug(slug, controller.signal)
      .then((data) => {
        if (data.status !== "Published") {
          setNotPublished(true);
          return;
        }
        setBlog(data);
      })
      .catch((err) => {
        if ((err as Error).name === "AbortError") return;
        if (isBlogConnectionError(err)) {
          setError(
            "Unable to connect to the server. Please check your connection and try again."
          );
        } else {
          setError(
            err instanceof Error ? err.message : "Failed to load blog post."
          );
        }
      })
      .finally(() => setLoading(false));

    return () => {
      controller.abort();
    };
  }, [slug]);

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Loading State
  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-3/4 bg-slate-200 rounded" />
            <div className="h-4 w-1/3 bg-slate-100 rounded" />
            <div className="h-56 w-full bg-slate-100 rounded-xl" />
            <div className="space-y-3">
              <div className="h-4 w-full bg-slate-100 rounded" />
              <div className="h-4 w-full bg-slate-100 rounded" />
              <div className="h-4 w-5/6 bg-slate-100 rounded" />
              <div className="h-4 w-full bg-slate-100 rounded" />
              <div className="h-4 w-3/4 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Error State
  if (error) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-slate-900">
            Something went wrong
          </h1>
          <p className="mt-2 text-slate-500 max-w-md mx-auto">{error}</p>
          <Link
            href="/blog"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors no-underline"
          >
            Back to Blog
          </Link>
        </div>
      </main>
    );
  }

  // Not Published / Not Found
  if (notPublished || !blog) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-5xl mb-4">📄</div>
          <h1 className="text-2xl font-bold text-slate-900">
            Blog Post Not Found
          </h1>
          <p className="mt-2 text-slate-500 max-w-md mx-auto">
            This blog post doesn&apos;t exist or hasn&apos;t been published yet.
          </p>
          <Link
            href="/blog"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors no-underline"
          >
            Back to Blog
          </Link>
        </div>
      </main>
    );
  }

  // Published Blog View
  return (
    <>
      <BlogSeoHead
        title={blog.title}
        seoTitle={blog.seoTitle}
        seoDescription={blog.seoDescription}
        seoKeywords={blog.seoKeywords}
        featuredImage={blog.featuredImage}
      />

      <main className="min-h-screen bg-white">
        {/* Blog Header */}
        <header className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-4">
            <Link
              href="/blog"
              className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors no-underline"
            >
              ← Back to Blog
            </Link>
          </div>
        </header>

        {/* Article */}
        <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
            {blog.title}
          </h1>

          {/* Meta */}
          <div className="mt-4 flex items-center gap-3 text-sm text-slate-500">
            <time dateTime={blog.createdAt}>
              {formatDate(blog.createdAt)}
            </time>
            {blog.updatedAt && blog.updatedAt !== blog.createdAt && (
              <>
                <span className="text-slate-300">·</span>
                <span>Updated {formatDate(blog.updatedAt)}</span>
              </>
            )}
          </div>

          {/* Featured Image */}
          {blog.featuredImage && (
            <div className="mt-8 rounded-xl overflow-hidden shadow-md">
              <img
                src={blog.featuredImage}
                alt={blog.title}
                className="block w-full h-auto object-cover max-h-[28rem]"
                loading="eager"
                decoding="async"
              />
            </div>
          )}

          {/* Content */}
          <div className="mt-8 prose prose-slate prose-lg max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
            {blog.content}
          </div>
        </article>

        <Footer />
      </main>
    </>
  );
}

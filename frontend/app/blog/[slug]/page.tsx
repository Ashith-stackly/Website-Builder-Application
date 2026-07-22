"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, RefreshCcw, Share2, Tag } from "lucide-react";
import type { Blog, BlogListItem } from "@/types/blog";
import {
  getPublicBlogPath,
  getPublishedBlog,
  getPublishedBlogs,
  isBlogConnectionError,
} from "@/lib/blogApi";
import { getBlogExcerpt, getPublishDate, getReadingTime } from "@/lib/blogPresentation";
import BlogSeoHead from "@/components/blog/BlogSeoHead";
import Footer from "@/components/Footer";

export function BlogViewPage({
  slugOverride,
  workspaceIdOverride,
}: {
  slugOverride?: string;
  workspaceIdOverride?: string;
} = {}) {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const slug = slugOverride || params.slug;
  const workspaceId = workspaceIdOverride || searchParams.get("workspaceId") || "";

  const [blog, setBlog] = useState<Blog | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const listingHref = workspaceId ? `/blog?workspaceId=${encodeURIComponent(workspaceId)}` : "/blog";
  const canonicalUrl = useMemo(() => {
    if (typeof window === "undefined" || !workspaceId || !slug) return undefined;
    return `${window.location.origin}${getPublicBlogPath(workspaceId, slug)}`;
  }, [slug, workspaceId]);

  const fetchPost = useCallback(async () => {
    if (!slug || !workspaceId) {
      setBlog(null);
      setRelatedPosts([]);
      setError(null);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setBlog(null);
    setRelatedPosts([]);
    setShareMessage(null);

    try {
      const post = await getPublishedBlog(workspaceId, slug, controller.signal);
      setBlog(post);

      const related = await getPublishedBlogs(
        workspaceId,
        { limit: 4, category: post.category },
        controller.signal
      ).catch(() => ({ posts: [], pagination: { page: 1, limit: 4, total: 0, pages: 0 } }));
      setRelatedPosts(related.posts.filter((item) => item.slug !== post.slug).slice(0, 3));
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(
        isBlogConnectionError(err)
          ? "Unable to connect to the blog service. Please try again."
          : err instanceof Error
            ? err.message
            : "Failed to load blog post."
      );
    } finally {
      setLoading(false);
    }
  }, [slug, workspaceId]);

  useEffect(() => {
    void fetchPost();
    return () => abortRef.current?.abort();
  }, [fetchPost]);

  const handleShare = useCallback(async () => {
    const href = canonicalUrl || window.location.href;
    try {
      if (navigator.share && blog) {
        await navigator.share({ title: blog.title, text: getBlogExcerpt(blog, 120), url: href });
        return;
      }
      await navigator.clipboard.writeText(href);
      setShareMessage("Link copied");
      window.setTimeout(() => setShareMessage(null), 1800);
    } catch {
      setShareMessage("Unable to share");
      window.setTimeout(() => setShareMessage(null), 1800);
    }
  }, [blog, canonicalUrl]);

  if (!slug || !workspaceId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-md border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Blog post not found</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">This post link is missing its workspace context.</p>
          <Link href="/blog" className="mt-6 inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white no-underline">
            Back to Blog
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-9 w-4/5 rounded bg-slate-200" />
            <div className="h-4 w-1/3 rounded bg-slate-100" />
            <div className="h-72 w-full rounded-md bg-slate-100" />
            <div className="space-y-3">
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-5/6 rounded bg-slate-100" />
              <div className="h-4 w-3/4 rounded bg-slate-100" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !blog) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-md border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Blog post not found</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {error || "This post does not exist or has not been published yet."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => void fetchPost()}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <RefreshCcw size={15} aria-hidden="true" />
              Retry
            </button>
            <Link href={listingHref} className="inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white no-underline">
              Back to Blog
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <BlogSeoHead
        title={blog.title}
        seoTitle={blog.seoTitle}
        seoDescription={blog.seoDescription || getBlogExcerpt(blog, 155)}
        seoKeywords={blog.seoKeywords}
        featuredImage={blog.featuredImage}
        canonicalUrl={canonicalUrl}
        publishedAt={blog.publishedAt}
        updatedAt={blog.updatedAt}
      />

      <main className="min-h-screen bg-white text-slate-900">
        <header className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <Link
              href={listingHref}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 no-underline transition hover:text-slate-950"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Back to Blog
            </Link>
            <button
              type="button"
              onClick={() => void handleShare()}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <Share2 size={15} aria-hidden="true" />
              {shareMessage || "Share"}
            </button>
          </div>
        </header>

        <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={16} aria-hidden="true" />
              {getPublishDate(blog)}
            </span>
            <span>{getReadingTime(blog.content)}</span>
            {blog.category && (
              <span className="inline-flex items-center gap-1.5">
                <Tag size={16} aria-hidden="true" />
                {blog.category}
              </span>
            )}
          </div>

          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-normal text-slate-950 sm:text-5xl">
            {blog.title}
          </h1>

          {getBlogExcerpt(blog) && (
            <p className="mt-5 text-lg leading-8 text-slate-600">{getBlogExcerpt(blog, 240)}</p>
          )}

          {blog.featuredImage && (
            <img
              src={blog.featuredImage}
              alt={blog.title}
              className="mt-8 block max-h-[30rem] w-full rounded-md object-cover"
              loading="eager"
              decoding="async"
            />
          )}

          <div className="mt-8 whitespace-pre-wrap break-words text-base leading-8 text-slate-700 sm:text-lg">
            {blog.content}
          </div>

          {blog.tags && blog.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2 border-t border-slate-200 pt-6">
              {blog.tags.map((tag) => (
                <span key={tag} className="rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </article>

        {relatedPosts.length > 0 && (
          <section className="border-t border-slate-200 bg-slate-50">
            <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
              <h2 className="text-xl font-bold text-slate-950">More from this blog</h2>
              <div className="mt-5 space-y-3">
                {relatedPosts.map((post) => (
                  <Link
                    key={post._id}
                    href={getPublicBlogPath(workspaceId, post.slug)}
                    className="flex items-center justify-between gap-4 rounded-md border border-slate-200 bg-white p-4 text-slate-900 no-underline transition hover:border-blue-200 hover:text-blue-700"
                  >
                    <span>
                      <span className="block font-semibold">{post.title}</span>
                      <span className="mt-1 block text-sm text-slate-500">{getPublishDate(post)}</span>
                    </span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <Footer />
      </main>
    </>
  );
}

export default BlogViewPage;

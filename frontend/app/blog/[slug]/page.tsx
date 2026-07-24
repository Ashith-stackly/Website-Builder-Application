"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { motion, useScroll, useSpring } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock,
  RefreshCcw,
  Share2,
  Tag,
  Sparkles,
  BookOpen,
  Check,
  FileText,
  Globe,
  User,
} from "lucide-react";
import type { Blog, BlogListItem } from "@/types/blog";
import {
  getPublicBlogPath,
  getPublishedBlog,
  getPublishedBlogs,
  isBlogConnectionError,
} from "@/lib/blogApi";
import { getProjects, type ProjectApiProject } from "@/lib/projectApi";
import { getBlogExcerpt, getPublishDate, getReadingTime } from "@/lib/blogPresentation";
import { useThemeStore } from "@/lib/theme";
import BlogSeoHead from "@/components/blog/BlogSeoHead";
import ThemeToggle from "@/components/blog/ThemeToggle";
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

  // Theme integration from lib/theme.ts
  const resolved = useThemeStore((s) => s.resolved);
  const hydrate = useThemeStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Scroll Progress Bar
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 300,
    damping: 30,
    restDelta: 0.001,
  });

  const [blog, setBlog] = useState<Blog | null>(null);
  const [project, setProject] = useState<ProjectApiProject | null>(null);
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

      // Fetch project info to show project name
      getProjects(controller.signal)
        .then((projectsList) => {
          const match = projectsList.find((p) => p._id === workspaceId);
          if (match) setProject(match);
        })
        .catch(() => {});

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
      <main data-theme={resolved} className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <div className="max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-md">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Blog post not found</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">This post link is missing its workspace context.</p>
          <Link href="/blog" className="mt-6 inline-flex rounded-xl bg-blue-600 dark:bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white no-underline hover:bg-blue-700 transition">
            Back to Blog
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main data-theme={resolved} className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-40 w-full rounded-3xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-64 w-full rounded-3xl bg-slate-100 dark:bg-slate-800/60" />
            <div className="h-96 w-full rounded-3xl bg-slate-100 dark:bg-slate-800/60" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !blog) {
    return (
      <main data-theme={resolved} className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <div className="max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-md">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Blog post not found</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
            {error || "This post does not exist or has not been published yet."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => void fetchPost()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              <RefreshCcw size={15} aria-hidden="true" />
              Retry
            </button>
            <Link href={listingHref} className="inline-flex rounded-xl bg-blue-600 dark:bg-blue-500 px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-blue-700 transition">
              Back to Blog
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div data-theme={resolved} className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 relative overflow-hidden">
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

      {/* Top Animated Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 z-50 origin-left"
        style={{ scaleX }}
      />

      {/* Ambient Radial Background Glows */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[32rem] bg-gradient-to-b from-blue-100/60 dark:from-blue-950/40 via-indigo-50/30 dark:via-indigo-950/20 to-transparent blur-3xl -z-10" />

      <main className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100 pb-16">
        {/* Sticky Glassmorphic Header */}
        <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl shadow-2xs">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
            <Link
              href={listingHref}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 no-underline transition hover:text-blue-600 dark:hover:text-blue-400 group"
            >
              <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Blog</span>
            </Link>
            
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => void handleShare()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs cursor-pointer"
              >
                {shareMessage ? (
                  <>
                    <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400">{shareMessage}</span>
                  </>
                ) : (
                  <>
                    <Share2 size={14} className="text-blue-600 dark:text-blue-400" />
                    <span>Share Post</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </header>

        {/* Main Segregated Article Container */}
        <motion.article
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.08 },
            },
          }}
          className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 space-y-8"
        >
          {/* SECTION 1: Standardized Article Hero Card Header */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 15 },
              show: { opacity: 1, y: 0 },
            }}
            className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10 shadow-xl shadow-blue-500/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 dark:bg-blue-400/5 rounded-full blur-2xl pointer-events-none" />

            {/* Badges & Meta Info */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-4">
              {project && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                  <Globe className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{project.projectName}</span>
                </div>
              )}

              {blog.category && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/70 dark:to-indigo-950/70 px-3.5 py-1 text-xs font-bold text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                  <span>{blog.category}</span>
                </div>
              )}

              <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <CalendarDays size={14} className="text-slate-400 dark:text-slate-500" />
                {getPublishDate(blog)}
              </span>

              <span className="text-slate-300 dark:text-slate-700">·</span>

              <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Clock size={14} className="text-slate-400 dark:text-slate-500" />
                {getReadingTime(blog.content)}
              </span>
            </div>

            {/* Main Title Section */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Blog Post Article
              </span>
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl lg:text-5xl m-0">
                {blog.title}
              </h1>
            </div>

            {/* Subtitle / Excerpt Lead Paragraph */}
            {getBlogExcerpt(blog) && (
              <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300 font-medium border-l-4 border-blue-500 dark:border-blue-400 pl-4 py-1 m-0">
                {getBlogExcerpt(blog, 240)}
              </p>
            )}
          </motion.div>

          {/* SECTION 2: Standardized Featured Image Card (Constrained Width & Height) */}
          {blog.featuredImage && (
            <motion.div
              variants={{
                hidden: { opacity: 0, scale: 0.98, y: 15 },
                show: { opacity: 1, scale: 1, y: 0 },
              }}
              className="overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-slate-900 shadow-xl shadow-blue-500/5 group relative"
            >
              <div className="max-h-[26rem] sm:max-h-[28rem] w-full overflow-hidden flex items-center justify-center bg-slate-950">
                <img
                  src={blog.featuredImage}
                  alt={blog.title}
                  className="w-full max-h-[28rem] object-cover transition-transform duration-500 group-hover:scale-102"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </motion.div>
          )}

          {/* SECTION 3: Standardized Content Body Card */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 15 },
              show: { opacity: 1, y: 0 },
            }}
            className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10 shadow-sm space-y-6"
          >
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <FileText className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 m-0">
                Article Story Content
              </h3>
            </div>

            <div className="whitespace-pre-wrap break-words text-base leading-relaxed sm:leading-loose text-slate-800 dark:text-slate-200 sm:text-lg">
              {blog.content}
            </div>

            {/* Tag Pills Footer */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-slate-100 dark:border-slate-800/80 pt-6">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-2 flex items-center gap-1">
                  <Tag size={13} />
                  Tags:
                </span>
                {blog.tags.map((tag) => (
                  <motion.span
                    key={tag}
                    whileHover={{ y: -2, scale: 1.04 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs hover:border-blue-300 dark:hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    #{tag}
                  </motion.span>
                ))}
              </div>
            )}
          </motion.div>
        </motion.article>

        {/* Related Posts Cards */}
        {relatedPosts.length > 0 && (
          <section className="border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 py-12 sm:py-16 mt-8">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60">
                  <BookOpen size={16} />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight m-0">
                  More From This Blog
                </h2>
              </div>

              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.08 },
                  },
                }}
                className="space-y-3.5"
              >
                {relatedPosts.map((post) => (
                  <motion.div
                    key={post._id}
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      show: { opacity: 1, y: 0 },
                    }}
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      href={getPublicBlogPath(workspaceId, post.slug)}
                      className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-slate-900 dark:text-slate-100 no-underline transition-all hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-md hover:shadow-blue-500/5"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="block font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {post.title}
                        </span>
                        <span className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <Clock size={12} />
                          {getPublishDate(post)}
                        </span>
                      </div>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>
        )}

        <Footer />
      </main>
    </div>
  );
}

export default BlogViewPage;

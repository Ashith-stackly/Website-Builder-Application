"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  RefreshCcw,
  Search,
  Tag,
  Sparkles,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  FolderKanban,
  Globe,
  ChevronDown,
  Check,
  Layers,
} from "lucide-react";
import type { BlogListItem, BlogPagination } from "@/types/blog";
import { getProjects, type ProjectApiProject } from "@/lib/projectApi";
import {
  getPublicBlogPath,
  getPublishedBlogs,
  isBlogConnectionError,
  isAbortError,
} from "@/lib/blogApi";
import { getBlogExcerpt, getPublishDate } from "@/lib/blogPresentation";
import { onBlogChanged } from "@/lib/blogEvents";
import { getAuthToken } from "@/lib/authToken";
import { useThemeStore } from "@/lib/theme";
import ThemeToggle from "@/components/blog/ThemeToggle";

// The footer is below the primary blog content
const Footer = dynamic(() => import("@/components/Footer"), {
  ssr: false,
  loading: () => <div className="h-64 bg-slate-900 dark:bg-slate-950" aria-hidden="true" />,
});

const PAGE_SIZE = 9;

function getPaginationFallback(page: number): BlogPagination {
  return { page, limit: PAGE_SIZE, total: 0, pages: 0 };
}

export default function PublicBlogListing() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("workspaceId") || "";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const initialSearch = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";

  // Theme integration from lib/theme.ts
  const resolved = useThemeStore((s) => s.resolved);
  const hydrate = useThemeStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const [posts, setPosts] = useState<BlogListItem[]>([]);
  const [projects, setProjects] = useState<ProjectApiProject[]>([]);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [pagination, setPagination] = useState<BlogPagination>(getPaginationFallback(page));
  const [searchValue, setSearchValue] = useState(initialSearch);
  const [loading, setLoading] = useState(true);
  const [contextLoading, setContextLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextError, setContextError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getProjects(controller.signal)
      .then((list) => setProjects(list))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const activeProject = useMemo(
    () => projects.find((p) => p._id === workspaceId),
    [projects, workspaceId]
  );

  const categories = useMemo(() => {
    const unique = new Set(posts.map((post) => post.category).filter(Boolean) as string[]);
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [posts]);

  const updateQuery = useCallback(
    (updates: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === "") {
          params.delete(key);
          return;
        }
        params.set(key, String(value));
      });
      router.push(`/blog${params.toString() ? `?${params.toString()}` : ""}`);
    },
    [router, searchParams]
  );

  useEffect(() => {
    setSearchValue(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    if (workspaceId || !getAuthToken()) {
      if (!workspaceId) {
        setLoading(false);
      }
      return;
    }

    const controller = new AbortController();
    setContextLoading(true);
    setContextError(null);

    getProjects(controller.signal)
      .then((projectsList) => {
        if (projectsList[0]?._id) {
          router.replace(`/blog?workspaceId=${encodeURIComponent(projectsList[0]._id)}`);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        if (controller.signal.aborted || isAbortError(err)) return;
        setContextError(err instanceof Error ? err.message : "Unable to load project context.");
        setLoading(false);
      })
      .finally(() => setContextLoading(false));

    return () => controller.abort();
  }, [router, workspaceId]);

  const fetchPosts = useCallback(async () => {
    if (!workspaceId) {
      setPosts([]);
      setPagination(getPaginationFallback(page));
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const result = await getPublishedBlogs(
        workspaceId,
        { page, limit: PAGE_SIZE, search: initialSearch, category },
        controller.signal
      );
      setPosts(result.posts);
      setPagination(result.pagination);
    } catch (err) {
      if (controller.signal.aborted || isAbortError(err)) return;
      setError(
        isBlogConnectionError(err)
          ? "Unable to connect to the blog service. Please try again."
          : err instanceof Error
            ? err.message
            : "Failed to load blog posts."
      );
    } finally {
      setLoading(false);
    }
  }, [category, initialSearch, page, workspaceId]);

  useEffect(() => {
    void fetchPosts();
    return () => abortRef.current?.abort();
  }, [fetchPosts]);

  useEffect(() => {
    return onBlogChanged((changedWorkspaceId) => {
      if (!changedWorkspaceId || changedWorkspaceId === workspaceId) {
        void fetchPosts();
      }
    });
  }, [fetchPosts, workspaceId]);

  const handleSearch = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      updateQuery({ search: searchValue.trim() || undefined, page: 1 });
    },
    [searchValue, updateQuery]
  );

  const totalLabel = pagination.total === 1 ? "1 published post" : `${pagination.total} published posts`;

  return (
    <div data-theme={resolved} suppressHydrationWarning className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-100/60 dark:from-blue-950/40 via-indigo-50/30 dark:via-indigo-950/20 to-transparent blur-3xl -z-10" />

      {/* Sticky Glassmorphic Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl shadow-2xs">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <button
                type="button"
                onClick={() => setProjectDropdownOpen((p) => !p)}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 mb-2 hover:bg-blue-100 dark:hover:bg-blue-900/80 transition-colors cursor-pointer"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>{activeProject ? `Active Website: ${activeProject.projectName}` : "STACKLY BLOG"}</span>
                {projects.length > 0 && <ChevronDown className="h-3 w-3 opacity-60" />}
              </button>

              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl m-0">
                Published Articles
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 m-0">
                Explore latest guides, news, and insights.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Website Project Selector Dropdown */}
              {projects.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setProjectDropdownOpen((p) => !p)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs"
                  >
                    <Globe className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="max-w-[140px] sm:max-w-[200px] truncate">
                      {activeProject ? activeProject.projectName : "Select Project"}
                    </span>
                    <ChevronDown className={`h-3 w-3 text-slate-400 dark:text-slate-500 transition-transform ${projectDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {projectDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setProjectDropdownOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 z-40 w-72 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-xl text-left"
                        >
                          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Switch Website Project
                          </div>
                          <div className="space-y-1 max-h-60 overflow-y-auto">
                            {projects.map((proj) => {
                              const isSelected = proj._id === workspaceId;
                              return (
                                <button
                                  key={proj._id}
                                  type="button"
                                  onClick={() => {
                                    setProjectDropdownOpen(false);
                                    updateQuery({ workspaceId: proj._id, page: 1 });
                                  }}
                                  className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition text-left cursor-pointer ${
                                    isSelected
                                      ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60"
                                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Layers className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                                    <span className="truncate">{proj.projectName}</span>
                                  </div>
                                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <ThemeToggle />

              <Link
                href={workspaceId ? `/blog/manage?workspaceId=${encodeURIComponent(workspaceId)}` : "/blog/manage"}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 no-underline shadow-2xs transition hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              >
                <FolderKanban className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Dashboard</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Search posts</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={17} />
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search published posts by title or keyword..."
                className="h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition duration-200 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 shadow-2xs autofill:shadow-[0_0_0_1000px_white_inset] dark:autofill:shadow-[0_0_0_1000px_#0f172a_inset]"
              />
            </label>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 dark:bg-blue-500 px-6 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 dark:hover:bg-blue-600 cursor-pointer"
            >
              <Search size={15} />
              <span>Search</span>
            </motion.button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!workspaceId && !contextLoading && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-md">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <BookOpen size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Choose a website blog</h2>
            <p className="mx-auto mt-2 max-w-lg text-xs sm:text-sm leading-6 text-slate-600 dark:text-slate-400">
              Public blog pages are workspace-scoped. Open this page from Blog Management or add a workspaceId to the URL.
            </p>
            {contextError && <p className="mt-3 text-xs font-semibold text-rose-600 dark:text-rose-400">{contextError}</p>}
            <Link
              href="/blog/manage"
              className="mt-5 inline-flex rounded-xl bg-blue-600 dark:bg-blue-500 px-5 py-2.5 text-xs font-bold text-white no-underline transition hover:bg-blue-700"
            >
              Open Blog Management
            </Link>
          </div>
        )}

        {workspaceId && (
          <>
            {/* Category Filter Pills & Result Count */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 m-0">
                <SlidersHorizontal size={14} className="text-blue-600 dark:text-blue-400" />
                {loading ? "Loading articles..." : totalLabel}
              </p>

              {categories.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateQuery({ category: undefined, page: 1 })}
                    className={`relative rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                      !category
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 shadow-2xs"
                        : "text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    All
                  </button>
                  {categories.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => updateQuery({ category: item, page: 1 })}
                      className={`relative rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                        category === item
                          ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 shadow-2xs"
                          : "text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Skeleton Loading State */}
            {loading && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-80 animate-pulse rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                    <div className="h-44 rounded-xl bg-slate-200 dark:bg-slate-800" />
                    <div className="mt-4 h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="mt-3 h-4 w-full rounded bg-slate-100 dark:bg-slate-800/60" />
                    <div className="mt-2 h-4 w-5/6 rounded bg-slate-100 dark:bg-slate-800/60" />
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {!loading && error && (
              <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/60 p-8 text-center">
                <p className="text-xs sm:text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>
                <button
                  type="button"
                  onClick={() => void fetchPosts()}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 dark:bg-rose-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-700 cursor-pointer"
                >
                  <RefreshCcw size={14} />
                  Retry
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && posts.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center shadow-2xs">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">No published posts yet</h2>
                <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Drafts stay in Blog Management until they are published.
                </p>
                <Link
                  href={`/blog/manage/create?workspaceId=${encodeURIComponent(workspaceId)}`}
                  className="mt-5 inline-flex rounded-xl bg-blue-600 dark:bg-blue-500 px-5 py-2.5 text-xs font-bold text-white no-underline transition hover:bg-blue-700"
                >
                  Create a post
                </Link>
              </div>
            )}

            {/* Staggered Post Cards Grid */}
            {!loading && !error && posts.length > 0 && (
              <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.08 },
                  },
                }}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {posts.map((post, index) => (
                  <motion.article
                    key={post._id}
                    variants={{
                      hidden: { opacity: 0, y: 16 },
                      show: { opacity: 1, y: 0 },
                    }}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="group flex min-h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-300 dark:hover:border-blue-500/50 transition-all duration-300"
                  >
                    {/* Featured Image */}
                    <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
                      {post.featuredImage ? (
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading={index === 0 ? "eager" : "lazy"}
                          decoding="async"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950 text-xs font-bold text-slate-400 dark:text-slate-600">
                          <Sparkles className="h-6 w-6 opacity-40" />
                        </div>
                      )}

                      {/* Category Overlay Tag */}
                      {post.category && (
                        <div className="absolute top-3 left-3">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-900/80 dark:bg-slate-950/80 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md border border-white/20">
                            <Tag size={11} />
                            {post.category}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <CalendarDays size={13} className="text-slate-400 dark:text-slate-500" />
                        <span>{getPublishDate(post)}</span>
                      </div>

                      <h2 className="mt-2.5 text-base font-extrabold leading-snug text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 m-0">
                        <Link href={getPublicBlogPath(workspaceId, post.slug)} className="text-inherit no-underline">
                          {post.seoTitle || post.title}
                        </Link>
                      </h2>

                      <p className="mt-2 flex-1 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-3">
                        {getBlogExcerpt(post)}
                      </p>

                      {post.tags && post.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                        <Link
                          href={getPublicBlogPath(workspaceId, post.slug)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 no-underline transition"
                        >
                          <span>Read article</span>
                          <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            )}

            {/* Pagination Controls */}
            {!loading && !error && pagination.pages > 1 && (
              <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Blog pagination">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => updateQuery({ page: pagination.page - 1 })}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs transition hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  <ChevronLeft size={15} />
                  Previous
                </button>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => updateQuery({ page: pagination.page + 1 })}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs transition hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  Next
                  <ChevronRight size={15} />
                </button>
              </nav>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

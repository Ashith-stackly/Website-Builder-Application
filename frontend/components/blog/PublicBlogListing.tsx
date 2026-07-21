"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CalendarDays, RefreshCcw, Search, Tag } from "lucide-react";
import type { BlogListItem, BlogPagination } from "@/types/blog";
import { getProjects } from "@/lib/projectApi";
import {
  getPublicBlogPath,
  getPublishedBlogs,
  isBlogConnectionError,
} from "@/lib/blogApi";
import { getBlogExcerpt, getPublishDate } from "@/lib/blogPresentation";
import { onBlogChanged } from "@/lib/blogEvents";
import Footer from "@/components/Footer";

const PAGE_SIZE = 9;

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("stackly-auth-token");
}

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

  const [posts, setPosts] = useState<BlogListItem[]>([]);
  const [pagination, setPagination] = useState<BlogPagination>(getPaginationFallback(page));
  const [searchValue, setSearchValue] = useState(initialSearch);
  const [loading, setLoading] = useState(true);
  const [contextLoading, setContextLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextError, setContextError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

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
      .then((projects) => {
        if (projects[0]?._id) {
          router.replace(`/blog?workspaceId=${encodeURIComponent(projects[0]._id)}`);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        if ((err as Error).name === "AbortError") return;
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
      if ((err as Error).name === "AbortError") return;
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
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Stackly Blog</p>
              <h1 className="mt-1 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
                Published posts
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Browse the articles published for this website.
              </p>
            </div>
            <Link
              href={workspaceId ? `/blog/manage?workspaceId=${encodeURIComponent(workspaceId)}` : "/blog/manage"}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 no-underline shadow-sm transition hover:bg-slate-100"
            >
              Manage posts
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Search posts</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search published posts"
                className="h-10 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Search
            </button>
          </form>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {!workspaceId && !contextLoading && (
          <div className="rounded-md border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Choose a website blog</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
              Public blog pages are workspace-scoped. Open this page from Blog Management or add a workspaceId to the URL.
            </p>
            {contextError && <p className="mt-3 text-sm font-semibold text-red-600">{contextError}</p>}
            <Link
              href="/blog/manage"
              className="mt-5 inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white no-underline transition hover:bg-blue-700"
            >
              Open Blog Management
            </Link>
          </div>
        )}

        {workspaceId && (
          <>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-slate-500">{loading ? "Loading posts..." : totalLabel}</p>
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuery({ category: undefined, page: 1 })}
                    className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                      category
                        ? "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                        : "border-blue-200 bg-blue-50 text-blue-700"
                    }`}
                  >
                    All
                  </button>
                  {categories.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => updateQuery({ category: item, page: 1 })}
                      className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                        category === item
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {loading && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-72 animate-pulse rounded-md border border-slate-200 bg-white p-4">
                    <div className="h-32 rounded-md bg-slate-100" />
                    <div className="mt-4 h-5 w-3/4 rounded bg-slate-200" />
                    <div className="mt-3 h-4 w-full rounded bg-slate-100" />
                    <div className="mt-2 h-4 w-5/6 rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            )}

            {!loading && error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-8 text-center">
                <p className="text-sm font-semibold text-red-700">{error}</p>
                <button
                  type="button"
                  onClick={() => void fetchPosts()}
                  className="mt-4 inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  <RefreshCcw size={15} aria-hidden="true" />
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && posts.length === 0 && (
              <div className="rounded-md border border-dashed border-slate-300 bg-white p-10 text-center">
                <h2 className="text-lg font-bold text-slate-900">No published posts yet</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                  Drafts stay in Blog Management until they are published.
                </p>
                <Link
                  href={`/blog/manage/create?workspaceId=${encodeURIComponent(workspaceId)}`}
                  className="mt-5 inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white no-underline transition hover:bg-blue-700"
                >
                  Create a post
                </Link>
              </div>
            )}

            {!loading && !error && posts.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post, index) => (
                  <article key={post._id} className="flex min-h-full flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                    {post.featuredImage ? (
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="h-44 w-full object-cover"
                        loading={index === 0 ? "eager" : "lazy"}
                        decoding="async"
                      />
                    ) : (
                      <div className="flex h-44 items-center justify-center bg-slate-100 text-sm font-semibold text-slate-400">
                        Stackly
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays size={14} aria-hidden="true" />
                          {getPublishDate(post)}
                        </span>
                        {post.category && (
                          <span className="inline-flex items-center gap-1">
                            <Tag size={14} aria-hidden="true" />
                            {post.category}
                          </span>
                        )}
                      </div>
                      <h2 className="mt-3 text-lg font-bold leading-snug text-slate-950">
                        <Link href={getPublicBlogPath(workspaceId, post.slug)} className="text-inherit no-underline hover:text-blue-700">
                          {post.seoTitle || post.title}
                        </Link>
                      </h2>
                      <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{getBlogExcerpt(post)}</p>
                      {post.tags && post.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <Link
                        href={getPublicBlogPath(workspaceId, post.slug)}
                        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 no-underline hover:text-blue-800"
                      >
                        Read post
                        <ArrowRight size={15} aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {!loading && !error && pagination.pages > 1 && (
              <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Blog pagination">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => updateQuery({ page: pagination.page - 1 })}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm font-medium text-slate-500">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => updateQuery({ page: pagination.page + 1 })}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </section>

      <Footer />
    </main>
  );
}

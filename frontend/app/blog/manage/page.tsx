"use client";
 
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  Search,
  X,
  Eye,
  Edit3,
  Trash2,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  LayoutDashboard,
  Filter,
  RefreshCw,
  AlertCircle,
  FolderPlus,
  ChevronDown,
  Check,
  Globe,
} from "lucide-react";
import type { BlogListItem } from "@/types/blog";
import {
  getBlogs,
  deleteBlog,
  getPublicBlogPath,
  isBlogConnectionError,
  isAbortError,
} from "@/lib/blogApi";
import {
  getProjects,
  createProject,
  type ProjectApiProject,
} from "@/lib/projectApi";
import { getAuthToken } from "@/lib/authToken";
import { DEMO_AUTH_TOKEN } from "@/lib/demoAuth";
import { notifyBlogChanged } from "@/lib/blogEvents";
import { useThemeStore } from "@/lib/theme";
import BlogDeleteDialog from "@/components/blog/BlogDeleteDialog";
import BlogToast from "@/components/blog/BlogToast";
import ThemeToggle from "@/components/blog/ThemeToggle";
 
/* ─── Modern Blog Management Dashboard ──────────────────────────────── */
 
export default function BlogManagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("workspaceId") || "";
 
  // Theme integration from lib/theme.ts
  const resolved = useThemeStore((s) => s.resolved);
  const hydrate = useThemeStore((s) => s.hydrate);
 
  useEffect(() => {
    hydrate();
  }, [hydrate]);
 
  const [blogs, setBlogs] = useState<BlogListItem[]>([]);
  const [projects, setProjects] = useState<ProjectApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectsReady, setProjectsReady] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
 
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
 
  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<BlogListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
 
  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
 
  const abortRef = useRef<AbortController | null>(null);
 
  // Success toast on redirect after create/edit
  useEffect(() => {
    const created = searchParams.get("created");
    const updated = searchParams.get("updated");
    if (!created && !updated) return;
 
    setToast({
      message: created
        ? "Blog post created successfully."
        : "Blog post updated successfully.",
      type: "success",
    });
 
    const params = new URLSearchParams(searchParams.toString());
    params.delete("created");
    params.delete("updated");
    router.replace(
      `/blog/manage${params.toString() ? `?${params.toString()}` : ""}`
    );
  }, [router, searchParams]);
 
  // Authenticate & Load Projects
  useEffect(() => {
    const token = typeof window !== "undefined" ? getAuthToken() : null;
    if (!token || token === DEMO_AUTH_TOKEN) {
      router.push(
        `/login?redirect=${encodeURIComponent(
          `/blog/manage${workspaceId ? `?workspaceId=${workspaceId}` : ""}`
        )}`
      );
      return;
    }
 
    const controller = new AbortController();
    void getProjects(controller.signal)
      .then(async (items) => {
        setProjects(items);
        if (!workspaceId) {
          if (items[0]) {
            router.replace(
              `/blog/manage?workspaceId=${encodeURIComponent(items[0]._id)}`
            );
          } else {
            try {
              const newProj = await createProject(
                { projectName: "My Blog Website", category: "blog" },
                controller.signal
              );
              setProjects([newProj]);
              router.replace(
                `/blog/manage?workspaceId=${encodeURIComponent(newProj._id)}`
              );
            } catch {
              setLoading(false);
            }
          }
        }
        setProjectsReady(true);
      })
      .catch((err) => {
        if (controller.signal.aborted || isAbortError(err)) return;
        setError(err instanceof Error ? err.message : "Unable to load projects.");
        setLoading(false);
      });
    return () => controller.abort();
  }, [router, workspaceId]);
 
  // Fetch blogs for active workspace
  const fetchBlogs = useCallback(async () => {
    if (!workspaceId || !projectsReady) {
      if (!workspaceId) setBlogs([]);
      setLoading(false);
      return;
    }
 
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
 
    setLoading(true);
    setError(null);
 
    try {
      const data = await getBlogs(workspaceId, controller.signal);
      setBlogs(data);
    } catch (err) {
      if (controller.signal.aborted || isAbortError(err)) return;
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
  }, [workspaceId, projectsReady]);
 
  useEffect(() => {
    fetchBlogs();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchBlogs]);
 
  // Delete Handler
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
 
    try {
      await deleteBlog(deleteTarget._id);
      setDeleteTarget(null);
      setToast({ message: "Blog post deleted successfully.", type: "success" });
      notifyBlogChanged(workspaceId);
      // Optimistic update
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
  }, [deleteTarget, workspaceId]);
 
  // Date Formatter
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
 
  // Filtered Blogs computation
  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      const matchesSearch =
        blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (blog.slug && blog.slug.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus =
        statusFilter === "all" || blog.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [blogs, searchQuery, statusFilter]);
 
  // Statistics
  const stats = useMemo(() => {
    const total = blogs.length;
    const published = blogs.filter((b) => b.status === "published").length;
    const drafts = blogs.filter((b) => b.status === "draft").length;
    return { total, published, drafts };
  }, [blogs]);
 
  const activeProject = projects.find((p) => p._id === workspaceId);
 
  return (
    <div
      data-theme={resolved}
      className="min-h-screen transition-colors duration-200 bg-gradient-to-b from-slate-50 via-slate-50/50 to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-16"
    >
      {/* Top Glassmorphic Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Left: Breadcrumbs & Project Selector */}
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors no-underline flex items-center gap-1.5 shrink-0"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-500/30">
                <FileText className="h-4 w-4" />
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 m-0 tracking-tight">
                Blog Management
              </h1>
            </div>
 
            {/* Website Project Selector Dropdown */}
            {projects.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProjectDropdownOpen((p) => !p)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 px-2 sm:px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs max-w-full"
                >
                  <Globe className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0 self-start mt-0.5" />
                  <span className="max-w-[120px] sm:max-w-[200px] text-[10px] sm:text-[11px] whitespace-normal break-words leading-snug text-left">
                    {activeProject ? activeProject.projectName : "Select Project"}
                  </span>
                  <ChevronDown className={`h-3 w-3 text-slate-400 dark:text-slate-500 transition-transform shrink-0 self-start mt-1 ${projectDropdownOpen ? "rotate-180" : ""}`} />
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
                        className="absolute left-0 top-full mt-2 z-40 w-[240px] max-w-[80vw] sm:w-72 sm:max-w-none rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-xl text-left"
                      >
                        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Select Website Project
                        </div>
                        <div className="space-y-1">
                          {projects.map((proj) => {
                            const isSelected = proj._id === workspaceId;
                            return (
                              <button
                                key={proj._id}
                                type="button"
                                onClick={() => {
                                  setProjectDropdownOpen(false);
                                  router.replace(`/blog/manage?workspaceId=${encodeURIComponent(proj._id)}`);
                                }}
                                className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition text-left cursor-pointer ${isSelected
                                  ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60"
                                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                  }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <Layers className="h-3.5 w-3.5 shrink-0 text-blue-500 mt-0.5 self-start" />
                                  <span className="text-[10px] sm:text-[11px] whitespace-normal break-words leading-snug text-left">{proj.projectName}</span>
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
          </div>
 
          {/* Right: Theme Switcher & Primary Action Button */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-start sm:justify-end mt-2 sm:mt-0">
            <ThemeToggle />
 
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={
                  workspaceId
                    ? `/blog/manage/create?workspaceId=${encodeURIComponent(
                      workspaceId
                    )}`
                    : "/blog/manage"
                }
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 dark:bg-blue-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 dark:hover:bg-blue-600 hover:shadow-blue-600/30 transition-all no-underline cursor-pointer whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span>New Blog Post</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </header>
 
      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Workspace Greeting & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => setProjectDropdownOpen((p) => !p)}
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60 mb-2 hover:bg-blue-100 dark:hover:bg-blue-900/80 transition-colors cursor-pointer"
            >
              <Globe className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>{activeProject ? `Active Website: ${activeProject.projectName}` : "Select Website Project"}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight m-0">
              Blog Dashboard
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 m-0">
              Manage, edit, publish, and monitor your blog posts in real-time.
            </p>
          </div>
 
          <button
            type="button"
            onClick={fetchBlogs}
            disabled={loading}
            className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`} />
            <span>Refresh</span>
          </button>
        </div>
 
        {/* Quick Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Total Posts */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 dark:bg-blue-400/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Total Posts</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">{stats.total}</span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">articles created</span>
            </div>
          </motion.div>
 
          {/* Card 2: Published */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-2xl border border-emerald-200/60 dark:border-emerald-900/60 bg-white dark:bg-slate-900 p-5 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 dark:bg-emerald-400/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Published</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">{stats.published}</span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">live on site</span>
            </div>
          </motion.div>
 
          {/* Card 3: Drafts */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="rounded-2xl border border-amber-200/60 dark:border-amber-900/60 bg-white dark:bg-slate-900 p-5 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 dark:bg-amber-400/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Drafts</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/60">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">{stats.drafts}</span>
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">in progress</span>
            </div>
          </motion.div>
        </div>
 
        {/* Toolbar: Search & Filter bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 w-full sm:w-auto">
            {(["all", "published", "draft"] as const).map((filterOption) => (
              <button
                key={filterOption}
                type="button"
                onClick={() => setStatusFilter(filterOption)}
                className={`relative flex-auto sm:flex-none rounded-lg px-3 sm:px-3.5 py-1.5 text-xs font-bold capitalize transition-all cursor-pointer ${statusFilter === filterOption
                  ? "text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
              >
                {statusFilter === filterOption && (
                  <motion.div
                    layoutId="manage-filter-indicator"
                    className="absolute inset-0 rounded-lg bg-white dark:bg-slate-900 shadow-xs border border-slate-200/50 dark:border-slate-700/60"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {filterOption === "all" && <Filter className="h-3 w-3" />}
                  {filterOption === "published" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  )}
                  {filterOption === "draft" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  )}
                  {filterOption}
                  <span className="ml-0.5 rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    {filterOption === "all"
                      ? stats.total
                      : filterOption === "published"
                        ? stats.published
                        : stats.drafts}
                  </span>
                </span>
              </button>
            ))}
          </div>
 
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts by title or slug..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 pl-10 pr-9 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 autofill:shadow-[0_0_0_1000px_white_inset] dark:autofill:shadow-[0_0_0_1000px_#0f172a_inset]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
 
        {/* Loading State Skeleton */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs animate-pulse flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex-1 space-y-2.5">
                  <div className="h-5 w-2/5 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="h-3.5 w-1/4 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="h-8 w-16 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
                  <div className="h-8 w-16 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
                  <div className="h-8 w-16 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        )}
 
        {/* Error State */}
        {!loading && error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/60 p-8 text-center shadow-xs"
          >
            <AlertCircle className="h-8 w-8 text-rose-600 dark:text-rose-400 mx-auto mb-3" />
            <p className="text-rose-700 dark:text-rose-300 font-bold text-base m-0">{error}</p>
            <button
              type="button"
              onClick={fetchBlogs}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 dark:bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 dark:hover:bg-rose-600 transition-colors cursor-pointer border-none"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Try Again</span>
            </button>
          </motion.div>
        )}
 
        {/* Empty State: No Blogs Exist */}
        {!loading && !error && blogs.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-12 text-center shadow-2xs backdrop-blur-xs"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 mb-4 shadow-inner">
              <FolderPlus className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 m-0">No blog posts yet</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto m-0 leading-relaxed">
              Create your first blog post to start building your brand, sharing tutorials, and reaching audience readers.
            </p>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="mt-6 inline-block"
            >
              <Link
                href={
                  workspaceId
                    ? `/blog/manage/create?workspaceId=${encodeURIComponent(
                      workspaceId
                    )}`
                    : "/blog/manage"
                }
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 dark:bg-blue-500 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 dark:hover:bg-blue-600 transition-all no-underline cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Create Your First Blog Post</span>
              </Link>
            </motion.div>
          </motion.div>
        )}
 
        {/* Empty Search/Filter Result State */}
        {!loading && !error && blogs.length > 0 && filteredBlogs.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center shadow-2xs"
          >
            <Search className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 m-0">No matching posts found</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 m-0">
              Try adjusting your search criteria or filter tabs.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/60 cursor-pointer"
            >
              Clear filters
            </button>
          </motion.div>
        )}
 
        {/* Blog Post Cards List */}
        {!loading && !error && filteredBlogs.length > 0 && (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.05 },
              },
            }}
            className="space-y-3.5"
          >
            {filteredBlogs.map((blog) => (
              <motion.article
                key={blog._id}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0 },
                }}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                className="group rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-md hover:shadow-blue-500/5 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left Metadata & Title */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 m-0 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        {blog.title}
                      </h3>
 
                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold shrink-0 ${blog.status === "published"
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/60"
                          : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60"
                          }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${blog.status === "published"
                            ? "bg-emerald-500 animate-pulse"
                            : "bg-amber-500"
                            }`}
                        />
                        <span className="capitalize">{blog.status}</span>
                      </span>
                    </div>
 
                    {/* Metadata line */}
                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <Clock className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                        Created {formatDate(blog.createdAt)}
                      </span>
                      {blog.slug && (
                        <>
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                          <span className="font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-700 truncate max-w-[200px]">
                            /{blog.slug}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
 
                  {/* Right Actions Toolbar */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 w-full sm:w-auto justify-end mt-3 sm:mt-0">
                    {blog.status === "published" && (
                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Link
                          href={getPublicBlogPath(workspaceId, blog.slug)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors no-underline cursor-pointer"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                          <span>View</span>
                          <ArrowUpRight className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                        </Link>
                      </motion.div>
                    )}
 
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={() =>
                        router.push(
                          `/blog/manage/edit?slug=${encodeURIComponent(
                            blog.slug
                          )}&workspaceId=${encodeURIComponent(workspaceId)}`
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/60 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/80 transition-colors cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </motion.button>
 
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={() => setDeleteTarget(blog)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/60 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/80 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </motion.button>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}
      </main>
 
      {/* Delete Confirmation Dialog Modal */}
      {deleteTarget && (
        <BlogDeleteDialog
          blogTitle={deleteTarget.title}
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
 
      {/* Toast Notification */}
      <BlogToast
        message={toast?.message ?? null}
        type={toast?.type}
        onDismiss={() => setToast(null)}
      />
    </div>
  );
}
 
 
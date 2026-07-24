"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  Globe2,
  LoaderCircle,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Users,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import {
  AdminApiError,
  getAdminDashboardSummary,
  type AdminDashboardSummary,
} from "@/lib/adminApi";
import { useThemeStore } from "@/lib/theme";
import ThemeToggle from "@/components/blog/ThemeToggle";

const ranges = [7, 30, 90] as const;

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null): string {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminDashboardPage() {
  const [days, setDays] = useState<(typeof ranges)[number]>(30);
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminApiError | Error | null>(null);

  // Theme integration from lib/theme.ts
  const resolved = useThemeStore((s) => s.resolved);
  const hydrate = useThemeStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      setSummary(await getAdminDashboardSummary(days, signal));
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause : new Error("Unable to load platform metrics."));
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const highestDailyViews = useMemo(
    () => Math.max(...(summary?.analytics.daily.map((point) => point.views) || [1]), 1),
    [summary],
  );

  if (loading && !summary) {
    return (
      <div data-theme={resolved} className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <LoadingScreen />
      </div>
    );
  }

  if (error && !summary) {
    const denied = error instanceof AdminApiError && error.status === 403;
    const unauthenticated = error instanceof AdminApiError && error.status === 401;
    return (
      <div data-theme={resolved} className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <main className="grid min-h-screen place-items-center p-6">
          <motion.section
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-2xl"
          >
            <ShieldCheck className="mx-auto h-12 w-12 text-amber-500 dark:text-amber-400" />
            <h1 className="mt-4 text-2xl font-black text-slate-900 dark:text-slate-100">
              {denied ? "Administrator access required" : "Admin dashboard unavailable"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              {denied
                ? "Your account does not have permission to view platform-wide information."
                : unauthenticated
                  ? "Sign in with an administrator account to access this area."
                  : error.message}
            </p>
            <Link
              href={unauthenticated ? "/login" : "/dashboard"}
              className="mt-6 inline-flex rounded-xl bg-blue-600 dark:bg-blue-500 px-5 py-2.5 text-xs font-bold text-white no-underline transition hover:bg-blue-700 dark:hover:bg-blue-600 shadow-md shadow-blue-500/20"
            >
              {unauthenticated ? "Go to sign in" : "Return to your dashboard"}
            </Link>
          </motion.section>
        </main>
      </div>
    );
  }

  if (!summary) return null;

  const cards = [
    { label: "Registered users", value: formatNumber(summary.users.total), hint: `${formatNumber(summary.users.active)} active in ${summary.range.days} days`, icon: Users, tone: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-900/60" },
    { label: "Published sites", value: formatNumber(summary.workspaces.published), hint: `${formatNumber(summary.workspaces.total)} total workspaces`, icon: Globe2, tone: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60" },
    { label: "Page views", value: formatNumber(summary.analytics.views), hint: `${formatNumber(summary.analytics.visitors)} unique visitors`, icon: Activity, tone: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-900/60" },
    { label: "Paid revenue", value: formatCurrency(summary.commerce.paidRevenue), hint: `${formatNumber(summary.commerce.paidOrders)} paid orders`, icon: CircleDollarSign, tone: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60" },
  ];

  return (
    <div data-theme={resolved} className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 relative overflow-hidden pb-16">
      {/* Ambient Radial Background Glows */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[32rem] bg-gradient-to-b from-blue-100/60 dark:from-blue-950/40 via-indigo-50/30 dark:via-indigo-950/20 to-transparent blur-3xl -z-10" />

      {/* Top Glassmorphic Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
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
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 m-0 tracking-tight">
                Admin Console
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-60 cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-blue-600 dark:text-blue-400 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Banner Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>PLATFORM OPERATIONAL METRICS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight m-0">
              Admin Dashboard
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 m-0">
              Cross-account platform operational metrics and system telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1">Period:</span>
            <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-2xs" aria-label="Select reporting period">
              {ranges.map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setDays(range)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    days === range
                      ? "bg-blue-600 dark:bg-blue-500 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  {range}d
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-amber-300 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/60 px-4 py-3 text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Showing the last loaded metrics. {error.message}</span>
          </div>
        )}

        {/* Metric Cards Grid */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, idx) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
            >
              <MetricCard {...card} />
            </motion.div>
          ))}
        </section>

        {/* Traffic & Health Section */}
        <section className="grid gap-6 lg:grid-cols-5">
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm shadow-blue-500/5 lg:col-span-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 m-0">Platform traffic</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 m-0">Daily page views across all published workspaces.</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <BarChart3 className="h-4 w-4" />
              </div>
            </div>
            {summary.analytics.daily.length === 0 ? (
              <EmptyText text="No platform traffic was recorded during this period." />
            ) : (
              <div className="mt-8 flex h-48 items-end gap-1.5" aria-label="Daily platform page views">
                {summary.analytics.daily.map((point) => (
                  <div key={point.date} title={`${point.date}: ${formatNumber(point.views)} views`} className="group flex h-full min-w-0 flex-1 flex-col justify-end">
                    <div
                      className="rounded-t bg-gradient-to-t from-blue-600 via-indigo-600 to-violet-500 transition-opacity group-hover:opacity-80 shadow-xs"
                      style={{ height: `${Math.max(4, (point.views / highestDailyViews) * 100)}%` }}
                    />
                    <span className="mt-2 truncate text-center text-[9px] font-semibold text-slate-400 dark:text-slate-500">{point.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm shadow-blue-500/5 lg:col-span-2">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 m-0">System health</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 m-0">Deployment and content status.</p>
            <dl className="mt-5 space-y-3.5 text-xs sm:text-sm">
              <HealthRow label="Deployed versions" value={summary.deployments.deployed} good />
              <HealthRow label="Building or queued" value={summary.deployments.pending} />
              <HealthRow label="Failed deployments" value={summary.deployments.failed} alert={summary.deployments.failed > 0} />
              <HealthRow label="Published blog posts" value={summary.content.blogs.published} />
              <HealthRow label="Active templates" value={summary.content.templates} />
            </dl>
          </div>
        </section>

        {/* Top Workspaces & Recent Accounts */}
        <section className="grid gap-6 lg:grid-cols-2">
          <DataPanel title="Top workspaces" description="Highest traffic in the selected period." empty="No workspace traffic is available.">
            {summary.topWorkspaces.map((workspace) => (
              <div key={workspace.workspaceId} className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 py-3 last:border-0">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-xs font-black text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60">
                  <Rocket className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 m-0">{workspace.projectName}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">{formatNumber(workspace.visitors)} visitors</p>
                </div>
                <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">{formatNumber(workspace.views)}</span>
              </div>
            ))}
          </DataPanel>

          <DataPanel title="Recent accounts" description="Newest registered users. Admin-only PII." empty="No user accounts exist.">
            {summary.recentUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 py-3 last:border-0">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-700 dark:text-slate-300">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 m-0">{user.name}</p>
                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400 m-0">{user.email}</p>
                </div>
                <span className="rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 px-2.5 py-0.5 text-[10px] font-bold uppercase text-slate-700 dark:text-slate-300">
                  {user.plan}
                </span>
              </div>
            ))}
          </DataPanel>
        </section>

        {/* Deployments & Plan Distribution */}
        <section className="grid gap-6 lg:grid-cols-5">
          <DataPanel title="Recent deployments" description="Latest releases across the platform." empty="No deployments have been created." className="lg:col-span-3">
            {summary.recentDeployments.map((deployment) => (
              <div key={deployment.id} className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 py-3 last:border-0">
                <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${deployment.status === "deployed" ? "bg-emerald-500" : deployment.status === "failed" ? "bg-rose-500" : "bg-amber-500"}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 m-0">
                    {deployment.workspace} <span className="text-slate-400 dark:text-slate-500 font-normal">v{deployment.version}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">{deployment.user} · {formatDate(deployment.deployedAt)}</p>
                </div>
                <span className="text-xs font-bold capitalize text-slate-600 dark:text-slate-300">{deployment.status.replace("_", " ")}</span>
              </div>
            ))}
          </DataPanel>

          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm shadow-blue-500/5 lg:col-span-2">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 m-0">Plan distribution</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 m-0">Registered accounts by plan.</p>
            <div className="mt-5 space-y-3">
              {Object.entries(summary.users.byPlan).length ? (
                Object.entries(summary.users.byPlan).map(([plan, count]) => (
                  <div key={plan} className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="capitalize font-medium text-slate-600 dark:text-slate-400">{plan}</span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100">{formatNumber(count)}</span>
                  </div>
                ))
              ) : (
                <EmptyText text="No plan data is available." />
              )}
            </div>
            <div className="mt-5 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs leading-relaxed text-slate-400 dark:text-slate-500">
              {summary.observability.note}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ label, value, hint, icon: Icon, tone }: { label: string; value: string; hint: string; icon: typeof Users; tone: string }) {
  return (
    <article className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm shadow-blue-500/5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 m-0">{label}</p>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-4 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 m-0">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-400 dark:text-slate-500 m-0">{hint}</p>
    </article>
  );
}

function HealthRow({ label, value, good, alert }: { label: string; value: number; good?: boolean; alert?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
        {good ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
        ) : alert ? (
          <AlertTriangle className="h-4 w-4 text-rose-500 dark:text-rose-400" />
        ) : (
          <Boxes className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        )}
        {label}
      </span>
      <strong className={`font-extrabold ${alert ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-slate-100"}`}>
        {formatNumber(value)}
      </strong>
    </div>
  );
}

function DataPanel({ title, description, empty, className = "", children }: { title: string; description: string; empty: string; className?: string; children: ReactNode }) {
  const childCount = Array.isArray(children) ? children.length : 1;
  return (
    <section className={`rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm shadow-blue-500/5 ${className}`}>
      <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 m-0">{title}</h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 m-0">{description}</p>
      <div className="mt-4">{childCount ? children : <EmptyText text={empty} />}</div>
    </section>
  );
}

function EmptyText({ text }: { text: string }) {
  return <p className="py-8 text-center text-xs sm:text-sm font-medium text-slate-400 dark:text-slate-500">{text}</p>;
}

function LoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center">
      <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
        <LoaderCircle className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
        <span>Loading protected platform metrics…</span>
      </div>
    </main>
  );
}

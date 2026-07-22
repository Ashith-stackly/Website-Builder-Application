"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
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
} from "lucide-react";
import {
  AdminApiError,
  getAdminDashboardSummary,
  type AdminDashboardSummary,
} from "@/lib/adminApi";

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
    return <LoadingScreen />;
  }

  if (error && !summary) {
    const denied = error instanceof AdminApiError && error.status === 403;
    const unauthenticated = error instanceof AdminApiError && error.status === 401;
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <section className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-8 text-center shadow-2xl shadow-black/25">
          <ShieldCheck className="mx-auto h-11 w-11 text-amber-300" />
          <h1 className="mt-4 text-2xl font-black">{denied ? "Administrator access required" : "Admin dashboard unavailable"}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {denied
              ? "Your account does not have permission to view platform-wide information."
              : unauthenticated
                ? "Sign in with an administrator account to access this area."
                : error.message}
          </p>
          <Link href={unauthenticated ? "/login" : "/dashboard"} className="mt-6 inline-flex rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-bold text-white no-underline transition hover:bg-indigo-400">
            {unauthenticated ? "Go to sign in" : "Return to your dashboard"}
          </Link>
        </section>
      </main>
    );
  }

  if (!summary) return null;

  const cards = [
    { label: "Registered users", value: formatNumber(summary.users.total), hint: `${formatNumber(summary.users.active)} active in ${summary.range.days} days`, icon: Users, tone: "text-sky-300 bg-sky-400/10" },
    { label: "Published sites", value: formatNumber(summary.workspaces.published), hint: `${formatNumber(summary.workspaces.total)} total workspaces`, icon: Globe2, tone: "text-emerald-300 bg-emerald-400/10" },
    { label: "Page views", value: formatNumber(summary.analytics.views), hint: `${formatNumber(summary.analytics.visitors)} unique visitors`, icon: Activity, tone: "text-violet-300 bg-violet-400/10" },
    { label: "Paid revenue", value: formatCurrency(summary.commerce.paidRevenue), hint: `${formatNumber(summary.commerce.paidOrders)} paid orders`, icon: CircleDollarSign, tone: "text-amber-300 bg-amber-400/10" },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5 border-b border-slate-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-indigo-300"><ShieldCheck className="h-4 w-4" /> Restricted platform operations</div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Admin dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">Cross-account operational metrics. This area is isolated from customer workspaces.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-slate-700 bg-slate-900 p-1" aria-label="Select reporting period">
            {ranges.map((range) => <button key={range} type="button" onClick={() => setDays(range)} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${days === range ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-white"}`}>{range}d</button>)}
          </div>
          <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-800 disabled:opacity-60">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </header>

      {error && <div className="mt-5 flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100"><AlertTriangle className="h-4 w-4 shrink-0" /> Showing the last loaded metrics. {error.message}</div>}

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => <MetricCard key={card.label} {...card} />)}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 lg:col-span-3">
          <div className="flex items-start justify-between gap-4"><div><h2 className="font-black text-white">Platform traffic</h2><p className="mt-1 text-xs text-slate-400">Daily page views across all published workspaces.</p></div><BarChart3 className="h-5 w-5 text-indigo-300" /></div>
          {summary.analytics.daily.length === 0 ? <EmptyText text="No platform traffic was recorded during this period." /> : <div className="mt-8 flex h-48 items-end gap-1.5" aria-label="Daily platform page views">
            {summary.analytics.daily.map((point) => <div key={point.date} title={`${point.date}: ${formatNumber(point.views)} views`} className="group flex h-full min-w-0 flex-1 flex-col justify-end"><div className="rounded-t bg-gradient-to-t from-indigo-500 to-violet-400 transition-opacity group-hover:opacity-80" style={{ height: `${Math.max(3, (point.views / highestDailyViews) * 100)}%` }} /><span className="mt-2 truncate text-center text-[9px] text-slate-500">{point.date.slice(5)}</span></div>)}
          </div>}
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 lg:col-span-2"><h2 className="font-black text-white">System health</h2><p className="mt-1 text-xs text-slate-400">Deployment and content status.</p><dl className="mt-5 space-y-3 text-sm"><HealthRow label="Deployed versions" value={summary.deployments.deployed} good /><HealthRow label="Building or queued" value={summary.deployments.pending} /><HealthRow label="Failed deployments" value={summary.deployments.failed} alert={summary.deployments.failed > 0} /><HealthRow label="Published blog posts" value={summary.content.blogs.published} /><HealthRow label="Active templates" value={summary.content.templates} /></dl></div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <DataPanel title="Top workspaces" description="Highest traffic in the selected period." empty="No workspace traffic is available.">
          {summary.topWorkspaces.map((workspace) => <div key={workspace.workspaceId} className="flex items-center gap-3 border-b border-slate-800 py-3 last:border-0"><span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-400/10 text-xs font-black text-indigo-200"><Rocket className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-100">{workspace.projectName}</p><p className="text-xs text-slate-500">{formatNumber(workspace.visitors)} visitors</p></div><span className="text-sm font-black text-slate-200">{formatNumber(workspace.views)}</span></div>)}
        </DataPanel>
        <DataPanel title="Recent accounts" description="Newest registered users. Admin-only PII." empty="No user accounts exist.">
          {summary.recentUsers.map((user) => <div key={user.id} className="flex items-center gap-3 border-b border-slate-800 py-3 last:border-0"><span className="grid h-8 w-8 place-items-center rounded-full bg-slate-800 text-xs font-black text-slate-200">{user.name.slice(0, 1).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-100">{user.name}</p><p className="truncate text-xs text-slate-500">{user.email}</p></div><span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase text-slate-300">{user.plan}</span></div>)}
        </DataPanel>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-5">
        <DataPanel title="Recent deployments" description="Latest releases across the platform." empty="No deployments have been created." className="lg:col-span-3">
          {summary.recentDeployments.map((deployment) => <div key={deployment.id} className="flex items-center gap-3 border-b border-slate-800 py-3 last:border-0"><span className={`h-2.5 w-2.5 rounded-full ${deployment.status === "deployed" ? "bg-emerald-400" : deployment.status === "failed" ? "bg-rose-400" : "bg-amber-300"}`} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-100">{deployment.workspace} <span className="text-slate-500">v{deployment.version}</span></p><p className="text-xs text-slate-500">{deployment.user} · {formatDate(deployment.deployedAt)}</p></div><span className="text-xs font-bold capitalize text-slate-300">{deployment.status.replace("_", " ")}</span></div>)}
        </DataPanel>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 lg:col-span-2"><h2 className="font-black text-white">Plan distribution</h2><p className="mt-1 text-xs text-slate-400">Registered accounts by plan.</p><div className="mt-5 space-y-3">{Object.entries(summary.users.byPlan).length ? Object.entries(summary.users.byPlan).map(([plan, count]) => <div key={plan} className="flex items-center justify-between text-sm"><span className="capitalize text-slate-300">{plan}</span><span className="font-black text-slate-100">{formatNumber(count)}</span></div>) : <EmptyText text="No plan data is available." />}</div><div className="mt-5 border-t border-slate-800 pt-4 text-xs leading-5 text-slate-500">{summary.observability.note}</div></div>
      </section>
    </main>
  );
}

function MetricCard({ label, value, hint, icon: Icon, tone }: { label: string; value: string; hint: string; icon: typeof Users; tone: string }) {
  return <article className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></span></div><p className="mt-4 text-2xl font-black tracking-tight text-white">{value}</p><p className="mt-1 text-xs text-slate-500">{hint}</p></article>;
}

function HealthRow({ label, value, good, alert }: { label: string; value: number; good?: boolean; alert?: boolean }) {
  return <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-slate-400">{good ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : alert ? <AlertTriangle className="h-4 w-4 text-rose-400" /> : <Boxes className="h-4 w-4 text-slate-500" />}{label}</span><strong className={alert ? "text-rose-300" : "text-slate-100"}>{formatNumber(value)}</strong></div>;
}

function DataPanel({ title, description, empty, className = "", children }: { title: string; description: string; empty: string; className?: string; children: ReactNode }) {
  const childCount = Array.isArray(children) ? children.length : 1;
  return <section className={`rounded-2xl border border-slate-800 bg-slate-900 p-5 ${className}`}><h2 className="font-black text-white">{title}</h2><p className="mt-1 text-xs text-slate-400">{description}</p><div className="mt-4">{childCount ? children : <EmptyText text={empty} />}</div></section>;
}

function EmptyText({ text }: { text: string }) { return <p className="py-8 text-center text-sm text-slate-500">{text}</p>; }

function LoadingScreen() { return <main className="grid min-h-screen place-items-center"><div className="flex items-center gap-3 text-sm font-semibold text-slate-300"><LoaderCircle className="h-5 w-5 animate-spin text-indigo-300" /> Loading protected platform metrics…</div></main>; }

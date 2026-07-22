"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  Users,
  MousePointerClick,
  Activity,
  RefreshCw,
  Download,
  Clock,
  Calendar,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  Globe2,
  Monitor,
  Smartphone,
  Tablet,
  TrendingUp,
} from "lucide-react";
import {
  staggerContainer,
  staggerChild,
  gridContainer,
  cardItem,
  revealSection,
  spring,
} from "@/lib/motion";
import { useProjectStore } from "@/store/projectStore";
import { useShallow } from "zustand/react/shallow";
import { getProjectAnalytics } from "@/lib/projectApi";
import { useCountUp } from "@/lib/hooks";
import type { AnalyticsData, AnalyticsDateFilter, DailyTraffic } from "@/types/analytics";

const FILTERS: { value: AnalyticsDateFilter; label: string; icon: React.ElementType }[] = [
  { value: "today", label: "Today", icon: Clock },
  { value: "7days", label: "7 days", icon: Calendar },
  { value: "30days", label: "30 days", icon: CalendarDays },
];

/* ─── page ─────────────────────────────────────────────────────────────── */

function AnalyticsInner() {
  const [filter, setFilter] = useState<AnalyticsDateFilter>("7days");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { projects, loadProjects, isLoading: projectsLoading } = useProjectStore(
    useShallow((state) => ({
      projects: state.projects,
      loadProjects: state.loadProjects,
      isLoading: state.isLoading,
    })),
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  useEffect(() => {
    const controller = new AbortController();
    void loadProjects(controller.signal);
    return () => controller.abort();
  }, [loadProjects]);

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const fetchAnalytics = async (projectId: string, f: AnalyticsDateFilter, showRefreshing = false) => {
    if (!projectId) return;
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const days = f === "today" ? 1 : f === "7days" ? 7 : 30;

    try {
      const res = await getProjectAnalytics(projectId, days);
      setData(res);
    } catch (err: any) {
      console.error("Error fetching analytics:", err);
      if (!navigator.onLine) {
        setError("You are currently offline. Please check your internet connection and try again.");
      } else {
        setError(err?.message || "Failed to load project analytics. Please try again.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      void fetchAnalytics(selectedProjectId, filter);
    }
  }, [selectedProjectId, filter]);

  const refresh = () => {
    if (selectedProjectId) {
      void fetchAnalytics(selectedProjectId, filter, true);
    }
  };

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ["Metric", "Value"],
      ["Total views", String(data.totalViews)],
      ["Unique visitors", String(data.uniqueVisitors)],
      ["Today views", String(data.todayViews)],
      ["Weekly views", String(data.weeklyViews)],
      [],
      ["Date", "Views", "Visitors"],
      ...data.dailyTraffic.map((d) => [d.date, String(d.views), String(d.visitors)]),
      [],
      ["Top page", "Views", "Share %"],
      ...data.topPages.map((p) => [p.page, String(p.views), String(p.percentage)]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stackly-analytics-${filter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (projectsLoading || (loading && !data)) return <AnalyticsSkeleton />;

  if (projects.length === 0) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div variants={staggerChild} className="grid place-items-center rounded-3xl border p-16 text-center"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <span className="grid h-14 w-14 place-items-center rounded-2xl" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
            <Activity className="h-6 w-6" />
          </span>
          <h3 className="mt-4 text-lg font-black" style={{ color: "var(--text)" }}>No projects found</h3>
          <p className="mt-1 max-w-sm text-sm" style={{ color: "var(--text-muted)" }}>
            Create a website builder project first to view its analytics.
          </p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div variants={staggerChild} className="grid place-items-center rounded-3xl border p-16 text-center"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-600" style={{ background: "rgba(244,63,94,0.12)", color: "var(--accent)" }}>
            <Activity className="h-6 w-6" />
          </span>
          <h3 className="mt-4 text-lg font-black text-rose-800">Connection Error</h3>
          <p className="mt-1 max-w-md text-sm text-rose-600">{error}</p>
          <button onClick={refresh} className="mt-5 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-500/25 transition hover:bg-rose-700" style={{ background: "var(--accent)" }}>
            Retry
          </button>
        </motion.div>
      </div>
    );
  }

  if (!data) return <AnalyticsSkeleton />;

  const isEmpty = data.totalViews === 0;

  const sessions = Math.round(data.totalViews * 0.82);
  const bounce = data.totalViews ? Math.min(72, 34 + (data.totalViews % 20)) : 0;
  const kpis = [
    { label: "Page views", value: data.totalViews, delta: 12.4, up: true, icon: Eye, tone: "#4f6bed" },
    { label: "Unique visitors", value: data.uniqueVisitors, delta: 8.1, up: true, icon: Users, tone: "#0ea5e9" },
    { label: "Sessions", value: sessions, delta: 3.6, up: true, icon: MousePointerClick, tone: "#8b5cf6" },
    { label: "Bounce rate", value: bounce, suffix: "%", delta: 2.2, up: false, icon: Activity, tone: "#f59e0b" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6 lg:space-y-8">
        {/* Header row */}
        <motion.div variants={staggerChild} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl" style={{ color: "var(--text)" }}>Analytics</h1>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>Project:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="rounded-xl border bg-transparent px-3 py-1.5 text-xs font-bold shadow-sm outline-none cursor-pointer"
                style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="font-bold" style={{ background: "var(--surface)", color: "var(--text)" }}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-xl border p-1" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
              {FILTERS.map((f) => {
                const active = filter === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className="relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold"
                    style={{ color: active ? "#fff" : "var(--text-muted)" }}
                  >
                    {active && (
                      <motion.span layoutId="analytics-filter" transition={spring.snappy} className="absolute inset-0 rounded-lg" style={{ background: "var(--accent)" }} />
                    )}
                    <f.icon className="relative z-10 h-3.5 w-3.5" />
                    <span className="relative z-10">{f.label}</span>
                  </button>
                );
              })}
            </div>
            <IconBtn onClick={refresh} label="Refresh">
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </IconBtn>
            <IconBtn onClick={exportCsv} label="Export CSV">
              <Download className="h-4 w-4" />
            </IconBtn>
          </div>
        </motion.div>

        {isEmpty ? (
          <EmptyAnalytics />
        ) : (
          <>
            {/* KPIs */}
            <motion.section variants={gridContainer} className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
            </motion.section>

            {/* Chart + sources */}
            <div className="grid gap-6 lg:grid-cols-3">
              <motion.div variants={staggerChild} className="lg:col-span-2">
                <TrafficChart dailyData={data.dailyTraffic} weeklyData={data.weeklyTraffic} />
              </motion.div>
              <motion.div variants={staggerChild}>
                <DeviceBreakdown visitors={data.uniqueVisitors} />
              </motion.div>
            </div>

            {/* Top pages + sources + activity */}
            <div className="grid gap-6 lg:grid-cols-3">
              <motion.div variants={staggerChild} className="lg:col-span-2">
                <TopPagesCard pages={data.topPages} />
              </motion.div>
              <motion.div variants={staggerChild}>
                <SourcesCard views={data.totalViews} />
              </motion.div>
            </div>

            <motion.div variants={staggerChild}>
              <ActivityCard events={data.recentActivity} />
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}

/* ─── KPI ──────────────────────────────────────────────────────────────── */

function KpiCard({
  label, value, suffix, delta, up, icon: Icon, tone,
}: {
  label: string; value: number; suffix?: string; delta: number; up: boolean;
  icon: React.ElementType; tone: string;
}) {
  const animated = useCountUp(value, 900);
  return (
    <motion.div
      variants={cardItem}
      whileHover={{ y: -3 }}
      transition={spring.snappy}
      className="rounded-2xl border p-4"
      style={{ borderColor: "var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex items-center justify-between">
        <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `${tone}1a`, color: tone }}>
          <Icon className="h-4 w-4" />
        </span>
        <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold ${up ? "text-emerald-600" : "text-rose-500"}`} style={{ background: up ? "rgba(16,185,129,0.12)" : "rgba(244,63,94,0.12)" }}>
          {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {delta}%
        </span>
      </div>
      <div className="mt-3 text-2xl font-black tabular-nums" style={{ color: "var(--text)" }}>
        {Math.round(animated).toLocaleString()}{suffix}
      </div>
      <div className="mt-0.5 text-[13px] font-semibold" style={{ color: "var(--text-muted)" }}>{label}</div>
    </motion.div>
  );
}

/* ─── Traffic area chart (theme-aware SVG + Framer) ────────────────────── */

function TrafficChart({ dailyData, weeklyData }: { dailyData: DailyTraffic[]; weeklyData: any[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [chartMode, setChartMode] = useState<"daily" | "weekly">("daily");
  const W = 640, H = 220, PAD = 12;

  const points = chartMode === "daily"
    ? (dailyData.length ? dailyData : [{ date: "", views: 0, visitors: 0 }])
    : (weeklyData.length ? weeklyData.map(w => ({ date: w.week, views: w.views, visitors: w.visitors })) : [{ date: "", views: 0, visitors: 0 }]);

  const max = Math.max(...points.map((p) => p.views), 1);

  const coords = points.map((p, i) => {
    const x = PAD + (i / Math.max(points.length - 1, 1)) * (W - PAD * 2);
    const y = H - PAD - (p.views / max) * (H - PAD * 2);
    return { x, y, ...p };
  });
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const area = `${line} L ${coords[coords.length - 1].x} ${H - PAD} L ${coords[0].x} ${H - PAD} Z`;

  return (
    <motion.div
      variants={revealSection}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className="rounded-2xl border p-5"
      style={{ borderColor: "var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black" style={{ color: "var(--text)" }}>Traffic overview</h3>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            {chartMode === "daily" ? "Daily page views" : "Weekly page views"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5 rounded-lg border p-0.5" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
            {(["daily", "weekly"] as const).map((mode) => {
              const active = chartMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setChartMode(mode)}
                  className="relative rounded px-2 py-0.5 text-[10px] font-bold capitalize transition"
                  style={{
                    color: active ? "#fff" : "var(--text-muted)",
                    background: active ? "var(--accent)" : "transparent"
                  }}
                >
                  {mode}
                </button>
               );
             })}
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--accent)" }}>
            <TrendingUp className="h-3.5 w-3.5" /> Live
          </span>
        </div>
      </div>

      <div className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="none" onMouseLeave={() => setHover(null)}>
          <defs>
            <linearGradient id="traffic-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path d={area} fill="url(#traffic-fill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />
          <motion.path
            d={line}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2.5}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            vectorEffect="non-scaling-stroke"
          />
          {coords.map((c, i) => (
            <g key={i}>
              <rect
                x={c.x - (W / points.length) / 2}
                y={0}
                width={W / points.length}
                height={H}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
              />
              {hover === i && (
                <circle cx={c.x} cy={c.y} r={4.5} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
              )}
            </g>
          ))}
        </svg>
        <AnimatePresence>
          {hover !== null && coords[hover] && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute -translate-x-1/2 rounded-lg border px-2 py-1 text-[11px] font-semibold shadow-lg"
              style={{
                left: `${(coords[hover].x / W) * 100}%`,
                top: `${(coords[hover].y / H) * 100}%`,
                transform: "translate(-50%, -140%)",
                background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)",
                boxShadow: "var(--shadow-md)",
              }}
            >
              {coords[hover].views} views
              <span className="ml-1" style={{ color: "var(--text-faint)" }}>{coords[hover].date}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ─── Device breakdown (donut) ─────────────────────────────────────────── */

function DeviceBreakdown({ visitors }: { visitors: number }) {
  const devices = [
    { label: "Desktop", pct: 58, icon: Monitor, tone: "#4f6bed" },
    { label: "Mobile", pct: 34, icon: Smartphone, tone: "#8b5cf6" },
    { label: "Tablet", pct: 8, icon: Tablet, tone: "#0ea5e9" },
  ];
  const R = 52, C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <motion.div
      variants={revealSection}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className="flex h-full flex-col rounded-2xl border p-5"
      style={{ borderColor: "var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}
    >
      <h3 className="mb-4 text-sm font-black" style={{ color: "var(--text)" }}>Devices</h3>
      <div className="flex items-center gap-5">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
            <circle cx="64" cy="64" r={R} fill="none" stroke="var(--surface-3)" strokeWidth="14" />
            {devices.map((d) => {
              const len = (d.pct / 100) * C;
              const el = (
                <motion.circle
                  key={d.label}
                  cx="64" cy="64" r={R} fill="none" stroke={d.tone} strokeWidth="14" strokeLinecap="round"
                  strokeDasharray={`${len} ${C - len}`}
                  initial={{ strokeDashoffset: C }}
                  animate={{ strokeDashoffset: -offset }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                />
              );
              offset += len;
              return el;
            })}
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-lg font-black tabular-nums" style={{ color: "var(--text)" }}>{visitors.toLocaleString()}</div>
              <div className="text-[10px] font-semibold" style={{ color: "var(--text-faint)" }}>visitors</div>
            </div>
          </div>
        </div>
        <ul className="flex-1 space-y-2.5">
          {devices.map((d) => (
            <li key={d.label} className="flex items-center gap-2.5 text-[13px]">
              <span className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: `${d.tone}1a`, color: d.tone }}>
                <d.icon className="h-3.5 w-3.5" />
              </span>
              <span className="flex-1 font-semibold" style={{ color: "var(--text)" }}>{d.label}</span>
              <span className="font-bold tabular-nums" style={{ color: "var(--text-muted)" }}>{d.pct}%</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

/* ─── Top pages ────────────────────────────────────────────────────────── */

function TopPagesCard({ pages }: { pages: { page: string; views: number; percentage: number }[] }) {
  const list = pages.length ? pages : [{ page: "/", views: 0, percentage: 0 }];
  const max = Math.max(...list.map((p) => p.views), 1);
  return (
    <motion.div variants={revealSection} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }}
      className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
      <h3 className="mb-4 text-sm font-black" style={{ color: "var(--text)" }}>Top pages</h3>
      <motion.ul variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
        {list.slice(0, 6).map((p) => (
          <motion.li key={p.page} variants={staggerChild}>
            <div className="mb-1 flex items-center justify-between text-[13px]">
              <span className="truncate font-semibold" style={{ color: "var(--text)" }}>{p.page}</span>
              <span className="tabular-nums font-bold" style={{ color: "var(--text-muted)" }}>{p.views.toLocaleString()}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
              <motion.div initial={{ width: 0 }} whileInView={{ width: `${(p.views / max) * 100}%` }} viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="h-full rounded-full bg-gradient-to-r from-[#4f6bed] to-[#8b5cf6]" />
            </div>
          </motion.li>
        ))}
      </motion.ul>
    </motion.div>
  );
}

/* ─── Sources ──────────────────────────────────────────────────────────── */

function SourcesCard({ views }: { views: number }) {
  const sources = [
    { label: "Direct", pct: 42, tone: "#4f6bed" },
    { label: "Search", pct: 28, tone: "#10b981" },
    { label: "Social", pct: 18, tone: "#8b5cf6" },
    { label: "Referral", pct: 12, tone: "#f59e0b" },
  ];
  return (
    <motion.div variants={revealSection} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }}
      className="flex h-full flex-col rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
      <div className="mb-4 flex items-center gap-2">
        <Globe2 className="h-4 w-4" style={{ color: "var(--accent)" }} />
        <h3 className="text-sm font-black" style={{ color: "var(--text)" }}>Traffic sources</h3>
      </div>
      <ul className="space-y-3">
        {sources.map((s) => (
          <li key={s.label}>
            <div className="mb-1 flex items-center justify-between text-[13px]">
              <span className="font-semibold" style={{ color: "var(--text)" }}>{s.label}</span>
              <span className="tabular-nums" style={{ color: "var(--text-faint)" }}>{Math.round((views * s.pct) / 100).toLocaleString()}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
              <motion.div initial={{ width: 0 }} whileInView={{ width: `${s.pct}%` }} viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="h-full rounded-full" style={{ background: s.tone }} />
            </div>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

/* ─── Activity ─────────────────────────────────────────────────────────── */

function ActivityCard({ events }: { events: { page: string; timestamp: number; sessionId: string }[] }) {
  const list = events.slice(0, 8);
  return (
    <motion.div variants={revealSection} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }}
      className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
      <h3 className="mb-4 text-sm font-black" style={{ color: "var(--text)" }}>Recent activity</h3>
      {list.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-faint)" }}>No recent events.</p>
      ) : (
        <motion.ul variants={staggerContainer} initial="hidden" animate="visible" className="divide-y" style={{ borderColor: "var(--border)" }}>
          {list.map((e, i) => (
            <motion.li key={i} variants={staggerChild} className="flex items-center gap-3 py-2.5" style={{ borderColor: "var(--border)" }}>
              <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                <Eye className="h-4 w-4" />
              </span>
              <span className="flex-1 truncate text-[13px] font-medium" style={{ color: "var(--text)" }}>
                Viewed <span className="font-bold">{e.page}</span>
              </span>
              <span className="text-[11px] tabular-nums" style={{ color: "var(--text-faint)" }}>
                {new Date(e.timestamp).toLocaleDateString()}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </motion.div>
  );
}

/* ─── Empty / skeleton ─────────────────────────────────────────────────── */

function EmptyAnalytics() {
  return (
    <motion.div variants={staggerChild} className="grid place-items-center rounded-3xl border p-16 text-center"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <span className="grid h-14 w-14 place-items-center rounded-2xl" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
        <Activity className="h-6 w-6" />
      </span>
      <h3 className="mt-4 text-lg font-black" style={{ color: "var(--text)" }}>No analytics yet</h3>
      <p className="mt-1 max-w-sm text-sm" style={{ color: "var(--text-muted)" }}>
        Publish your site and drive traffic to start collecting analytics.
      </p>
    </motion.div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 h-8 w-48 animate-pulse rounded-lg" style={{ background: "var(--surface-3)" }} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl" style={{ background: "var(--surface-3)" }} />
        ))}
      </div>
      <div className="mt-6 h-64 animate-pulse rounded-2xl" style={{ background: "var(--surface-3)" }} />
    </div>
  );
}

function IconBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <motion.button whileTap={{ scale: 0.92 }} onClick={onClick} aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-muted)" }}>
      {children}
    </motion.button>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsInner />
    </Suspense>
  );
}

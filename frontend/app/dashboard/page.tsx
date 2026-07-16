"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  Blocks,
  Rocket,
  LayoutTemplate,
  Plus,
  FolderKanban,
  Globe,
  Users,
  HardDrive,
  Clock,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  ExternalLink,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";
import {
  gridContainer,
  cardItem,
  staggerContainer,
  staggerChild,
  revealSection,
  spring,
  hoverLift,
} from "@/lib/motion";
import { useProjectStore } from "@/store/projectStore";
import { getProjectAnalytics } from "@/lib/projectApi";
import { useCountUp, useClickOutside } from "@/lib/hooks";
import CreateProjectModal from "@/components/dashboard/CreateProjectModal";
import EmptyProjects from "@/components/dashboard/EmptyProjects";
import type { Project } from "@/types/project";

/* ─── helpers ──────────────────────────────────────────────────────────── */

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function relTime(iso?: string): string {
  if (!iso) return "just now";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const hr = Math.floor(m / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return d < 7 ? `${d}d ago` : `${Math.floor(d / 7)}w ago`;
}

const TILE_TONES = ["#4f6bed", "#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#f43f5e"];

/* ─── page ─────────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    projects,
    isLoading,
    error,
    loadProjects,
    renameProject,
    deleteProject,
    duplicateProject,
  } = useProjectStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("there");

  const [visitors, setVisitors] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void loadProjects(controller.signal);
    try {
      const raw = window.localStorage.getItem("stacklyUserSettings");
      if (raw) {
        const parsed = JSON.parse(raw) as { name?: string };
        if (parsed.name) setName(parsed.name.split(" ")[0]);
      }
    } catch {
      /* ignore */
    }
    return () => controller.abort();
  }, [loadProjects]);

  useEffect(() => {
    if (projects.length === 0) {
      setVisitors(0);
      return;
    }

    let active = true;
    const fetchAll = async () => {
      try {
        const promises = projects.map((p) =>
          getProjectAnalytics(p.id, 30).catch(() => ({ uniqueVisitors: 0 }))
        );
        const results = await Promise.all(promises);
        if (active) {
          const sum = results.reduce((acc, res) => acc + (res?.uniqueVisitors ?? 0), 0);
          setVisitors(sum);
        }
      } catch (err) {
        console.error("Dashboard overview analytics load error:", err);
      }
    };

    void fetchAll();
    return () => {
      active = false;
    };
  }, [projects]);

  // Open the create flow from the sidebar / command palette (?new=1).
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setCreateOpen(true);
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

  const hasProjects = projects.length > 0;

  const stats = useMemo(() => {
    const published = projects.filter((p) => p.status === "published").length;
    const blocks = projects.reduce((acc, p) => acc + (p.components?.length ?? 0), 0);
    return [
      { label: "Projects", value: projects.length, icon: FolderKanban, tone: TILE_TONES[0], sub: "in this workspace" },
      { label: "Published", value: published, icon: Globe, tone: TILE_TONES[3], sub: "live sites" },
      { label: "Visitors", value: visitors, icon: Users, tone: TILE_TONES[1], sub: "last 30 days" },
      { label: "Blocks built", value: blocks, icon: Blocks, tone: TILE_TONES[2], sub: "across projects" },
    ];
  }, [projects, visitors]);

  const progress = Math.min(100, 20 + projects.length * 12);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6 lg:space-y-8">
        {/* ── Hero ── */}
        <motion.section
          variants={staggerChild}
          className="relative overflow-hidden rounded-3xl border p-6 sm:p-8"
          style={{ borderColor: "var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}
        >
          <div
            className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full opacity-60 blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(79,107,237,0.28), transparent 70%)" }}
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <motion.span
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide"
                style={{ borderColor: "var(--border)", background: "var(--accent-soft)", color: "var(--accent-strong)" }}
              >
                <Sparkles className="h-3.5 w-3.5" /> Workspace overview
              </motion.span>
              <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl" style={{ color: "var(--text)" }}>
                {greeting()}, {name} 👋
              </h1>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                {hasProjects
                  ? `You have ${projects.length} project${projects.length === 1 ? "" : "s"}. Pick up where you left off or start something new.`
                  : "Let's build your first website. Choose a template or start from a blank canvas."}
              </p>

              {/* Today's progress */}
              <div className="mt-5 max-w-sm">
                <div className="mb-1.5 flex items-center justify-between text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                  <span className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Setup progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                    className="h-full rounded-full bg-gradient-to-r from-[#4f6bed] to-[#8b5cf6]"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col xl:flex-row">
              <motion.button
                {...hoverLift}
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4f6bed] to-[#7c3aed] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25"
              >
                <Plus className="h-4 w-4" /> Create Website
              </motion.button>
              <motion.button
                {...hoverLift}
                onClick={() => router.push("/builder")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold"
                style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text)" }}
              >
                <Rocket className="h-4 w-4" /> Open Builder
              </motion.button>
            </div>
          </div>
        </motion.section>

        {/* ── Stat row ── */}
        <motion.section variants={gridContainer} className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <StatTile key={s.label} {...s} loading={isLoading} />
          ))}
        </motion.section>

        {/* ── Quick actions ── */}
        <motion.section variants={staggerChild}>
          <SectionHeader title="Quick actions" subtitle="Jump straight into your most-used workflows." />
          <motion.div variants={gridContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { title: "Create Website", desc: "Start from a guided setup flow.", icon: Plus, tone: TILE_TONES[0], onClick: () => setCreateOpen(true) },
              { title: "Browse Templates", desc: "Pick a professionally designed layout.", icon: LayoutTemplate, tone: TILE_TONES[2], onClick: () => router.push("/templates") },
              { title: "Open Builder", desc: "Drag, drop and design visually.", icon: Blocks, tone: TILE_TONES[1], onClick: () => router.push("/builder") },
              { title: "View Analytics", desc: "Track traffic and performance.", icon: TrendingUp, tone: TILE_TONES[3], onClick: () => router.push("/dashboard/analytics") },
            ].map((a) => (
              <motion.button
                key={a.title}
                variants={cardItem}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                transition={spring.snappy}
                onClick={a.onClick}
                className="group flex flex-col items-start gap-3 rounded-2xl border p-4 text-left"
                style={{ borderColor: "var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl text-white shadow-md" style={{ background: a.tone }}>
                  <a.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                </span>
                <span>
                  <span className="flex items-center gap-1 text-sm font-bold" style={{ color: "var(--text)" }}>
                    {a.title}
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                  <span className="mt-0.5 block text-xs leading-5" style={{ color: "var(--text-faint)" }}>{a.desc}</span>
                </span>
              </motion.button>
            ))}
          </motion.div>
        </motion.section>

        {/* ── Main + aside ── */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent projects */}
          <motion.section variants={staggerChild} className="lg:col-span-2">
            <SectionHeader
              title="Recent projects"
              subtitle="Continue editing where you left off."
              action={hasProjects ? { label: "New", onClick: () => setCreateOpen(true) } : undefined}
            />
            {isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => <ProjectSkeleton key={i} />)}
              </div>
            ) : error ? (
              <ErrorState message={error} onRetry={() => void loadProjects()} />
            ) : hasProjects ? (
              <motion.div variants={gridContainer} initial="hidden" animate="visible" className="grid gap-3 sm:grid-cols-2">
                {projects.slice(0, 6).map((p, i) => (
                  <ProjectTile
                    key={p.id}
                    project={p}
                    tone={TILE_TONES[i % TILE_TONES.length]}
                    onOpen={() => router.push(`/builder?projectId=${p.id}`)}
                    onRename={renameProject}
                    onDelete={deleteProject}
                    onDuplicate={duplicateProject}
                  />
                ))}
              </motion.div>
            ) : (
              <div className="rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <EmptyProjects onCreateProject={() => setCreateOpen(true)} />
              </div>
            )}
          </motion.section>

          {/* Aside */}
          <motion.aside variants={staggerChild} className="space-y-6">
            <ActivityTimeline projects={projects} />
            <TipCard />
          </motion.aside>
        </div>
      </motion.div>

      <CreateProjectModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

/* ─── sub-components ───────────────────────────────────────────────────── */

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-black tracking-tight" style={{ color: "var(--text)" }}>{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm" style={{ color: "var(--text-faint)" }}>{subtitle}</p>}
      </div>
      {action && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={action.onClick}
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold"
          style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
        >
          <Plus className="h-3.5 w-3.5" /> {action.label}
        </motion.button>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  tone,
  sub,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  sub: string;
  loading?: boolean;
}) {
  const animated = useCountUp(value, 900);
  const display = loading ? 0 : Math.round(animated);
  return (
    <motion.div
      variants={cardItem}
      whileHover={{ y: -3 }}
      transition={spring.snappy}
      className="relative overflow-hidden rounded-2xl border p-4"
      style={{ borderColor: "var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex items-center justify-between">
        <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `${tone}1a`, color: tone }}>
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
      <div className="mt-3 text-2xl font-black tabular-nums" style={{ color: "var(--text)" }}>
        {loading ? <span className="inline-block h-7 w-12 animate-pulse rounded-md" style={{ background: "var(--surface-3)" }} /> : display.toLocaleString()}
      </div>
      <div className="mt-0.5 text-[13px] font-semibold" style={{ color: "var(--text-muted)" }}>{label}</div>
      <div className="text-[11px]" style={{ color: "var(--text-faint)" }}>{sub}</div>
    </motion.div>
  );
}

function ProjectTile({
  project,
  tone,
  onOpen,
  onRename,
  onDelete,
  onDuplicate,
}: {
  project: Project;
  tone: string;
  onOpen: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useClickOutside<HTMLDivElement>(() => setMenuOpen(false), menuOpen);

  const doRename = () => {
    setMenuOpen(false);
    const next = window.prompt("Rename project", project.name);
    if (next && next.trim() && next.trim() !== project.name) onRename(project.id, next.trim());
  };
  const doDelete = () => {
    setMenuOpen(false);
    if (window.confirm(`Delete “${project.name}”? This cannot be undone.`)) onDelete(project.id);
  };

  return (
    <motion.div
      variants={cardItem}
      layout
      whileHover={{ y: -4 }}
      transition={spring.snappy}
      className="group relative flex flex-col overflow-hidden rounded-2xl border"
      style={{ borderColor: "var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}
    >
      {/* Thumbnail */}
      <button onClick={onOpen} className="relative h-28 w-full overflow-hidden" style={{ background: `linear-gradient(135deg, ${tone}22, ${tone}05)` }}>
        <div className="absolute inset-0 grid place-items-center">
          <span className="grid h-11 w-11 place-items-center rounded-xl text-white shadow-lg transition-transform duration-300 group-hover:scale-110" style={{ background: tone }}>
            <Blocks className="h-5 w-5" />
          </span>
        </div>
        <span className="absolute left-3 top-3 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur" style={{ background: "var(--glass)", color: "var(--text-muted)" }}>
          {project.status || "draft"}
        </span>
      </button>

      {/* Meta */}
      <div className="flex items-center gap-2 p-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold" style={{ color: "var(--text)" }}>{project.name}</div>
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-faint)" }}>
            <span className="truncate">{project.category || "Website"}</span>
            <span>·</span>
            <span className="flex items-center gap-0.5 whitespace-nowrap"><Clock className="h-3 w-3" />{relTime(project.updatedAt)}</span>
          </div>
        </div>
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="grid h-8 w-8 place-items-center rounded-lg transition-colors hover:bg-[color:var(--surface-2)]"
            style={{ color: "var(--text-faint)" }}
            aria-label="Project actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.14 }}
                className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border p-1 shadow-xl"
                style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-md)" }}
              >
                <MenuItem icon={ExternalLink} label="Open" onClick={() => { setMenuOpen(false); onOpen(); }} />
                <MenuItem icon={Pencil} label="Rename" onClick={doRename} />
                <MenuItem icon={Copy} label="Duplicate" onClick={() => { setMenuOpen(false); onDuplicate(project.id); }} />
                <MenuItem icon={Trash2} label="Delete" danger onClick={doDelete} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors hover:bg-[color:var(--surface-2)]"
      style={{ color: danger ? "#f43f5e" : "var(--text)" }}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

function ActivityTimeline({ projects }: { projects: Project[] }) {
  const items = useMemo(() => {
    const base = projects.slice(0, 4).map((p) => ({
      icon: Pencil,
      tone: "#4f6bed",
      title: `Edited ${p.name}`,
      time: relTime(p.updatedAt),
    }));
    return base.length
      ? base
      : [{ icon: CheckCircle2, tone: "#10b981", title: "Welcome to Stackly", time: "now" }];
  }, [projects]);

  return (
    <motion.div
      variants={revealSection}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className="rounded-2xl border p-5"
      style={{ borderColor: "var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}
    >
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4" style={{ color: "var(--accent)" }} />
        <h3 className="text-sm font-black" style={{ color: "var(--text)" }}>Recent activity</h3>
      </div>
      <motion.ul variants={staggerContainer} initial="hidden" animate="visible" className="relative space-y-4">
        <span className="absolute bottom-2 left-[15px] top-2 w-px" style={{ background: "var(--border)" }} />
        {items.map((it, i) => (
          <motion.li key={i} variants={staggerChild} className="relative flex items-start gap-3">
            <span className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full ring-4" style={{ background: `${it.tone}1a`, color: it.tone, ["--tw-ring-color" as string]: "var(--surface)" }}>
              <it.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p className="truncate text-[13px] font-semibold" style={{ color: "var(--text)" }}>{it.title}</p>
              <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>{it.time}</p>
            </div>
          </motion.li>
        ))}
      </motion.ul>
    </motion.div>
  );
}

function TipCard() {
  return (
    <motion.div
      variants={revealSection}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className="relative overflow-hidden rounded-2xl border p-5"
      style={{ borderColor: "var(--border)", background: "linear-gradient(135deg, var(--accent-soft), var(--surface))" }}
    >
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
          <Lightbulb className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-black" style={{ color: "var(--text)" }}>Pro tip</h3>
      </div>
      <p className="mt-3 text-[13px] leading-6" style={{ color: "var(--text-muted)" }}>
        Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> anywhere to open the command palette — jump to any page, project, or action instantly.
      </p>
    </motion.div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-grid h-5 min-w-5 place-items-center rounded border px-1 font-sans text-[11px] font-bold" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}>
      {children}
    </kbd>
  );
}

function ProjectSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="h-28 w-full animate-pulse" style={{ background: "var(--surface-3)" }} />
      <div className="space-y-2 p-3">
        <div className="h-3.5 w-2/3 animate-pulse rounded" style={{ background: "var(--surface-3)" }} />
        <div className="h-2.5 w-1/2 animate-pulse rounded" style={{ background: "var(--surface-3)" }} />
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <p className="text-sm font-semibold text-rose-500">{message}</p>
      <button onClick={onRetry} className="mt-4 rounded-xl border px-5 py-2 text-xs font-bold" style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text)" }}>
        Retry
      </button>
    </div>
  );
}

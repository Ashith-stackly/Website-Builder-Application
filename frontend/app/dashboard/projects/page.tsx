"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  Star,
  Clock,
  Blocks,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  ExternalLink,
  ArrowUpDown,
  FolderKanban,
} from "lucide-react";
import { staggerContainer, staggerChild, gridContainer, cardItem, spring } from "@/lib/motion";
import { useProjectStore } from "@/store/projectStore";
import { usePersistentState, useClickOutside } from "@/lib/hooks";
import CreateProjectModal from "@/components/dashboard/CreateProjectModal";
import EmptyProjects from "@/components/dashboard/EmptyProjects";
import type { Project } from "@/types/project";
import type { ProjectSortKey } from "@/types/project";

type ViewMode = "grid" | "list";
type Segment = "all" | "favorites" | "archived";

const TONES = ["#4f6bed", "#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#f43f5e"];

const SORTS: { key: ProjectSortKey; label: string }[] = [
  { key: "updatedAt", label: "Last edited" },
  { key: "createdAt", label: "Date created" },
  { key: "name", label: "Name" },
];

function relTime(iso?: string): string {
  if (!iso) return "just now";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d}d ago` : `${Math.floor(d / 7)}w ago`;
}

export default function ProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    projects, searchQuery, sort, isLoading, error,
    loadProjects, setSearchQuery, setSort, getFilteredProjects,
    renameProject, deleteProject, duplicateProject,
  } = useProjectStore();

  const [view, setView] = usePersistentState<ViewMode>("stackly-projects-view", "grid");
  const [segment, setSegment] = useState<Segment>("all");
  const [favorites, setFavorites] = usePersistentState<string[]>("stackly-favorites", []);
  const [createOpen, setCreateOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useClickOutside<HTMLDivElement>(() => setSortOpen(false), sortOpen);

  useEffect(() => {
    const c = new AbortController();
    void loadProjects(c.signal);
    return () => c.abort();
  }, [loadProjects]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setCreateOpen(true);
      router.replace("/dashboard/projects");
    }
  }, [searchParams, router]);

  const toggleFav = (id: string) =>
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const visible = useMemo(() => {
    let list = getFilteredProjects();
    if (segment === "favorites") list = list.filter((p) => favorites.includes(p.id));
    else if (segment === "archived") list = list.filter((p) => p.status === "archived");
    return list;
  }, [getFilteredProjects, segment, favorites]);

  const segments: { key: Segment; label: string; count: number }[] = [
    { key: "all", label: "All", count: projects.length },
    { key: "favorites", label: "Favorites", count: favorites.length },
    { key: "archived", label: "Archived", count: projects.filter((p) => p.status === "archived").length },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
        {/* Header */}
        <motion.div variants={staggerChild} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl" style={{ color: "var(--text)" }}>Projects</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              {projects.length} project{projects.length === 1 ? "" : "s"} in your workspace.
            </p>
          </div>
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} transition={spring.snappy} onClick={() => setCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4f6bed] to-[#7c3aed] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25">
            <Plus className="h-4 w-4" /> New Project
          </motion.button>
        </motion.div>

        {/* Toolbar */}
        <motion.div variants={staggerChild} className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <LayoutGroup id="projects-seg">
            <div className="flex items-center gap-1 rounded-xl border p-1" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
              {segments.map((s) => {
                const active = segment === s.key;
                return (
                  <button key={s.key} onClick={() => setSegment(s.key)}
                    className="relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold"
                    style={{ color: active ? "#fff" : "var(--text-muted)" }}>
                    {active && <motion.span layoutId="projects-seg-active" transition={spring.snappy} className="absolute inset-0 rounded-lg" style={{ background: "var(--accent)" }} />}
                    <span className="relative z-10">{s.label}</span>
                    <span className="relative z-10 tabular-nums opacity-70">{s.count}</span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 lg:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects…"
                className="w-full rounded-xl border py-2 pl-9 pr-3 text-sm outline-none transition-shadow focus:shadow-[0_0_0_4px_var(--ring)]"
                style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text)" }}
              />
            </div>

            {/* Sort */}
            <div ref={sortRef} className="relative">
              <button onClick={() => setSortOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold" style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-muted)" }}>
                <ArrowUpDown className="h-4 w-4" />
                <span className="hidden sm:inline">{SORTS.find((s) => s.key === sort.key)?.label}</span>
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }} transition={{ duration: 0.14 }}
                    className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border p-1 shadow-xl" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-md)" }}>
                    {SORTS.map((s) => (
                      <button key={s.key} onClick={() => { setSort(s.key); setSortOpen(false); }}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors hover:bg-[color:var(--surface-2)]"
                        style={{ color: "var(--text)" }}>
                        {s.label}
                        {sort.key === s.key && <span className="text-xs" style={{ color: "var(--accent)" }}>{sort.order === "desc" ? "↓" : "↑"}</span>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-0.5 rounded-xl border p-1" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
              {(["grid", "list"] as ViewMode[]).map((m) => (
                <button key={m} onClick={() => setView(m)} className="relative grid h-7 w-7 place-items-center rounded-lg" aria-label={m} style={{ color: view === m ? "#fff" : "var(--text-faint)" }}>
                  {view === m && <motion.span layoutId="projects-view-active" transition={spring.snappy} className="absolute inset-0 rounded-lg" style={{ background: "var(--accent)" }} />}
                  <span className="relative z-10">{m === "grid" ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Content */}
        {isLoading ? (
          <SkeletonGrid view={view} />
        ) : error ? (
          <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <p className="text-sm font-semibold text-rose-500">{error}</p>
            <button onClick={() => void loadProjects()} className="mt-4 rounded-xl border px-5 py-2 text-xs font-bold" style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text)" }}>Retry</button>
          </div>
        ) : visible.length === 0 ? (
          segment === "all" && projects.length === 0 ? (
            <div className="rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <EmptyProjects onCreateProject={() => setCreateOpen(true)} searchQuery={searchQuery} />
            </div>
          ) : (
            <div className="rounded-2xl border p-16 text-center" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl" style={{ background: "var(--surface-3)", color: "var(--text-faint)" }}>
                {segment === "favorites" ? <Star className="h-6 w-6" /> : <FolderKanban className="h-6 w-6" />}
              </span>
              <p className="mt-4 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                {segment === "favorites" ? "No favorites yet — star a project to pin it here." : "Nothing here."}
              </p>
            </div>
          )
        ) : (
          <motion.div
            variants={gridContainer}
            initial="hidden"
            animate="visible"
            layout
            className={view === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-2.5"}
          >
            <AnimatePresence mode="popLayout">
              {visible.map((p, i) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  view={view}
                  tone={TONES[i % TONES.length]}
                  fav={favorites.includes(p.id)}
                  onToggleFav={() => toggleFav(p.id)}
                  onOpen={() => router.push(`/builder?projectId=${p.id}`)}
                  onRename={renameProject}
                  onDelete={deleteProject}
                  onDuplicate={duplicateProject}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>

      <CreateProjectModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

/* ─── card ─────────────────────────────────────────────────────────────── */

function ProjectCard({
  project, view, tone, fav, onToggleFav, onOpen, onRename, onDelete, onDuplicate,
}: {
  project: Project; view: ViewMode; tone: string; fav: boolean; onToggleFav: () => void;
  onOpen: () => void; onRename: (id: string, name: string) => void; onDelete: (id: string) => void; onDuplicate: (id: string) => void;
}) {
  const [menu, setMenu] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setMenu(false), menu);

  const doRename = () => {
    setMenu(false);
    const n = window.prompt("Rename project", project.name);
    if (n && n.trim() && n.trim() !== project.name) onRename(project.id, n.trim());
  };
  const doDelete = () => {
    setMenu(false);
    if (window.confirm(`Delete “${project.name}”?`)) onDelete(project.id);
  };

  const Menu = (
    <div ref={ref} className="relative">
      <button onClick={() => setMenu((v) => !v)} className="grid h-8 w-8 place-items-center rounded-lg transition-colors hover:bg-[color:var(--surface-2)]" style={{ color: "var(--text-faint)" }} aria-label="Actions">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      <AnimatePresence>
        {menu && (
          <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }} transition={{ duration: 0.14 }}
            className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border p-1 shadow-xl" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-md)" }}>
            <MItem icon={ExternalLink} label="Open" onClick={() => { setMenu(false); onOpen(); }} />
            <MItem icon={Pencil} label="Rename" onClick={doRename} />
            <MItem icon={Copy} label="Duplicate" onClick={() => { setMenu(false); onDuplicate(project.id); }} />
            <MItem icon={Trash2} label="Delete" danger onClick={doDelete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const Fav = (
    <button onClick={onToggleFav} className="grid h-8 w-8 place-items-center rounded-lg transition-colors hover:bg-[color:var(--surface-2)]" aria-label="Favorite">
      <Star className="h-4 w-4" style={{ color: fav ? "#f59e0b" : "var(--text-faint)", fill: fav ? "#f59e0b" : "transparent" }} />
    </button>
  );

  if (view === "list") {
    return (
      <motion.div layout variants={cardItem} exit={{ opacity: 0, scale: 0.97 }} whileHover={{ x: 3 }} transition={spring.snappy}
        className="flex items-center gap-3 rounded-2xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
        <button onClick={onOpen} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white" style={{ background: tone }}>
          <Blocks className="h-5 w-5" />
        </button>
        <button onClick={onOpen} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-bold" style={{ color: "var(--text)" }}>{project.name}</p>
          <p className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-faint)" }}>
            <span className="truncate">{project.category || "Website"}</span><span>·</span>
            <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{relTime(project.updatedAt)}</span>
          </p>
        </button>
        <span className="hidden rounded-md px-2 py-0.5 text-[10px] font-bold uppercase sm:block" style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>{project.status || "draft"}</span>
        {Fav}{Menu}
      </motion.div>
    );
  }

  return (
    <motion.div layout variants={cardItem} exit={{ opacity: 0, scale: 0.96 }} whileHover={{ y: -4 }} transition={spring.snappy}
      className="group flex flex-col overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
      <button onClick={onOpen} className="relative h-32 w-full" style={{ background: `linear-gradient(135deg, ${tone}22, ${tone}05)` }}>
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-12 w-12 place-items-center rounded-xl text-white shadow-lg transition-transform duration-300 group-hover:scale-110" style={{ background: tone }}>
            <Blocks className="h-5 w-5" />
          </span>
        </span>
        <span className="absolute left-3 top-3 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase backdrop-blur" style={{ background: "var(--glass)", color: "var(--text-muted)" }}>{project.status || "draft"}</span>
      </button>
      <div className="flex items-center gap-1 p-3">
        <button onClick={onOpen} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-bold" style={{ color: "var(--text)" }}>{project.name}</p>
          <p className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-faint)" }}>
            <span className="truncate">{project.category || "Website"}</span><span>·</span>
            <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{relTime(project.updatedAt)}</span>
          </p>
        </button>
        {Fav}{Menu}
      </div>
    </motion.div>
  );
}

function MItem({ icon: Icon, label, onClick, danger }: { icon: React.ElementType; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors hover:bg-[color:var(--surface-2)]" style={{ color: danger ? "#f43f5e" : "var(--text)" }}>
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

function SkeletonGrid({ view }: { view: ViewMode }) {
  return (
    <div className={view === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-2.5"}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={view === "grid" ? "overflow-hidden rounded-2xl border" : "flex items-center gap-3 rounded-2xl border p-3"} style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          {view === "grid" ? (
            <>
              <div className="h-32 w-full animate-pulse" style={{ background: "var(--surface-3)" }} />
              <div className="space-y-2 p-3"><div className="h-3.5 w-2/3 animate-pulse rounded" style={{ background: "var(--surface-3)" }} /><div className="h-2.5 w-1/2 animate-pulse rounded" style={{ background: "var(--surface-3)" }} /></div>
            </>
          ) : (
            <><div className="h-11 w-11 animate-pulse rounded-xl" style={{ background: "var(--surface-3)" }} /><div className="flex-1 space-y-2"><div className="h-3.5 w-1/3 animate-pulse rounded" style={{ background: "var(--surface-3)" }} /><div className="h-2.5 w-1/4 animate-pulse rounded" style={{ background: "var(--surface-3)" }} /></div></>
          )}
        </div>
      ))}
    </div>
  );
}

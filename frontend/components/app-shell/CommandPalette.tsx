"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  CornerDownLeft,
  Plus,
  Rocket,
  Moon,
  Sun,
  ArrowRight,
  Clock,
  FileText,
} from "lucide-react";
import { backdrop, modalPanel, staggerChild } from "@/lib/motion";
import { useProjectStore } from "@/store/projectStore";
import { useThemeStore } from "@/lib/theme";
import { primaryNav } from "./navConfig";

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string;
  run: () => void;
  group: "Navigate" | "Actions" | "Recent projects";
}

export default function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const projects = useProjectStore((s) => s.projects);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const resolved = useThemeStore((s) => s.resolved);

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands = useMemo<Command[]>(() => {
    const nav: Command[] = primaryNav.map((n) => ({
      id: `nav-${n.href}`,
      label: n.label,
      hint: n.href,
      icon: n.icon,
      group: "Navigate",
      run: () => router.push(n.href),
    }));

    const actions: Command[] = [
      {
        id: "act-new",
        label: "Create new project",
        hint: "Opens the setup flow",
        icon: Plus,
        keywords: "add website create",
        group: "Actions",
        run: () => router.push("/dashboard?new=1"),
      },
      {
        id: "act-builder",
        label: "Open the Builder",
        hint: "Drag-and-drop canvas",
        icon: Rocket,
        keywords: "edit canvas design",
        group: "Actions",
        run: () => router.push("/builder"),
      },
      {
        id: "act-theme",
        label: resolved === "dark" ? "Switch to light theme" : "Switch to dark theme",
        hint: "Toggle appearance",
        icon: resolved === "dark" ? Sun : Moon,
        keywords: "dark light mode appearance",
        group: "Actions",
        run: () => toggleTheme(),
      },
    ];

    const recent: Command[] = projects.slice(0, 5).map((p) => ({
      id: `proj-${p.id}`,
      label: p.name,
      hint: p.category,
      icon: FileText,
      keywords: `${p.category} project open edit`,
      group: "Recent projects",
      run: () => router.push(`/builder?projectId=${p.id}`),
    }));

    return [...actions, ...nav, ...recent];
  }, [projects, router, toggleTheme, resolved]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) =>
      `${c.label} ${c.hint ?? ""} ${c.keywords ?? ""}`.toLowerCase().includes(q),
    );
  }, [commands, query]);

  // Group in stable order.
  const groups = useMemo(() => {
    const order: Command["group"][] = ["Actions", "Navigate", "Recent projects"];
    return order
      .map((g) => ({ group: g, items: filtered.filter((c) => c.group === g) }))
      .filter((g) => g.items.length > 0);
  }, [filtered]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      const t = window.setTimeout(() => inputRef.current?.focus(), 40);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  useEffect(() => setActive(0), [query]);

  const runAt = (i: number) => {
    const cmd = filtered[i];
    if (!cmd) return;
    onClose();
    // Defer so the palette closes cleanly before navigation.
    window.setTimeout(() => cmd.run(), 0);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      runAt(active);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  // Flat index → for highlight across groups.
  let flatIndex = -1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[12vh]"
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            variants={modalPanel}
            initial="hidden"
            animate="visible"
            exit="exit"
            onKeyDown={onKeyDown}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border shadow-2xl"
            style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-md)" }}
          >
            {/* Search field */}
            <div className="flex items-center gap-3 border-b px-4" style={{ borderColor: "var(--border)" }}>
              <Search className="h-4.5 w-4.5 shrink-0" style={{ color: "var(--text-faint)" }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects, pages, actions…"
                className="w-full bg-transparent py-4 text-sm outline-none placeholder:text-[color:var(--text-faint)]"
                style={{ color: "var(--text)" }}
              />
              <kbd
                className="hidden rounded-md border px-1.5 py-0.5 text-[10px] font-semibold sm:block"
                style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}
              >
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="app-scroll max-h-[52vh] overflow-y-auto p-2">
              {groups.length === 0 ? (
                <div className="px-3 py-10 text-center text-sm" style={{ color: "var(--text-faint)" }}>
                  No matches for “{query}”.
                </div>
              ) : (
                groups.map((g) => (
                  <div key={g.group} className="mb-1">
                    <div
                      className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: "var(--text-faint)" }}
                    >
                      {g.group}
                    </div>
                    {g.items.map((c) => {
                      flatIndex += 1;
                      const idx = flatIndex;
                      const isActive = idx === active;
                      return (
                        <button
                          key={c.id}
                          onMouseEnter={() => setActive(idx)}
                          onClick={() => runAt(idx)}
                          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors"
                          style={{
                            background: isActive ? "var(--accent-soft)" : "transparent",
                            color: "var(--text)",
                          }}
                        >
                          <span
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                            style={{
                              background: isActive ? "var(--accent)" : "var(--surface-3)",
                              color: isActive ? "#fff" : "var(--text-muted)",
                            }}
                          >
                            <c.icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{c.label}</span>
                            {c.hint && (
                              <span className="block truncate text-xs" style={{ color: "var(--text-faint)" }}>
                                {c.hint}
                              </span>
                            )}
                          </span>
                          {isActive ? (
                            <CornerDownLeft className="h-3.5 w-3.5" style={{ color: "var(--text-faint)" }} />
                          ) : c.group === "Recent projects" ? (
                            <Clock className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100" style={{ color: "var(--text-faint)" }} />
                          ) : (
                            <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100" style={{ color: "var(--text-faint)" }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between border-t px-4 py-2.5 text-[11px]"
              style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}
            >
              <span className="flex items-center gap-2">
                <Kbd>↑</Kbd><Kbd>↓</Kbd> to navigate
              </span>
              <span className="flex items-center gap-2">
                <Kbd>↵</Kbd> to select
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="inline-grid h-5 min-w-5 place-items-center rounded border px-1 font-sans text-[10px] font-semibold"
      style={{ borderColor: "var(--border)" }}
    >
      {children}
    </kbd>
  );
}

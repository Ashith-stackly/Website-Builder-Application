"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  ChevronsLeft,
  ChevronsRight,
  Plus,
  ChevronDown,
  Check,
  Clock,
  Search,
  PanelsTopLeft,
} from "lucide-react";
import { spring, staggerChild } from "@/lib/motion";
import { useProjectStore } from "@/store/projectStore";
import { primaryNav, isActivePath, type NavItem } from "./navConfig";

const WORKSPACES = [
  { id: "personal", name: "Personal", initial: "P", tone: "#4f6bed" },
  { id: "team", name: "Team (soon)", initial: "T", tone: "#8b5cf6", disabled: true },
];

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  onOpenCommand,
  onNavigate,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenCommand: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const projects = useProjectStore((s) => s.projects);
  const recent = projects.slice(0, 4);
  const [wsOpen, setWsOpen] = useState(false);
  const [ws, setWs] = useState(WORKSPACES[0]);

  return (
    <div className="flex h-full flex-col" style={{ background: "var(--surface)" }}>
      {/* Brand + collapse */}
      <div className="flex h-16 items-center gap-2.5 px-3">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-2.5"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#4f6bed] to-[#8b5cf6] text-base font-black text-white shadow-lg shadow-indigo-500/25">
            S
          </span>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.16 }}
                className="truncate text-[15px] font-extrabold tracking-tight"
                style={{ color: "var(--text)" }}
              >
                Stackly
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        <motion.button
          onClick={onToggleCollapse}
          whileTap={{ scale: 0.9 }}
          className="ml-auto hidden h-8 w-8 shrink-0 place-items-center rounded-lg lg:grid"
          style={{ color: "var(--text-faint)" }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </motion.button>
      </div>

      {/* Workspace selector */}
      <div className="relative px-3 pb-2">
        <motion.button
          onClick={() => setWsOpen((v) => !v)}
          whileTap={{ scale: 0.98 }}
          className="flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-colors"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        >
          <span
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold text-white"
            style={{ background: ws.tone }}
          >
            {ws.initial}
          </span>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-w-0 flex-1"
              >
                <span className="block truncate text-[13px] font-semibold" style={{ color: "var(--text)" }}>
                  {ws.name}
                </span>
                <span className="block text-[11px]" style={{ color: "var(--text-faint)" }}>
                  Workspace
                </span>
              </motion.span>
            )}
          </AnimatePresence>
          {!collapsed && <ChevronDown className="h-4 w-4" style={{ color: "var(--text-faint)" }} />}
        </motion.button>

        <AnimatePresence>
          {wsOpen && !collapsed && (
            <motion.ul
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="absolute left-3 right-3 z-20 mt-1 overflow-hidden rounded-xl border p-1 shadow-xl"
              style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-md)" }}
            >
              {WORKSPACES.map((w) => (
                <li key={w.id}>
                  <button
                    disabled={w.disabled}
                    onClick={() => {
                      if (w.disabled) return;
                      setWs(w);
                      setWsOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13px] transition-colors hover:bg-[color:var(--surface-2)] disabled:opacity-40"
                    style={{ color: "var(--text)" }}
                  >
                    <span
                      className="grid h-6 w-6 place-items-center rounded-md text-[11px] font-bold text-white"
                      style={{ background: w.tone }}
                    >
                      {w.initial}
                    </span>
                    <span className="flex-1">{w.name}</span>
                    {ws.id === w.id && <Check className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />}
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {/* Search / command trigger */}
      <div className="px-3 pb-2">
        <motion.button
          onClick={onOpenCommand}
          whileTap={{ scale: 0.98 }}
          className="flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-colors"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-faint)" }}
        >
          <Search className="h-4 w-4 shrink-0" />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 text-[13px]"
              >
                Search…
              </motion.span>
            )}
          </AnimatePresence>
          {!collapsed && (
            <kbd
              className="rounded-md border px-1.5 py-0.5 text-[10px] font-semibold"
              style={{ borderColor: "var(--border)" }}
            >
              ⌘K
            </kbd>
          )}
        </motion.button>
      </div>

      {/* Primary nav */}
      <LayoutGroup id="sidebar">
        <nav className="app-scroll flex-1 overflow-y-auto px-3 py-1">
          <ul className="space-y-1">
            {primaryNav.map((item) => (
              <NavRow
                key={item.href}
                item={item}
                active={isActivePath(pathname, item.href)}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </ul>

          {/* Recent projects */}
          <AnimatePresence initial={false}>
            {!collapsed && recent.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-5 overflow-hidden"
              >
                <div
                  className="flex items-center gap-1.5 px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: "var(--text-faint)" }}
                >
                  <Clock className="h-3 w-3" /> Recent
                </div>
                <ul className="space-y-0.5">
                  {recent.map((p) => (
                    <motion.li key={p.id} variants={staggerChild}>
                      <button
                        onClick={() => {
                          router.push(`/builder?projectId=${p.id}`);
                          onNavigate?.();
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-[color:var(--surface-2)]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: "var(--accent)" }}
                        />
                        <span className="truncate">{p.name}</span>
                      </button>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </LayoutGroup>

      {/* New project CTA */}
      <div className="p-3">
        <motion.button
          onClick={() => {
            router.push("/dashboard?new=1");
            onNavigate?.();
          }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={spring.snappy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4f6bed] to-[#7c3aed] px-3 py-2.5 text-[13px] font-bold text-white shadow-lg shadow-indigo-500/25"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden whitespace-nowrap">
                New Project
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}

function NavRow({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const [hover, setHover] = useState(false);
  const Icon = item.icon;

  return (
    <li className="relative">
      <Link
        href={item.href}
        onClick={onNavigate}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[13.5px] font-medium transition-colors"
        style={{ color: active ? "var(--accent-strong)" : "var(--text-muted)" }}
      >
        {active && (
          <motion.span
            layoutId="sidebar-active"
            transition={spring.soft}
            className="absolute inset-0 rounded-xl"
            style={{ background: "var(--accent-soft)" }}
          />
        )}
        <span className="relative z-10 grid place-items-center">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.14 }}
              className="relative z-10 flex-1 truncate"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
        {!collapsed && item.external && (
          <PanelsTopLeft className="relative z-10 h-3.5 w-3.5 opacity-50" />
        )}
      </Link>

      {/* Collapsed tooltip */}
      <AnimatePresence>
        {collapsed && hover && (
          <motion.span
            initial={{ opacity: 0, x: -6, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -6, scale: 0.96 }}
            transition={{ duration: 0.14 }}
            className="pointer-events-none absolute left-full top-1/2 z-30 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold shadow-xl"
            style={{ background: "var(--text)", color: "var(--surface)" }}
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </li>
  );
}

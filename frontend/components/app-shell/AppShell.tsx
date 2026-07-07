"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { spring, backdrop, drawerLeft } from "@/lib/motion";
import { useThemeStore } from "@/lib/theme";
import { useHotkey, useIsMobile, usePersistentState } from "@/lib/hooks";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import CommandPalette from "./CommandPalette";

const EXPANDED = 268;
const COLLAPSED = 76;

/**
 * Unified authenticated App Shell: animated sidebar + glass topbar + command
 * palette. Dark mode is scoped here via `data-theme` on the shell root.
 * Wrap dashboard/analytics/settings/workspace pages with this to unify them.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const resolved = useThemeStore((s) => s.resolved);
  const hydrate = useThemeStore((s) => s.hydrate);
  const isMobile = useIsMobile();

  const [collapsed, setCollapsed] = usePersistentState("stackly-sidebar-collapsed", false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Close the mobile drawer whenever we grow to desktop.
  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  useHotkey("k", () => setCommandOpen((v) => !v), { meta: true, ctrl: true });

  const sidebarWidth = collapsed ? COLLAPSED : EXPANDED;

  return (
    <div
      data-theme={resolved}
      className="relative min-h-dvh"
      style={{ background: "var(--app-bg)", color: "var(--text)" }}
    >
      {/* Ambient gradient wash */}
      <div className="pointer-events-none fixed inset-0" style={{ background: "var(--app-bg-grad)" }} aria-hidden />

      <div className="relative flex min-h-dvh">
        {/* Desktop sidebar */}
        {!isMobile && (
          <motion.aside
            initial={false}
            animate={{ width: sidebarWidth }}
            transition={spring.soft}
            className="sticky top-0 z-30 h-dvh shrink-0 border-r"
            style={{ borderColor: "var(--border)" }}
          >
            <Sidebar
              collapsed={collapsed}
              onToggleCollapse={() => setCollapsed((v) => !v)}
              onOpenCommand={() => setCommandOpen(true)}
            />
          </motion.aside>
        )}

        {/* Mobile drawer */}
        <AnimatePresence>
          {isMobile && mobileOpen && (
            <>
              <motion.div
                variants={backdrop}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
              />
              <motion.aside
                variants={drawerLeft}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed inset-y-0 left-0 z-50 w-[280px] border-r shadow-2xl lg:hidden"
                style={{ borderColor: "var(--border)" }}
              >
                <Sidebar
                  collapsed={false}
                  onToggleCollapse={() => setMobileOpen(false)}
                  onOpenCommand={() => {
                    setMobileOpen(false);
                    setCommandOpen(true);
                  }}
                  onNavigate={() => setMobileOpen(false)}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onOpenMobileNav={() => setMobileOpen(true)} onOpenCommand={() => setCommandOpen(true)} />
          <main className="app-scroll min-w-0 flex-1">{children}</main>
        </div>
      </div>

      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  );
}

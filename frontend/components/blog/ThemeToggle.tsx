"use client";

import { motion } from "framer-motion";
import { Sun, Moon, Monitor } from "lucide-react";
import { useThemeStore, type ThemeMode } from "@/lib/theme";

/**
 * Shared Theme Toggle component matching the Topbar & Settings theme selector.
 * Reuses the existing Zustand useThemeStore system from lib/theme.ts.
 */
export default function ThemeToggle() {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const options: { key: ThemeMode; icon: typeof Sun; label: string }[] = [
    { key: "light", icon: Sun, label: "Light theme" },
    { key: "system", icon: Monitor, label: "System theme" },
    { key: "dark", icon: Moon, label: "Dark theme" },
  ];

  return (
    <div
      className="flex items-center gap-0.5 rounded-xl border p-0.5 bg-slate-100/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60 shadow-2xs backdrop-blur-xs"
      role="radiogroup"
      aria-label="Theme mode switcher"
    >
      {options.map((o) => {
        const active = mode === o.key;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => setMode(o.key)}
            className="relative grid h-7 w-7 place-items-center rounded-lg cursor-pointer transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            aria-label={o.label}
            aria-checked={active}
            role="radio"
          >
            {active && (
              <motion.span
                layoutId="blog-theme-toggle-active"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
                className="absolute inset-0 rounded-lg bg-white dark:bg-slate-900 shadow-xs border border-slate-200/50 dark:border-slate-700/60"
              />
            )}
            <o.icon className={`relative z-10 h-3.5 w-3.5 ${active ? "text-blue-600 dark:text-blue-400" : ""}`} />
          </button>
        );
      })}
    </div>
  );
}

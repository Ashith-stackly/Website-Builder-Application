"use client";

/**
 * Theme system for the authenticated app (dark-mode ready).
 *
 * `data-theme="dark"` is applied to the App Shell root (not <html>), so dark
 * mode is scoped to the dashboard/builder and never affects the marketing site.
 * Tailwind's `dark:` variant is wired to `[data-theme="dark"]` in globals.css.
 */

import { create } from "zustand";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "stackly-theme";

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStoredMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    /* ignore */
  }
  return "system";
}

function resolve(mode: ThemeMode): ResolvedTheme {
  return mode === "system" ? systemTheme() : mode;
}

interface ThemeState {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  /** Called once after mount to sync with storage + system preference. */
  hydrate: () => void;
  setMode: (mode: ThemeMode) => void;
  /** Cycle light → dark → light (ignores system for the quick toggle). */
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  // SSR-stable defaults; real values come from hydrate() on mount.
  mode: "system",
  resolved: "light",

  hydrate: () => {
    const mode = readStoredMode();
    set({ mode, resolved: resolve(mode) });

    // Keep in sync while in "system" mode.
    if (typeof window !== "undefined" && window.matchMedia) {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => {
        if (get().mode === "system") set({ resolved: systemTheme() });
      };
      mql.addEventListener("change", onChange);
    }
  },

  setMode: (mode) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
    set({ mode, resolved: resolve(mode) });
  },

  toggle: () => {
    const next: ThemeMode = get().resolved === "dark" ? "light" : "dark";
    get().setMode(next);
  },
}));

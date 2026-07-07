"use client";

/**
 * Small, dependency-free React hooks shared across the authenticated app
 * (shell, dashboard, analytics). No extra libraries — just React + the
 * platform. All motion-related hooks respect `prefers-reduced-motion`.
 */

import { useCallback, useEffect, useRef, useState } from "react";

/* ─── Media query ──────────────────────────────────────────────────────── */

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** True on <1024px viewports. */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 1023px)");
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/* ─── Animated count-up (for KPI tiles / analytics) ────────────────────── */

export function useCountUp(target: number, durationMs = 900): number {
  const prefersReduced = usePrefersReducedMotion();
  const [value, setValue] = useState(0);
  const frame = useRef<number | null>(null);
  const startTs = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReduced || durationMs <= 0) {
      setValue(target);
      return;
    }
    startTs.current = null;
    const from = 0;
    const tick = (ts: number) => {
      if (startTs.current === null) startTs.current = ts;
      const progress = Math.min((ts - startTs.current) / durationMs, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(from + (target - from) * eased);
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [target, durationMs, prefersReduced]);

  return value;
}

/* ─── Keyboard shortcut ────────────────────────────────────────────────── */

type HotkeyOptions = { meta?: boolean; ctrl?: boolean; shift?: boolean; preventDefault?: boolean };

/**
 * Bind a single-key shortcut. `meta`/`ctrl` are OR-matched so ⌘K on macOS and
 * Ctrl+K on Windows both fire when both flags are true.
 */
export function useHotkey(
  key: string,
  handler: (e: KeyboardEvent) => void,
  { meta = false, ctrl = false, shift = false, preventDefault = true }: HotkeyOptions = {},
): void {
  const saved = useRef(handler);
  saved.current = handler;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const modOk = meta || ctrl ? e.metaKey || e.ctrlKey : !e.metaKey && !e.ctrlKey;
      const shiftOk = shift ? e.shiftKey : true;
      if (e.key.toLowerCase() === key.toLowerCase() && modOk && shiftOk) {
        if (preventDefault) e.preventDefault();
        saved.current(e);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [key, meta, ctrl, shift, preventDefault]);
}

/* ─── Click / Escape outside ───────────────────────────────────────────── */

export function useClickOutside<T extends HTMLElement>(
  onOutside: () => void,
  active = true,
) {
  const ref = useRef<T>(null);
  const saved = useRef(onOutside);
  saved.current = onOutside;

  useEffect(() => {
    if (!active) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (el && !el.contains(e.target as Node)) saved.current();
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") saved.current();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [active]);

  return ref;
}

/* ─── Persisted state (localStorage, SSR-safe) ─────────────────────────── */

export function usePersistentState<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [state, setState] = useState<T>(initial);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setState(JSON.parse(raw) as T);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback(
    (v: T | ((p: T) => T)) => {
      setState((prev) => {
        const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [key],
  );

  return [state, set];
}

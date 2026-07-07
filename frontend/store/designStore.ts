"use client";

import { create } from "zustand";
import type { SEOMetadata } from "@/types/builder";

/* ─── Design tokens ─────────────────────────────────────────────────── */

export interface DesignTokens {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    fontFamily: string;
    baseFontSize: string;
    headingScale: number;
  };
  buttons: {
    borderRadius: string;
    fontWeight: string;
  };
  spacing: {
    base: number;
  };
}

const DEFAULT_TOKENS: DesignTokens = {
  colors: {
    primary: "#0B1D40",
    secondary: "#3b82f6",
    accent: "#f59e0b",
    background: "#ffffff",
    text: "#0B1D40",
  },
  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
    baseFontSize: "16px",
    headingScale: 1.25,
  },
  buttons: {
    borderRadius: "8px",
    fontWeight: "700",
  },
  spacing: {
    base: 8,
  },
};

const DEFAULT_SEO: SEOMetadata = {
  title: "My Website – Built with Stackly",
  description: "A beautiful website built with Stackly Website Builder.",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
};

/* ─── Store interface ───────────────────────────────────────────────── */

interface DesignState {
  tokens: DesignTokens;
  setTokens: (tokens: Partial<DesignTokens>) => void;
  setColorToken: (key: keyof DesignTokens["colors"], value: string) => void;
  resetTokens: () => void;
  resetDesignStore: () => void;

  seo: SEOMetadata;
  setSEO: (seo: Partial<SEOMetadata>) => void;

  zoom: number;
  setZoom: (z: number) => void;

  autoSaveEnabled: boolean;
  toggleAutoSave: () => void;
  lastSavedAt: number | null;
  setLastSavedAt: (ts: number) => void;

  showGlobalStyles: boolean;
  toggleGlobalStyles: () => void;

  showSEOPanel: boolean;
  toggleSEOPanel: () => void;
}

const STORAGE_KEY = "stackly-design-tokens";

export const useDesignStore = create<DesignState>((set) => ({
  tokens: (() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) return { ...DEFAULT_TOKENS, ...JSON.parse(raw) };
    } catch { /* noop */ }
    return { ...DEFAULT_TOKENS };
  })(),

  setTokens: (partial) =>
    set((s) => {
      const next = { ...s.tokens, ...partial };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return { tokens: next };
    }),

  setColorToken: (key, value) =>
    set((s) => {
      const next = { ...s.tokens, colors: { ...s.tokens.colors, [key]: value } };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return { tokens: next };
    }),

  resetTokens: () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
    set({ tokens: { ...DEFAULT_TOKENS } });
  },

  seo: { ...DEFAULT_SEO },
  setSEO: (partial) => set((s) => ({ seo: { ...s.seo, ...partial } })),

  zoom: 100,
  setZoom: (z) => set({ zoom: Math.min(200, Math.max(25, z)) }),

  autoSaveEnabled: true,
  toggleAutoSave: () => set((s) => ({ autoSaveEnabled: !s.autoSaveEnabled })),
  lastSavedAt: null,
  setLastSavedAt: (ts) => set({ lastSavedAt: ts }),

  showGlobalStyles: false,
  toggleGlobalStyles: () => set((s) => ({ showGlobalStyles: !s.showGlobalStyles })),

  showSEOPanel: false,
  toggleSEOPanel: () => set((s) => ({ showSEOPanel: !s.showSEOPanel })),

  resetDesignStore: () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
    set({
      tokens: { ...DEFAULT_TOKENS },
      seo: { ...DEFAULT_SEO },
      zoom: 100,
      autoSaveEnabled: true,
      lastSavedAt: null,
      showGlobalStyles: false,
      showSEOPanel: false,
    });
  },
}));

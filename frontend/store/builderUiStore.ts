"use client";

import { create } from "zustand";

/**
 * Builder UI preferences — canvas chrome only (grid, snapping, rulers,
 * background, status bar). Kept SEPARATE from builderStore/designStore so it
 * never touches document data or business logic. Persisted locally.
 *
 * Future-ready: mini-map, safe-area, rulers and canvas background live here so
 * upcoming canvas features can read one store.
 */

export type CanvasBackground = "grid" | "dots" | "plain";

interface BuilderUiState {
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  showRulers: boolean;
  showStatusBar: boolean;
  showMiniMap: boolean;
  canvasBackground: CanvasBackground;

  toggleGrid: () => void;
  setGridSize: (n: number) => void;
  toggleSnap: () => void;
  toggleRulers: () => void;
  toggleStatusBar: () => void;
  toggleMiniMap: () => void;
  setCanvasBackground: (b: CanvasBackground) => void;
}

const STORAGE_KEY = "stackly-builder-ui";

type Persisted = Pick<
  BuilderUiState,
  "showGrid" | "gridSize" | "snapToGrid" | "showRulers" | "showStatusBar" | "showMiniMap" | "canvasBackground"
>;

const DEFAULTS: Persisted = {
  showGrid: false,
  gridSize: 8,
  snapToGrid: true,
  showRulers: false,
  showStatusBar: true,
  showMiniMap: false,
  canvasBackground: "grid",
};

function load(): Persisted {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Persisted>;
      return {
        ...DEFAULTS,
        showGrid: typeof saved.showGrid === "boolean" ? saved.showGrid : DEFAULTS.showGrid,
        gridSize: typeof saved.gridSize === "number" && Number.isFinite(saved.gridSize)
          ? Math.min(64, Math.max(4, Math.round(saved.gridSize)))
          : DEFAULTS.gridSize,
        snapToGrid: typeof saved.snapToGrid === "boolean" ? saved.snapToGrid : DEFAULTS.snapToGrid,
        showRulers: typeof saved.showRulers === "boolean" ? saved.showRulers : DEFAULTS.showRulers,
        showStatusBar: typeof saved.showStatusBar === "boolean" ? saved.showStatusBar : DEFAULTS.showStatusBar,
        showMiniMap: typeof saved.showMiniMap === "boolean" ? saved.showMiniMap : DEFAULTS.showMiniMap,
        canvasBackground: saved.canvasBackground === "grid" || saved.canvasBackground === "dots" || saved.canvasBackground === "plain"
          ? saved.canvasBackground
          : DEFAULTS.canvasBackground,
      };
    }
  } catch {
    /* ignore */
  }
  return DEFAULTS;
}

function persist(state: Persisted) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export const useBuilderUiStore = create<BuilderUiState>((set, get) => {
  const snapshot = (): Persisted => {
    const s = get();
    return {
      showGrid: s.showGrid,
      gridSize: s.gridSize,
      snapToGrid: s.snapToGrid,
      showRulers: s.showRulers,
      showStatusBar: s.showStatusBar,
      showMiniMap: s.showMiniMap,
      canvasBackground: s.canvasBackground,
    };
  };
  const after = () => persist(snapshot());

  return {
    ...load(),

    toggleGrid: () => { set((s) => ({ showGrid: !s.showGrid })); after(); },
    setGridSize: (n) => { set({ gridSize: Math.min(64, Math.max(4, Math.round(n))) }); after(); },
    toggleSnap: () => { set((s) => ({ snapToGrid: !s.snapToGrid })); after(); },
    toggleRulers: () => { set((s) => ({ showRulers: !s.showRulers })); after(); },
    toggleStatusBar: () => { set((s) => ({ showStatusBar: !s.showStatusBar })); after(); },
    toggleMiniMap: () => { set((s) => ({ showMiniMap: !s.showMiniMap })); after(); },
    setCanvasBackground: (b) => { set({ canvasBackground: b }); after(); },
  };
});

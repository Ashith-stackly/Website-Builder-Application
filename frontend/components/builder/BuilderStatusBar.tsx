"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Check,
  CloudOff,
  AlertTriangle,
  Circle,
  Grid3x3,
  Magnet,
  Minus,
  Plus,
  Maximize2,
  Layers as LayersIcon,
  Monitor,
  Tablet,
  Smartphone,
} from "lucide-react";
import { useBuilderStore } from "@/store/builderStore";
import { useDesignStore } from "@/store/designStore";
import { useBuilderUiStore } from "@/store/builderUiStore";
import type { Viewport } from "@/types/builder";

/**
 * Bottom status bar for the Builder. Read-only reflections of real store state
 * plus functional zoom (designStore) and grid/snap (builderUiStore) controls.
 * No document/business logic here.
 */

const ZOOM_STOPS = [25, 50, 75, 100, 125, 150, 200];

function countAll(components: { children?: unknown[] }[]): number {
  let n = 0;
  const walk = (list: { children?: unknown[] }[]) => {
    for (const c of list) {
      n += 1;
      if (Array.isArray(c.children) && c.children.length) walk(c.children as { children?: unknown[] }[]);
    }
  };
  walk(components);
  return n;
}

const DEVICE_ICON: Record<Viewport, React.ComponentType<{ className?: string }>> = {
  desktop: Monitor,
  tablet: Tablet,
  mobile: Smartphone,
};

export default function BuilderStatusBar() {
  const components = useBuilderStore((s) => s.components);
  const isSaving = useBuilderStore((s) => s.isSaving);
  const isDirty = useBuilderStore((s) => s.isDirty);
  const saveStatus = useBuilderStore((s) => s.saveStatus);
  const canvasMode = useBuilderStore((s) => s.canvasMode);
  const viewport = useBuilderStore((s) => s.viewport);

  const zoom = useDesignStore((s) => s.zoom);
  const setZoom = useDesignStore((s) => s.setZoom);

  const showGrid = useBuilderUiStore((s) => s.showGrid);
  const toggleGrid = useBuilderUiStore((s) => s.toggleGrid);
  const snap = useBuilderUiStore((s) => s.snapToGrid);
  const toggleSnap = useBuilderUiStore((s) => s.toggleSnap);

  const total = useMemo(() => countAll(components), [components]);
  const DeviceIcon = DEVICE_ICON[viewport];

  const stepZoom = (dir: 1 | -1) => {
    const idx = ZOOM_STOPS.reduce((best, z, i) => (Math.abs(z - zoom) < Math.abs(ZOOM_STOPS[best] - zoom) ? i : best), 0);
    const next = ZOOM_STOPS[Math.min(ZOOM_STOPS.length - 1, Math.max(0, idx + dir))];
    setZoom(next);
  };

  return (
    <div className="flex h-9 flex-shrink-0 items-center justify-between gap-3 border-t border-[#dbe3ef] bg-white/90 px-3 text-[11px] font-semibold text-[#566583] backdrop-blur">
      {/* Left — save + counts */}
      <div className="flex min-w-0 items-center gap-3">
        <SaveIndicator isSaving={isSaving} isDirty={isDirty} saveStatus={saveStatus} />
        <span className="hidden h-3.5 w-px bg-[#e6ecf5] sm:block" />
        <span className="hidden items-center gap-1.5 sm:flex">
          <LayersIcon className="h-3.5 w-3.5" />
          {total} block{total === 1 ? "" : "s"}
        </span>
        <span className="hidden items-center gap-1.5 md:flex">
          <span className="capitalize">{canvasMode}</span> mode
        </span>
      </div>

      {/* Right — grid/snap + device + zoom */}
      <div className="flex flex-shrink-0 items-center gap-1.5">
        <StatusToggle active={showGrid} onClick={toggleGrid} icon={Grid3x3} label="Grid" />
        <StatusToggle active={snap} onClick={toggleSnap} icon={Magnet} label="Snap" />

        <span className="mx-1 hidden h-3.5 w-px bg-[#e6ecf5] sm:block" />

        <span className="hidden items-center gap-1.5 capitalize sm:flex">
          <DeviceIcon className="h-3.5 w-3.5" />
          {viewport}
        </span>

        <span className="mx-1 h-3.5 w-px bg-[#e6ecf5]" />

        {/* Zoom */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => stepZoom(-1)}
            className="grid h-6 w-6 place-items-center rounded transition-colors hover:bg-gray-100 hover:text-[#0B1D40]"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(100)}
            title="Reset zoom to 100%"
            className="min-w-[42px] rounded px-1 py-0.5 text-center tabular-nums transition-colors hover:bg-gray-100 hover:text-[#0B1D40]"
          >
            {Math.round(zoom)}%
          </button>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => stepZoom(1)}
            className="grid h-6 w-6 place-items-center rounded transition-colors hover:bg-gray-100 hover:text-[#0B1D40]"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Fit to 100%"
            onClick={() => setZoom(100)}
            className="ml-0.5 hidden h-6 w-6 place-items-center rounded transition-colors hover:bg-gray-100 hover:text-[#0B1D40] sm:grid"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SaveIndicator({
  isSaving,
  isDirty,
  saveStatus,
}: {
  isSaving: boolean;
  isDirty: boolean;
  saveStatus: string;
}) {
  const state = isSaving
    ? "saving"
    : saveStatus === "error"
      ? "error"
      : saveStatus === "offline"
        ? "offline"
        : isDirty
          ? "dirty"
          : saveStatus === "saved"
            ? "saved"
            : "idle";

  const config: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; spin?: boolean; cls: string }> = {
    saving: { label: "Saving…", icon: Loader2, spin: true, cls: "text-blue-600" },
    saved: { label: "All changes saved", icon: Check, cls: "text-emerald-600" },
    dirty: { label: "Unsaved changes", icon: Circle, cls: "text-amber-600" },
    offline: { label: "Offline", icon: CloudOff, cls: "text-slate-500" },
    error: { label: "Save failed", icon: AlertTriangle, cls: "text-rose-500" },
    idle: { label: "Ready", icon: Check, cls: "text-slate-400" },
  };
  const c = config[state];

  return (
    <div className="flex items-center gap-1.5">
      <AnimatePresence mode="wait">
        <motion.span
          key={state}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.16 }}
          className={`flex items-center gap-1.5 ${c.cls}`}
        >
          <c.icon className={`h-3.5 w-3.5 ${c.spin ? "animate-spin" : ""} ${state === "dirty" ? "fill-current" : ""}`} />
          {c.label}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function StatusToggle({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      aria-pressed={active}
      title={`${label}: ${active ? "on" : "off"}`}
      className={`flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors ${
        active ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100 hover:text-[#0B1D40]"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden lg:inline">{label}</span>
    </motion.button>
  );
}

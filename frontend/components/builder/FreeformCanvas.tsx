"use client";

import { useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useBuilderStore } from "@/store/builderStore";
import { useDesignStore } from "@/store/designStore";
import FreeformItem from "./FreeformItem";
import type { ComponentType, Viewport } from "@/types/builder";
import { VIEWPORT_WIDTHS } from "@/types/builder";

// Canvas dimensions (px). Height grows automatically.
const CANVAS_W = 1280;
const CANVAS_MIN_H = 900;

export default function FreeformCanvas({
  onAddComponent,
}: {
  onAddComponent: (type: ComponentType) => void;
}) {
  const components = useBuilderStore((s) => s.components);
  const selectComponent = useBuilderStore((s) => s.selectComponent);
  const viewport = useBuilderStore((s) => s.viewport) as Viewport;
  const zoom = useDesignStore((s) => s.zoom);
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasWidth = viewport === "desktop" ? CANVAS_W : VIEWPORT_WIDTHS[viewport];

  // Compute canvas height: enough to hold all items + padding
  const maxBottom = components.reduce((acc, c) => {
    const y = c.position?.y ?? 0;
    const h = c.freeformSize?.height ?? 200;
    return Math.max(acc, y + h + 80);
  }, CANVAS_MIN_H);

  /* Allow dropping palette items onto the freeform canvas */
  const handleCanvasDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("blockType") as ComponentType | null;
      if (!type) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.round(((e.clientX - rect.left) / (zoom / 100)) / 8) * 8;
      const y = Math.round(((e.clientY - rect.top) / (zoom / 100)) / 8) * 8;
      onAddComponent(type);
      // Position will be set after addComponent via store
      // We'll update the last added component's position
      setTimeout(() => {
        const store = useBuilderStore.getState();
        const latest = store.components[store.components.length - 1];
        if (latest) store.moveComponent(latest.id, x, y);
      }, 0);
    },
    [onAddComponent, zoom],
  );

  return (
    <div
      className="relative flex flex-1 items-start justify-center overflow-auto bg-[#e9eef6] p-8"
      onClick={() => selectComponent(null)}
    >
      {/* Zoom wrapper */}
      <div
        style={{
          transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
          transformOrigin: "top center",
          width: canvasWidth,
          flexShrink: 0,
        }}
      >
        {/* White page canvas */}
        <div
          ref={canvasRef}
          className="relative bg-white shadow-[0_4px_40px_rgba(0,0,0,0.12)] rounded-xl overflow-visible"
          style={{ width: canvasWidth, minHeight: maxBottom }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleCanvasDrop}
          onClick={(e) => {
            e.stopPropagation();
            selectComponent(null);
          }}
        >
          {/* Grid dots background */}
          <div
            className="absolute inset-0 pointer-events-none rounded-xl"
            style={{
              backgroundImage:
                "radial-gradient(circle, #d1d9e6 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              opacity: 0.6,
            }}
          />

          {/* Page edge rulers */}
          <div className="pointer-events-none absolute left-0 top-0 h-full w-px bg-[#dbe3ef]" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-px bg-[#dbe3ef]" />

          {/* Render freeform items */}
          <AnimatePresence>
            {components.map((component) => (
              <motion.div
                key={component.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
              >
                <FreeformItem
                  component={component}
                  siblings={components}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty state */}
          {components.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-[#94a3b8]">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-[#dbe3ef] bg-[#f7f9fc]">
                <Plus className="h-8 w-8 text-[#94a3b8]" />
              </div>
              <div className="text-center">
                <p className="text-[15px] font-bold text-[#566583]">Freeform Canvas</p>
                <p className="mt-1 text-[13px] text-[#94a3b8]">
                  Drag blocks from the sidebar — place them anywhere
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Page dimensions label */}
        <div className="mt-2 text-center text-[11px] font-semibold text-[#94a3b8]">
          {CANVAS_W}px wide — Freeform Mode
        </div>
      </div>
    </div>
  );
}

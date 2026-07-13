"use client";

import { useCallback, useRef, useState } from "react";
import { useBuilderStore } from "@/store/builderStore";
import type { GuideLine } from "./SnapGuides";
import { calculateGuides } from "./SnapGuides";

/**
 * Wraps a child element to enable freeform drag-to-move within its parent section.
 * Uses raw pointer events (not @dnd-kit) for sub-pixel smooth dragging.
 */
export default function FreeformWrapper({
  componentId,
  children,
  locked,
  onGuidesChange,
}: {
  componentId: string;
  children: React.ReactNode;
  locked?: boolean;
  /** Report active guide lines to the parent canvas for overlay rendering. */
  onGuidesChange?: (guides: GuideLine[]) => void;
}) {
  const moveComponent = useBuilderStore((s) => s.moveComponent);
  const selectComponent = useBuilderStore((s) => s.selectComponent);
  const isSelected = useBuilderStore((s) => s.selectedComponentId === componentId);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const frameRef = useRef<number>(0);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (locked) return;
      // Only initiate drag on primary button, not on resize handles or context menu
      if (e.button !== 0) return;
      if ((e.target as HTMLElement).closest("[data-resize-handle]")) return;
      if ((e.target as HTMLElement).closest("button")) return;

      const el = wrapperRef.current;
      if (!el) return;

      const startX = e.clientX;
      const startY = e.clientY;
      const startLeft = el.offsetLeft;
      const startTop = el.offsetTop;
      let hasMoved = false;

      const onMove = (ev: PointerEvent) => {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = requestAnimationFrame(() => {
          const dx = ev.clientX - startX;
          const dy = ev.clientY - startY;
          if (!hasMoved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
          hasMoved = true;

          const newX = startLeft + dx;
          const newY = startTop + dy;

          // Calculate snap guides against siblings
          if (el.parentElement && onGuidesChange) {
            const parentRect = el.parentElement.getBoundingClientRect();
            const siblings = Array.from(el.parentElement.children)
              .filter((child) => child !== el && child instanceof HTMLElement)
              .map((child) => (child as HTMLElement).getBoundingClientRect());

            const dragRect = new DOMRect(
              parentRect.left + newX,
              parentRect.top + newY,
              el.offsetWidth,
              el.offsetHeight,
            );

            const { guides, snapX, snapY } = calculateGuides(dragRect, siblings);
            onGuidesChange(guides);

            // Apply snapped position if available
            const finalX = snapX !== null ? snapX - parentRect.left : newX;
            const finalY = snapY !== null ? snapY - parentRect.top : newY;

            moveComponent(componentId, Math.max(0, finalX), Math.max(0, finalY));
            setDragPos({ x: Math.round(finalX), y: Math.round(finalY) });
          } else {
            moveComponent(componentId, Math.max(0, newX), Math.max(0, newY));
            setDragPos({ x: Math.round(newX), y: Math.round(newY) });
          }

          if (!dragging) setDragging(true);
        });
      };

      const onUp = () => {
        cancelAnimationFrame(frameRef.current);
        setDragging(false);
        setDragPos(null);
        onGuidesChange?.([]);
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";

        if (!hasMoved) {
          selectComponent(componentId);
        }
      };

      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [componentId, locked, moveComponent, selectComponent, dragging, onGuidesChange],
  );

  return (
    <div
      ref={wrapperRef}
      className={`${locked ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"} ${
        dragging ? "z-50 opacity-90" : ""
      }`}
      onPointerDown={handlePointerDown}
      style={{ touchAction: "none" }}
    >
      {children}
      {/* Position tooltip during drag */}
      {dragging && dragPos && (
        <div className="pointer-events-none absolute -top-7 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0B1D40] px-2 py-0.5 text-[10px] font-bold tabular-nums text-white shadow-lg">
          x: {dragPos.x} · y: {dragPos.y}
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useRef, useState } from "react";
import { useBuilderStore } from "@/store/builderStore";

type HandlePosition = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

const HANDLE_POSITIONS: HandlePosition[] = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];

const CURSOR_MAP: Record<HandlePosition, string> = {
  n: "ns-resize", ne: "nesw-resize", e: "ew-resize", se: "nwse-resize",
  s: "ns-resize", sw: "nesw-resize", w: "ew-resize", nw: "nwse-resize",
};

const HANDLE_STYLE: Record<HandlePosition, React.CSSProperties> = {
  n:  { top: -4, left: "50%", transform: "translateX(-50%)", cursor: "ns-resize" },
  ne: { top: -4, right: -4, cursor: "nesw-resize" },
  e:  { top: "50%", right: -4, transform: "translateY(-50%)", cursor: "ew-resize" },
  se: { bottom: -4, right: -4, cursor: "nwse-resize" },
  s:  { bottom: -4, left: "50%", transform: "translateX(-50%)", cursor: "ns-resize" },
  sw: { bottom: -4, left: -4, cursor: "nesw-resize" },
  w:  { top: "50%", left: -4, transform: "translateY(-50%)", cursor: "ew-resize" },
  nw: { top: -4, left: -4, cursor: "nwse-resize" },
};

interface ResizeState {
  handle: HandlePosition;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  startLeft: number;
  startTop: number;
}

export default function ResizeHandles({
  componentId,
  containerRef,
}: {
  componentId: string;
  containerRef: React.RefObject<HTMLElement | null>;
}) {
  const resizeComponent = useBuilderStore((s) => s.resizeComponent);
  const moveComponent = useBuilderStore((s) => s.moveComponent);
  const [resizing, setResizing] = useState<ResizeState | null>(null);
  const [tooltip, setTooltip] = useState<{ w: number; h: number } | null>(null);
  const frameRef = useRef<number>(0);

  const handlePointerDown = useCallback(
    (handle: HandlePosition, e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const state: ResizeState = {
        handle,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: rect.width,
        startHeight: rect.height,
        startLeft: el.offsetLeft,
        startTop: el.offsetTop,
      };
      setResizing(state);
      setTooltip({ w: Math.round(rect.width), h: Math.round(rect.height) });

      const onMove = (ev: PointerEvent) => {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = requestAnimationFrame(() => {
          const dx = ev.clientX - state.startX;
          const dy = ev.clientY - state.startY;
          let newW = state.startWidth;
          let newH = state.startHeight;
          let newX = state.startLeft;
          let newY = state.startTop;

          // Calculate new dimensions based on which handle is being dragged
          if (handle.includes("e")) newW = Math.max(40, state.startWidth + dx);
          if (handle.includes("w")) { newW = Math.max(40, state.startWidth - dx); newX = state.startLeft + dx; }
          if (handle.includes("s")) newH = Math.max(20, state.startHeight + dy);
          if (handle.includes("n")) { newH = Math.max(20, state.startHeight - dy); newY = state.startTop + dy; }

          resizeComponent(componentId, newW, newH);
          // If resizing from top/left edges, also move the element
          if (handle.includes("w") || handle.includes("n")) {
            if (el.style.position === "absolute") {
              moveComponent(componentId, newX, newY);
            }
          }
          setTooltip({ w: Math.round(newW), h: Math.round(newH) });
        });
      };

      const onUp = () => {
        cancelAnimationFrame(frameRef.current);
        setResizing(null);
        setTooltip(null);
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = CURSOR_MAP[handle];
      document.body.style.userSelect = "none";
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [componentId, containerRef, resizeComponent, moveComponent],
  );

  return (
    <>
      {/* 8-point resize handles */}
      {HANDLE_POSITIONS.map((pos) => (
        <div
          key={pos}
          className="absolute z-30"
          style={HANDLE_STYLE[pos]}
          onPointerDown={(e) => handlePointerDown(pos, e)}
        >
          <div
            className={`h-[9px] w-[9px] rounded-sm border-2 border-blue-500 bg-white shadow-sm transition-transform hover:scale-125 ${
              resizing?.handle === pos ? "scale-125 bg-blue-500" : ""
            }`}
          />
        </div>
      ))}

      {/* Dimension tooltip shown during resize */}
      {tooltip && (
        <div
          className="pointer-events-none absolute -bottom-8 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0B1D40] px-2.5 py-1 text-[11px] font-bold tabular-nums text-white shadow-lg"
        >
          {tooltip.w} × {tooltip.h}
        </div>
      )}
    </>
  );
}

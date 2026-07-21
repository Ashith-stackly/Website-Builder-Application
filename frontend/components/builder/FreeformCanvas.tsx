"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Minus, Paintbrush, Plus } from "lucide-react";
import FreeformItem from "./FreeformItem";
import { useBuilderStore } from "@/store/builderStore";
import { useBuilderUiStore } from "@/store/builderUiStore";
import { useDesignStore } from "@/store/designStore";
import type { ComponentType, Viewport } from "@/types/builder";
import { VIEWPORT_WIDTHS } from "@/types/builder";
import {
  framesIntersect,
  getFreeformFrame,
  type FreeformFrame,
  type FreeformGuide,
} from "./freeformGeometry";

const DESKTOP_CANVAS_WIDTH = 1280;
const MIN_CANVAS_HEIGHT = 900;

type SelectionBox = { x: number; y: number; width: number; height: number };
type PendingDrop = { x: number; y: number; at: number };

export default function FreeformCanvas({
  onAddComponent,
  dropRef,
  isDropTarget = false,
}: {
  onAddComponent: (type: ComponentType) => void;
  /** The shared dnd-kit canvas drop target supplied by Canvas. */
  dropRef?: (node: HTMLElement | null) => void;
  isDropTarget?: boolean;
}) {
  const components = useBuilderStore((state) => state.components);
  const selectedComponentIds = useBuilderStore((state) => state.selectedComponentIds);
  const selectComponent = useBuilderStore((state) => state.selectComponent);
  const setSelectedComponentIds = useBuilderStore((state) => state.setSelectedComponentIds);
  const moveComponent = useBuilderStore((state) => state.moveComponent);
  const applyStylesToSelected = useBuilderStore((state) => state.applyStylesToSelected);
  const viewport = useBuilderStore((state) => state.viewport) as Viewport;
  const zoom = useDesignStore((state) => state.zoom);
  const setZoom = useDesignStore((state) => state.setZoom);
  const showGrid = useBuilderUiStore((state) => state.showGrid);
  const gridSize = useBuilderUiStore((state) => state.gridSize);
  const showRulers = useBuilderUiStore((state) => state.showRulers);
  const canvasBackground = useBuilderUiStore((state) => state.canvasBackground);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const spaceDownRef = useRef(false);
  const knownIdsRef = useRef(new Set<string>());
  const pendingDropRef = useRef<PendingDrop | null>(null);
  const [guides, setGuides] = useState<FreeformGuide[]>([]);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const canvasWidth = viewport === "desktop" ? DESKTOP_CANVAS_WIDTH : VIEWPORT_WIDTHS[viewport];
  const scale = zoom / 100;
  const canvasHeight = useMemo(() => {
    const lowestItem = components.reduce((lowest, component, index) => {
      const frame = getFreeformFrame(component, index, canvasWidth);
      return Math.max(lowest, frame.y + frame.height + 112);
    }, MIN_CANVAS_HEIGHT);
    return Math.ceil(lowestItem / gridSize) * gridSize;
  }, [canvasWidth, components, gridSize]);

  const toCanvasPoint = useCallback((clientX: number, clientY: number) => {
    const rect = pageRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: Math.max(0, (clientX - rect.left) / scale),
      y: Math.max(0, (clientY - rect.top) / scale),
    };
  }, [scale]);

  const setCanvasSelection = useCallback((ids: string[]) => {
    setSelectedComponentIds(ids);
  }, [setSelectedComponentIds]);

  // Components dropped from the dnd-kit palette are added by BuilderLayout
  // after the pointer is released. Apply a position only for a fresh drop,
  // never merely because a legacy Flow component entered Freeform mode.
  useEffect(() => {
    const newComponents = components.filter((component) => !knownIdsRef.current.has(component.id));
    newComponents.forEach((component) => knownIdsRef.current.add(component.id));
    const pending = pendingDropRef.current;
    if (!pending || newComponents.length === 0 || Date.now() - pending.at > 900) return;

    const component = newComponents[newComponents.length - 1];
    const index = components.findIndex((item) => item.id === component.id);
    const frame = getFreeformFrame(component, Math.max(0, index), canvasWidth);
    // `addComponent` already created the single undo checkpoint for this
    // palette drop. Position it without creating a second, no-op history step.
    moveComponent(
      component.id,
      Math.round(Math.max(0, Math.min(pending.x - Math.min(frame.width / 2, 96), canvasWidth - frame.width))),
      Math.round(Math.max(0, pending.y - 32)),
      { snap: false },
    );
    pendingDropRef.current = null;
  }, [canvasWidth, components, moveComponent]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const inInput = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT" || target?.isContentEditable;
      if (event.code === "Space" && !inInput) {
        spaceDownRef.current = true;
        event.preventDefault();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") spaceDownRef.current = false;
    };
    const clearSpace = () => { spaceDownRef.current = false; };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clearSpace);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearSpace);
    };
  }, []);

  const beginPan = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 1 && !(event.button === 0 && spaceDownRef.current)) return;
    const viewportElement = scrollRef.current;
    if (!viewportElement) return;
    event.preventDefault();
    event.stopPropagation();
    const start = {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: viewportElement.scrollLeft,
      scrollTop: viewportElement.scrollTop,
    };
    setIsPanning(true);
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";

    const onMove = (moveEvent: PointerEvent) => {
      viewportElement.scrollLeft = start.scrollLeft - (moveEvent.clientX - start.x);
      viewportElement.scrollTop = start.scrollTop - (moveEvent.clientY - start.y);
    };
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setIsPanning(false);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp, { once: true });
  }, []);

  const beginSelection = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || spaceDownRef.current) return;
    if ((event.target as HTMLElement).closest("[data-freeform-item]")) return;
    const start = toCanvasPoint(event.clientX, event.clientY);
    if (!start) return;
    event.stopPropagation();
    const startingSelection = event.shiftKey ? selectedComponentIds : [];
    let selecting = false;
    let animationFrame = 0;

    const onMove = (moveEvent: PointerEvent) => {
      const current = toCanvasPoint(moveEvent.clientX, moveEvent.clientY);
      if (!current) return;
      const width = Math.abs(current.x - start.x);
      const height = Math.abs(current.y - start.y);
      if (!selecting && width < 3 && height < 3) return;
      selecting = true;
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        const box = {
          x: Math.min(start.x, current.x),
          y: Math.min(start.y, current.y),
          width,
          height,
        };
        setSelectionBox(box);
        const pageRect = pageRef.current?.getBoundingClientRect();
        if (!pageRect) return;
        const ids = Array.from(pageRef.current?.querySelectorAll<HTMLElement>("[data-freeform-item]") ?? [])
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            const elementFrame: FreeformFrame = {
              x: (rect.left - pageRect.left) / scale,
              y: (rect.top - pageRect.top) / scale,
              width: rect.width / scale,
              height: rect.height / scale,
            };
            return framesIntersect(box, elementFrame);
          })
          .map((element) => element.dataset.freeformItem)
          .filter((id): id is string => Boolean(id));
        setCanvasSelection([...startingSelection, ...ids]);
      });
    };

    const onUp = () => {
      cancelAnimationFrame(animationFrame);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      setSelectionBox(null);
      if (!selecting && !event.shiftKey) selectComponent(null);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp, { once: true });
  }, [scale, selectComponent, selectedComponentIds, setCanvasSelection, toCanvasPoint]);

  const recordPaletteDropPoint = useCallback((event: { clientX: number; clientY: number; target: EventTarget | null }) => {
    const target = event.target as HTMLElement | null;
    if (!isDropTarget || target?.closest("[data-freeform-item]")) return;
    const point = toCanvasPoint(event.clientX, event.clientY);
    if (point) pendingDropRef.current = { ...point, at: Date.now() };
  }, [isDropTarget, toCanvasPoint]);

  const handlePointerUpCapture = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    recordPaletteDropPoint(event);
  }, [recordPaletteDropPoint]);

  const handleNativeDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const type = event.dataTransfer.getData("blockType") as ComponentType | "";
    if (!type) return;
    recordPaletteDropPoint(event);
    onAddComponent(type);
  }, [onAddComponent, recordPaletteDropPoint]);

  const handleWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    const direction = event.deltaY > 0 ? -10 : 10;
    setZoom(zoom + direction);
  }, [setZoom, zoom]);

  const gridStyle = useMemo(() => {
    const visible = showGrid ? 0.18 : 0.08;
    if (canvasBackground === "dots") {
      return {
        backgroundImage: `radial-gradient(circle, rgba(71, 85, 105, ${visible}) 1px, transparent 1px)`,
        backgroundSize: `${gridSize}px ${gridSize}px`,
      };
    }
    return {
      backgroundImage: `linear-gradient(rgba(71, 85, 105, ${visible}) 1px, transparent 1px), linear-gradient(90deg, rgba(71, 85, 105, ${visible}) 1px, transparent 1px)`,
      backgroundSize: `${gridSize}px ${gridSize}px`,
    };
  }, [canvasBackground, gridSize, showGrid]);

  return (
    <div
      ref={scrollRef}
      className={`relative flex flex-1 items-start justify-center overflow-auto bg-[#e9eef6] p-8 ${isPanning ? "cursor-grabbing" : ""}`}
      onPointerDownCapture={beginPan}
      onWheel={handleWheel}
    >
      <div
        className="relative shrink-0"
        style={{
          width: canvasWidth,
          transform: zoom !== 100 ? `scale(${scale})` : undefined,
          transformOrigin: "top center",
          marginBottom: zoom !== 100 ? -(canvasHeight * (1 - scale)) : undefined,
        }}
      >
        <div
          ref={(node) => {
            pageRef.current = node;
            dropRef?.(node);
          }}
          className={`relative overflow-visible rounded-xl bg-white shadow-[0_4px_40px_rgba(0,0,0,0.12)] ${
            isDropTarget ? "ring-2 ring-blue-400 ring-offset-4 ring-offset-[#e9eef6]" : ""
          }`}
          style={{ width: canvasWidth, minHeight: canvasHeight, ...gridStyle }}
          onPointerDown={beginSelection}
          onPointerMoveCapture={recordPaletteDropPoint}
          onPointerUpCapture={handlePointerUpCapture}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleNativeDrop}
        >
          {showRulers && <Rulers width={canvasWidth} height={canvasHeight} gridSize={gridSize} />}
          <GuideOverlay guides={guides} width={canvasWidth} height={canvasHeight} />
          {selectedComponentIds.length > 1 && (
            <MultiSelectionStyleBar
              count={selectedComponentIds.length}
              onColorChange={(color) => applyStylesToSelected({ color })}
              onBackgroundChange={(backgroundColor) => applyStylesToSelected({ backgroundColor })}
            />
          )}

          {components.map((component, index) => (
            <FreeformItem
              key={component.id}
              component={component}
              index={index}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              zoom={zoom}
              onGuidesChange={setGuides}
            />
          ))}

          {selectionBox && (
            <div
              className="pointer-events-none absolute z-[9990] border border-blue-500 bg-blue-400/10"
              style={{
                left: selectionBox.x,
                top: selectionBox.y,
                width: selectionBox.width,
                height: selectionBox.height,
              }}
            />
          )}

          {components.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-center text-[#94a3b8]">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-dashed border-[#cbd5e1] bg-white/80 text-2xl">+</div>
              <div>
                <p className="text-[15px] font-bold text-[#566583]">Freeform canvas</p>
                <p className="mt-1 text-[13px]">Drop a block, then drag its label to position it.</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-semibold text-[#64748b]">
          <span>{canvasWidth}px artboard · {gridSize}px snap grid</span>
          <span>{viewport === "desktop"
            ? "Hold Space + drag to pan · Ctrl/Cmd + wheel to zoom"
            : "Responsive review: freeform coordinates may need adjustment at this breakpoint"}
          </span>
        </div>
      </div>

      <div className="sticky right-3 top-3 ml-3 flex h-fit items-center gap-0.5 rounded-lg border border-[#dbe3ef] bg-white/95 p-1 shadow-sm backdrop-blur">
        <button
          type="button"
          title="Zoom out"
          onClick={() => setZoom(zoom - 10)}
          className="flex h-7 w-7 items-center justify-center rounded text-[#566583] transition hover:bg-slate-100 disabled:opacity-30"
          disabled={zoom <= 25}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-10 text-center text-[11px] font-bold tabular-nums text-[#0B1D40]">{zoom}%</span>
        <button
          type="button"
          title="Zoom in"
          onClick={() => setZoom(zoom + 10)}
          className="flex h-7 w-7 items-center justify-center rounded text-[#566583] transition hover:bg-slate-100 disabled:opacity-30"
          disabled={zoom >= 200}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Reset zoom"
          onClick={() => setZoom(100)}
          className="ml-1 flex h-7 w-7 items-center justify-center rounded border-l border-[#e2e8f0] text-[#566583] transition hover:bg-slate-100"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function MultiSelectionStyleBar({
  count,
  onColorChange,
  onBackgroundChange,
}: {
  count: number;
  onColorChange: (color: string) => void;
  onBackgroundChange: (color: string) => void;
}) {
  return (
    <div
      className="absolute right-3 top-7 z-[9995] flex items-center gap-2 rounded-lg border border-blue-100 bg-white/95 px-2 py-1.5 text-[11px] font-semibold text-[#0B1D40] shadow-md backdrop-blur"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <Paintbrush className="h-3.5 w-3.5 text-blue-600" />
      <span>{count} selected</span>
      <label className="flex items-center gap-1 text-[#566583]" title="Apply text color to selected layers">
        Text
        <input
          aria-label="Apply text color to selected layers"
          type="color"
          defaultValue="#0b1d40"
          onChange={(event) => onColorChange(event.currentTarget.value)}
          className="h-5 w-5 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
        />
      </label>
      <label className="flex items-center gap-1 text-[#566583]" title="Apply background color to selected layers">
        Fill
        <input
          aria-label="Apply background color to selected layers"
          type="color"
          defaultValue="#ffffff"
          onChange={(event) => onBackgroundChange(event.currentTarget.value)}
          className="h-5 w-5 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
        />
      </label>
    </div>
  );
}

function GuideOverlay({ guides, width, height }: { guides: FreeformGuide[]; width: number; height: number }) {
  if (guides.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-[9980] overflow-hidden">
      {guides.map((guide, index) => guide.distance ? (
        <span
          key={`${guide.axis}-distance-${index}`}
          className="absolute rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white shadow-sm"
          style={guide.axis === "x"
            ? { left: guide.position, top: 4, transform: "translateX(-50%)" }
            : { left: 4, top: guide.position, transform: "translateY(-50%)" }}
        >
          {guide.distance}px
        </span>
      ) : guide.axis === "x" ? (
        <div
          key={`x-${index}`}
          className="absolute top-0 w-px bg-blue-500/90 shadow-[0_0_6px_rgba(59,130,246,0.65)]"
          style={{ left: guide.position, height }}
        />
      ) : (
        <div
          key={`y-${index}`}
          className="absolute left-0 h-px bg-blue-500/90 shadow-[0_0_6px_rgba(59,130,246,0.65)]"
          style={{ top: guide.position, width }}
        />
      ))}
    </div>
  );
}

function Rulers({ width, height, gridSize }: { width: number; height: number; gridSize: number }) {
  const major = Math.max(gridSize * 8, 32);
  return (
    <>
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 z-[9970] h-5 border-b border-slate-200 bg-white/85"
        style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent 0, transparent calc(100% - 1px), rgba(100,116,139,0.35) calc(100% - 1px))", backgroundSize: `${major}px 100%` }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 top-0 z-[9970] w-5 border-r border-slate-200 bg-white/85"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent 0, transparent calc(100% - 1px), rgba(100,116,139,0.35) calc(100% - 1px))", backgroundSize: `100% ${major}px` }}
      />
      <span className="pointer-events-none absolute left-1 top-1 z-[9971] text-[8px] font-bold text-slate-400">0</span>
      <span className="pointer-events-none absolute right-1 top-1 z-[9971] text-[8px] font-bold text-slate-400">{width}</span>
      <span className="pointer-events-none absolute bottom-1 left-1 z-[9971] text-[8px] font-bold text-slate-400">{height}</span>
    </>
  );
}

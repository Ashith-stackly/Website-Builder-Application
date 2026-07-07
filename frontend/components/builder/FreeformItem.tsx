"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, Lock, LockOpen, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useBuilderStore } from "@/store/builderStore";
import { componentRegistry } from "@/lib/componentRegistry";
import type { BuilderComponent, Viewport } from "@/types/builder";

const SNAP = 8; // grid snap in px
const MIN_W = 120;
const MIN_H = 40;

function snap(v: number) {
  return Math.round(v / SNAP) * SNAP;
}

type ResizeHandle =
  | "nw" | "n" | "ne"
  | "w"         | "e"
  | "sw" | "s" | "se";

const HANDLES: ResizeHandle[] = ["nw", "n", "ne", "w", "e", "sw", "s", "se"];

const HANDLE_CLASSES: Record<ResizeHandle, string> = {
  nw: "-top-1.5 -left-1.5 cursor-nw-resize",
  n:  "-top-1.5 left-1/2 -translate-x-1/2 cursor-n-resize",
  ne: "-top-1.5 -right-1.5 cursor-ne-resize",
  w:  "top-1/2 -translate-y-1/2 -left-1.5 cursor-w-resize",
  e:  "top-1/2 -translate-y-1/2 -right-1.5 cursor-e-resize",
  sw: "-bottom-1.5 -left-1.5 cursor-sw-resize",
  s:  "-bottom-1.5 left-1/2 -translate-x-1/2 cursor-s-resize",
  se: "-bottom-1.5 -right-1.5 cursor-se-resize",
};

interface FreeformItemProps {
  component: BuilderComponent;
  /** Other components – used for alignment guide calculation */
  siblings: BuilderComponent[];
}

export default function FreeformItem({ component, siblings }: FreeformItemProps) {
  const Renderer = componentRegistry[component.type];
  const isSelected = useBuilderStore((s) => s.selectedComponentId === component.id);
  const selectComponent = useBuilderStore((s) => s.selectComponent);
  const moveComponent  = useBuilderStore((s) => s.moveComponent);
  const resizeComponent = useBuilderStore((s) => s.resizeComponent);
  const duplicateComponent = useBuilderStore((s) => s.duplicateComponent);
  const deleteComponent = useBuilderStore((s) => s.deleteComponent);
  const toggleLock = useBuilderStore((s) => s.toggleLock);
  const moveLayer = useBuilderStore((s) => s.moveLayer);
  const updateComponent = useBuilderStore((s) => s.updateComponent);
  const viewport = useBuilderStore((s) => s.viewport) as Viewport;

  const isLocked = component.locked ?? false;

  // Position from component data (freeform)
  const posX = component.position?.x ?? 40;
  const posY = component.position?.y ?? 40;
  const width  = component.freeformSize?.width  ?? 640;
  const height = component.freeformSize?.height ?? null; // null = auto

  // Local state during drag/resize
  const [pos, setPos] = useState({ x: posX, y: posY });
  const [size, setSize] = useState({ w: width, h: height ?? 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [guides, setGuides] = useState<{ x?: number; y?: number }>({});

  // Sync position from store (e.g. after undo) without cascading render effects.
  useEffect(() => {
    const id = window.setTimeout(() => setPos({ x: posX, y: posY }), 0);
    return () => window.clearTimeout(id);
  }, [posX, posY]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSize((current) => ({ w: width, h: height ?? current.h }));
    }, 0);
    return () => window.clearTimeout(id);
  }, [width, height]);

  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const resizeStart = useRef({ mx: 0, my: 0, pw: 0, ph: 0, px: 0, py: 0, handle: "se" as ResizeHandle });
  const itemRef = useRef<HTMLDivElement>(null);

  /* ─── DRAG to reposition ─────────────────────────────────────── */
  const onDragMouseDown = useCallback((e: React.MouseEvent) => {
    if (isLocked || e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    selectComponent(component.id);
    setIsDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };

    const onMove = (mv: MouseEvent) => {
      const dx = mv.clientX - dragStart.current.mx;
      const dy = mv.clientY - dragStart.current.my;
      const nx = snap(dragStart.current.px + dx);
      const ny = snap(Math.max(0, dragStart.current.py + dy));
      setPos({ x: nx, y: ny });

      // Compute snap guides vs siblings
      const newGuides: { x?: number; y?: number } = {};
      for (const sib of siblings) {
        if (sib.id === component.id) continue;
        const sx = sib.position?.x ?? 0;
        const sy = sib.position?.y ?? 0;
        const sw = sib.freeformSize?.width ?? 640;
        if (Math.abs(nx - sx) < 8) newGuides.x = sx;
        if (Math.abs(ny - sy) < 8) newGuides.y = sy;
        if (Math.abs(nx + size.w - (sx + sw)) < 8) newGuides.x = sx + sw - size.w;
      }
      setGuides(newGuides);
    };

    const onUp = (uv: MouseEvent) => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      setIsDragging(false);
      setGuides({});
      const dx = uv.clientX - dragStart.current.mx;
      const dy = uv.clientY - dragStart.current.my;
      const fx = snap(dragStart.current.px + dx);
      const fy = snap(Math.max(0, dragStart.current.py + dy));
      moveComponent(component.id, fx, fy);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [isLocked, pos, size.w, component.id, selectComponent, moveComponent, siblings]);

  /* ─── RESIZE ─────────────────────────────────────────────────── */
  const onResizeMouseDown = useCallback((e: React.MouseEvent, handle: ResizeHandle) => {
    if (isLocked || e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    const el = itemRef.current;
    const currentH = el ? el.getBoundingClientRect().height : (size.h || 200);
    resizeStart.current = {
      mx: e.clientX, my: e.clientY,
      pw: size.w, ph: currentH,
      px: pos.x, py: pos.y,
      handle,
    };

    const onMove = (mv: MouseEvent) => {
      const { mx, my, pw, ph, px, py, handle } = resizeStart.current;
      const dx = mv.clientX - mx;
      const dy = mv.clientY - my;
      let nw = pw, nh = ph, nx = px, ny = py;

      if (handle.includes("e")) nw = snap(Math.max(MIN_W, pw + dx));
      if (handle.includes("w")) { nw = snap(Math.max(MIN_W, pw - dx)); nx = snap(px + pw - nw); }
      if (handle.includes("s")) nh = snap(Math.max(MIN_H, ph + dy));
      if (handle.includes("n")) { nh = snap(Math.max(MIN_H, ph - dy)); ny = snap(py + ph - nh); }

      setPos({ x: nx, y: ny });
      setSize({ w: nw, h: nh });
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      setIsResizing(false);
      // Get final from state via ref pattern
      const el2 = itemRef.current;
      const finalH = el2 ? el2.getBoundingClientRect().height : resizeStart.current.ph;
      resizeComponent(component.id, size.w, size.h || finalH);
      moveComponent(component.id, pos.x, pos.y);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [isLocked, size, pos, component.id, resizeComponent, moveComponent]);

  /* ─── Content inline-edit handler for Renderer ──────────────── */
  const handleUpdate = useCallback((content: string | null) => {
    if (content !== null) updateComponent(component.id, { content });
  }, [component.id, updateComponent]);

  const handlePatch = useCallback((patch: Partial<BuilderComponent>) => {
    updateComponent(component.id, patch);
  }, [component.id, updateComponent]);

  const viewportComponent = useMemo(() => {
    if (viewport === "desktop" || !component.responsiveStyles) return component;
    const overrides = component.responsiveStyles[viewport];
    if (!overrides || Object.keys(overrides).length === 0) return component;
    return { ...component, styles: { ...component.styles, ...overrides } };
  }, [component, viewport]);

  if (!Renderer) return null;

  const zIndex = component.zIndex ?? 1;

  return (
    <>
      {/* Snap guide lines */}
      {isDragging && guides.x !== undefined && (
        <div
          className="pointer-events-none absolute top-0 bottom-0 z-[9998] w-px bg-blue-500"
          style={{ left: guides.x }}
        />
      )}
      {isDragging && guides.y !== undefined && (
        <div
          className="pointer-events-none absolute left-0 right-0 z-[9998] h-px bg-blue-500"
          style={{ top: guides.y }}
        />
      )}

      <div
        ref={itemRef}
        className={`absolute group ${isLocked ? "opacity-80" : ""}`}
        style={{
          left: pos.x,
          top: pos.y,
          width: size.w,
          height: size.h ? size.h : undefined,
          zIndex: isSelected ? zIndex + 100 : zIndex,
          userSelect: isDragging || isResizing ? "none" : undefined,
        }}
        onClick={(e) => { e.stopPropagation(); selectComponent(component.id); }}
      >
        {/* Drag handle — top bar shown on hover/select */}
        <div
          className={`absolute -top-8 left-0 right-0 flex items-center justify-between gap-1 rounded-t-lg px-2 py-1 transition-all duration-150 ${
            isSelected
              ? "bg-blue-600 opacity-100"
              : "bg-[#0B1D40] opacity-0 group-hover:opacity-100"
          }`}
          style={{ zIndex: 10 }}
          onMouseDown={onDragMouseDown}
        >
          <span className="truncate text-[10px] font-bold uppercase tracking-widest text-white/80 cursor-grab active:cursor-grabbing select-none">
            ⠿ {component.type}
          </span>
          {isSelected && (
            <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
              <ActionBtn title="Move Up" onClick={() => moveLayer(component.id, "forward")}>
                <ArrowUp className="h-3 w-3" />
              </ActionBtn>
              <ActionBtn title="Move Down" onClick={() => moveLayer(component.id, "backward")}>
                <ArrowDown className="h-3 w-3" />
              </ActionBtn>
              <ActionBtn title="Duplicate" onClick={() => duplicateComponent(component.id)}>
                <Copy className="h-3 w-3" />
              </ActionBtn>
              <ActionBtn title={isLocked ? "Unlock" : "Lock"} onClick={() => toggleLock(component.id)}>
                {isLocked ? <LockOpen className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              </ActionBtn>
              <ActionBtn title="Delete" onClick={() => deleteComponent(component.id)} danger>
                <Trash2 className="h-3 w-3" />
              </ActionBtn>
            </div>
          )}
        </div>

        {/* Selection border */}
        <div
          className={`absolute inset-0 rounded-xl pointer-events-none transition-all duration-150 ${
            isSelected
              ? "ring-2 ring-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.15)]"
              : "ring-1 ring-transparent group-hover:ring-blue-300"
          }`}
          style={{ zIndex: 5 }}
        />

        {/* Content renderer */}
        <div
          className={`w-full h-full min-h-[40px] overflow-hidden rounded-xl bg-white ${
            isDragging || isResizing ? "pointer-events-none" : ""
          }`}
          onDoubleClick={(e) => { e.stopPropagation(); }}
        >
          <Renderer
            component={viewportComponent}
            isEditing={false}
            onUpdate={handleUpdate}
            onPatch={handlePatch}
          />
        </div>

        {/* Resize handles — shown when selected */}
        {isSelected && !isLocked && HANDLES.map((handle) => (
          <div
            key={handle}
            className={`absolute h-3 w-3 rounded-full border-2 border-blue-500 bg-white shadow-md transition-opacity ${HANDLE_CLASSES[handle]}`}
            style={{ zIndex: 20 }}
            onMouseDown={(e) => onResizeMouseDown(e, handle)}
          />
        ))}
      </div>
    </>
  );
}

function ActionBtn({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-5 w-5 items-center justify-center rounded transition ${
        danger
          ? "text-red-300 hover:bg-red-500/20 hover:text-red-200"
          : "text-white/70 hover:bg-white/20 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

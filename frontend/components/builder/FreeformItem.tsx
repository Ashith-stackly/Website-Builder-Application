"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Copy, Lock, LockOpen, Trash2 } from "lucide-react";
import { componentRegistry } from "@/lib/componentRegistry";
import { useBuilderStore } from "@/store/builderStore";
import { useBuilderUiStore } from "@/store/builderUiStore";
import type { BuilderComponent, Viewport } from "@/types/builder";
import {
  alignFreeformFrame,
  clampFrameToBounds,
  FREEFORM_MIN_HEIGHT,
  FREEFORM_MIN_WIDTH,
  getFreeformFrame,
  snapToGrid,
  type FreeformFrame,
  type FreeformGuide,
} from "./freeformGeometry";

type ResizeHandle = "nw" | "n" | "ne" | "w" | "e" | "sw" | "s" | "se";

const HANDLES: ResizeHandle[] = ["nw", "n", "ne", "w", "e", "sw", "s", "se"];

const HANDLE_CLASSES: Record<ResizeHandle, string> = {
  nw: "-left-1.5 -top-1.5 cursor-nw-resize",
  n: "-top-1.5 left-1/2 -translate-x-1/2 cursor-n-resize",
  ne: "-right-1.5 -top-1.5 cursor-ne-resize",
  w: "-left-1.5 top-1/2 -translate-y-1/2 cursor-w-resize",
  e: "-right-1.5 top-1/2 -translate-y-1/2 cursor-e-resize",
  sw: "-bottom-1.5 -left-1.5 cursor-sw-resize",
  s: "-bottom-1.5 left-1/2 -translate-x-1/2 cursor-s-resize",
  se: "-bottom-1.5 -right-1.5 cursor-se-resize",
};

interface FreeformItemProps {
  component: BuilderComponent;
  index: number;
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  onGuidesChange: (guides: FreeformGuide[]) => void;
}

function FreeformItem({
  component,
  index,
  canvasWidth,
  canvasHeight,
  zoom,
  onGuidesChange,
}: FreeformItemProps) {
  const Renderer = componentRegistry[component.type];
  const selectedComponentIds = useBuilderStore((state) => state.selectedComponentIds);
  const selectedComponentId = useBuilderStore((state) => state.selectedComponentId);
  const selectComponent = useBuilderStore((state) => state.selectComponent);
  const toggleSelectComponent = useBuilderStore((state) => state.toggleSelectComponent);
  const beginFreeformInteraction = useBuilderStore((state) => state.beginFreeformInteraction);
  const moveComponent = useBuilderStore((state) => state.moveComponent);
  const moveComponents = useBuilderStore((state) => state.moveComponents);
  const resizeComponent = useBuilderStore((state) => state.resizeComponent);
  const updateComponent = useBuilderStore((state) => state.updateComponent);
  const duplicateComponent = useBuilderStore((state) => state.duplicateComponent);
  const deleteComponent = useBuilderStore((state) => state.deleteComponent);
  const toggleLock = useBuilderStore((state) => state.toggleLock);
  const moveLayer = useBuilderStore((state) => state.moveLayer);
  const viewport = useBuilderStore((state) => state.viewport) as Viewport;
  const snapEnabled = useBuilderUiStore((state) => state.snapToGrid);
  const gridSize = useBuilderUiStore((state) => state.gridSize);

  const isSelected = selectedComponentIds.includes(component.id);
  const isPrimarySelection = selectedComponentId === component.id;
  const isLocked = component.locked ?? false;
  const pageBounds = useMemo(
    () => ({ width: canvasWidth, height: canvasHeight }),
    [canvasHeight, canvasWidth],
  );
  const sourceFrame = useMemo(
    () => getFreeformFrame(component, index, canvasWidth),
    [canvasWidth, component, index],
  );
  const [frame, setFrame] = useState<FreeformFrame>(sourceFrame);
  const [isInteracting, setIsInteracting] = useState(false);
  const frameRef = useRef(sourceFrame);
  const interactionRef = useRef(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const scale = zoom / 100;
  const snapValue = useCallback(
    (value: number) => (snapEnabled ? snapToGrid(value, gridSize) : Math.round(value)),
    [gridSize, snapEnabled],
  );

  const setLocalFrame = useCallback((next: FreeformFrame) => {
    frameRef.current = next;
    setFrame(next);
  }, []);

  // Imports, undo/redo, breakpoint changes, and sibling group moves replace
  // the component frame in the store. Schedule the visual sync after React's
  // commit so a pointer interaction never gets overwritten mid-drag.
  useEffect(() => {
    if (isInteracting) return;
    const timeout = window.setTimeout(() => {
      if (!interactionRef.current) setLocalFrame(sourceFrame);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [isInteracting, setLocalFrame, sourceFrame]);

  const viewportComponent = useMemo(() => {
    if (viewport === "desktop" || !component.responsiveStyles) return component;
    const overrides = component.responsiveStyles[viewport];
    if (!overrides || Object.keys(overrides).length === 0) return component;
    return { ...component, styles: { ...component.styles, ...overrides } };
  }, [component, viewport]);

  const beginDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (isLocked || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    if (!isSelected) selectComponent(component.id);
    const startPointer = { x: event.clientX, y: event.clientY };
    const startFrame = frameRef.current;
    const selectedIds = selectedComponentIds.includes(component.id)
      ? selectedComponentIds
      : [component.id];
    // Read the latest tree once at pointer-down. We deliberately do not pass
    // the complete sibling array through every item render: untouched blocks
    // can then stay memoized during a large multi-block drag.
    const currentComponents = useBuilderStore.getState().components;
    const siblingFrames = currentComponents
      .filter((sibling) => sibling.id !== component.id && !selectedIds.includes(sibling.id))
      .map((sibling, siblingIndex) => getFreeformFrame(sibling, siblingIndex, canvasWidth));
    const movableItems = currentComponents
      .map((sibling, siblingIndex) => ({
        component: sibling,
        frame: sibling.id === component.id
          ? startFrame
          : getFreeformFrame(sibling, siblingIndex, canvasWidth),
      }))
      .filter(({ component: sibling }) => selectedIds.includes(sibling.id) && !sibling.locked);
    let moved = false;
    let animationFrame = 0;

    const onMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startPointer.x) / scale;
      const dy = (moveEvent.clientY - startPointer.y) / scale;
      if (!moved && Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
      if (!moved) {
        moved = true;
        interactionRef.current = true;
        setIsInteracting(true);
        beginFreeformInteraction();
        document.body.style.cursor = "grabbing";
        document.body.style.userSelect = "none";
      }

      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        const snapped = clampFrameToBounds({
          ...startFrame,
          x: snapValue(startFrame.x + dx),
          y: snapValue(startFrame.y + dy),
        }, pageBounds);
        const aligned = alignFreeformFrame(snapped, siblingFrames, pageBounds);
        setLocalFrame(aligned.frame);
        onGuidesChange(aligned.guides);
        const deltaX = aligned.frame.x - startFrame.x;
        const deltaY = aligned.frame.y - startFrame.y;
        moveComponents(
          movableItems
            .filter(({ component: sibling }) => sibling.id !== component.id)
            .map(({ component: sibling, frame: siblingFrame }) => ({
              id: sibling.id,
              x: siblingFrame.x + deltaX,
              y: siblingFrame.y + deltaY,
            })),
          { snap: false },
        );
      });
    };

    const onUp = () => {
      cancelAnimationFrame(animationFrame);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      onGuidesChange([]);
      if (moved) {
        const deltaX = frameRef.current.x - startFrame.x;
        const deltaY = frameRef.current.y - startFrame.y;
        moveComponents(
          movableItems.map(({ component: sibling, frame: siblingFrame }) => ({
            id: sibling.id,
            x: siblingFrame.x + deltaX,
            y: siblingFrame.y + deltaY,
          })),
          { snap: false },
        );
      }
      setIsInteracting(false);
      interactionRef.current = false;
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp, { once: true });
  }, [beginFreeformInteraction, canvasWidth, component.id, isLocked, isSelected, moveComponents, onGuidesChange, pageBounds, scale, selectComponent, selectedComponentIds, setLocalFrame, snapValue]);

  const beginResize = useCallback((event: React.PointerEvent<HTMLDivElement>, handle: ResizeHandle) => {
    if (isLocked || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    if (!isSelected) selectComponent(component.id);

    const measuredHeight = itemRef.current?.offsetHeight ?? frameRef.current.height;
    const startFrame = { ...frameRef.current, height: measuredHeight };
    const startPointer = { x: event.clientX, y: event.clientY };
    let changed = false;
    let animationFrame = 0;

    const onMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startPointer.x) / scale;
      const dy = (moveEvent.clientY - startPointer.y) / scale;
      if (!changed && Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
      if (!changed) {
        changed = true;
        interactionRef.current = true;
        setIsInteracting(true);
        beginFreeformInteraction();
        document.body.style.userSelect = "none";
      }

      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        let next = { ...startFrame };
        if (handle.includes("e")) next.width = snapValue(Math.max(FREEFORM_MIN_WIDTH, startFrame.width + dx));
        if (handle.includes("s")) next.height = snapValue(Math.max(FREEFORM_MIN_HEIGHT, startFrame.height + dy));
        if (handle.includes("w")) {
          next.width = snapValue(Math.max(FREEFORM_MIN_WIDTH, startFrame.width - dx));
          next.x = snapValue(startFrame.x + startFrame.width - next.width);
        }
        if (handle.includes("n")) {
          next.height = snapValue(Math.max(FREEFORM_MIN_HEIGHT, startFrame.height - dy));
          next.y = snapValue(startFrame.y + startFrame.height - next.height);
        }
        next = clampFrameToBounds(next, pageBounds);
        setLocalFrame(next);
      });
    };

    const onUp = () => {
      cancelAnimationFrame(animationFrame);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.body.style.userSelect = "";
      if (changed) {
        moveComponent(component.id, frameRef.current.x, frameRef.current.y, { snap: false });
        resizeComponent(component.id, frameRef.current.width, frameRef.current.height, { snap: false });
      }
      setIsInteracting(false);
      interactionRef.current = false;
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp, { once: true });
  }, [beginFreeformInteraction, component.id, isLocked, isSelected, moveComponent, pageBounds, resizeComponent, scale, selectComponent, setLocalFrame, snapValue]);

  const handleItemPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || isLocked) return;
    event.stopPropagation();
    if (event.shiftKey) {
      toggleSelectComponent(component.id);
      return;
    }
    if (!isSelected || selectedComponentIds.length > 1) selectComponent(component.id);
  }, [component.id, isLocked, isSelected, selectComponent, selectedComponentIds.length, toggleSelectComponent]);

  const zIndexFromStyles = Number.parseInt(component.styles.zIndex ?? "", 10);
  const zIndex = Number.isFinite(zIndexFromStyles)
    ? zIndexFromStyles
    : component.zIndex ?? index + 1;

  if (!Renderer) return null;

  return (
    <div
      ref={itemRef}
      data-freeform-item={component.id}
      className={`group absolute rounded-xl ${isLocked ? "opacity-80" : ""} ${component.hidden ? "opacity-40" : ""}`}
      style={{
        left: frame.x,
        top: frame.y,
        width: frame.width,
        height: component.freeformSize ? frame.height : undefined,
        zIndex: isSelected ? zIndex + 100 : zIndex,
        userSelect: isInteracting ? "none" : undefined,
      }}
      onPointerDown={handleItemPointerDown}
      onClick={(event) => event.stopPropagation()}
    >
      <div
        data-freeform-control
        className={`absolute -top-8 left-0 right-0 flex items-center justify-between gap-1 rounded-t-lg px-2 py-1 transition-all duration-150 ${
          isSelected
            ? "bg-blue-600 opacity-100"
            : "bg-[#0B1D40] opacity-0 group-hover:opacity-100"
        }`}
        style={{ zIndex: 10 }}
        onPointerDown={beginDrag}
      >
        <span className="cursor-grab select-none truncate text-[10px] font-bold uppercase tracking-widest text-white/80 active:cursor-grabbing">
          ⠿ {component.type}
        </span>
        {isPrimarySelection && (
          <div className="flex items-center gap-1" onPointerDown={(event) => event.stopPropagation()}>
            <ActionButton title="Bring forward" onClick={() => moveLayer(component.id, "forward")}>
              <ArrowUp className="h-3 w-3" />
            </ActionButton>
            <ActionButton title="Send backward" onClick={() => moveLayer(component.id, "backward")}>
              <ArrowDown className="h-3 w-3" />
            </ActionButton>
            <ActionButton title="Duplicate" onClick={() => duplicateComponent(component.id)}>
              <Copy className="h-3 w-3" />
            </ActionButton>
            <ActionButton title={isLocked ? "Unlock" : "Lock"} onClick={() => toggleLock(component.id)}>
              {isLocked ? <LockOpen className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            </ActionButton>
            <ActionButton title="Delete" onClick={() => deleteComponent(component.id)} danger>
              <Trash2 className="h-3 w-3" />
            </ActionButton>
          </div>
        )}
      </div>

      <div
        className={`pointer-events-none absolute inset-0 rounded-xl transition-all duration-150 ${
          isSelected
            ? "ring-2 ring-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.15)]"
            : "ring-1 ring-transparent group-hover:ring-blue-300"
        }`}
        style={{ zIndex: 5 }}
      />

      <div
        className={`h-full min-h-[40px] w-full overflow-hidden rounded-xl bg-white ${
          isInteracting ? "pointer-events-none" : ""
        }`}
      >
        <Renderer
          component={viewportComponent}
          isEditing={false}
          onUpdate={(content) => {
            if (content !== null) updateComponent(component.id, { content });
          }}
          onPatch={(patch) => updateComponent(component.id, patch)}
        />
      </div>

      {isPrimarySelection && !isLocked && HANDLES.map((handle) => (
        <div
          key={handle}
          data-freeform-control
          className={`absolute h-3 w-3 rounded-full border-2 border-blue-500 bg-white shadow-md transition-transform hover:scale-125 ${HANDLE_CLASSES[handle]}`}
          style={{ zIndex: 20 }}
          onPointerDown={(event) => beginResize(event, handle)}
        />
      ))}
    </div>
  );
}

function ActionButton({
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
      data-freeform-control
      type="button"
      title={title}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
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

export default memo(FreeformItem);

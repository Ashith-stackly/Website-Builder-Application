"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { FaMinus, FaPlus, FaTrash } from "react-icons/fa";
import {
  computeDividerPositionFromAnchor,
  normalizeOverlayPosition,
  type BlockpagesOverlayKind,
  type BlockpagesOverlayPosition,
} from "@/lib/blockpagesOverlayLayers";

type BlockpagesPositionedOverlayProps = {
  id: string;
  index: number;
  kind: BlockpagesOverlayKind;
  position?: BlockpagesOverlayPosition;
  scale?: number;
  onPositionChange: (id: string, position: BlockpagesOverlayPosition) => void;
  onScaleChange?: (id: string, scale: number) => void;
  onRemove: (id: string) => void;
  children: ReactNode;
  contentStyle?: CSSProperties;
};

function stopOverlayDrag(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

export default function BlockpagesPositionedOverlay({
  id,
  index,
  kind,
  position,
  scale = 1,
  onPositionChange,
  onScaleChange,
  onRemove,
  children,
  contentStyle,
}: BlockpagesPositionedOverlayProps) {
  const resolvedPosition = normalizeOverlayPosition(position, index, kind);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; originTop: number; originLeft: number } | null>(null);
  const [layoutPosition, setLayoutPosition] = useState(resolvedPosition);

  const syncLayoutFromAnchor = () => {
    if (kind !== "divider" || !overlayRef.current) {
      setLayoutPosition(resolvedPosition);
      return resolvedPosition;
    }

    if (typeof position?.top === "number" && typeof position?.left === "number") {
      const nextPosition = { top: position.top, left: position.left };
      setLayoutPosition(nextPosition);
      return nextPosition;
    }

    const hasAnchor = Boolean(
      position?.sectionId || (position?.anchorPath?.length && position?.insertMode)
    );
    if (!hasAnchor) {
      setLayoutPosition(resolvedPosition);
      return resolvedPosition;
    }

    const container = overlayRef.current.closest<HTMLElement>('[data-blockpages-overlay-container="true"]');
    const templateRoot = container?.querySelector<HTMLElement>("[data-blockpages-template-root]");
    if (!container || !templateRoot || !position?.anchorPath || !position.insertMode) {
      setLayoutPosition(resolvedPosition);
      return resolvedPosition;
    }

    const anchored = computeDividerPositionFromAnchor(
      templateRoot,
      container,
      { path: position.anchorPath, mode: position.insertMode },
      resolvedPosition.left
    );

    const nextPosition = anchored ?? resolvedPosition;
    setLayoutPosition(nextPosition);
    return nextPosition;
  };

  useLayoutEffect(() => {
    syncLayoutFromAnchor();
  }, [
    kind,
    position?.top,
    position?.left,
    position?.sectionId,
    position?.anchorPath,
    position?.insertMode,
    resolvedPosition.top,
    resolvedPosition.left,
  ]);

  useLayoutEffect(() => {
    if (kind !== "divider") return;

    const scrollRoot =
      overlayRef.current?.closest<HTMLElement>("[data-textblock-canvas]") ??
      overlayRef.current?.closest<HTMLElement>("[data-blockpages-scroll-root]");

    const handleLayoutSync = () => {
      if (typeof position?.top === "number" && typeof position?.left === "number") return;
      syncLayoutFromAnchor();
    };

    scrollRoot?.addEventListener("scroll", handleLayoutSync, { passive: true });
    window.addEventListener("resize", handleLayoutSync);

    return () => {
      scrollRoot?.removeEventListener("scroll", handleLayoutSync);
      window.removeEventListener("resize", handleLayoutSync);
    };
  }, [kind, position?.top, position?.left, position?.sectionId, position?.anchorPath, position?.insertMode]);

  const overlayStyle: CSSProperties =
    kind === "divider"
      ? {
          top: `${Math.max(0, layoutPosition.top)}px`,
          left: `${Math.max(0, layoutPosition.left)}px`,
          width: `max(120px, calc(100% - ${Math.max(0, layoutPosition.left) + 16}px))`,
          maxWidth: `max(120px, calc(100% - ${Math.max(0, layoutPosition.left) + 16}px))`,
          minHeight: "12px",
        }
      : {
          top: `${Math.max(0, layoutPosition.top)}px`,
          left: `${Math.max(0, layoutPosition.left)}px`,
        };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('[data-blockpages-overlay-toolbar="true"]')) return;

    const current = syncLayoutFromAnchor();

    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originTop: current.top,
      originLeft: current.left,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !overlayRef.current) return;

    const deltaX = event.clientX - dragRef.current.startX;
    const deltaY = event.clientY - dragRef.current.startY;

    overlayRef.current.style.top = `${dragRef.current.originTop + deltaY}px`;
    overlayRef.current.style.left = `${dragRef.current.originLeft + deltaX}px`;
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !overlayRef.current) return;

    const deltaX = event.clientX - dragRef.current.startX;
    const deltaY = event.clientY - dragRef.current.startY;
    const nextTop = dragRef.current.originTop + deltaY;
    const nextLeft = Math.max(0, dragRef.current.originLeft + deltaX);

    overlayRef.current.style.top = `${nextTop}px`;
    overlayRef.current.style.left = `${nextLeft}px`;

    onPositionChange(id, {
      top: nextTop,
      left: nextLeft,
      anchorPath: undefined,
      insertMode: undefined,
      sectionId: undefined,
    });

    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div
      ref={overlayRef}
      data-blockpages-overlay="true"
      data-blockpages-overlay-kind={kind}
      data-blockpages-overlay-id={id}
      data-blockpages-divider-section-id={kind === "divider" ? position?.sectionId : undefined}
      className="pointer-events-none absolute z-[120] flex max-w-full flex-col items-stretch bg-transparent"
      style={overlayStyle}
    >
      <div
        className="group/inner pointer-events-auto relative flex w-full flex-col items-center outline-none"
        tabIndex={0}
      >
        <div
          data-builder-chrome="true"
          data-blockpages-overlay-toolbar="true"
          className="pointer-events-auto absolute -top-10 left-1/2 z-[130] flex -translate-x-1/2 items-center gap-2 rounded-lg border border-gray-200 bg-white p-1.5 shadow-xl opacity-100 sm:opacity-0 transition-opacity sm:group-hover/inner:opacity-100 group-focus-within/inner:opacity-100"
        >
          {onScaleChange ? (
            <>
              <button
                type="button"
                data-blockpages-overlay-scale-action="decrease"
                data-overlay-id={id}
                onPointerDown={stopOverlayDrag}
                onClick={(event) => {
                  stopOverlayDrag(event);
                  onScaleChange(id, Math.max(0.2, scale - 0.1));
                }}
                className="flex cursor-pointer items-center justify-center rounded-md bg-gray-100 p-1.5 text-gray-700 shadow-sm transition-transform hover:scale-105 hover:bg-gray-200"
                title="Decrease Size"
              >
                <FaMinus size={12} />
              </button>
              <button
                type="button"
                data-blockpages-overlay-scale-action="increase"
                data-overlay-id={id}
                onPointerDown={stopOverlayDrag}
                onClick={(event) => {
                  stopOverlayDrag(event);
                  onScaleChange(id, scale + 0.1);
                }}
                className="flex cursor-pointer items-center justify-center rounded-md bg-gray-100 p-1.5 text-gray-700 shadow-sm transition-transform hover:scale-105 hover:bg-gray-200"
                title="Increase Size"
              >
                <FaPlus size={12} />
              </button>
            </>
          ) : null}
          <button
            type="button"
            data-blockpages-overlay-remove="true"
            data-overlay-id={id}
            onPointerDown={stopOverlayDrag}
            onClick={(event) => {
              stopOverlayDrag(event);
              onRemove(id);
            }}
            className="flex cursor-pointer items-center justify-center rounded-md bg-red-50 p-1.5 text-red-500 shadow-sm transition-transform hover:scale-105 hover:bg-red-100"
            title={kind === "divider" ? "Remove Divider" : "Remove Icon"}
          >
            <FaTrash size={12} />
          </button>
        </div>

        <div
          data-draggable-chrome="true"
          className="w-full cursor-move touch-none active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          title={kind === "divider" ? "Drag to move the divider" : "Drag to move the icon"}
        >
          <div
            data-blockpages-overlay-scale="true"
            className="relative z-10 w-full rounded-md p-2 transition-transform group-hover/inner:outline group-hover/inner:outline-2 group-hover/inner:outline-dashed group-hover/inner:outline-blue-400 group-focus-within/inner:outline group-focus-within/inner:outline-2 group-focus-within/inner:outline-blue-400"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "center",
              ...contentStyle,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

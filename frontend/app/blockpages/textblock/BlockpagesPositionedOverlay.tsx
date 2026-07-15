"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";
import { FaMinus, FaPlus, FaTrash } from "react-icons/fa";
import {
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
  onPositionChange: (id: string, position: { top: number; left: number }) => void;
  onScaleChange?: (id: string, scale: number) => void;
  onRemove: (id: string) => void;
  children: ReactNode;
  contentStyle?: CSSProperties;
};

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

  return (
    <motion.div
      key={`${id}-${resolvedPosition.top}-${resolvedPosition.left}`}
      drag
      dragMomentum={false}
      data-blockpages-overlay="true"
      data-blockpages-overlay-kind={kind}
      data-draggable-chrome="true"
      className={`absolute z-[100] flex max-w-full flex-col items-center bg-transparent cursor-move active:cursor-grabbing ${
        kind === "divider" ? "right-4" : "right-4"
      }`}
      style={{
        top: `${resolvedPosition.top}px`,
        left: `${resolvedPosition.left}px`,
      }}
      onDragEnd={(_event, info) => {
        onPositionChange(id, {
          top: resolvedPosition.top + info.offset.y,
          left: resolvedPosition.left + info.offset.x,
        });
      }}
      title={kind === "divider" ? "Drag to move the divider" : "Drag to move the icon"}
    >
      <div className="group/inner relative flex w-full flex-col items-center outline-none" tabIndex={0}>
        <div
          data-blockpages-overlay-scale="true"
          className="relative z-10 rounded-md p-2 transition-transform group-hover/inner:outline group-hover/inner:outline-2 group-hover/inner:outline-dashed group-hover/inner:outline-blue-400 group-focus-within/inner:outline group-focus-within/inner:outline-2 group-focus-within/inner:outline-blue-400"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center",
            ...contentStyle,
          }}
        >
          {children}
        </div>
        <div
          data-builder-chrome="true"
          className="absolute -top-10 left-1/2 z-[110] hidden -translate-x-1/2 items-center gap-2 rounded-lg border border-gray-200 bg-white p-1.5 shadow-xl group-hover/inner:flex group-focus-within/inner:flex"
        >
          {onScaleChange ? (
            <>
              <button
                type="button"
                onClick={() => onScaleChange(id, Math.max(0.2, scale - 0.1))}
                className="flex cursor-pointer items-center justify-center rounded-md bg-gray-100 p-1.5 text-gray-700 shadow-sm transition-transform hover:scale-105 hover:bg-gray-200"
                title="Decrease Size"
              >
                <FaMinus size={12} />
              </button>
              <button
                type="button"
                onClick={() => onScaleChange(id, scale + 0.1)}
                className="flex cursor-pointer items-center justify-center rounded-md bg-gray-100 p-1.5 text-gray-700 shadow-sm transition-transform hover:scale-105 hover:bg-gray-200"
                title="Increase Size"
              >
                <FaPlus size={12} />
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={() => onRemove(id)}
            className="flex cursor-pointer items-center justify-center rounded-md bg-red-50 p-1.5 text-red-500 shadow-sm transition-transform hover:scale-105 hover:bg-red-100"
            title={kind === "divider" ? "Remove Divider" : "Remove Icon"}
          >
            <FaTrash size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

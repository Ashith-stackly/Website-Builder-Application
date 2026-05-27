"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Trash2 } from "lucide-react";
import { componentRegistry } from "@/lib/componentRegistry";
import { useBuilderStore } from "@/store/builderStore";
import { canvasItem, floatUp } from "@/lib/motion";
import type { BuilderComponent } from "@/types/builder";

function CanvasItem({
  component,
  isDropTarget = false,
  onDelete,
  onDuplicate,
  onSelect,
}: {
  component: BuilderComponent;
  isDropTarget?: boolean;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const Renderer = componentRegistry[component.type];
  const isSelected = useBuilderStore((s) => s.selectedComponentId === component.id);
  const updateComponent = useBuilderStore((s) => s.updateComponent);
  const setInlineEditing = useBuilderStore((s) => s.setInlineEditing);
  const [isEditing, setIsEditing] = useState(false);
  const isInlineEditable = component.type === "heading" || component.type === "text" || component.type === "button";
  const isSectionComponent = component.type === "contact" || component.type === "hero" || component.type === "navigation" || component.type === "features" || component.type === "gallery";

  useEffect(() => {
    if (!isSelected && isEditing) {
      const timeout = window.setTimeout(() => {
        setIsEditing(false);
        setInlineEditing(false);
      }, 0);

      return () => window.clearTimeout(timeout);
    }
  }, [isSelected, isEditing, setInlineEditing]);

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (isEditing) return;
      onSelect(component.id);
    },
    [onSelect, component.id, isEditing],
  );

  const handleDuplicate = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onDuplicate(component.id);
    },
    [onDuplicate, component.id],
  );

  const handleDelete = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onDelete(component.id);
    },
    [onDelete, component.id],
  );

  const handleDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onSelect(component.id);
      setIsEditing(true);
      setInlineEditing(true);
    },
    [onSelect, component.id, setInlineEditing],
  );

  const handleInlineUpdate = useCallback(
    (content: string | null) => {
      if (content !== null) {
        updateComponent(component.id, { content });
      }
      setIsEditing(false);
      setInlineEditing(false);
    },
    [updateComponent, component.id, setInlineEditing],
  );

  const handleSectionUpdate = useCallback(
    (content: string | null) => {
      if (content !== null) {
        updateComponent(component.id, { content });
      }
    },
    [updateComponent, component.id],
  );

  /**
   * Typed structured-patch callback for migrated blocks (`hero`, `feature-item`, ...).
   * The store shallow-merges `props` and `styles`, so renderers can patch a single
   * field at a time without clobbering siblings.
   */
  const handlePatch = useCallback(
    (patch: Partial<BuilderComponent>) => {
      updateComponent(component.id, patch);
    },
    [updateComponent, component.id],
  );

  const nestedChildren = useMemo(
    () =>
      component.children.length > 0
        ? component.children.map((child) => (
            <CanvasItem
              key={child.id}
              component={child}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onSelect={onSelect}
            />
          ))
        : null,
    [component.children, onDelete, onDuplicate, onSelect],
  );

  const [isHovered, setIsHovered] = useState(false);
  const typeLabel = component.type.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const showOverlay = (isSelected || isHovered) && !isEditing;

  return (
    <motion.div
      variants={canvasItem}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`relative w-full cursor-pointer overflow-hidden rounded-xl border bg-white transition-[border-color,box-shadow] duration-200 ${
        isSelected
          ? "border-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.15),0_20px_50px_rgba(15,35,75,0.12)]"
          : isHovered
            ? "border-blue-300 shadow-[0_8px_24px_rgba(15,35,75,0.10)]"
            : "border-[#e6edf5] shadow-[0_2px_12px_rgba(15,35,75,0.05)]"
      }`}
      onClick={isEditing ? undefined : handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Floating overlay toolbar (shown on hover / select) ── */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            key="toolbar"
            variants={floatUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-3 py-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Type badge */}
            <span className="pointer-events-auto flex items-center gap-1.5 rounded-md bg-[#0B1D40]/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              {typeLabel}
            </span>

            {/* Actions */}
            <div className="pointer-events-auto flex items-center gap-0.5 rounded-lg border border-white/20 bg-[#0B1D40]/80 p-0.5 backdrop-blur-sm">
              <button
                type="button"
                title="Duplicate (Ctrl+D)"
                onClick={handleDuplicate}
                className="flex h-6 w-6 items-center justify-center rounded text-white/80 transition hover:bg-white/15 hover:text-white"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Delete (Del)"
                onClick={handleDelete}
                className="flex h-6 w-6 items-center justify-center rounded text-red-300 transition hover:bg-red-500/20 hover:text-red-200"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Component content (WYSIWYG) ── */}
      <div
        className={`relative flex w-full flex-col items-start transition-colors duration-150 ${
          isEditing
            ? "bg-blue-50/20"
            : isDropTarget && (component.type === "container" || component.type === "columns")
              ? "bg-blue-50/50 ring-2 ring-inset ring-blue-400/40"
              : ""
        } ${isInlineEditable && isSelected && !isEditing ? "cursor-text" : ""}`}
        onDoubleClick={isInlineEditable ? handleDoubleClick : undefined}
      >
        <Renderer
          component={component}
          isEditing={isEditing}
          onUpdate={isSectionComponent ? handleSectionUpdate : isEditing ? handleInlineUpdate : undefined}
          onPatch={handlePatch}
        >
          {nestedChildren}
        </Renderer>
      </div>
    </motion.div>
  );
}

export default memo(CanvasItem);

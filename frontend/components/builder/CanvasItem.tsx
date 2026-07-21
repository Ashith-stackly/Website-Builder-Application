"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, EyeOff, Lock, Trash2 } from "lucide-react";
import { componentRegistry } from "@/lib/componentRegistry";
import { useBuilderStore } from "@/store/builderStore";
import { canvasItem, floatUp } from "@/lib/motion";
import type { BuilderComponent, Viewport } from "@/types/builder";
import ResizeHandles from "./ResizeHandles";
import ContextMenu from "./ContextMenu";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableItem from "./SortableItem";

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
  const isMultiSelected = useBuilderStore((s) => s.selectedComponentIds.includes(component.id));
  const updateComponent = useBuilderStore((s) => s.updateComponent);
  const setInlineEditing = useBuilderStore((s) => s.setInlineEditing);
  const toggleSelectComponent = useBuilderStore((s) => s.toggleSelectComponent);
  const viewport = useBuilderStore((s) => s.viewport) as Viewport;
  const [isEditing, setIsEditing] = useState(false);
  const isInlineEditable = component.type === "heading" || component.type === "text" || component.type === "button";
  const isSectionComponent = component.type === "contact" || component.type === "hero" || component.type === "navigation" || component.type === "features" || component.type === "gallery" || component.type === "pricing-table" || component.type === "product-collection" || component.type === "testimonial" || component.type === "footer" || component.type === "accordion" || component.type === "tabs" || component.type === "form" || component.type === "row";
  const isLocked = component.locked ?? false;
  const isHidden = component.hidden ?? false;

  /* ── Resize handle ref ── */
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Context menu state ── */
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

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
      // Shift+click for multi-select
      if (event.shiftKey) {
        toggleSelectComponent(component.id);
        return;
      }
      onSelect(component.id);
    },
    [onSelect, component.id, isEditing, toggleSelectComponent],
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
      if (isLocked) return;
      onSelect(component.id);
      setIsEditing(true);
      setInlineEditing(true);
    },
    [onSelect, component.id, setInlineEditing, isLocked],
  );

  const handleContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      onSelect(component.id);
      setContextMenu({ x: event.clientX, y: event.clientY });
    },
    [component.id, onSelect],
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
        ? (
            <SortableContext items={component.children.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              {component.children.map((child) => (
                <SortableItem
                  key={child.id}
                  component={child}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  onSelect={onSelect}
                />
              ))}
            </SortableContext>
          )
        : null,
    [component.children, onDelete, onDuplicate, onSelect],
  );

  const [isHovered, setIsHovered] = useState(false);
  const typeLabel = component.type.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  /* ── Merge responsive overrides for active viewport ── */
  const viewportComponent = useMemo(() => {
    if (viewport === "desktop" || !component.responsiveStyles) return component;
    const overrides = component.responsiveStyles[viewport];
    if (!overrides || Object.keys(overrides).length === 0) return component;
    return { ...component, styles: { ...component.styles, ...overrides } };
  }, [component, viewport]);

  const showOverlay = (isSelected || isHovered) && !isEditing;
  return (
    <>
      <motion.div
        ref={containerRef}
        variants={canvasItem}
        exit="exit"
        className={`relative w-full cursor-pointer overflow-visible rounded-xl border bg-white transition-[border-color,box-shadow] duration-200 ${
          isSelected
            ? "border-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.15),0_20px_50px_rgba(15,35,75,0.12)]"
            : isMultiSelected
              ? "border-blue-400 shadow-[0_0_0_2px_rgba(59,130,246,0.12),0_8px_24px_rgba(15,35,75,0.08)]"
              : isHovered
                ? "border-blue-300 shadow-[0_8px_24px_rgba(15,35,75,0.10)]"
                : "border-[#e6edf5] shadow-[0_2px_12px_rgba(15,35,75,0.05)]"
        } ${isLocked ? "opacity-80" : ""} ${isHidden ? "opacity-40" : ""}`}
        role="listitem"
        aria-selected={isSelected}
        aria-label={`${component.type} component${isLocked ? " (locked)" : ""}${isHidden ? " (hidden)" : ""}`}
        onClick={isEditing ? undefined : handleClick}
        onContextMenu={handleContextMenu}
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
                {isLocked && <Lock className="ml-1 h-3 w-3 text-yellow-400" />}
                {isHidden && <EyeOff className="ml-1 h-3 w-3 text-gray-400" />}
              </span>

              {!isLocked && (
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
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Resize handles (shown when selected and not locked) ── */}
        {isSelected && !isEditing && !isLocked && (
          <ResizeHandles componentId={component.id} containerRef={containerRef} />
        )}

        {/* ── Multi-select indicator ── */}
        {isMultiSelected && !isSelected && (
          <div className="pointer-events-none absolute inset-0 z-10 rounded-xl border-2 border-dashed border-blue-400/50" />
        )}

        {/* ── Component content (WYSIWYG) ── */}
        <div
          className={`relative flex w-full flex-col items-start transition-colors duration-150 ${
            isEditing
              ? "bg-blue-50/20"
              : isDropTarget && (component.type === "container" || component.type === "columns" || component.type === "row")
                ? "bg-blue-50/50 ring-2 ring-inset ring-blue-400/40"
                : ""
          } ${isInlineEditable && isSelected && !isEditing ? "cursor-text" : ""}`}
          onDoubleClick={isInlineEditable ? handleDoubleClick : undefined}
        >
          <Renderer
            component={viewportComponent}
            isEditing={isEditing}
            onUpdate={isSectionComponent ? handleSectionUpdate : isEditing ? handleInlineUpdate : undefined}
            onPatch={handlePatch}
          >
            {nestedChildren}
          </Renderer>
        </div>
      </motion.div>

      {/* ── Context Menu (rendered as portal-like overlay) ── */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          componentId={component.id}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}

export default memo(CanvasItem);

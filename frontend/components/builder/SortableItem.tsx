"use client";

import { memo } from "react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
import CanvasItem from "./CanvasItem";
import { useBuilderStore } from "@/store/builderStore";
import type { BuilderComponent } from "@/types/builder";

function SortableItem({
  component,
  onDelete,
  onDuplicate,
  onSelect,
}: {
  component: BuilderComponent;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const isInlineEditing = useBuilderStore((s) => s.isInlineEditing);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    index,
    activeIndex,
    overIndex,
    isOver,
  } = useSortable({
    id: component.id,
    data: { fromCanvas: true },
    disabled: isInlineEditing || Boolean(component.locked),
  });

  const isSortingActive = activeIndex !== -1 && overIndex !== -1;
  const showLineBefore = isSortingActive && !isDragging && overIndex === index && activeIndex > index;
  const showLineAfter  = isSortingActive && !isDragging && overIndex === index && activeIndex < index;

  return (
    <div
      ref={setNodeRef}
      className={`group relative w-full max-w-[900px] ${isDragging ? "opacity-40" : ""}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: [transition, "opacity 200ms ease"].filter(Boolean).join(", "),
      }}
    >
      {showLineBefore && (
        <div className="pointer-events-none absolute inset-x-0 -top-3 z-30 flex h-0 items-center">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full border-[2.5px] border-blue-500 bg-blue-50" />
          <span className="h-px flex-1 bg-blue-500 shadow-[0_0_6px_2px_rgba(59,130,246,0.35)]" />
        </div>
      )}
      {!component.locked && (
        <button
          className="pointer-events-none absolute -left-3 top-5 z-10 flex h-8 w-8 cursor-grab items-center justify-center rounded-lg border border-[#dbe3ef] bg-white text-[#566583] opacity-0 shadow-sm transition-all duration-150 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 group-hover:pointer-events-auto group-hover:opacity-100 active:cursor-grabbing"
          type="button"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      <CanvasItem
        component={component}
        isDropTarget={isOver && !isDragging}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onSelect={onSelect}
      />
      {showLineAfter && (
        <div className="pointer-events-none absolute inset-x-0 -bottom-3 z-30 flex h-0 items-center">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full border-[2.5px] border-blue-500 bg-blue-50" />
          <span className="h-px flex-1 bg-blue-500 shadow-[0_0_6px_2px_rgba(59,130,246,0.35)]" />
        </div>
      )}
    </div>
  );
}

export default memo(SortableItem);

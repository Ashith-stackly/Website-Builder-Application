"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
import CanvasItem from "./CanvasItem";
import type { BuilderComponent } from "@/types/builder";

export default function SortableItem({
  component,
  isSelected,
  onDelete,
  onDuplicate,
  onSelect,
}: {
  component: BuilderComponent;
  isSelected: boolean;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: component.id,
    data: { fromCanvas: true },
  });

  return (
    <div
      ref={setNodeRef}
      className={`group relative w-full max-w-[900px] transition ${isDragging ? "opacity-60" : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        className="absolute -left-3 top-5 z-10 hidden h-8 w-8 items-center justify-center rounded-md border border-[#dbe3ef] bg-white text-[#566583] shadow-sm transition hover:bg-gray-50 group-hover:flex"
        type="button"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <CanvasItem component={component} isSelected={isSelected} onDelete={onDelete} onDuplicate={onDuplicate} onSelect={onSelect} />
    </div>
  );
}

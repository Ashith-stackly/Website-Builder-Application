"use client";

import { ChevronDown, Eye, Save, Sparkles, Trash2 } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableItem from "./SortableItem";
import ExportButton from "./ExportButton";
import type { BuilderComponent } from "@/types/builder";

export default function Canvas({
  components,
  selectedComponentId,
  onSelect,
  onDelete,
  onDuplicate,
  onLoadStarter,
  onClear,
}: {
  components: BuilderComponent[];
  selectedComponentId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onLoadStarter: () => void;
  onClear: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "builder-canvas" });

  return (
    <main
      className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#dbe3ef] bg-[#f7f9fc] shadow-sm"
      onClick={() => onSelect(null)}
    >
      <div
        className="flex h-[64px] flex-shrink-0 items-center justify-between gap-4 overflow-x-auto border-b border-[#dbe3ef] bg-white px-3 shadow-[0_1px_0_rgba(15,23,42,0.03)] md:px-5"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="flex items-center gap-2 whitespace-nowrap rounded px-2 py-1.5 text-[14px] font-bold text-[#0B1D40] hover:bg-gray-100 md:text-[15px]" type="button">
          My Website
          <ChevronDown className="h-4 w-4 text-gray-600" />
        </button>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            className="flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-2 text-[13px] font-bold text-[#0B1D40] shadow-sm transition hover:bg-gray-50 active:scale-95"
            onClick={() => onLoadStarter()}
            title="Create Starter Website"
            type="button"
          >
            <Sparkles className="h-4 w-4 text-gray-600" />
            <span className="hidden lg:inline">Starter</span>
          </button>
          <button
            className="flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-2 text-[13px] font-bold text-[#0B1D40] shadow-sm transition hover:bg-gray-50 active:scale-95"
            onClick={() => onClear()}
            title="Clear Canvas"
            type="button"
          >
            <Trash2 className="h-4 w-4 text-gray-600" />
            <span className="hidden lg:inline">Clear</span>
          </button>
          <button
            className="flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-2 text-[13px] font-bold text-[#0B1D40] shadow-sm transition hover:bg-gray-50 active:scale-95"
            onClick={() => alert("Draft saved locally.")}
            title="Save Draft"
            type="button"
          >
            <Save className="h-4 w-4 text-gray-600" />
            <span className="hidden lg:inline">Save Draft</span>
          </button>
          <button
            className="flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-2 text-[13px] font-bold text-[#0B1D40] shadow-sm transition hover:bg-gray-50 active:scale-95"
            onClick={() => alert("Preview uses the current canvas.")}
            title="Preview"
            type="button"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden lg:inline">Preview</span>
          </button>
          <ExportButton components={components} />
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col items-center gap-6 overflow-y-auto px-4 py-6 transition sm:px-6 lg:px-8 ${isOver ? "bg-blue-50/50" : ""}`}
      >
        {components.length === 0 ? (
          <div className="flex min-h-[420px] w-full max-w-[900px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#dbe3ef] bg-white px-6 text-center shadow-[0_18px_45px_rgba(15,35,75,0.08)] transition">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#eef4fb] text-[#0B1D40]">
              <ChevronDown className="h-7 w-7" />
            </div>
            <h2 className="text-[18px] font-bold text-[#0B1D40]">Drop blocks here</h2>
            <p className="mt-2 max-w-[360px] text-sm font-medium leading-6 text-[#566583]">
              Drag a block from the sidebar or click a palette item to start building.
            </p>
            <button
              className="mt-6 flex items-center gap-2 rounded-md bg-[#0B1D40] px-5 py-3 text-sm font-bold text-white shadow-[0_2px_4px_rgba(11,29,64,0.3)] transition hover:bg-[#152B52] active:scale-95"
              onClick={(event) => {
                event.stopPropagation();
                onLoadStarter();
              }}
              type="button"
            >
              <Sparkles className="h-4 w-4" />
              Create Starter Website
            </button>
          </div>
        ) : (
          <SortableContext items={components.map((component) => component.id)} strategy={verticalListSortingStrategy}>
            {components.map((component) => (
              <SortableItem
                component={component}
                isSelected={selectedComponentId === component.id}
                key={component.id}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                onSelect={onSelect}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </main>
  );
}

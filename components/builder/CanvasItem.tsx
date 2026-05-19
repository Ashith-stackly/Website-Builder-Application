"use client";

import { Copy, X } from "lucide-react";
import { componentRegistry } from "@/lib/componentRegistry";
import type { BuilderComponent } from "@/types/builder";

export default function CanvasItem({
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
  const Renderer = componentRegistry[component.type];

  return (
    <div
      className={`flex w-full cursor-pointer flex-col overflow-hidden rounded-xl border bg-white shadow-[0_18px_45px_rgba(15,35,75,0.08)] transition ${isSelected ? "border-blue-500 ring-2 ring-blue-500" : "border-[#dbe3ef] hover:border-blue-300"}`}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(component.id);
      }}
    >
      <div className="flex items-center justify-between border-b border-[#e6edf5] bg-white px-5 py-4 sm:px-6">
        <h2 className="text-[18px] font-bold capitalize text-[#0B1D40]">{component.type}</h2>
        <div className="flex items-center gap-1">
          <button
            className="rounded p-1.5 text-[#566583] transition hover:bg-gray-100 hover:text-[#0B1D40]"
            onClick={(event) => {
              event.stopPropagation();
              onDuplicate(component.id);
            }}
            title="Duplicate block"
            type="button"
          >
            <Copy className="h-[17px] w-[17px]" strokeWidth={2.2} />
          </button>
          <button
            className="rounded p-1.5 text-red-500 transition hover:bg-red-50"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(component.id);
            }}
            title="Delete block"
            type="button"
          >
            <X className="h-[18px] w-[18px]" strokeWidth={2.5} />
          </button>
        </div>
      </div>
      <div className="relative flex w-full flex-1 flex-col items-start overflow-y-auto p-5 pb-8 sm:p-8 sm:pb-10">
        <Renderer component={component} />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Contact, GripVertical, Heading1, Home, Image, Images, LayoutTemplate, Menu, Minus, MousePointerSquareDashed, PanelsTopLeft, Search, Sparkles, TextCursorInput, Type } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import type { ComponentType } from "@/types/builder";

const paletteItems: Array<{ type: ComponentType; label: string; group: "Website Sections" | "Basic Blocks"; icon: React.ComponentType<{ className?: string }> }> = [
  { type: "navigation", label: "Navigation", group: "Website Sections", icon: Menu },
  { type: "hero", label: "Hero", group: "Website Sections", icon: Home },
  { type: "features", label: "Features", group: "Website Sections", icon: PanelsTopLeft },
  { type: "gallery", label: "Gallery", group: "Website Sections", icon: Images },
  { type: "contact", label: "Contact", group: "Website Sections", icon: Contact },
  { type: "heading", label: "Heading", group: "Basic Blocks", icon: Heading1 },
  { type: "text", label: "Text", group: "Basic Blocks", icon: Type },
  { type: "button", label: "Button", group: "Basic Blocks", icon: MousePointerSquareDashed },
  { type: "image", label: "Image", group: "Basic Blocks", icon: Image },
  { type: "input", label: "Input", group: "Basic Blocks", icon: TextCursorInput },
  { type: "divider", label: "Divider", group: "Basic Blocks", icon: Minus },
  { type: "container", label: "Container", group: "Basic Blocks", icon: LayoutTemplate },
];

function PaletteItem({ item, onAdd }: { item: (typeof paletteItems)[number]; onAdd: (type: ComponentType) => void }) {
  const suppressClickAfterDrag = useRef(false);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${item.type}`,
    data: { fromPalette: true, type: item.type },
  });
  const Icon = item.icon;

  useEffect(() => {
    if (isDragging) {
      suppressClickAfterDrag.current = true;
    }
  }, [isDragging]);

  return (
    <button
      ref={setNodeRef}
      className={`flex min-h-[78px] flex-col items-center justify-center gap-1 rounded bg-[#F3F4F6] p-2 text-[11px] text-gray-700 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-md active:scale-95 ${isDragging ? "opacity-50" : ""}`}
      onClick={() => {
        if (suppressClickAfterDrag.current) {
          suppressClickAfterDrag.current = false;
          return;
        }

        onAdd(item.type);
      }}
      type="button"
      {...listeners}
      {...attributes}
    >
      <span className="flex items-center gap-1">
        <GripVertical className="h-3 w-3 text-gray-400" />
        <Icon className="h-4 w-4 text-gray-500" />
      </span>
      {item.label}
    </button>
  );
}

export default function ComponentPalette({
  className = "w-[248px]",
  onAdd,
  onLoadStarter,
}: {
  className?: string;
  onAdd: (type: ComponentType) => void;
  onLoadStarter: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState<"Website Sections" | "Basic Blocks">("Website Sections");
  const filteredItems = paletteItems.filter((item) => item.label.toLowerCase().includes(searchQuery.toLowerCase()));
  const groups: Array<"Website Sections" | "Basic Blocks"> = ["Website Sections", "Basic Blocks"];

  return (
    <aside className={`flex h-full flex-shrink-0 flex-col overflow-hidden rounded-xl border border-[#183765] bg-[#0B1D40] text-white shadow-[0_18px_45px_rgba(11,29,64,0.18)] ${className}`}>
      <div className="flex border-b border-[#1A315E] px-6 pt-5">
        <button className="flex-1 border-b-2 border-blue-500 pb-3 text-sm font-semibold text-white" type="button">
          Blocks
        </button>
        <div className="mx-2 h-4 w-[1px] self-center bg-[#1A315E]" />
        <button className="flex-1 border-b-2 border-transparent pb-3 text-sm font-semibold text-gray-400" type="button">
          Pages
        </button>
      </div>

      <div className="w-full flex-1 overflow-y-auto p-5">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            className="w-full rounded-full bg-white py-2 pl-9 pr-4 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search Blocks"
            type="text"
            value={searchQuery}
          />
        </div>

        <button
          className="mb-5 flex w-full items-center justify-center gap-2 rounded bg-white px-3 py-2.5 text-sm font-bold text-[#0B1D40] shadow-sm transition-all duration-300 hover:-translate-y-[1px] hover:bg-gray-100 active:scale-95"
          onClick={onLoadStarter}
          type="button"
        >
          <Sparkles className="h-4 w-4" />
          Starter Website
        </button>

        <div className="mb-4 grid grid-cols-2 overflow-hidden rounded bg-white text-xs font-bold text-[#0B1D40]">
          {groups.map((group) => (
            <button
              className={`px-2 py-2 transition ${activeGroup === group ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}
              key={group}
              onClick={() => setActiveGroup(group)}
              type="button"
            >
              {group === "Website Sections" ? "Sections" : "Basic"}
            </button>
          ))}
        </div>

        <div className="mb-4 flex w-full items-center justify-between text-sm font-medium">
          {activeGroup}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {filteredItems
            .filter((item) => item.group === activeGroup)
            .map((item) => (
              <PaletteItem item={item} key={item.type} onAdd={onAdd} />
            ))}
        </div>
      </div>

      <div className="border-t border-[#1A315E] p-5">
        <div className="rounded border border-[#1A315E] px-3 py-2 text-center text-xs font-medium text-gray-300">
          Drag blocks onto the canvas
        </div>
      </div>
    </aside>
  );
}

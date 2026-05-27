"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Contact, GripVertical, Heading1, Home, Image, Images, LayoutGrid, LayoutTemplate, Layers, Menu, Minus, MousePointerSquareDashed, PanelsTopLeft, Play, Search, Sparkles, Star, TextCursorInput, Type } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import type { ComponentType } from "@/types/builder";
import { staggerContainer, staggerChild } from "@/lib/motion";

type PaletteGroup = "Website Sections" | "Basic Blocks";

const BLOCK_COLORS: Record<ComponentType, string> = {
  navigation:    "bg-blue-500/20 text-blue-300",
  hero:          "bg-violet-500/20 text-violet-300",
  features:      "bg-emerald-500/20 text-emerald-300",
  gallery:       "bg-pink-500/20 text-pink-300",
  contact:       "bg-orange-500/20 text-orange-300",
  heading:       "bg-yellow-500/20 text-yellow-300",
  text:          "bg-sky-500/20 text-sky-300",
  button:        "bg-indigo-500/20 text-indigo-300",
  icon:          "bg-amber-500/20 text-amber-300",
  "feature-item":"bg-teal-500/20 text-teal-300",
  columns:       "bg-cyan-500/20 text-cyan-300",
  image:         "bg-rose-500/20 text-rose-300",
  input:         "bg-lime-500/20 text-lime-300",
  divider:       "bg-gray-500/20 text-gray-300",
  container:     "bg-purple-500/20 text-purple-300",
  video:         "bg-red-500/20 text-red-300",
};

const paletteItems: Array<{ type: ComponentType; label: string; group: PaletteGroup; icon: React.ComponentType<{ className?: string }> }> = [
  { type: "navigation",   label: "Navigation",   group: "Website Sections", icon: Menu },
  { type: "hero",         label: "Hero",         group: "Website Sections", icon: Home },
  { type: "features",     label: "Features",     group: "Website Sections", icon: PanelsTopLeft },
  { type: "gallery",      label: "Gallery",      group: "Website Sections", icon: Images },
  { type: "contact",      label: "Contact",      group: "Website Sections", icon: Contact },
  { type: "heading",      label: "Heading",      group: "Basic Blocks",     icon: Heading1 },
  { type: "text",         label: "Text",         group: "Basic Blocks",     icon: Type },
  { type: "button",       label: "Button",       group: "Basic Blocks",     icon: MousePointerSquareDashed },
  { type: "icon",         label: "Icon",         group: "Basic Blocks",     icon: Star },
  { type: "feature-item", label: "Feature Item", group: "Basic Blocks",     icon: Layers },
  { type: "columns",      label: "Columns",      group: "Basic Blocks",     icon: LayoutGrid },
  { type: "image",        label: "Image",        group: "Basic Blocks",     icon: Image },
  { type: "input",        label: "Input",        group: "Basic Blocks",     icon: TextCursorInput },
  { type: "divider",      label: "Divider",      group: "Basic Blocks",     icon: Minus },
  { type: "container",    label: "Container",    group: "Basic Blocks",     icon: LayoutTemplate },
  { type: "video",        label: "Video",        group: "Basic Blocks",     icon: Play },
];

function PaletteItem({ item, onAdd }: { item: (typeof paletteItems)[number]; onAdd: (type: ComponentType) => void }) {
  const suppressClickAfterDrag = useRef(false);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${item.type}`,
    data: { fromPalette: true, type: item.type },
  });
  const Icon = item.icon;
  const colorClass = BLOCK_COLORS[item.type] ?? "bg-blue-500/20 text-blue-300";

  useEffect(() => {
    if (isDragging) suppressClickAfterDrag.current = true;
  }, [isDragging]);

  return (
    <motion.button
      ref={setNodeRef}
      variants={staggerChild}
      whileHover={{ y: -3, scale: 1.03 }}
      whileTap={{ scale: 0.94 }}
      className={`group flex flex-col items-center gap-2.5 rounded-xl border border-white/5 bg-[#112248] px-2 py-4 text-center transition-colors hover:border-blue-500/40 hover:bg-[#162C58] ${isDragging ? "opacity-40" : ""}`}
      onClick={() => {
        if (suppressClickAfterDrag.current) { suppressClickAfterDrag.current = false; return; }
        onAdd(item.type);
      }}
      type="button"
      {...listeners}
      {...attributes}
    >
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colorClass} transition-transform group-hover:scale-110`}>
        <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
      </div>
      <span className="text-[11px] font-bold leading-tight text-gray-300 group-hover:text-white">{item.label}</span>
      <GripVertical className="h-3 w-3 text-white/20 transition group-hover:text-white/40" />
    </motion.button>
  );
}

const GROUPS: PaletteGroup[] = ["Website Sections", "Basic Blocks"];

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
  const [activeGroup, setActiveGroup] = useState<PaletteGroup>("Website Sections");

  const filtered = paletteItems.filter(
    (item) =>
      item.group === activeGroup &&
      item.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <aside className={`flex h-full flex-shrink-0 flex-col overflow-hidden rounded-xl border border-[#183765] bg-[#0B1D40] text-white shadow-[0_18px_45px_rgba(11,29,64,0.22)] ${className}`}>
      {/* ── Header ── */}
      <div className="flex-shrink-0 border-b border-[#1A315E] px-5 pt-5 pb-0">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/20">
            <Layers className="h-4 w-4 text-blue-400" />
          </div>
          <span className="text-[13px] font-bold tracking-wide text-white">Blocks</span>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full rounded-lg border border-[#1A315E] bg-[#112248] py-2 pl-9 pr-4 text-[12px] text-gray-200 placeholder-gray-500 outline-none transition focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search blocks…"
            type="text"
            value={searchQuery}
          />
        </div>

        {/* Group tabs */}
        <div className="relative flex rounded-lg bg-[#071428] p-0.5 mb-4">
          {GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setActiveGroup(g)}
              className="relative z-10 flex-1 rounded-md py-1.5 text-[11px] font-bold transition-colors"
            >
              <span className={activeGroup === g ? "text-white" : "text-gray-500 hover:text-gray-300"}>
                {g === "Website Sections" ? "Sections" : "Basic"}
              </span>
              {activeGroup === g && (
                <motion.div
                  layoutId="palette-tab"
                  className="absolute inset-0 rounded-md bg-blue-600 shadow-sm"
                  style={{ zIndex: -1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Block grid ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3 [scrollbar-width:thin] [scrollbar-color:#1A315E_transparent]">
        {/* Starter CTA */}
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.97 }}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-600/20 to-violet-600/20 px-3 py-2.5 text-[12px] font-bold text-blue-200 shadow-[0_0_20px_rgba(59,130,246,0.1)] transition hover:border-blue-400/50 hover:text-white"
          onClick={onLoadStarter}
          type="button"
        >
          <Sparkles className="h-3.5 w-3.5 text-blue-400" />
          Generate Starter Website
        </motion.button>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeGroup + searchQuery}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            className="grid grid-cols-2 gap-2.5"
          >
            {filtered.length === 0 ? (
              <motion.p variants={staggerChild} className="col-span-2 py-8 text-center text-[12px] text-gray-500">
                No blocks match "{searchQuery}"
              </motion.p>
            ) : (
              filtered.map((item) => (
                <PaletteItem key={item.type} item={item} onAdd={onAdd} />
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Footer hint ── */}
      <div className="flex-shrink-0 border-t border-[#1A315E] px-4 py-3">
        <p className="text-center text-[10px] font-medium text-gray-600">
          Click to add · Drag to reorder
        </p>
      </div>
    </aside>
  );
}

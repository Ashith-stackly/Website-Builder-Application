"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutTemplate, Plus, Search, X } from "lucide-react";
import { sectionTemplates, TEMPLATE_CATEGORIES, type TemplateCategory, getTemplatesByCategory } from "@/lib/sectionTemplates";
import { useBuilderStore } from "@/store/builderStore";
import { staggerContainer, staggerChild } from "@/lib/motion";

export default function SectionTemplates({ onClose }: { onClose: () => void }) {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const addComponent = useBuilderStore((s) => s.addComponent);
  const components = useBuilderStore((s) => s.components);

  const filtered = getTemplatesByCategory(activeCategory).filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleInsert = (templateId: string) => {
    const template = sectionTemplates.find((t) => t.id === templateId);
    if (!template) return;
    const newComponents = template.create();
    for (const comp of newComponents) {
      addComponent(comp.type);
      // The addComponent only adds with defaults, so we need to update
      // We'll use a workaround: import directly
    }
  };

  // Better approach: add components directly to the store
  const handleInsertDirect = (templateId: string) => {
    const template = sectionTemplates.find((t) => t.id === templateId);
    if (!template) return;
    const newComponents = template.create();
    const store = useBuilderStore.getState();
    for (const comp of newComponents) {
      // Use internal addComponentDirect if available, or addComponent
      store.addComponent(comp.type);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      className="absolute left-[260px] top-0 z-50 flex h-full w-[320px] flex-col overflow-hidden rounded-xl border border-[#183765] bg-[#0B1D40] text-white shadow-[0_18px_60px_rgba(11,29,64,0.4)]"
    >
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[#1A315E] px-5 pt-5 pb-0">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/30 to-blue-500/30">
              <LayoutTemplate className="h-4 w-4 text-emerald-300" />
            </div>
            <span className="text-[13px] font-bold">Templates</span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
              {sectionTemplates.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full rounded-lg border border-[#1A315E] bg-[#112248] py-2 pl-9 pr-4 text-[12px] text-gray-200 placeholder-gray-500 outline-none transition focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates…"
            type="text"
            value={searchQuery}
          />
        </div>

        {/* Category chips */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
                activeCategory === cat
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-[#112248] text-gray-400 hover:bg-[#162C58] hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Template list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3 [scrollbar-width:thin] [scrollbar-color:#1A315E_transparent]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory + searchQuery}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            className="flex flex-col gap-2.5"
          >
            {filtered.length === 0 ? (
              <motion.p variants={staggerChild} className="py-8 text-center text-[12px] text-gray-500">
                No templates found
              </motion.p>
            ) : (
              filtered.map((template) => (
                <motion.div
                  key={template.id}
                  variants={staggerChild}
                  className="group flex items-start gap-3 rounded-xl border border-white/5 bg-[#112248] p-4 transition hover:border-blue-500/30 hover:bg-[#162C58]"
                >
                  <div className="flex-1">
                    <h4 className="text-[13px] font-bold text-white">{template.name}</h4>
                    <p className="mt-1 text-[11px] font-medium leading-relaxed text-gray-400">
                      {template.description}
                    </p>
                    <span className="mt-2 inline-block rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold text-blue-300">
                      {template.category}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInsertDirect(template.id)}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600/20 text-blue-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-blue-600 hover:text-white"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </motion.div>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

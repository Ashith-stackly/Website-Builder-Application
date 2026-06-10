"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Image, MousePointerSquareDashed, MoreHorizontal, Plus, Type } from "lucide-react";
import type { ComponentType } from "@/types/builder";

const quickOptions: Array<{
  type: ComponentType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = [
  { type: "text",   label: "Text",   icon: Type,                       color: "bg-sky-500/20 text-sky-400 hover:bg-sky-500/30" },
  { type: "button", label: "Button", icon: MousePointerSquareDashed,   color: "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30" },
  { type: "image",  label: "Image",  icon: Image,                      color: "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30" },
];

export default function QuickInsertBar({
  onInsert,
  onOpenPalette,
}: {
  /** Called when the user picks a quick-insert option. */
  onInsert: (type: ComponentType) => void;
  /** Called when the user clicks "More…" to open the full palette. */
  onOpenPalette?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleInsert = (type: ComponentType) => {
    onInsert(type);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className="quick-insert-bar group/insert relative flex w-full items-center justify-center"
      style={{ height: "24px", margin: "-4px 0" }}
    >
      {/* ── Hover line ── */}
      <div
        className={`absolute inset-x-4 top-1/2 h-px -translate-y-1/2 transition-all duration-200 ${
          isOpen
            ? "bg-blue-400/60 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
            : "bg-transparent group-hover/insert:bg-blue-300/40"
        }`}
      />

      {/* ── Center "+" button ── */}
      <motion.button
        type="button"
        title="Insert block here"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((o) => !o);
        }}
        className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-200 ${
          isOpen
            ? "border-blue-400 bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)] scale-110"
            : "border-transparent bg-transparent text-transparent group-hover/insert:border-blue-400/60 group-hover/insert:bg-[#0B1D40] group-hover/insert:text-white group-hover/insert:shadow-md"
        }`}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.92 }}
      >
        <Plus className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`} />
      </motion.button>

      {/* ── Popover ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Invisible backdrop to dismiss */}
            <div
              className="fixed inset-0 z-20"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-full z-30 mt-1.5 flex items-center gap-1.5 rounded-xl border border-[#1A315E] bg-[#0B1D40] px-2.5 py-2 shadow-[0_12px_40px_rgba(11,29,64,0.45)]"
              onClick={(e) => e.stopPropagation()}
            >
              {quickOptions.map(({ type, label, icon: Icon, color }) => (
                <motion.button
                  key={type}
                  type="button"
                  title={`Add ${label}`}
                  onClick={() => handleInsert(type)}
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.92 }}
                  className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-colors ${color}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[10px] font-bold leading-none">{label}</span>
                </motion.button>
              ))}

              {/* Divider */}
              <div className="mx-0.5 h-8 w-px bg-white/10" />

              {/* More… button */}
              <motion.button
                type="button"
                title="More blocks…"
                onClick={() => {
                  setIsOpen(false);
                  onOpenPalette?.();
                }}
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.92 }}
                className="flex flex-col items-center gap-1 rounded-lg bg-white/5 px-3 py-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="text-[10px] font-bold leading-none">More</span>
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

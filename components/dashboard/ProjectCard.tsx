"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  BriefcaseBusiness,
  Clock3,
  Copy,
  ExternalLink,
  MoreHorizontal,
  Newspaper,
  Palette,
  Pencil,
  Settings,
  ShoppingBag,
  Sparkles,
  Trash2,
  Utensils,
} from "lucide-react";
import { scaleIn } from "@/lib/motion";
import type { Project } from "@/types/project";

interface ProjectCardProps {
  project: Project;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const categoryStyles: Record<
  string,
  { bg: string; text: string; border: string; gradient: string; icon: React.ElementType }
> = {
  "E-commerce": {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    gradient: "from-amber-300/35 via-orange-200/30 to-rose-200/25",
    icon: ShoppingBag,
  },
  Portfolio: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
    gradient: "from-violet-300/35 via-fuchsia-200/30 to-indigo-200/25",
    icon: Palette,
  },
  Blog: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    gradient: "from-emerald-300/35 via-teal-200/30 to-cyan-200/25",
    icon: Newspaper,
  },
  Business: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    gradient: "from-blue-300/35 via-sky-200/30 to-cyan-200/25",
    icon: BriefcaseBusiness,
  },
  Restaurant: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    gradient: "from-red-300/35 via-rose-200/30 to-orange-200/25",
    icon: Utensils,
  },
};

export default function ProjectCard({ project, onRename, onDelete, onDuplicate }: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(project.name);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== project.name) {
      onRename(project.id, trimmed);
    } else {
      setRenameValue(project.name);
    }
    setIsRenaming(false);
  };

  const style = categoryStyles[project.category] ?? categoryStyles.Business;
  const CategoryIcon = style.icon;
  const updatedAt = new Date(project.updatedAt);
  const timeAgo = getTimeAgo(updatedAt);

  return (
    <motion.div
      layout
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-colors duration-300 hover:border-blue-200 hover:shadow-xl"
    >
      <Link href={`/builder?projectId=${project.id}`} className="block">
        <div className={`relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br ${style.gradient}`}>
          <motion.div
            aria-hidden="true"
            className="absolute inset-4 rounded-2xl border border-white/70 bg-white/60 p-3 shadow-lg shadow-slate-900/5 backdrop-blur-sm"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mb-3 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-300" />
              <span className="h-2 w-2 rounded-full bg-amber-300" />
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
            </div>
            <div className="space-y-2">
              <motion.span
                className="block h-3 w-2/3 rounded-full bg-[#06224C]/20"
                animate={{ opacity: [0.55, 0.9, 0.55] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="block h-2 w-full rounded-full bg-slate-300/55" />
              <span className="block h-2 w-4/5 rounded-full bg-slate-300/45" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[0, 1, 2].map((item) => (
                <motion.span
                  key={item}
                  className="h-8 rounded-lg bg-white/70 shadow-sm"
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 2.4, delay: item * 0.18, repeat: Infinity, ease: "easeInOut" }}
                />
              ))}
            </div>
          </motion.div>
          <div className="absolute left-4 top-4 rounded-xl bg-white/85 p-2 text-[#06224C] shadow-sm backdrop-blur">
            <CategoryIcon className="h-5 w-5" />
          </div>
          <motion.div className="absolute inset-0 flex items-center justify-center bg-[#06224C]/0 opacity-0 transition-all duration-300 group-hover:bg-[#06224C]/65 group-hover:opacity-100">
            <span className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-[#06224C] shadow-lg">
              <ExternalLink className="h-3.5 w-3.5" /> Open in Builder
            </span>
          </motion.div>
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {isRenaming ? (
              <input
                ref={inputRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameSubmit();
                  if (e.key === "Escape") {
                    setRenameValue(project.name);
                    setIsRenaming(false);
                  }
                }}
                className="w-full rounded-lg border border-blue-300 bg-blue-50/50 px-2 py-1 text-sm font-bold text-[#06224C] outline-none ring-2 ring-blue-100"
                maxLength={40}
              />
            ) : (
              <h3 className="truncate text-sm font-bold text-[#06224C]">{project.name}</h3>
            )}
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-md ${style.bg} ${style.border} border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${style.text}`}>
                <CategoryIcon className="h-3 w-3" />
                {project.category}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400">
                <Sparkles className="h-3 w-3" />
                {project.style}
              </span>
            </div>
          </div>

          <div ref={menuRef} className="relative">
            <motion.button
              onClick={() => setMenuOpen(!menuOpen)}
              whileHover={{ rotate: 90, scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#06224C]"
              aria-label="Project actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </motion.button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  variants={scaleIn}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
                >
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setIsRenaming(true);
                    }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#06224C]"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Rename
                  </button>
                  <button
                    onClick={() => {
                      onDuplicate(project.id);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#06224C]"
                  >
                    <Copy className="h-3.5 w-3.5" /> Duplicate
                  </button>
                  <Link
                    href={`/dashboard/settings?id=${project.id}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#06224C]"
                  >
                    <Settings className="h-3.5 w-3.5" /> Settings
                  </Link>
                  <div className="border-t border-slate-100" />
                  <button
                    onClick={() => {
                      onDelete(project.id);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {project.description && (
          <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
            {project.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-slate-400">
            <Clock3 className="h-3 w-3" />
            <span>Updated {timeAgo}</span>
            <span className="text-slate-300">.</span>
            <span>{project.status || "draft"}</span>
          </p>
          <Link
            href={`/builder?projectId=${project.id}`}
            className="rounded-lg bg-[#06224C] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-blue-900"
          >
            Edit
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { staggerContainer, staggerChild } from "@/lib/motion";
import ProjectCard from "./ProjectCard";
import type { Project, ProjectSort, ProjectSortKey } from "@/types/project";
import { ArrowDownAZ, ArrowDownUp, ArrowUpDown, Calendar, Clock } from "lucide-react";

interface ProjectGridProps {
  projects: Project[];
  sort: ProjectSort;
  onSortChange: (key: ProjectSortKey) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const sortOptions: { key: ProjectSortKey; label: string; icon: React.ElementType }[] = [
  { key: "updatedAt", label: "Last Updated", icon: Clock },
  { key: "createdAt", label: "Date Created", icon: Calendar },
  { key: "name", label: "Name", icon: ArrowDownAZ },
];

export default function ProjectGrid({
  projects,
  sort,
  onSortChange,
  onRename,
  onDelete,
  onDuplicate,
}: ProjectGridProps) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
        <h2 className="text-base font-black text-[#06224C] sm:text-lg">
          My Projects
          <span className="ml-2 text-sm font-medium text-slate-400">({projects.length})</span>
        </h2>
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-slate-400" />
          {sortOptions.map((opt) => (
            <motion.button
              key={opt.key}
              onClick={() => onSortChange(opt.key)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              className={`relative flex items-center gap-1.5 overflow-hidden rounded-xl px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                sort.key === opt.key
                  ? "text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100 hover:text-[#06224C]"
              }`}
            >
              {sort.key === opt.key && (
                <motion.span
                  layoutId="active-sort-pill"
                  className="absolute inset-0 bg-[#06224C]"
                  transition={{ type: "spring", stiffness: 450, damping: 34 }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                <opt.icon className="h-3 w-3" />
                <span className="hidden sm:inline">{opt.label}</span>
                <AnimatePresence mode="wait">
                  {sort.key === opt.key && (
                    <motion.span
                      key={sort.order}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="opacity-80"
                    >
                      {sort.order === "desc" ? (
                        <ArrowDownUp className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        layout
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <AnimatePresence initial={false}>
          {projects.map((project) => (
            <motion.div key={project.id} variants={staggerChild} layout exit={{ opacity: 0, scale: 0.96, y: 8 }}>
              <ProjectCard
                project={project}
                onRename={onRename}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

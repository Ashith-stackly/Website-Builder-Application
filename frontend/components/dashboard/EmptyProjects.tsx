"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, FileSearch, LayoutTemplate, MousePointerClick, Sparkles } from "lucide-react";
import { fadeUp, staggerContainer, staggerChild } from "@/lib/motion";

interface EmptyProjectsProps {
  onCreateProject: () => void;
  searchQuery?: string;
}

export default function EmptyProjects({ onCreateProject, searchQuery }: EmptyProjectsProps) {
  if (searchQuery?.trim()) {
    return (
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/70 px-6 py-16 text-center shadow-sm sm:py-24"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="mb-4 rounded-2xl bg-slate-100 p-4 text-slate-400"
        >
          <FileSearch className="h-8 w-8" />
        </motion.div>
        <h3 className="text-lg font-bold text-[#06224C]">No projects found</h3>
        <p className="mt-1 text-sm text-slate-400">
          No results for &quot;{searchQuery}&quot;. Try a different search term.
        </p>
      </motion.div>
    );
  }

  const highlights = [
    { label: "Templates", icon: LayoutTemplate },
    { label: "Drag tools", icon: MousePointerClick },
    { label: "Smart sections", icon: Sparkles },
  ];

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="relative overflow-hidden rounded-3xl border-2 border-dashed border-slate-200 bg-white/80 px-6 py-16 text-center shadow-sm sm:py-24"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(#dbeafe 1px, transparent 1px), linear-gradient(90deg, #dbeafe 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="relative mx-auto mb-6 inline-flex rounded-3xl bg-[#06224C] p-5 text-white shadow-lg shadow-[#06224C]/20"
      >
        <Sparkles className="h-10 w-10" />
      </motion.div>

      <h3 className="relative text-xl font-black text-[#06224C] sm:text-2xl">
        Start Building Your Website
      </h3>
      <p className="relative mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
        Create your first project and bring your ideas to life with Stackly&apos;s guided builder.
      </p>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative mx-auto mt-6 grid max-w-xl gap-2 sm:grid-cols-3"
      >
        {highlights.map((item) => (
          <motion.div
            key={item.label}
            variants={staggerChild}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 shadow-sm"
          >
            <item.icon className="h-4 w-4 text-blue-600" />
            {item.label}
          </motion.div>
        ))}
      </motion.div>

      <motion.button
        onClick={onCreateProject}
        whileHover={{ y: -2, scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-[#06224C] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#06224C]/20 transition-all hover:bg-blue-900 hover:shadow-xl"
      >
        Create Your First Project
        <ArrowRight className="h-4 w-4" />
      </motion.button>
    </motion.div>
  );
}

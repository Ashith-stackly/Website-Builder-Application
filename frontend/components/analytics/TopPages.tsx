"use client";

import React from "react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import type { TopPage } from "@/types/analytics";

interface TopPagesProps {
  pages: TopPage[];
}

export default function TopPages({ pages }: TopPagesProps) {
  if (pages.length === 0) {
    return (
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#06224C]">
          Top Pages
        </h3>
        <p className="py-8 text-center text-sm text-slate-400">No page data available yet.</p>
      </motion.div>
    );
  }

  const maxViews = Math.max(...pages.map((p) => p.views), 1);

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#06224C]">
        Top Pages
      </h3>
      <div className="space-y-3">
        {pages.map((page, index) => (
          <div key={page.page} className="group">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-[9px] font-black text-slate-500">
                  {index + 1}
                </span>
                <span className="text-sm font-semibold text-[#06224C]">{page.page}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#06224C]">{page.views}</span>
                <span className="text-[10px] font-bold text-slate-400">{page.percentage}%</span>
              </div>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(page.views / maxViews) * 100}%` }}
                transition={{ duration: 0.8, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

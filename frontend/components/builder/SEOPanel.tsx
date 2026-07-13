"use client";

import { motion } from "framer-motion";
import { Globe, Search, X } from "lucide-react";
import { useDesignStore } from "@/store/designStore";

export default function SEOPanel({ onClose }: { onClose: () => void }) {
  const { seo, setSEO } = useDesignStore();

  const titleLen = seo.title.length;
  const descLen = seo.description.length;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      className="absolute right-0 top-0 z-50 flex h-full w-[320px] flex-col overflow-hidden rounded-xl border border-[#f4d8cc] bg-[#fff7f4] shadow-[0_18px_60px_rgba(113,63,18,0.15)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#f0eae6] px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
            <Globe className="h-4 w-4 text-emerald-600" />
          </div>
          <span className="text-[13px] font-bold text-[#0B1D40]">SEO Settings</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 [scrollbar-width:none]">
        {/* Page Title */}
        <div>
          <label className="mb-1.5 flex items-center justify-between text-[12px] font-bold uppercase tracking-wider text-[#566583]">
            Page Title
            <span className={`text-[10px] font-medium ${titleLen > 60 ? "text-red-500" : "text-[#94a3b8]"}`}>
              {titleLen}/60
            </span>
          </label>
          <input
            type="text"
            value={seo.title}
            onChange={(e) => setSEO({ title: e.target.value })}
            placeholder="My Awesome Website"
            className="w-full rounded-xl border-2 border-[#e6edf5] bg-white px-3 py-2.5 text-sm font-semibold text-[#0B1D40] outline-none transition focus:border-[#0B1D40] focus:ring-2 focus:ring-[#0B1D40]/10"
          />
        </div>

        {/* Meta Description */}
        <div>
          <label className="mb-1.5 flex items-center justify-between text-[12px] font-bold uppercase tracking-wider text-[#566583]">
            Meta Description
            <span className={`text-[10px] font-medium ${descLen > 160 ? "text-red-500" : "text-[#94a3b8]"}`}>
              {descLen}/160
            </span>
          </label>
          <textarea
            rows={3}
            value={seo.description}
            onChange={(e) => setSEO({ description: e.target.value })}
            placeholder="A brief description of your website..."
            className="w-full resize-none rounded-xl border-2 border-[#e6edf5] bg-white px-3 py-2.5 text-sm font-medium text-[#0B1D40] outline-none transition focus:border-[#0B1D40] focus:ring-2 focus:ring-[#0B1D40]/10"
          />
        </div>

        {/* OG Title */}
        <div>
          <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#566583]">
            Open Graph Title
          </label>
          <input
            type="text"
            value={seo.ogTitle || ""}
            onChange={(e) => setSEO({ ogTitle: e.target.value })}
            placeholder="Share title (defaults to page title)"
            className="w-full rounded-xl border-2 border-[#e6edf5] bg-white px-3 py-2.5 text-sm font-medium text-[#0B1D40] outline-none transition focus:border-[#0B1D40] focus:ring-2 focus:ring-[#0B1D40]/10"
          />
        </div>

        {/* OG Description */}
        <div>
          <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#566583]">
            Open Graph Description
          </label>
          <textarea
            rows={2}
            value={seo.ogDescription || ""}
            onChange={(e) => setSEO({ ogDescription: e.target.value })}
            placeholder="Share description"
            className="w-full resize-none rounded-xl border-2 border-[#e6edf5] bg-white px-3 py-2.5 text-sm font-medium text-[#0B1D40] outline-none transition focus:border-[#0B1D40] focus:ring-2 focus:ring-[#0B1D40]/10"
          />
        </div>

        {/* Google Preview */}
        <div>
          <span className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#566583]">
            <Search className="h-3 w-3" />
            Search Preview
          </span>
          <div className="rounded-xl border-2 border-[#e6edf5] bg-white p-4">
            <p className="truncate text-[16px] font-medium leading-tight text-[#1a0dab]">
              {seo.title || "Page Title"}
            </p>
            <p className="mt-0.5 truncate text-[12px] text-emerald-700">
              https://yourdomain.com
            </p>
            <p className="mt-1 line-clamp-2 text-[13px] leading-[1.4] text-[#545454]">
              {seo.description || "Add a meta description to improve your search engine visibility..."}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

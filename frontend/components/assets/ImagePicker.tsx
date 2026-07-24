"use client";

/**
 * ImagePicker — reusable image selection modal.
 *
 * Usage:
 *   <ImagePicker
 *     open={open}
 *     onClose={() => setOpen(false)}
 *     onSelect={(url, assetId) => { /* use url in block props *\/ }}
 *     currentUrl={currentSrc}
 *   />
 *
 * Integrates with: ImagePanel, HeroPanel, StyleTab background picker,
 * and any future panel that needs an image URL.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Sparkles, Upload, X, Link as LinkIcon } from "lucide-react";
import { useAssetStore } from "@/store/assetStore";
import { AssetCard } from "./AssetCard";
import { DropZone } from "./DropZone";
import { AIGenerateImageForm, type GeneratedAssetDetails } from "./AIImageGenerator";
import { staggerContainer } from "@/lib/motion";
import type { Asset } from "@/types/assets";

interface ImagePickerProps {
  open:        boolean;
  onClose:     () => void;
  /** Called immediately when an asset is selected or URL confirmed (single mode). */
  onSelect:    (url: string, assetId?: string) => void;
  currentUrl?: string;
  /** Selection mode. Defaults to "single" for backward compatibility. */
  mode?:       "single" | "multiple";
  /** Initial active tab when modal opens. Defaults to "library". */
  initialTab?: PickerTab;
  /** Called with all selected assets when user confirms in "multiple" mode. */
  onSelectMultiple?: (selections: Array<{ url: string; assetId?: string }>) => void;
}

type PickerTab = "library" | "upload" | "url" | "ai";

export function ImagePicker({ open, onClose, onSelect, currentUrl, mode = "single", initialTab = "library", onSelectMultiple }: ImagePickerProps) {
  const { assets, loadAssets, uploadFiles, deleteAsset, getUrl } = useAssetStore();

  const [tab,        setTab]        = useState<PickerTab>(initialTab);
  const [search,     setSearch]     = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [multiSelectedIds, setMultiSelectedIds] = useState<Set<string>>(new Set());
  const [urlInput,   setUrlInput]   = useState(currentUrl ?? "");

  const urlRef = useRef<HTMLInputElement>(null);
  const isMulti = mode === "multiple";

  useEffect(() => {
    if (open) {
      void loadAssets();
      setTab(initialTab);
    }
  }, [open, loadAssets, initialTab]);

  const closePicker = () => {
    setSelectedId(null);
    setMultiSelectedIds(new Set());
    onClose();
  };

  /* Directly confirm an explicit URL string input */
  const confirmUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (isMulti) {
      onSelectMultiple?.([{ url: trimmed }]);
    } else {
      onSelect(trimmed);
    }
    closePicker();
  };

  /* AI image generated callback */
  const handleGeneratedAsset = async (details: GeneratedAssetDetails) => {
    if (isMulti) {
      setMultiSelectedIds((prev) => new Set([...prev, details.id]));
      setTab("library");
      return;
    }
    const url = await getUrl(details.id);
    onSelect(url || details.url, details.id);
    closePicker();
  };

  /* Asset card click handler */
  const handleAssetSelect = async (asset: Asset) => {
    if (isMulti) {
      setMultiSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(asset.id)) next.delete(asset.id);
        else next.add(asset.id);
        return next;
      });
      return;
    }
    setSelectedId(asset.id);
    const url = await getUrl(asset.id);
    if (url) onSelect(url, asset.id);
  };

  /* Upload then auto-select first uploaded file */
  const handleUpload = async (files: File[]) => {
    const uploaded = await uploadFiles(files);
    if (isMulti) {
      // In multi mode, add all uploaded to selection
      setMultiSelectedIds((prev) => {
        const next = new Set(prev);
        uploaded.forEach((a) => next.add(a.id));
        return next;
      });
      setTab("library");
      return;
    }
    if (uploaded[0]) {
      const url = await getUrl(uploaded[0].id);
      if (url) { onSelect(url, uploaded[0].id); closePicker(); }
    }
    setTab("library");
  };

  /* Confirm multi-selection */
  const confirmMultiSelect = async () => {
    if (!onSelectMultiple || multiSelectedIds.size === 0) return;
    const selections: Array<{ url: string; assetId?: string }> = [];
    for (const id of multiSelectedIds) {
      const url = await getUrl(id);
      if (url) selections.push({ url, assetId: id });
    }
    onSelectMultiple(selections);
    closePicker();
  };

  const filtered = assets.filter((a) => {
    if (!a) return false;
    const query = (search || "").toLowerCase();
    const filename = (a.filename || (a as Record<string, unknown>).name || (a as Record<string, unknown>).originalName || "").toString().toLowerCase();
    const matchName = filename.includes(query);
    const matchTags = Array.isArray(a.tags) && a.tags.some((t) => typeof t === "string" && t.toLowerCase().includes(query));
    return matchName || matchTags;
  });

  const TABS: { id: PickerTab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "library", label: "Library",  Icon: Search   },
    { id: "upload",  label: "Upload",   Icon: Upload   },
    { id: "ai",      label: "AI Create", Icon: Sparkles },
    { id: "url",     label: "URL",      Icon: LinkIcon },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) closePicker(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.93,  y: 12 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            className="flex h-[560px] w-full max-w-[660px] flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl"
          >
            {/* ── Header ── */}
            <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4">
              <h2 className="text-[15px] font-bold text-slate-900 dark:text-slate-100">Media Library</h2>
              <button
                onClick={closePicker}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ── Tabs ── */}
            <div className="flex flex-shrink-0 gap-0 border-b border-slate-200 dark:border-slate-800 px-5">
              {TABS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`relative mr-4 pb-2.5 pt-3 text-[13px] font-semibold transition-colors cursor-pointer
                    ${tab === id ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"}`}
                >
                  {label}
                  {tab === id && (
                    <motion.div
                      layoutId="picker-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-blue-500"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* ── Body ── */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Upload tab */}
              {tab === "upload" && (
                <div className="flex flex-1 items-center justify-center p-8">
                  <DropZone onFiles={handleUpload} className="w-full max-w-md" />
                </div>
              )}

              {/* AI image / placeholder tab */}
              {tab === "ai" && (
                <div className="flex-1 overflow-y-auto [scrollbar-width:thin]">
                  <AIGenerateImageForm compact onSaved={handleGeneratedAsset} />
                </div>
              )}

              {/* External URL tab */}
              {tab === "url" && (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8">
                  <p className="text-[13px] text-slate-500 dark:text-slate-400">Paste an external image URL</p>
                  <input
                    ref={urlRef}
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && confirmUrl()}
                    placeholder="https://example.com/image.jpg"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-[13px] text-slate-900 dark:text-slate-100 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100/20"
                  />
                  {urlInput && (
                    <img
                      src={urlInput}
                      alt="preview"
                      className="h-32 w-auto rounded-lg border border-slate-200 dark:border-slate-800 object-contain shadow-sm"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  )}
                  <button
                    onClick={confirmUrl}
                    type="button"
                    disabled={!urlInput.trim()}
                    className="rounded-xl bg-blue-600 dark:bg-blue-500 px-6 py-2.5 text-[13px] font-bold text-white shadow-sm hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-40 cursor-pointer"
                  >
                    Use This URL
                  </button>
                </div>
              )}

              {/* Library tab */}
              {tab === "library" && (
                <>
                  <div className="flex-shrink-0 px-5 py-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search images…"
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 pl-9 pr-4 text-[13px] text-slate-900 dark:text-slate-100 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100/20"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-5 pb-5 [scrollbar-width:thin]">
                    {filtered.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center gap-3 pb-10 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                          <Upload className="h-7 w-7" />
                        </div>
                        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                          {search ? `No results for "${search}"` : "No images yet"}
                        </p>
                        <button
                          onClick={() => setTab("ai")}
                          type="button"
                          className="rounded-lg bg-blue-600 dark:bg-blue-500 px-4 py-2 text-[12px] font-bold text-white hover:bg-blue-700 dark:hover:bg-blue-600 cursor-pointer"
                        >
                          Create with AI
                        </button>
                      </div>
                    ) : (
                      <motion.div
                        key={search}
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-4 gap-2 sm:grid-cols-5"
                      >
                        {filtered.map((asset) => (
                          <AssetCard
                            key={asset.id}
                            asset={asset}
                            selected={isMulti ? multiSelectedIds.has(asset.id) : selectedId === asset.id}
                            onSelect={handleAssetSelect}
                            onDelete={deleteAsset}
                          />
                        ))}
                      </motion.div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="flex flex-shrink-0 items-center justify-between border-t border-slate-200 dark:border-slate-800 px-5 py-3">
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {assets.length} image{assets.length !== 1 ? "s" : ""} in library
              </span>
              <div className="flex items-center gap-2">
                {isMulti && multiSelectedIds.size > 0 && (
                  <button
                    onClick={confirmMultiSelect}
                    type="button"
                    className="rounded-lg bg-blue-600 dark:bg-blue-500 px-4 py-2 text-[12px] font-bold text-white shadow-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition cursor-pointer"
                  >
                    Add Selected ({multiSelectedIds.size})
                  </button>
                )}
                <button
                  onClick={closePicker}
                  type="button"
                  className="rounded-lg px-4 py-2 text-[12px] font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {isMulti ? "Cancel" : "Close"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

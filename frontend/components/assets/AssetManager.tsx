"use client";

/**
 * AssetManager — full-screen media library panel.
 *
 * Open from the Canvas toolbar (Images button).
 * Features: upload zone, searchable grid, batch delete, detail sidebar.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check, Image as ImageIcon, Info, Pencil, Search, Sparkles, Trash2, Upload, WandSparkles, X,
} from "lucide-react";
import { useAssetStore } from "@/store/assetStore";
import { AssetCard } from "./AssetCard";
import { DropZone } from "./DropZone";
import { AIImageGeneratorDialog } from "./AIImageGenerator";
import { formatBytes } from "@/lib/assetUtils";
import { staggerContainer } from "@/lib/motion";
import type { Asset } from "@/types/assets";

interface AssetManagerProps {
  open:    boolean;
  onClose: () => void;
}

export function AssetManager({ open, onClose }: AssetManagerProps) {
  const { assets, isLoading, uploadProgress, loadAssets, uploadFiles, deleteAsset, renameAsset } =
    useAssetStore();

  const [search,   setSearch]   = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [focused,  setFocused]  = useState<Asset | null>(null);
  const [aiMode,   setAiMode]   = useState<"generate" | "placeholder" | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState("");

  useEffect(() => {
    if (open) void loadAssets();
  }, [open, loadAssets]);

  const filtered = assets.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()),
  );

  const totalSize = assets.reduce((s, a) => s + a.size, 0);

  const closeManager = () => {
    setSearch("");
    setSelected(new Set());
    setFocused(null);
    setAiMode(null);
    setIsRenaming(false);
    setRenameError("");
    onClose();
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleCardClick = (asset: Asset) => {
    toggleSelect(asset.id);
    setFocused(asset);
    setRenameValue(asset.name);
    setIsRenaming(false);
    setRenameError("");
  };

  const deleteSelected = async () => {
    for (const id of selected) await deleteAsset(id);
    setSelected(new Set());
    if (focused && selected.has(focused.id)) setFocused(null);
  };

  const handleDeleteOne = async (id: string) => {
    await deleteAsset(id);
    if (focused?.id === id) setFocused(null);
    setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
  };

  const saveRename = async () => {
    if (!focused) return;
    try {
      const renamed = await renameAsset(focused.id, renameValue);
      if (renamed) {
        setFocused(renamed);
        setRenameValue(renamed.name);
        setIsRenaming(false);
        setRenameError("");
      }
    } catch (error) {
      setRenameError(error instanceof Error ? error.message : "Unable to rename this asset.");
    }
  };

  return (
    <>
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => { if (e.target === e.currentTarget) closeManager(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.95,  y: 12 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            className="flex h-[680px] w-full max-w-4xl overflow-hidden rounded-2xl bg-[#f8fafc] shadow-2xl"
          >
            {/* ════ Left: main panel ════ */}
            <div className="flex flex-1 flex-col overflow-hidden border-r border-gray-200 bg-white">
              {/* Header */}
              <div className="flex flex-shrink-0 items-center justify-between border-b px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                    <ImageIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <h2 className="text-[15px] font-bold text-gray-900">Asset Library</h2>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-500">
                    {assets.length}
                  </span>
                </div>
                <button
                  onClick={closeManager}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Toolbar: search + batch delete */}
              <div className="flex flex-shrink-0 items-center gap-2 border-b px-5 py-2.5">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search assets…"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-3 text-[12px] outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  />
                </div>

                <button
                  onClick={() => setAiMode("generate")}
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[11px] font-bold text-violet-800 transition hover:border-violet-300 hover:bg-violet-100"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Generate</span>
                </button>
                <button
                  onClick={() => setAiMode("placeholder")}
                  type="button"
                  className="hidden items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-[11px] font-bold text-sky-800 transition hover:border-sky-300 hover:bg-sky-100 md:flex"
                >
                  <WandSparkles className="h-3.5 w-3.5" />
                  Placeholder
                </button>

                <AnimatePresence>
                  {selected.size > 0 && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      onClick={deleteSelected}
                      type="button"
                      className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-[12px] font-bold text-red-600 hover:bg-red-100 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete ({selected.size})
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Upload drop zone (compact) */}
              <div className="flex-shrink-0 border-b px-5 py-3">
                {uploadProgress >= 0 ? (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[12px] text-gray-500">
                      <span>Uploading…</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <motion.div
                        className="h-full rounded-full bg-blue-500"
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                ) : (
                  <DropZone onFiles={async (files) => { await uploadFiles(files); }} compact className="w-full" />
                )}
              </div>

              {/* Asset grid */}
              <div className="flex-1 overflow-y-auto px-5 py-4 [scrollbar-width:thin]">
                {isLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                    <Upload className="h-10 w-10 text-gray-200" />
                    <p className="text-[13px] font-medium text-gray-400">
                      {search ? `No results for "${search}"` : "Drop images above to get started"}
                    </p>
                  </div>
                ) : (
                  <motion.div
                    key={search}
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-4 gap-3 xl:grid-cols-5"
                  >
                    {filtered.map((asset) => (
                      <AssetCard
                        key={asset.id}
                        asset={asset}
                        selected={selected.has(asset.id)}
                        onSelect={handleCardClick}
                        onDelete={handleDeleteOne}
                      />
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Footer stats */}
              <div className="flex-shrink-0 border-t px-5 py-2.5 text-[11px] text-gray-400">
                {assets.length} file{assets.length !== 1 ? "s" : ""} · {formatBytes(totalSize)} stored locally
              </div>
            </div>

            {/* ════ Right: detail sidebar ════ */}
            <div className="w-56 flex-shrink-0 overflow-hidden">
              <AnimatePresence mode="wait">
                {focused ? (
                  <motion.div
                    key={focused.id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.2 }}
                    className="flex h-full flex-col p-4"
                  >
                    {/* Detail header */}
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Details</span>
                      <button
                        onClick={() => setFocused(null)}
                        className="rounded p-0.5 text-gray-400 hover:text-gray-600"
                        type="button"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Thumbnail */}
                    <div className="mb-3 overflow-hidden rounded-xl border border-gray-200 bg-[#f1f5f9]">
                      <img
                        src={focused.thumbnail}
                        alt={focused.name}
                        className="h-36 w-full object-contain"
                      />
                    </div>

                    {/* Name / rename */}
                    <div className="mb-3 flex items-start gap-1.5">
                      {isRenaming ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(event) => { setRenameValue(event.target.value); setRenameError(""); }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") void saveRename();
                            if (event.key === "Escape") { setRenameValue(focused.name); setIsRenaming(false); }
                          }}
                          maxLength={120}
                          aria-label="Asset name"
                          className="min-w-0 flex-1 rounded-md border border-blue-300 bg-white px-2 py-1 text-[11px] font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      ) : (
                        <p className="min-w-0 flex-1 break-all text-[12px] font-bold leading-tight text-gray-800">
                          {focused.name}
                        </p>
                      )}
                      {isRenaming ? (
                        <>
                          <button onClick={() => void saveRename()} type="button" aria-label="Save asset name" className="rounded p-1 text-emerald-600 transition hover:bg-emerald-50"><Check className="h-3.5 w-3.5" /></button>
                          <button onClick={() => { setRenameValue(focused.name); setIsRenaming(false); }} type="button" aria-label="Cancel rename" className="rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"><X className="h-3.5 w-3.5" /></button>
                        </>
                      ) : (
                        <button onClick={() => { setRenameValue(focused.name); setIsRenaming(true); }} type="button" aria-label="Rename asset" className="rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"><Pencil className="h-3.5 w-3.5" /></button>
                      )}
                    </div>
                    {renameError && <p className="-mt-2 mb-3 text-[10px] font-medium text-red-600">{renameError}</p>}

                    {/* Metadata */}
                    <div className="space-y-2 text-[11px]">
                      {(
                        [
                          ["Size",   formatBytes(focused.size)],
                          focused.width ? ["Dimensions", `${focused.width} × ${focused.height}`] : null,
                          ["Format", focused.mimeType.split("/")[1]?.toUpperCase() ?? "IMG"],
                          ["Added",  new Date(focused.uploadedAt).toLocaleDateString()],
                        ] as (string[] | null)[]
                      )
                        .filter((r): r is string[] => r !== null)
                        .map(([label, value]) => (
                          <div key={label} className="flex items-center justify-between">
                            <span className="text-gray-400">{label}</span>
                            <span className="font-semibold text-gray-700">{value}</span>
                          </div>
                        ))}
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteOne(focused.id)}
                      type="button"
                      className="mt-auto flex items-center justify-center gap-1.5 rounded-xl border border-red-200 py-2.5 text-[12px] font-bold text-red-500 hover:bg-red-50 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete Asset
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty-detail"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center"
                  >
                    <Info className="h-9 w-9 text-gray-200" />
                    <p className="text-[12px] leading-snug text-gray-400">
                      Click an asset to see its details
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
      <AIImageGeneratorDialog
        open={open && aiMode !== null}
        initialMode={aiMode ?? "generate"}
        onClose={() => setAiMode(null)}
        onSaved={({ asset }) => {
          setFocused(asset);
          setRenameValue(asset.name);
          setIsRenaming(false);
          setSearch("");
        }}
      />
    </>
  );
}

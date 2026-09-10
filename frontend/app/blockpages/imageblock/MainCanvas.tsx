"use client";
import React from "react";
import {
  Undo2,
  Redo2,
  Eye,
  Send,
  Image as ImageIcon,
  Save,
  Check,
  AlertTriangle,
  Loader2,
  Upload,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Sliders,
  Crop,
} from "lucide-react";
import { useBuilder } from "./BuilderContext";
import type { DraftSaveStatus } from "../BlockPagesClient";
import MyWebsiteDropdown from "../MyWebsiteDropdown";
import BlockEditorBackButton from "../BlockEditorBackButton";
import { compressImage, blobToDataUrl } from "@/lib/assetUtils";

/* ──────────────────────────────────────────────────────── *
 * Preset gallery images (the same set used by the mobile
 * Images tab in LeftSidebar, kept in sync).
 * ──────────────────────────────────────────────────────── */
const GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80",
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80",
  "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&q=80",
];

export default function MainCanvas({
  editingImageId,
  currentImageUrl,
  onImageSelected,
  onBackToCanvas,
  onSaveDraft,
  onPreview,
  saveStatus = "idle",
}: {
  editingImageId?: string | null;
  currentImageUrl?: string;
  onImageSelected?: (url: string) => void;
  onBackToCanvas?: () => void;
  onSaveDraft?: () => void;
  onPreview?: () => void;
  saveStatus?: DraftSaveStatus;
}) {
  const {
    imageAdjustments,
    setImageAdjustments,
    activeFilter,
    setActiveFilter,
    activeCrop,
    setActiveCrop,
    undo,
    redo,
    historyStack,
    futureStack,
  } = useBuilder();

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [pendingImageUrl, setPendingImageUrl] = React.useState<string | null>(null);
  const [isAdjustOpen, setIsAdjustOpen] = React.useState(true);
  const [isCropOpen, setIsCropOpen] = React.useState(false);

  // The image shown in the preview: pending change > current image > placeholder
  const displayImageUrl = pendingImageUrl || currentImageUrl || "";

  /* ── File upload handler ─────────────────────────────── */
  const handleFileUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 500 * 1024, 0.85);
      const dataUrl = await blobToDataUrl(compressed);
      setPendingImageUrl(dataUrl);
    } catch {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPendingImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ── Apply: commit the pending/gallery selection ─────── */
  const handleApply = () => {
    if (pendingImageUrl && onImageSelected) {
      onImageSelected(pendingImageUrl);
    } else if (onBackToCanvas) {
      onBackToCanvas();
    }
  };

  /* ── Gallery image select ────────────────────────────── */
  const handleGallerySelect = (url: string) => {
    setPendingImageUrl(url);
  };

  const handleAction = (action: string) => {
    if (action === "Save Draft") {
      onSaveDraft?.();
    } else if (action === "Preview") {
      onPreview?.();
    }
  };

  return (
    <main className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#dbe3ef] bg-[#f7f9fc] shadow-[0_18px_45px_rgba(15,35,75,0.08)]">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
        accept="image/*"
        aria-label="Upload image file"
      />

      {/* ── Top Bar ─────────────────────────────────────── */}
      <div className="z-10 flex h-[64px] shrink-0 items-center justify-between gap-4 overflow-x-auto border-b border-[#dbe3ef] bg-white px-3 shadow-sm md:px-5">
        <div className="flex items-center gap-3">
          <MyWebsiteDropdown />
          {onBackToCanvas && (
            <BlockEditorBackButton onClick={onBackToCanvas} />
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex flex-shrink-0 items-center overflow-hidden rounded-md border border-gray-300 bg-white shadow-sm">
            <button
              onClick={undo}
              disabled={historyStack.length <= 1}
              className={`border-r border-gray-300 px-3 py-2 transition-colors ${historyStack.length > 1 ? "text-gray-600 hover:bg-gray-50 cursor-pointer" : "text-gray-300 cursor-not-allowed"}`}
              title="Undo"
            >
              <Undo2 className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
            <button
              onClick={redo}
              disabled={futureStack.length === 0}
              className={`px-3 py-2 transition-colors ${futureStack.length > 0 ? "text-gray-600 hover:bg-gray-50 cursor-pointer" : "text-gray-300 cursor-not-allowed"}`}
              title="Redo"
            >
              <Redo2 className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
          </div>

          <button
            onClick={() => handleAction("Save Draft")}
            disabled={saveStatus === "saving"}
            className={`group flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-2 text-[13px] font-bold text-[#0B1D40] shadow-sm transition-all hover:bg-gray-50 ${saveStatus === "saving" ? "opacity-70 cursor-not-allowed" : ""}`}
            title="Save Draft"
          >
            {saveStatus === "saving" ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
            ) : saveStatus === "saved" ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : saveStatus === "error" ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : (
              <Save className="h-4 w-4 text-gray-600 xl:hidden group-hover:hidden" />
            )}
            <span className="hidden xl:inline group-hover:inline">
              {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : saveStatus === "error" ? "Save Failed" : "Save Draft"}
            </span>
          </button>
          <button
            onClick={() => handleAction("Preview")}
            className="group flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-2 text-[13px] font-bold text-[#0B1D40] shadow-sm transition-all hover:bg-gray-50"
            title="Preview"
          >
            <Eye className="h-4 w-4 xl:hidden group-hover:hidden" />
            <span className="hidden xl:inline group-hover:inline">Preview</span>
          </button>
          <button
            onClick={() => alert("Publish sequence initiated!")}
            className="group flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#0B1D40] px-3 py-2 text-[13px] font-bold text-white shadow-[0_2px_4px_rgba(11,29,64,0.3)] transition-all hover:bg-[#152B52]"
            title="Publish"
          >
            <span className="hidden xl:inline group-hover:inline">Publish</span>
            <Send className="h-[14px] w-[14px] xl:hidden group-hover:hidden" />
          </button>
        </div>
      </div>

      {/* ── Editor Content ──────────────────────────────── */}
      <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-5 sm:px-6 xl:px-8">
        <div className="mx-auto max-w-[900px] rounded-xl border border-[#dbe3ef] bg-white p-5 shadow-[0_18px_45px_rgba(15,35,75,0.08)] sm:p-8">

          {/* ── Editor Header ────────────────────────────── */}
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="flex items-center gap-2 text-[16px] font-bold text-[#0c1b33]">
              <ImageIcon className="h-5 w-5 text-[#517AA5]" />
              Image Editor
            </h2>
            {editingImageId && (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-600">
                Editing: {editingImageId}
              </span>
            )}
          </div>

          {/* ── Current Image Preview ────────────────────── */}
          <div className="mb-6">
            <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wider text-gray-400">
              Selected Image
            </h3>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              {displayImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayImageUrl}
                  alt="Current image preview"
                  className="h-48 w-full object-cover sm:h-64"
                  onError={(e) => (e.currentTarget.src = "/showcase.webp")}
                />
              ) : (
                <div className="flex h-48 flex-col items-center justify-center gap-3 text-gray-300 sm:h-64">
                  <ImageIcon className="h-16 w-16" />
                  <span className="text-sm font-medium">No image selected</span>
                </div>
              )}
            </div>
            {pendingImageUrl && (
              <p className="mt-2 text-xs font-medium text-amber-600">
                ⚠ Unsaved change — click Apply to commit
              </p>
            )}
          </div>

          {/* ── Image Source ─────────────────────────────── */}
          <div className="mb-6">
            <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wider text-gray-400">
              Image Source
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-5 py-3 text-[13px] font-bold text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
                aria-label="Upload a local image"
              >
                <Upload className="h-4 w-4" />
                Upload Image
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-[13px] font-bold text-white transition-colors hover:bg-blue-700"
                aria-label="Choose an image"
              >
                <RefreshCw className="h-4 w-4" />
                Replace Image
              </button>
            </div>
          </div>

          {/* ── Image Gallery ────────────────────────────── */}
          <div className="mb-6">
            <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wider text-gray-400">
              Image Gallery
            </h3>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {GALLERY_IMAGES.map((imgSrc, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleGallerySelect(imgSrc)}
                  className={`overflow-hidden rounded-lg border-2 transition-all hover:border-blue-400 hover:shadow-md ${pendingImageUrl === imgSrc ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200"}`}
                  aria-label={`Select gallery image ${i + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgSrc}
                    alt={`Gallery ${i + 1}`}
                    className="aspect-square w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* ── Image Adjustments ────────────────────────── */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50">
            <button
              type="button"
              className="flex w-full items-center justify-between px-5 py-4 text-left"
              onClick={() => setIsAdjustOpen(!isAdjustOpen)}
            >
              <div className="flex items-center gap-2 text-[14px] font-bold text-[#0c1b33]">
                <Sliders className="h-4 w-4" />
                Adjustments
              </div>
              {isAdjustOpen ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
            </button>

            {isAdjustOpen && (
              <div className="flex flex-col gap-4 border-t border-gray-200 px-5 py-4">
                {[
                  { label: "Brightness", key: "brightness", max: 120 },
                  { label: "Contrast", key: "contrast", max: 100 },
                  { label: "Saturation", key: "saturation", max: 100 },
                  { label: "Vignette", key: "vignette", max: 50 },
                ].map((adj) => (
                  <div key={adj.key}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-[12px] font-bold text-[#0c1b33]">
                        {adj.label}
                      </label>
                      <span className="text-[11px] font-medium text-slate-500">
                        {imageAdjustments[adj.key as keyof typeof imageAdjustments]}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={adj.max}
                      value={imageAdjustments[adj.key as keyof typeof imageAdjustments]}
                      onChange={(e) =>
                        setImageAdjustments((prev) => ({
                          ...prev,
                          [adj.key]: parseInt(e.target.value),
                        }))
                      }
                      className="h-[3px] w-full cursor-pointer appearance-none rounded-lg bg-slate-300 accent-[#0c1b33]"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Crop ─────────────────────────────────────── */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50">
            <button
              type="button"
              className="flex w-full items-center justify-between px-5 py-4 text-left"
              onClick={() => setIsCropOpen(!isCropOpen)}
            >
              <div className="flex items-center gap-2 text-[14px] font-bold text-[#0c1b33]">
                <Crop className="h-4 w-4" />
                Crop
              </div>
              {isCropOpen ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
            </button>

            {isCropOpen && (
              <div className="grid grid-cols-3 gap-2 border-t border-gray-200 px-5 py-4 sm:grid-cols-6">
                {["Original", "Square", "16:9", "4:3", "5:4", "9:16"].map(
                  (ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setActiveCrop(ratio)}
                      className={`rounded border px-2 py-1.5 text-[12px] font-medium transition-colors ${activeCrop === ratio ? "border-[#0c1b33] bg-[#0c1b33] text-white" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"}`}
                    >
                      {ratio}
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* ── Actions ──────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-2 rounded-lg bg-[#0f3b89] px-6 py-2.5 text-[13px] font-bold text-white shadow-sm transition-colors hover:bg-[#0c2e6b]"
              aria-label="Apply image changes"
            >
              <Check className="h-4 w-4" />
              Apply
            </button>
            {onBackToCanvas && (
              <BlockEditorBackButton onClick={onBackToCanvas} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

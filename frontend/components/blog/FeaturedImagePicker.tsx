"use client";

import { useState } from "react";
import { Image as ImageIcon, Loader2, Sparkles, FolderOpen, Trash2, RefreshCw } from "lucide-react";
import { useAssetStore } from "@/store/assetStore";
import { DropZone } from "@/components/assets/DropZone";
import { ImagePicker } from "@/components/assets/ImagePicker";

interface FeaturedImagePickerProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export default function FeaturedImagePicker({
  value,
  onChange,
  disabled = false,
}: FeaturedImagePickerProps) {
  const { uploadFiles, getUrl } = useAssetStore();
  const [isUploading, setIsUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<"library" | "upload" | "url" | "ai">("library");

  // Local file upload via DropZone or File Input
  const handleUploadFiles = async (files: File[]) => {
    if (!files.length || disabled) return;
    setIsUploading(true);
    try {
      const uploadedAssets = await uploadFiles(files);
      if (uploadedAssets[0]) {
        const url = await getUrl(uploadedAssets[0].id);
        if (url) {
          onChange(url);
        }
      }
    } catch {
      /* ignore upload errors handled by store */
    } finally {
      setIsUploading(false);
    }
  };

  const openPickerTab = (tab: "library" | "upload" | "url" | "ai") => {
    setPickerTab(tab);
    setPickerOpen(true);
  };

  const handleSelectFromPicker = (url: string) => {
    onChange(url);
    setPickerOpen(false);
  };

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-700">
        Featured Image
      </label>

      {/* Image Preview State */}
      {value ? (
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-slate-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative h-32 w-full sm:w-48 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
              <img
                src={value}
                alt="Featured preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/stackly-logo.webp";
                }}
              />
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  Image Attached
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate font-mono bg-white px-2.5 py-1.5 rounded border border-slate-200">
                {value}
              </p>

              <div className="flex items-center gap-2 flex-wrap pt-1">
                <button
                  type="button"
                  disabled={disabled || isUploading}
                  onClick={() => openPickerTab("library")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition cursor-pointer"
                >
                  <FolderOpen className="h-3.5 w-3.5 text-blue-600" />
                  Choose from Assets
                </button>
                <button
                  type="button"
                  disabled={disabled || isUploading}
                  onClick={() => openPickerTab("ai")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 shadow-sm hover:bg-purple-100 transition cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                  Generate AI Image
                </button>
                <button
                  type="button"
                  disabled={disabled || isUploading}
                  onClick={handleRemove}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 shadow-sm hover:bg-red-100 transition cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-600" />
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty / Upload State */
        <div className="space-y-3">
          {isUploading ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
              <p className="text-sm font-semibold text-blue-900">Uploading featured image...</p>
              <p className="text-xs text-blue-600">Adding asset to media library</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <DropZone onFiles={handleUploadFiles} className="w-full" />

              <div className="flex items-center justify-center gap-3 pt-1 border-t border-slate-100 flex-wrap">
                <span className="text-xs text-slate-400 font-medium">Or choose existing media:</span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => openPickerTab("library")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition cursor-pointer"
                >
                  <FolderOpen className="h-3.5 w-3.5 text-blue-600" />
                  Choose from Assets
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => openPickerTab("ai")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3.5 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 transition cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                  Generate Image
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reusable Builder Asset Manager Modal */}
      <ImagePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectFromPicker}
        currentUrl={value}
        initialTab={pickerTab}
      />
    </div>
  );
}

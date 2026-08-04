"use client";
 
import { useState } from "react";
import { Image as ImageIcon, Loader2, Sparkles, FolderOpen, Trash2 } from "lucide-react";
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
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
        Featured Image
      </label>
 
      {/* Image Preview State */}
      {value ? (
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4 transition-all hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="relative h-32 w-full sm:w-48 shrink-0 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
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
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
                  Image Attached
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-mono bg-white dark:bg-slate-950 px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-800">
                {value}
              </p>
 
              <div className="flex flex-wrap items-center gap-2 pt-1 w-full">
                <button
                  type="button"
                  disabled={disabled || isUploading}
                  onClick={() => openPickerTab("library")}
                  className="flex-1 sm:flex-none inline-flex justify-center items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  <FolderOpen className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Assets</span>
                </button>
                <button
                  type="button"
                  disabled={disabled || isUploading}
                  onClick={() => openPickerTab("ai")}
                  className="flex-1 sm:flex-none inline-flex justify-center items-center gap-1.5 rounded-lg border border-purple-200 dark:border-purple-900/60 bg-purple-50 dark:bg-purple-950/60 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold text-purple-700 dark:text-purple-300 shadow-sm hover:bg-purple-100 dark:hover:bg-purple-900/60 transition cursor-pointer"
                >
                  <Sparkles className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>AI Generate</span>
                </button>
                <button
                  type="button"
                  disabled={disabled || isUploading}
                  onClick={handleRemove}
                  className="flex-auto sm:flex-none inline-flex justify-center items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/60 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold text-red-700 dark:text-red-300 shadow-sm hover:bg-red-100 dark:hover:bg-red-900/60 transition cursor-pointer"
                >
                  <Trash2 className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-red-600 dark:text-red-400 shrink-0" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty / Upload State */
        <div className="space-y-3">
          {isUploading ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/50 p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mb-2" />
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Uploading featured image...</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Adding asset to media library</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 sm:p-4 space-y-3 shadow-2xs">
              <DropZone onFiles={handleUploadFiles} className="w-full" />
 
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 pt-2 sm:pt-1 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-medium">Or choose existing media:</span>
                <div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => openPickerTab("library")}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 sm:px-3.5 py-1.5 text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer"
                  >
                    <FolderOpen className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Assets</span>
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => openPickerTab("ai")}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg border border-purple-200 dark:border-purple-900/60 bg-purple-50 dark:bg-purple-950/60 px-2 sm:px-3.5 py-1.5 text-[10px] sm:text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition cursor-pointer"
                  >
                    <Sparkles className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span>AI Generate</span>
                  </button>
                </div>
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
 
 
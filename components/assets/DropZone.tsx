"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Image as ImageIcon, Upload } from "lucide-react";

interface DropZoneProps {
  onFiles: (files: File[]) => void | Promise<void>;
  accept?:   string;
  multiple?: boolean;
  /** Render as a single compact row instead of a tall drop area. */
  compact?:  boolean;
  className?: string;
}

export function DropZone({
  onFiles,
  accept   = "image/*",
  multiple = true,
  compact  = false,
  className = "",
}: DropZoneProps) {
  const [isDragOver,    setIsDragOver]    = useState(false);
  const [isProcessing, setIsProcessing]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = useCallback(
    async (fileList: FileList | File[]) => {
      const arr = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
      if (!arr.length) return;
      setIsProcessing(true);
      try { await onFiles(arr); }
      finally { setIsProcessing(false); }
    },
    [onFiles],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handle(e.dataTransfer.files);
    },
    [handle],
  );

  return (
    <motion.div
      animate={{
        borderColor: isDragOver ? "#3b82f6" : "#d1d5db",
        backgroundColor: isDragOver ? "#eff6ff" : "#f9fafb",
      }}
      className={`relative flex cursor-pointer select-none flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors
        ${compact ? "gap-1.5 py-3.5" : "gap-3 py-10"}
        ${className}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={onDrop}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
    >
      <input
        ref={inputRef}
        accept={accept}
        className="hidden"
        multiple={multiple}
        type="file"
        onChange={(e) => e.target.files && handle(e.target.files)}
      />

      <AnimatePresence mode="wait">
        {isProcessing ? (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <span className="text-[12px] text-gray-500">Uploading…</span>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2 text-center"
          >
            <div
              className={`flex items-center justify-center rounded-xl bg-blue-50 text-blue-500
                ${compact ? "h-8 w-8" : "h-12 w-12"}`}
            >
              {isDragOver
                ? <ImageIcon className={compact ? "h-4 w-4" : "h-5 w-5"} />
                : <Upload    className={compact ? "h-4 w-4" : "h-5 w-5"} />}
            </div>

            {compact ? (
              <p className="text-[12px] font-medium text-gray-500">
                {isDragOver ? "Drop to upload" : "Click or drag to upload"}
              </p>
            ) : (
              <>
                <p className="text-[13px] font-semibold text-gray-700">
                  {isDragOver ? "Drop images here" : "Drag & drop or click to upload"}
                </p>
                <p className="text-[11px] text-gray-400">PNG, JPG, WebP, GIF, SVG · max 10 MB</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

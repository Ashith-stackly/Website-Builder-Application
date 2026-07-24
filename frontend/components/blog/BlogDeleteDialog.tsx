"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";

interface BlogDeleteDialogProps {
  blogTitle: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modern Confirmation modal shown before deleting a blog post.
 * Enhanced with Framer Motion backdrop blur, spring entry, and dark mode support.
 */
export default function BlogDeleteDialog({
  blogTitle,
  isDeleting,
  onConfirm,
  onCancel,
}: BlogDeleteDialogProps) {
  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[150] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="blog-delete-dialog-title"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-slate-950/50 dark:bg-slate-950/70 backdrop-blur-md"
          onClick={() => {
            if (!isDeleting) onCancel();
          }}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-rose-100 dark:border-rose-900/40 bg-white/95 dark:bg-slate-900/95 p-6 shadow-2xl shadow-rose-900/10 dark:shadow-slate-950/50 backdrop-blur-xl sm:p-7 text-slate-900 dark:text-slate-100"
        >
          {/* Top Decorative accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-red-500 to-amber-500" />

          {/* Close button */}
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="flex-1">
              <h2
                id="blog-delete-dialog-title"
                className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight"
              >
                Delete Blog Post
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700">
                  &ldquo;{blogTitle}&rdquo;
                </span>
                ? This action is permanent and cannot be undone.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-7 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 transition-all cursor-pointer disabled:opacity-60"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deleting…</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Post</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

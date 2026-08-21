"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaXmark, FaTrashCan } from "react-icons/fa6";

interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  onConfirm: () => void;
}

export default function DeleteProjectModal({
  isOpen,
  onClose,
  projectName,
  onConfirm,
}: DeleteProjectModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-slate-100 z-10"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/80 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 dark:bg-rose-500 text-white shadow-md shadow-rose-500/20">
                <FaTrashCan className="text-sm" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 m-0 leading-tight">
                  Delete Project
                </h3>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 m-0">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <FaXmark />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed m-0">
              Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">“{projectName}”</span>? This will permanently remove the project and its saved configurations from your workspace.
            </p>

            {/* Modal Actions */}
            <div className="pt-3 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 dark:bg-rose-500 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 dark:hover:bg-rose-600 transition-all cursor-pointer"
              >
                <FaTrashCan className="text-xs" />
                <span>Delete Project</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

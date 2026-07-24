"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaXmark, FaCheck, FaPencil } from "react-icons/fa6";

interface RenameProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName: string;
  onSave: (newName: string) => void;
}

export default function RenameProjectModal({
  isOpen,
  onClose,
  initialName,
  onSave,
}: RenameProjectModalProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(initialName);
    setError("");
  }, [initialName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Project name cannot be empty.");
      return;
    }
    setError("");
    onSave(trimmed);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
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
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 dark:bg-blue-500 text-white shadow-md shadow-blue-500/20">
                <FaPencil className="text-sm" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 m-0 leading-tight">
                  Rename Project
                </h3>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 m-0">
                  Update your project display name
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-400 dark:text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
            >
              <FaXmark />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            <div>
              <label htmlFor="rename-project-input" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Project Name
              </label>
              <input
                id="rename-project-input"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") onClose();
                }}
                placeholder="Enter new project name..."
                autoFocus
                className={`w-full rounded-2xl border-2 px-4 py-3 text-sm font-bold text-slate-900 dark:text-slate-100 outline-none transition-all ${
                  error
                    ? "border-rose-400 dark:border-rose-500 bg-rose-50 dark:bg-rose-950/40"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900"
                }`}
              />
              {error && (
                <p className="text-rose-500 dark:text-rose-400 text-xs font-bold mt-2">
                  {error}
                </p>
              )}
            </div>

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
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 dark:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 dark:hover:bg-blue-600 transition-all cursor-pointer"
              >
                <FaCheck className="text-xs" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Trash2,
  Globe,
  Palette,
  Layers,
  Calendar,
  Check,
  CircleAlert,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { fadeUp, staggerContainer, staggerChild } from "@/lib/motion";
import { useProjectStore } from "@/store/projectStore";
import type { Project } from "@/types/project";

interface ProjectSettingsFormProps {
  projectId: string;
}

const categoryOptions = ["E-commerce", "Portfolio", "Blog", "Business", "Restaurant"];
const styleOptions = ["Modern", "Minimal", "Bold"];

export default function ProjectSettingsForm({ projectId }: ProjectSettingsFormProps) {
  const router = useRouter();
  const project = useProjectStore((state) => state.projects.find((candidate) => candidate.id === projectId));
  const isLoading = useProjectStore((state) => state.isLoading);
  const updatingProjectId = useProjectStore((state) => state.updatingProjectId);
  const updateProject = useProjectStore((state) => state.updateProject);
  const deleteProject = useProjectStore((state) => state.deleteProject);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    style: "",
  });
  const [saveState, setSaveState] = useState<"idle" | "success" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [hydratedProjectId, setHydratedProjectId] = useState<string | null>(null);
  const isSaving = updatingProjectId === projectId;
  const isHydrated = hydratedProjectId === project?.id;

  useEffect(() => {
    if (!project || hydratedProjectId === project.id) return;
    // Project data arrives asynchronously from the dashboard store. Defer the
    // one-time hydration so editing state is never reset by later store syncs.
    const timer = window.setTimeout(() => {
      setFormData({ name: project.name, category: project.category, style: project.style });
      setHydratedProjectId(project.id);
      setSaveState("idle");
      setSaveError(null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hydratedProjectId, project]);

  const isDirty = useMemo(() => {
    if (!project || !isHydrated) return false;
    return formData.name.trim() !== project.name
      || formData.category !== project.category
      || formData.style !== project.style;
  }, [formData, isHydrated, project]);

  useEffect(() => {
    if (!isDirty) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [isDirty]);

  if (!project) {
    if (isLoading) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-3 text-sm font-semibold text-slate-500">Loading project settings…</p>
        </div>
      );
    }
    return (
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex min-h-[60vh] flex-col items-center justify-center text-center"
      >
        <FolderOpen className="h-12 w-12 text-slate-300" />
        <h2 className="mt-4 text-xl font-bold text-[#06224C]">Project Not Found</h2>
        <p className="mt-2 text-sm text-slate-400">This project doesn&apos;t exist or was deleted.</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-6 rounded-xl bg-[#06224C] px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-900"
        >
          Back to Dashboard
        </button>
      </motion.div>
    );
  }

  const handleSave = async () => {
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setSaveState("error");
      setSaveError("Project name is required.");
      return;
    }
    if (trimmedName.length > 100) {
      setSaveState("error");
      setSaveError("Project name must be 100 characters or fewer.");
      return;
    }
    if (formData.category.length > 80 || formData.style.length > 80) {
      setSaveState("error");
      setSaveError("Category and style must be 80 characters or fewer.");
      return;
    }
    if (!isDirty || isSaving) return;

    const changes: Partial<Pick<Project, "name" | "category" | "style">> = {};
    if (trimmedName !== project.name) changes.name = trimmedName;
    if (formData.category !== project.category) changes.category = formData.category;
    if (formData.style !== project.style) changes.style = formData.style;

    setSaveState("idle");
    setSaveError(null);
    try {
      const savedProject = await updateProject(project.id, changes);
      setFormData({
        name: savedProject.name,
        category: savedProject.category,
        style: savedProject.style,
      });
      setSaveState("success");
      window.setTimeout(() => setSaveState("idle"), 2400);
    } catch (error) {
      setSaveState("error");
      setSaveError(error instanceof Error ? error.message : "Unable to save project settings.");
    }
  };

  const handleDelete = () => {
    deleteProject(project.id);
    router.push("/dashboard");
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-2xl space-y-6"
    >
      {/* Back */}
      <motion.div variants={staggerChild}>
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-[#06224C]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
      </motion.div>

      {/* Header */}
      <motion.div variants={staggerChild} className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#06224C]">Project Settings</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            Manage settings for <span className="font-semibold text-[#06224C]">{project.name}</span>
          </p>
        </div>
      </motion.div>

      {/* General Settings */}
      <motion.div
        variants={staggerChild}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#06224C]">
          <Globe className="h-4 w-4" /> General
        </h2>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Project Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-sm font-medium text-[#06224C] outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              maxLength={100}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              <Palette className="mr-1 inline h-3 w-3" /> Category
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {categoryOptions.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat })}
                  className={`rounded-xl border-2 px-3 py-2 text-xs font-bold transition-all ${
                    formData.category === cat
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-100 text-slate-500 hover:border-blue-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              <Layers className="mr-1 inline h-3 w-3" /> Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              {styleOptions.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setFormData({ ...formData, style })}
                  className={`rounded-xl border-2 px-3 py-2 text-xs font-bold transition-all ${
                    formData.style === style
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-100 text-slate-500 hover:border-blue-200"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence initial={false}>
        {isDirty && saveState !== "success" ? (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="text-xs font-bold text-amber-600">
            You have unsaved changes.
          </motion.p>
        ) : null}
        {saveState === "error" && saveError ? (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{saveError}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Info Card */}
      <motion.div
        variants={staggerChild}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#06224C]">
          <Calendar className="h-4 w-4" /> Project Info
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Created</p>
            <p className="mt-0.5 font-semibold text-[#06224C]">
              {new Date(project.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Last Updated</p>
            <p className="mt-0.5 font-semibold text-[#06224C]">
              {new Date(project.updatedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sections</p>
            <p className="mt-0.5 font-semibold text-[#06224C]">{project.sections.length} sections</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Components</p>
            <p className="mt-0.5 font-semibold text-[#06224C]">{project.components?.length ?? 0} blocks</p>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div variants={staggerChild} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <motion.button
          type="button"
          disabled={isSaving || !isDirty}
          onClick={() => void handleSave()}
          whileHover={!isSaving && isDirty ? { scale: 1.02 } : undefined}
          whileTap={!isSaving && isDirty ? { scale: 0.98 } : undefined}
          className={`flex items-center justify-center gap-2 rounded-xl px-8 py-3 text-sm font-bold text-white shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
            saveState === "success" ? "bg-green-500" : "bg-[#06224C] hover:bg-blue-900"
          }`}
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : saveState === "success" ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {isSaving ? "Saving…" : saveState === "success" ? "Saved!" : "Save Changes"}
        </motion.button>

        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-6 py-3 text-sm font-bold text-red-500 transition-all hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" /> Delete Project
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-red-500">Are you sure?</span>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-red-600"
            >
              Yes, Delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-500 transition-all hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

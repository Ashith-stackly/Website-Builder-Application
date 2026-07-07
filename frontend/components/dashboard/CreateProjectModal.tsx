"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowRight,
  Sparkles,
  Loader2,
  Check,
  Blocks,
  BriefcaseBusiness,
  Contact,
  GalleryHorizontalEnd,
  LayoutTemplate,
  Megaphone,
  Navigation,
  Newspaper,
  Palette,
  PanelTop,
  ShoppingBag,
  Utensils,
  WandSparkles,
} from "lucide-react";
import { fadeUp, scaleIn } from "@/lib/motion";
import { createProject } from "@/lib/projectApi";
import { useProjectStore } from "@/store/projectStore";

const categories = [
  { title: "E-commerce", description: "Online store, products, and sales pages", icon: ShoppingBag },
  { title: "Portfolio", description: "Personal brand, work showcase, and contact", icon: Palette },
  { title: "Blog", description: "Articles, categories, and reader growth", icon: Newspaper },
  { title: "Business", description: "Services, company profile, and leads", icon: BriefcaseBusiness },
  { title: "Restaurant", description: "Menus, reservations, location, and guest contact", icon: Utensils },
];

const templateStyles = [
  { title: "Modern", description: "Balanced sections with soft panels", icon: LayoutTemplate },
  { title: "Minimal", description: "Clean layout with more white space", icon: PanelTop },
  { title: "Bold", description: "Stronger hero area and clearer action", icon: WandSparkles },
];

const websiteSections = [
  { id: "navigation", label: "Navigation", description: "Header with links and action", icon: Navigation },
  { id: "hero", label: "Hero", description: "Main headline section", icon: Megaphone },
  { id: "features", label: "Features", description: "Service or value cards", icon: Blocks },
  { id: "gallery", label: "Gallery", description: "Multiple image showcase", icon: GalleryHorizontalEnd },
  { id: "contact", label: "Contact", description: "Lead capture section", icon: Contact },
];

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [projectData, setProjectData] = useState({
    name: "",
    category: "",
    template: "",
    sections: ["navigation", "hero", "features", "contact"],
  });
  const [error, setError] = useState("");
  const [isBuilding, setIsBuilding] = useState(false);
  const loadProjects = useProjectStore((s) => s.loadProjects);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^[a-zA-Z0-9 ]*$/.test(value)) {
      setProjectData({ ...projectData, name: value });
      setError("");
    } else {
      setError("Please use only letters and numbers.");
    }
  };

  const handleNext = () => {
    if (step === 1 && !projectData.name.trim()) {
      setError("Project name is required.");
      return;
    }
    if (step === 2 && !projectData.category) {
      setError("Select a website category.");
      return;
    }
    if (step === 3 && !projectData.template) {
      setError("Select a template style.");
      return;
    }
    if (step === 4 && projectData.sections.length === 0) {
      setError("Select at least one section.");
      return;
    }
    setError("");
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  const toggleSection = (sectionId: string) => {
    setProjectData((current) => ({
      ...current,
      sections: current.sections.includes(sectionId)
        ? current.sections.filter((s) => s !== sectionId)
        : [...current.sections, sectionId],
    }));
    setError("");
  };

  const handleBuild = async () => {
    if (isBuilding) return;
    setError("");
    setIsBuilding(true);

    try {
      const project = await createProject({
        projectName: projectData.name.trim(),
        category: projectData.category,
        style: projectData.template,
        sections: projectData.sections,
      });

      // Refresh the dashboard list in the background so the new card appears.
      void loadProjects();

      onClose();
      resetForm();
      router.push(`/builder?projectId=${project._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the project. Please try again.");
      setIsBuilding(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setProjectData({
      name: "",
      category: "",
      template: "",
      sections: ["navigation", "hero", "features", "contact"],
    });
    setError("");
    setIsBuilding(false);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-6"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#06224C]/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-[95vw] sm:max-w-2xl bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/80 p-4 sm:p-6">
              <div className="min-w-0">
                <h3 className="text-lg font-black uppercase tracking-widest text-[#06224C] sm:text-xl">
                  Create Project
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  {[1, 2, 3, 4].map((s) => (
                    <div
                      key={s}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        s <= step ? "w-8 bg-blue-500" : "w-4 bg-slate-200"
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-[10px] font-bold text-slate-400">
                    {step}/4
                  </span>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-sm transition-all hover:bg-red-50 hover:text-red-500 sm:h-10 sm:w-10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="min-h-0 flex-grow overflow-y-auto p-4 sm:p-8">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-4 sm:space-y-6">
                    <h4 className="break-words text-xl font-black text-[#06224C] sm:text-2xl">Your Project Name.</h4>
                    <input
                      type="text"
                      placeholder="e.g. MyProject01"
                      className={`w-full rounded-xl border-2 px-4 py-3 text-base font-bold outline-none transition-all sm:rounded-2xl sm:px-6 sm:py-4 sm:text-lg ${
                        error
                          ? "border-red-400 bg-red-50"
                          : "border-slate-100 bg-slate-50 focus:border-blue-500 focus:bg-white"
                      }`}
                      value={projectData.name}
                      onChange={handleNameChange}
                      maxLength={40}
                    />
                    {error && (
                      <p className="animate-pulse text-[10px] font-bold uppercase tracking-wide text-red-500">
                        {error}
                      </p>
                    )}
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-4 sm:space-y-6">
                    <h4 className="break-words text-xl font-black text-[#06224C] sm:text-2xl">What are you building?</h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                      {categories.map((cat) => (
                        <motion.button
                          key={cat.title}
                          onClick={() => {
                            setProjectData({ ...projectData, category: cat.title });
                            setError("");
                          }}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className={`relative overflow-hidden rounded-xl border-2 p-3 text-left transition-all sm:rounded-2xl sm:p-5 ${
                            projectData.category === cat.title
                              ? "border-blue-500 bg-blue-50"
                              : "border-slate-100 hover:border-blue-200"
                          }`}
                        >
                          {projectData.category === cat.title && (
                            <motion.span
                              layoutId="selected-category-bg"
                              className="absolute inset-x-0 top-0 h-1 bg-blue-500"
                            />
                          )}
                          <span className="mb-3 inline-flex rounded-xl bg-white p-2 text-blue-600 shadow-sm">
                            <cat.icon className="h-5 w-5" />
                          </span>
                          <p className="text-sm font-black text-[#06224C] sm:text-base">{cat.title}</p>
                          <p className="text-[9px] font-bold uppercase text-slate-400">{cat.description}</p>
                        </motion.button>
                      ))}
                    </div>
                    {error && <p className="text-[10px] font-bold uppercase tracking-wide text-red-500">{error}</p>}
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="step3" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-4 sm:space-y-6">
                    <h4 className="break-words text-xl font-black text-[#06224C] sm:text-2xl">Pick a template style.</h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                      {templateStyles.map((style) => (
                        <motion.button
                          key={style.title}
                          onClick={() => {
                            setProjectData({ ...projectData, template: style.title });
                            setError("");
                          }}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className={`group cursor-pointer space-y-2 rounded-xl border-2 p-3 text-left transition-all sm:rounded-2xl ${
                            projectData.template === style.title
                              ? "border-blue-500 bg-blue-50/30"
                              : "border-slate-100 hover:border-blue-200"
                          }`}
                        >
                          <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-300 sm:rounded-xl">
                            <motion.div
                              animate={projectData.template === style.title ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                              transition={{ duration: 0.35 }}
                              className="rounded-xl bg-white p-3 text-blue-600 shadow-sm"
                            >
                              <style.icon className="h-6 w-6 sm:h-8 sm:w-8" />
                            </motion.div>
                          </div>
                          <p className="text-[11px] font-black text-[#06224C] sm:text-xs">{style.title}</p>
                          <p className="text-[9px] font-bold uppercase text-slate-400">{style.description}</p>
                        </motion.button>
                      ))}
                    </div>
                    {error && <p className="text-[10px] font-bold uppercase tracking-wide text-red-500">{error}</p>}
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div key="step4" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-4 sm:space-y-6">
                    <div>
                      <h4 className="break-words text-xl font-black text-[#06224C] sm:text-2xl">Choose website sections.</h4>
                      <p className="mt-1 text-xs font-bold uppercase text-slate-400">These will be added to your builder canvas.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {websiteSections.map((section) => {
                        const isSelected = projectData.sections.includes(section.id);
                        return (
                          <motion.button
                            key={section.id}
                            onClick={() => toggleSection(section.id)}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all sm:rounded-2xl sm:p-4 ${
                              isSelected ? "border-blue-500 bg-blue-50" : "border-slate-100 hover:border-blue-200"
                            }`}
                          >
                            <span
                              className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border ${
                                isSelected
                                  ? "border-blue-500 bg-blue-600 text-white"
                                  : "border-slate-200 text-slate-300"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </span>
                            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                              <section.icon className="h-4 w-4" />
                            </span>
                            <span>
                              <span className="block text-sm font-black text-[#06224C]">{section.label}</span>
                              <span className="block text-[9px] font-bold uppercase text-slate-400">{section.description}</span>
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                    {error && <p className="text-[10px] font-bold uppercase tracking-wide text-red-500">{error}</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/80 p-4 sm:p-6">
              <button
                onClick={handleBack}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-[#06224C] sm:px-8 sm:py-3 sm:text-xs ${
                  step === 1 ? "invisible" : ""
                }`}
              >
                Back
              </button>
              {step < 4 ? (
                <button
                  onClick={handleNext}
                  disabled={!!error || (step === 1 && !projectData.name)}
                  className="rounded-lg bg-[#06224C] px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-blue-900 disabled:opacity-50 sm:rounded-xl sm:px-10 sm:py-3 sm:text-xs"
                >
                  Continue <ArrowRight className="ml-1 inline h-3 w-3" />
                </button>
              ) : (
                <motion.button
                  onClick={handleBuild}
                  disabled={isBuilding || !projectData.template || projectData.sections.length === 0}
                  whileTap={isBuilding ? undefined : { scale: 0.96 }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-green-700 disabled:opacity-60 sm:rounded-xl sm:px-10 sm:py-3 sm:text-xs"
                >
                  {isBuilding ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Building
                    </>
                  ) : (
                    <>
                      Build <Sparkles className="ml-1 inline h-3 w-3" />
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

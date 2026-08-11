"use client";
 
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaXmark, FaArrowRight, FaWandMagicSparkles, FaImage, FaPlay, FaCheck } from "react-icons/fa6";

const categories = [
  { title: "E-commerce", description: "Online store, products, and sales pages" },
  { title: "Portfolio", description: "Personal brand, work showcase, and contact" },
  { title: "Blog", description: "Articles, categories, and reader growth" },
  { title: "Business", description: "Services, company profile, and leads" },
  { title: "Restaurant", description: "Menus, reservations, location, and guest contact" },
];

const templateStyles = [
  { title: "Modern", description: "Balanced sections with soft panels" },
  { title: "Minimal", description: "Clean layout with more white space" },
  { title: "Bold", description: "Stronger hero area and clearer action" },
];

const websiteSections = [
  { id: "navigation", label: "Navigation", description: "Header with links and action" },
  { id: "hero", label: "Hero", description: "Main headline section" },
  { id: "features", label: "Features", description: "Service or value cards" },
  { id: "gallery", label: "Gallery", description: "Multiple image showcase" },
  { id: "contact", label: "Contact", description: "Lead capture section" },
];
 
const CreateProjectModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [projectData, setProjectData] = useState({
    name: "",
    category: "",
    template: "",
    sections: ["navigation", "hero", "features", "contact"],
  });
  const [error, setError] = useState("");

  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const stepContainerRef = useRef<HTMLDivElement>(null);

  // Focus management when modal opens or step changes
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (step === 1) {
        inputRef.current?.focus();
      } else if (stepContainerRef.current) {
        const firstFocusable = stepContainerRef.current.querySelector<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [isOpen, step]);

  // Keyboard trap and Escape key handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }

    if (e.key === "Tab") {
      if (!modalRef.current) return;
      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };
 
  if (!isOpen) return null;
 
  // Validation: Only allow Alphanumeric and Spaces
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const regex = /^[a-zA-Z0-9 ]*$/;
 
    if (regex.test(value)) {
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
    setProjectData((current) => {
      const isSelected = current.sections.includes(sectionId);

      return {
        ...current,
        sections: isSelected
          ? current.sections.filter((section) => section !== sectionId)
          : [...current.sections, sectionId],
      };
    });
    setError("");
  };

  const handleBuild = () => {
    const params = new URLSearchParams({
      projectName: projectData.name.trim(),
      category: projectData.category,
      style: projectData.template,
      sections: projectData.sections.join(","),
    });

    onClose();
    setStep(1);
    setProjectData({ name: "", category: "", template: "", sections: ["navigation", "hero", "features", "contact"] });
    router.push(`/builder?${params.toString()}`);
  };
 
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-6 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-project-title"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
 
      {/* Modal Card */}
      <div
        ref={modalRef}
        className="relative w-full max-w-[95vw] sm:max-w-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh] text-slate-900 dark:text-slate-100"
      >
       
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-slate-800 flex items-start justify-between bg-gray-50 dark:bg-slate-950 gap-4 shrink-0">
          <div className="min-w-0">
            <h3 id="create-project-title" className="text-base sm:text-xl font-black text-[#06224C] dark:text-slate-100 uppercase tracking-wider sm:tracking-widest break-words">
              Create Project
            </h3>
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase">Step {step} of 4</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/60 text-gray-400 dark:text-slate-400 hover:text-red-500 transition-all flex-shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-slate-950"
          >
            <FaXmark />
          </button>
        </div>
 
        {/* Content Area */}
        <div ref={stepContainerRef} className="p-4 sm:p-8 overflow-y-auto flex-grow min-h-0">
         
          {/* STEP 1: Name Validation */}
          {step === 1 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <h4 className="text-xl sm:text-2xl font-black text-[#06224C] dark:text-slate-100 leading-tight break-words">Your Project Name.</h4>
              </div>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  name="projectName"
                  placeholder="e.g. MyProject01"
                  className={`w-full border-2 rounded-xl sm:rounded-2xl px-4 py-3 sm:px-6 sm:py-4 text-base sm:text-lg outline-none transition-all font-bold text-[#06224C] dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 ${
                    error
                      ? "border-red-500 bg-red-50 dark:bg-red-950/60 focus:border-red-600 focus-visible:border-red-600"
                      : "border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:border-blue-600 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 focus-visible:border-blue-600 dark:focus-visible:border-blue-400"
                  } autofill:shadow-[0_0_0_1000px_white_inset] dark:autofill:shadow-[0_0_0_1000px_#0f172a_inset]`}
                  value={projectData.name}
                  onChange={handleNameChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && projectData.name.trim() && !error) {
                      e.preventDefault();
                      handleNext();
                    }
                  }}
                  autoFocus
                />
                {error && (
                  <p className="text-red-500 dark:text-rose-400 text-[10px] font-bold mt-2 uppercase tracking-wide animate-pulse">
                    {error}
                  </p>
                )}
              </div>
            </div>
          )}
 
          {/* STEP 2: Category */}
          {step === 2 && (
            <div className="space-y-4 sm:space-y-6">
              <h4 className="text-xl sm:text-2xl font-black text-[#06224C] dark:text-slate-100 break-words">What are you building?</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-0.5">
                {categories.map((cat) => (
                  <button
                    key={cat.title}
                    type="button"
                    aria-pressed={projectData.category === cat.title}
                    onClick={() => {
                      setProjectData({ ...projectData, category: cat.title });
                      setError("");
                    }}
                    className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 text-left transition-all cursor-pointer focus:outline-none focus-visible:outline-none focus-visible:border-blue-600 dark:focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-600/30 ${
                      projectData.category === cat.title
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/60 shadow-xs"
                        : "border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-blue-200 dark:hover:border-blue-500/50"
                    }`}
                  >
                    <p className="font-black text-sm sm:text-base text-[#06224C] dark:text-slate-100">{cat.title}</p>
                    <p className="text-[9px] text-gray-400 dark:text-slate-500 font-bold uppercase">{cat.description}</p>
                  </button>
                ))}
              </div>
              {error && <p className="text-red-500 dark:text-rose-400 text-[10px] font-bold uppercase tracking-wide">{error}</p>}
            </div>
          )}
 
          {/* STEP 3: Template Style */}
          {step === 3 && (
            <div className="space-y-4 sm:space-y-6">
              <h4 className="text-xl sm:text-2xl font-black text-[#06224C] dark:text-slate-100 break-words">Pick a template style.</h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 p-0.5">
                {templateStyles.map((style) => (
                  <button
                    key={style.title}
                    type="button"
                    aria-pressed={projectData.template === style.title}
                    onClick={() => {
                      setProjectData({ ...projectData, template: style.title });
                      setError("");
                    }}
                    className={`group cursor-pointer space-y-2 rounded-xl sm:rounded-2xl border-2 p-3 text-left transition-all focus:outline-none focus-visible:outline-none focus-visible:border-blue-600 dark:focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-600/30 ${
                      projectData.template === style.title
                        ? "border-blue-500 bg-blue-50/30 dark:bg-blue-950/40 shadow-xs"
                        : "border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-blue-200 dark:hover:border-blue-500/50"
                    }`}
                  >
                    <div className="aspect-video bg-gray-100 dark:bg-slate-800 rounded-lg sm:rounded-xl overflow-hidden flex items-center justify-center text-gray-300 dark:text-slate-600">
                      <FaImage className="text-2xl sm:text-3xl text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-[11px] sm:text-xs font-black text-[#06224C] dark:text-slate-100">{style.title}</p>
                    <p className="text-[9px] font-bold uppercase text-gray-400 dark:text-slate-500">{style.description}</p>
                  </button>
                ))}
              </div>
              {error && <p className="text-red-500 dark:text-rose-400 text-[10px] font-bold uppercase tracking-wide">{error}</p>}
            </div>
          )}
 
          {/* STEP 4: Sections */}
          {step === 4 && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h4 className="text-xl sm:text-2xl font-black text-[#06224C] dark:text-slate-100 break-words">Choose website sections.</h4>
                <p className="mt-1 text-xs font-bold uppercase text-gray-400 dark:text-slate-500">These will be added to your builder canvas.</p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 p-0.5">
                {websiteSections.map((section) => {
                  const isSelected = projectData.sections.includes(section.id);

                  return (
                    <button
                      key={section.id}
                      type="button"
                      role="checkbox"
                      aria-checked={isSelected}
                      onClick={() => toggleSection(section.id)}
                      className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all sm:rounded-2xl sm:p-4 cursor-pointer focus:outline-none focus-visible:outline-none focus-visible:border-blue-600 dark:focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-600/30 ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/60 shadow-xs"
                          : "border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-blue-200 dark:hover:border-blue-500/50"
                      }`}
                    >
                      <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border ${isSelected ? "border-blue-500 bg-blue-600 text-white" : "border-gray-200 dark:border-slate-700 text-gray-300 dark:text-slate-600"}`}>
                        {isSelected && <FaCheck className="text-[10px]" />}
                      </span>
                      <span>
                        <span className="block text-sm font-black text-[#06224C] dark:text-slate-100">{section.label}</span>
                        <span className="block text-[9px] font-bold uppercase text-gray-400 dark:text-slate-500">{section.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {error && <p className="text-red-500 dark:text-rose-400 text-[10px] font-bold uppercase tracking-wide">{error}</p>}
            </div>
          )}
        </div>
 
        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-slate-950 border-t border-gray-100 dark:border-slate-800 flex flex-wrap items-center gap-2 shrink-0">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 sm:px-8 sm:py-3 font-black text-[10px] sm:text-xs uppercase tracking-widest text-gray-400 dark:text-slate-500 hover:text-[#06224C] dark:hover:text-slate-200 transition-colors cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-slate-950"
            >
              Back
            </button>
          )}
         
          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!!error || !projectData.name}
              className="ml-auto bg-[#06224C] dark:bg-blue-600 text-white px-6 py-2 sm:px-10 sm:py-3 rounded-lg sm:rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-blue-900 dark:hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg whitespace-nowrap cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-slate-950"
            >
              Continue <FaArrowRight className="inline ml-1" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleBuild}
              disabled={!projectData.template || projectData.sections.length === 0}
              className="ml-auto bg-green-600 dark:bg-green-500 text-white px-6 py-2 sm:px-10 sm:py-3 rounded-lg sm:rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-green-700 dark:hover:bg-green-600 transition-all shadow-lg disabled:opacity-50 whitespace-nowrap cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 dark:focus-visible:ring-green-300 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-slate-950"
            >
              Build <FaWandMagicSparkles className="inline ml-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
 
export default function CreateProjectFlow() {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      triggerRef.current?.focus();
    }, 50);
  };
 
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#0A2357] px-8 py-4 font-bold text-white shadow-xl transition hover:scale-105 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A2357]"
      >
        Get Started
        <span className="rounded-full bg-white p-1 text-[10px] text-[#0A2357]">
          <FaPlay />
        </span>
      </button>
 
      <CreateProjectModal isOpen={isOpen} onClose={handleClose} />
    </>
  );
}

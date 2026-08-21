"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  FaXmark,
  FaArrowRight,
  FaWandMagicSparkles,
  FaImage,
  FaCheck,
} from "react-icons/fa6";
import { Loader2 } from "lucide-react";
import { createProject } from "@/lib/projectApi";
import { getAuthToken } from "@/lib/authToken";
import { useProjectStore } from "@/store/projectStore";

export const PROJECT_CATEGORIES = [
  { title: "E-commerce", description: "Online store, products, and sales pages" },
  { title: "Portfolio", description: "Personal brand, work showcase, and contact" },
  { title: "Blog", description: "Articles, categories, and reader growth" },
  { title: "Business", description: "Services, company profile, and leads" },
  { title: "Restaurant", description: "Menus, reservations, location, and guest contact" },
];

export const TEMPLATE_STYLES = [
  { title: "Modern", description: "Balanced sections with soft panels", image: "/landing-optimized/modern.webp" },
  { title: "Minimal", description: "Clean layout with more white space", image: "/landing-optimized/minimal.webp" },
  { title: "Bold", description: "Stronger hero area and clearer action", image: "/landing-optimized/bold.webp" },
];

/** All possible sections a category template can use. */
export const ALL_SECTIONS: Record<string, { label: string; description: string }> = {
  navigation:      { label: "Navigation",    description: "Header with links and action" },
  hero:            { label: "Hero",          description: "Main headline section" },
  features:        { label: "Features",      description: "Service or value cards" },
  gallery:         { label: "Gallery",       description: "Multiple image showcase" },
  contact:         { label: "Contact",       description: "Lead capture section" },
  "pricing-table": { label: "Pricing Table", description: "Plan comparison cards" },
  testimonial:     { label: "Testimonial",   description: "Customer review quotes" },
  form:            { label: "Form",          description: "Custom input form" },
  footer:          { label: "Footer",        description: "Bottom links and branding" },
  tabs:            { label: "Tabs",          description: "Tabbed content panels" },
  map:             { label: "Map",           description: "Embedded location map" },
};

/**
 * Maps each project category to the section IDs used by its template generator.
 */
export const CATEGORY_SECTIONS: Record<string, string[]> = {
  "E-commerce":  ["navigation", "hero", "features", "gallery", "pricing-table", "testimonial", "contact", "footer"],
  Portfolio:     ["navigation", "hero", "gallery", "features", "testimonial", "form", "footer"],
  Blog:          ["navigation", "hero", "features", "gallery", "tabs", "contact", "footer"],
  Business:      ["navigation", "hero", "features", "pricing-table", "testimonial", "form", "footer"],
  Restaurant:    ["navigation", "hero", "gallery", "features", "testimonial", "map", "contact", "footer"],
};

export const DEFAULT_SECTION_IDS = ["navigation", "hero", "features", "contact"];

export const getSectionsForCategory = (category: string) => {
  const ids = CATEGORY_SECTIONS[category] ?? DEFAULT_SECTION_IDS;
  return ids
    .map((id) => ({ id, ...(ALL_SECTIONS[id] ?? { label: id, description: "" }) }))
    .filter((s) => s.label !== s.id || ALL_SECTIONS[s.id]);
};

export interface ProjectCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated?: () => void;
}

export default function ProjectCreationWizard({
  isOpen,
  onClose,
  onProjectCreated,
}: ProjectCreationWizardProps) {
  const router = useRouter();
  const isClient = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [step, setStep] = useState(1);
  const [projectData, setProjectData] = useState({
    name: "",
    category: PROJECT_CATEGORIES[0].title,
    template: TEMPLATE_STYLES[0].title,
    sections: CATEGORY_SECTIONS[PROJECT_CATEGORIES[0].title] ?? DEFAULT_SECTION_IDS,
  });
  const [error, setError] = useState("");
  const [isBuilding, setIsBuilding] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const stepContainerRef = useRef<HTMLDivElement>(null);
  const backBtnRef = useRef<HTMLButtonElement>(null);
  const continueBtnRef = useRef<HTMLButtonElement>(null);
  const buildBtnRef = useRef<HTMLButtonElement>(null);

  // Lock both body and html scroll while modal is open, and prevent arrow keys from scrolling the window
  useEffect(() => {
    if (!isOpen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "PageUp" ||
        e.key === "PageDown" ||
        e.key === "Home" ||
        e.key === "End"
      ) {
        const isTextInput =
          document.activeElement &&
          (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA");

        if (isTextInput) {
          if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "PageUp" || e.key === "PageDown") {
            e.preventDefault();
          }
          return;
        }

        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleWindowKeyDown, { capture: true });

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      window.removeEventListener("keydown", handleWindowKeyDown, { capture: true });
    };
  }, [isOpen]);

  // Focus and default selection management when modal opens or step changes
  useEffect(() => {
    if (!isOpen) return;

    if (step === 1) {
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
    } else if (step === 2) {
      setTimeout(() => {
        const activeCat = projectData.category || PROJECT_CATEGORIES[0].title;
        const btn = stepContainerRef.current?.querySelector<HTMLElement>(`[data-category="${activeCat}"]`);
        btn?.focus({ preventScroll: true });
      }, 50);
    } else if (step === 3) {
      setTimeout(() => {
        const activeTpl = projectData.template || TEMPLATE_STYLES[0].title;
        const btn = stepContainerRef.current?.querySelector<HTMLElement>(`[data-template="${activeTpl}"]`);
        btn?.focus({ preventScroll: true });
      }, 50);
    } else if (step === 4) {
      setTimeout(() => {
        const firstBtn = stepContainerRef.current?.querySelector<HTMLElement>("button[data-section]");
        firstBtn?.focus({ preventScroll: true });
      }, 50);
    }
  }, [isOpen, step, projectData.category, projectData.template]);

  // Keyboard trap and Escape key handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      handleClose();
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
          lastElement.focus({ preventScroll: true });
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus({ preventScroll: true });
        }
      }
    }
  };

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

  const handleBack = () => {
    setError("");
    setStep((s) => s - 1);
  };

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

  // Step 2 Arrow navigation (Categories -> Back -> Continue)
  const navigateStep2 = (currentIndex: number, direction: 1 | -1) => {
    const total = PROJECT_CATEGORIES.length + 2;
    const nextIndex = (currentIndex + direction + total) % total;
    if (nextIndex < PROJECT_CATEGORIES.length) {
      const nextCat = PROJECT_CATEGORIES[nextIndex];
      const newSections = CATEGORY_SECTIONS[nextCat.title] ?? DEFAULT_SECTION_IDS;
      setProjectData((prev) => ({ ...prev, category: nextCat.title, sections: [...newSections] }));
      setError("");
      const btn = stepContainerRef.current?.querySelector<HTMLElement>(`[data-category="${nextCat.title}"]`);
      btn?.focus({ preventScroll: true });
      btn?.scrollIntoView({ block: "nearest" });
    } else if (nextIndex === PROJECT_CATEGORIES.length) {
      backBtnRef.current?.focus({ preventScroll: true });
    } else if (nextIndex === PROJECT_CATEGORIES.length + 1) {
      continueBtnRef.current?.focus({ preventScroll: true });
    }
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent, catIndex: number) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      e.stopPropagation();
      navigateStep2(catIndex, 1);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      e.stopPropagation();
      navigateStep2(catIndex, -1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      const cat = PROJECT_CATEGORIES[catIndex];
      const newSections = CATEGORY_SECTIONS[cat.title] ?? DEFAULT_SECTION_IDS;
      setProjectData((prev) => ({ ...prev, category: cat.title, sections: [...newSections] }));
      setError("");
      setStep(3);
    }
  };

  // Step 3 Arrow navigation (Template Styles -> Back -> Continue)
  const navigateStep3 = (currentIndex: number, direction: 1 | -1) => {
    const total = TEMPLATE_STYLES.length + 2;
    const nextIndex = (currentIndex + direction + total) % total;
    if (nextIndex < TEMPLATE_STYLES.length) {
      const nextStyle = TEMPLATE_STYLES[nextIndex];
      setProjectData((prev) => ({ ...prev, template: nextStyle.title }));
      setError("");
      const btn = stepContainerRef.current?.querySelector<HTMLElement>(`[data-template="${nextStyle.title}"]`);
      btn?.focus({ preventScroll: true });
      btn?.scrollIntoView({ block: "nearest" });
    } else if (nextIndex === TEMPLATE_STYLES.length) {
      backBtnRef.current?.focus({ preventScroll: true });
    } else if (nextIndex === TEMPLATE_STYLES.length + 1) {
      continueBtnRef.current?.focus({ preventScroll: true });
    }
  };

  const handleTemplateKeyDown = (e: React.KeyboardEvent, styleIndex: number) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      e.stopPropagation();
      navigateStep3(styleIndex, 1);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      e.stopPropagation();
      navigateStep3(styleIndex, -1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      const style = TEMPLATE_STYLES[styleIndex];
      setProjectData((prev) => ({ ...prev, template: style.title }));
      setError("");
      setStep(4);
    }
  };

  // Step 4 Arrow navigation (Dynamic Sections -> Back -> Build)
  const currentSections = getSectionsForCategory(projectData.category);

  const navigateStep4 = (currentIndex: number, direction: 1 | -1) => {
    const total = currentSections.length + 2;
    const nextIndex = (currentIndex + direction + total) % total;
    if (nextIndex < currentSections.length) {
      const section = currentSections[nextIndex];
      const btn = stepContainerRef.current?.querySelector<HTMLElement>(`[data-section="${section.id}"]`);
      btn?.focus({ preventScroll: true });
      btn?.scrollIntoView({ block: "nearest" });
    } else if (nextIndex === currentSections.length) {
      backBtnRef.current?.focus({ preventScroll: true });
    } else if (nextIndex === currentSections.length + 1) {
      buildBtnRef.current?.focus({ preventScroll: true });
    }
  };

  const handleSectionKeyDown = (e: React.KeyboardEvent, sectionIndex: number) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      e.stopPropagation();
      navigateStep4(sectionIndex, 1);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      e.stopPropagation();
      navigateStep4(sectionIndex, -1);
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      toggleSection(currentSections[sectionIndex].id);
    }
  };

  // Back button keyboard navigation
  const handleBackKeyDown = (e: React.KeyboardEvent) => {
    if (step === 4) {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        buildBtnRef.current?.focus({ preventScroll: true });
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        const lastSection = currentSections[currentSections.length - 1];
        const btn = stepContainerRef.current?.querySelector<HTMLElement>(`[data-section="${lastSection.id}"]`);
        btn?.focus({ preventScroll: true });
        btn?.scrollIntoView({ block: "nearest" });
      }
    } else if (step === 2) {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        continueBtnRef.current?.focus({ preventScroll: true });
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        const lastCat = PROJECT_CATEGORIES[PROJECT_CATEGORIES.length - 1];
        const btn = stepContainerRef.current?.querySelector<HTMLElement>(`[data-category="${lastCat.title}"]`);
        btn?.focus({ preventScroll: true });
        btn?.scrollIntoView({ block: "nearest" });
      }
    } else if (step === 3) {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        continueBtnRef.current?.focus({ preventScroll: true });
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        const lastStyle = TEMPLATE_STYLES[TEMPLATE_STYLES.length - 1];
        const btn = stepContainerRef.current?.querySelector<HTMLElement>(`[data-template="${lastStyle.title}"]`);
        btn?.focus({ preventScroll: true });
        btn?.scrollIntoView({ block: "nearest" });
      }
    }
  };

  // Continue button keyboard navigation
  const handleContinueKeyDown = (e: React.KeyboardEvent) => {
    if (step === 2) {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        const firstCat = PROJECT_CATEGORIES[0];
        const btn = stepContainerRef.current?.querySelector<HTMLElement>(`[data-category="${firstCat.title}"]`);
        btn?.focus({ preventScroll: true });
        btn?.scrollIntoView({ block: "nearest" });
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        backBtnRef.current?.focus({ preventScroll: true });
      }
    } else if (step === 3) {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        const firstStyle = TEMPLATE_STYLES[0];
        const btn = stepContainerRef.current?.querySelector<HTMLElement>(`[data-template="${firstStyle.title}"]`);
        btn?.focus({ preventScroll: true });
        btn?.scrollIntoView({ block: "nearest" });
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        backBtnRef.current?.focus({ preventScroll: true });
      }
    }
  };

  // Build button keyboard navigation
  const handleBuildKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      e.stopPropagation();
      const firstSection = currentSections[0];
      const btn = stepContainerRef.current?.querySelector<HTMLElement>(`[data-section="${firstSection.id}"]`);
      btn?.focus({ preventScroll: true });
      btn?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      e.stopPropagation();
      backBtnRef.current?.focus({ preventScroll: true });
    }
  };

  const resetState = () => {
    setStep(1);
    setProjectData({
      name: "",
      category: PROJECT_CATEGORIES[0].title,
      template: TEMPLATE_STYLES[0].title,
      sections: CATEGORY_SECTIONS[PROJECT_CATEGORIES[0].title] ?? DEFAULT_SECTION_IDS,
    });
    setError("");
    setIsBuilding(false);
  };

  const handleClose = () => {
    onClose();
    resetState();
  };

  const handleBuild = async () => {
    if (isBuilding) return;
    setError("");
    setIsBuilding(true);

    const token = typeof window !== "undefined" ? getAuthToken() : null;
    const isEcommerce = projectData.category === "E-commerce";
    const editorType = isEcommerce ? "ecommerce" : "builder";

    try {
      if (token) {
        // Authenticated: Create project in MongoDB via API
        const project = await createProject({
          projectName: projectData.name.trim(),
          category: projectData.category,
          style: projectData.template,
          sections: projectData.sections,
          editorType,
        });

        // Trigger store refresh for dashboard list
        try {
          const loadProjects = useProjectStore.getState().loadProjects;
          if (loadProjects) void loadProjects();
        } catch {
          /* ignore */
        }

        if (onProjectCreated) {
          onProjectCreated();
        }

        handleClose();
        const editorPath = editorType === "ecommerce" ? "/e-commerce" : "/builder";
        router.push(`${editorPath}?projectId=${project._id}`);
      } else {
        // Unauthenticated: pass requirements directly to editor
        const params = new URLSearchParams({
          projectName: projectData.name.trim(),
          category: projectData.category,
          style: projectData.template,
          sections: projectData.sections.join(","),
          editorType,
        });

        handleClose();
        const editorPath = editorType === "ecommerce" ? "/e-commerce" : "/builder";
        router.push(`${editorPath}?${params.toString()}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the project. Please try again.");
      setIsBuilding(false);
    }
  };

  if (!isOpen || !isClient) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-6 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-project-title"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal Card */}
      <div
        ref={modalRef}
        className="relative w-full max-w-[95vw] sm:max-w-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh] text-slate-900 dark:text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-8 pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm sm:text-base">
              <FaWandMagicSparkles />
            </span>
            <div>
              <h3 id="create-project-title" className="text-base sm:text-xl font-bold tracking-tight text-[#0A2357] dark:text-white">
                Create New Project
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Step {step} of 4:{" "}
                {step === 1
                  ? "Project Name"
                  : step === 2
                  ? "Select Category"
                  : step === 3
                  ? "Choose Style"
                  : "Customize Sections"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <FaXmark className="text-base sm:text-lg" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 flex-shrink-0" role="progressbar" aria-valuenow={(step / 4) * 100} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="bg-[#0A2357] dark:bg-blue-500 h-1 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Modal Body */}
        <div ref={stepContainerRef} className="p-4 sm:p-8 flex-1 overflow-y-auto min-h-0">
          {/* STEP 1: Name */}
          {step === 1 && (
            <div className="space-y-4">
              <label htmlFor="project-name-input" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                What would you like to name your project?
              </label>
              <input
                id="project-name-input"
                ref={inputRef}
                type="text"
                value={projectData.name}
                onChange={handleNameChange}
                onKeyDown={(e) => e.key === "Enter" && handleNext()}
                placeholder="e.g. Acme Studio"
                maxLength={40}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition"
              />
              <p className="text-[11px] sm:text-xs text-slate-400">
                Letters, numbers, and spaces only. Max 40 characters.
              </p>
            </div>
          )}

          {/* STEP 2: Category */}
          {step === 2 && (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Select your website type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3" role="radiogroup" aria-label="Website Category">
                {PROJECT_CATEGORIES.map((cat, idx) => {
                  const isSelected = projectData.category === cat.title;
                  return (
                    <button
                      key={cat.title}
                      data-category={cat.title}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => {
                        const newSections = CATEGORY_SECTIONS[cat.title] ?? DEFAULT_SECTION_IDS;
                        setProjectData({ ...projectData, category: cat.title, sections: [...newSections] });
                        setError("");
                      }}
                      onKeyDown={(e) => handleCategoryKeyDown(e, idx)}
                      className={`flex flex-col items-start p-3 sm:p-4 rounded-xl border text-left transition cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 ${
                        isSelected
                          ? "border-[#0A2357] dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-sm"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                          {cat.title}
                        </span>
                        {isSelected && <FaCheck className="text-xs text-[#0A2357] dark:text-blue-400" />}
                      </div>
                      <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                        {cat.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Style */}
          {step === 3 && (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Choose a visual template style
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Template Style">
                {TEMPLATE_STYLES.map((style, idx) => {
                  const isSelected = projectData.template === style.title;
                  return (
                    <button
                      key={style.title}
                      data-template={style.title}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => {
                        setProjectData({ ...projectData, template: style.title });
                        setError("");
                      }}
                      onKeyDown={(e) => handleTemplateKeyDown(e, idx)}
                      className={`flex flex-col rounded-xl border overflow-hidden text-left transition cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 ${
                        isSelected
                          ? "border-[#0A2357] dark:border-blue-500 bg-blue-50/30 dark:bg-blue-900/20 shadow-md ring-2 ring-[#0A2357] dark:ring-blue-500"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800"
                      }`}
                    >
                      <div className="h-28 sm:h-32 w-full bg-slate-100 dark:bg-slate-700 relative overflow-hidden flex items-center justify-center">
                        <img
                          src={style.image}
                          alt={style.title}
                          className="h-full w-full object-cover transition duration-300 hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center -z-10 text-slate-300">
                          <FaImage className="text-2xl" />
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {style.title}
                          </span>
                          {isSelected && <FaCheck className="text-xs text-[#0A2357] dark:text-blue-400" />}
                        </div>
                        <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 block">
                          {style.description}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Sections */}
          {step === 4 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Select website sections
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {projectData.sections.length} selected
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="group" aria-label="Sections selection">
                {currentSections.map((sec, idx) => {
                  const isChecked = projectData.sections.includes(sec.id);
                  return (
                    <button
                      key={sec.id}
                      data-section={sec.id}
                      type="button"
                      role="checkbox"
                      aria-checked={isChecked}
                      onClick={() => toggleSection(sec.id)}
                      onKeyDown={(e) => handleSectionKeyDown(e, idx)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 ${
                        isChecked
                          ? "border-[#0A2357] dark:border-blue-500 bg-blue-50/40 dark:bg-blue-900/20"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800"
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition ${
                          isChecked
                            ? "border-[#0A2357] dark:border-blue-500 bg-[#0A2357] dark:bg-blue-500 text-white"
                            : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                        }`}
                      >
                        {isChecked && <FaCheck className="text-[10px]" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                          {sec.label}
                        </span>
                        <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {sec.description}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-900/30 p-2.5 sm:p-3 text-[11px] sm:text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 flex items-center justify-between">
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
          {step > 1 ? (
            <button
              ref={backBtnRef}
              type="button"
              onClick={handleBack}
              onKeyDown={handleBackKeyDown}
              disabled={isBuilding}
              className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              ref={continueBtnRef}
              type="button"
              onClick={handleNext}
              onKeyDown={handleContinueKeyDown}
              className="flex items-center gap-2 rounded-xl bg-[#0A2357] dark:bg-blue-600 px-6 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-blue-900 dark:hover:bg-blue-700 transition cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
            >
              Continue
              <FaArrowRight className="text-xs" />
            </button>
          ) : (
            <button
              ref={buildBtnRef}
              type="button"
              onClick={handleBuild}
              onKeyDown={handleBuildKeyDown}
              disabled={isBuilding}
              className="flex items-center gap-2 rounded-xl bg-[#0A2357] dark:bg-blue-600 px-6 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-blue-900 dark:hover:bg-blue-700 transition cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isBuilding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Building Workspace...
                </>
              ) : (
                <>
                  <FaWandMagicSparkles className="text-xs" />
                  Build Website
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

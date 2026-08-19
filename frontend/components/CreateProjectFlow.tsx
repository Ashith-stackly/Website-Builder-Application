"use client";
 
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  { title: "Modern", description: "Balanced sections with soft panels", image: "/landing-optimized/modern.webp" },
  { title: "Minimal", description: "Clean layout with more white space", image: "/landing-optimized/minimal.webp" },
  { title: "Bold", description: "Stronger hero area and clearer action", image: "/landing-optimized/bold.webp" },
];

/** All possible sections a category template can use. */
const allSections: Record<string, { label: string; description: string }> = {
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
 * Maps each project category to the section IDs used by its
 * `buildCategoryTemplate` in the builder store.
 */
const categorySections: Record<string, string[]> = {
  "E-commerce":  ["navigation", "hero", "features", "gallery", "pricing-table", "testimonial", "contact", "footer"],
  Portfolio:     ["navigation", "hero", "gallery", "features", "testimonial", "form", "footer"],
  Blog:          ["navigation", "hero", "features", "gallery", "tabs", "contact", "footer"],
  Business:      ["navigation", "hero", "features", "pricing-table", "testimonial", "form", "footer"],
  Restaurant:    ["navigation", "hero", "gallery", "features", "testimonial", "map", "contact", "footer"],
};

/** Fallback sections when no category-specific mapping exists. */
const defaultSectionIds = ["navigation", "hero", "features", "contact"];

/** Return the section list for a given category (with metadata for rendering). */
const getSectionsForCategory = (category: string) => {
  const ids = categorySections[category] ?? defaultSectionIds;
  return ids
    .map((id) => ({ id, ...(allSections[id] ?? { label: id, description: "" }) }))
    .filter((s) => s.label !== s.id || allSections[s.id]); // drop unknown ids
};
 
const CreateProjectModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [projectData, setProjectData] = useState({
    name: "",
    category: "",
    template: "",
    sections: defaultSectionIds,
  });
  const [error, setError] = useState("");

  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const stepContainerRef = useRef<HTMLDivElement>(null);
  const backBtnRef = useRef<HTMLButtonElement>(null);
  const continueBtnRef = useRef<HTMLButtonElement>(null);
  const buildBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock both body and html scroll while modal is open, and prevent arrow keys from scrolling the window
  useEffect(() => {
    if (!isOpen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    // Capture arrow keys and navigation keys to prevent window/background scrolling
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
      if (!projectData.category) {
        const initialCategory = categories[0].title;
        const initialSections = categorySections[initialCategory] ?? defaultSectionIds;
        setProjectData((prev) => ({
          ...prev,
          category: initialCategory,
          sections: [...initialSections],
        }));
      }
      setTimeout(() => {
        const activeCat = projectData.category || categories[0].title;
        const btn = stepContainerRef.current?.querySelector<HTMLElement>(`[data-category="${activeCat}"]`);
        btn?.focus({ preventScroll: true });
      }, 50);
    } else if (step === 3) {
      if (!projectData.template) {
        setProjectData((prev) => ({ ...prev, template: templateStyles[0].title }));
      }
      setTimeout(() => {
        const activeTpl = projectData.template || templateStyles[0].title;
        const btn = stepContainerRef.current?.querySelector<HTMLElement>(`[data-template="${activeTpl}"]`);
        btn?.focus({ preventScroll: true });
      }, 50);
    } else if (step === 4) {
      setTimeout(() => {
        const firstBtn = stepContainerRef.current?.querySelector<HTMLElement>('button[data-section]');
        firstBtn?.focus({ preventScroll: true });
      }, 50);
    }
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

  // Step 2 Arrow navigation (Categories -> Back -> Continue)
  const navigateStep2 = (currentIndex: number, direction: 1 | -1) => {
    const total = categories.length + 2; // 5 categories + Back + Continue = 7
    const nextIndex = (currentIndex + direction + total) % total;
    if (nextIndex < categories.length) {
      const nextCat = categories[nextIndex];
      const newSections = categorySections[nextCat.title] ?? defaultSectionIds;
      setProjectData((prev) => ({ ...prev, category: nextCat.title, sections: [...newSections] }));
      setError("");
      const btn = stepContainerRef.current?.querySelector<HTMLElement>(`[data-category="${nextCat.title}"]`);
      btn?.focus({ preventScroll: true });
      btn?.scrollIntoView({ block: "nearest" });
    } else if (nextIndex === categories.length) {
      backBtnRef.current?.focus({ preventScroll: true });
    } else if (nextIndex === categories.length + 1) {
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
      const cat = categories[catIndex];
      const newSections = categorySections[cat.title] ?? defaultSectionIds;
      setProjectData((prev) => ({ ...prev, category: cat.title, sections: [...newSections] }));
      setError("");
      setStep(3);
    }
  };

  // Step 3 Arrow navigation (Template Styles -> Back -> Continue)
  const navigateStep3 = (currentIndex: number, direction: 1 | -1) => {
    const total = templateStyles.length + 2; // 3 styles + Back + Continue = 5
    const nextIndex = (currentIndex + direction + total) % total;
    if (nextIndex < templateStyles.length) {
      const nextStyle = templateStyles[nextIndex];
      setProjectData((prev) => ({ ...prev, template: nextStyle.title }));
      setError("");
      const btn = stepContainerRef.current?.querySelector<HTMLElement>(`[data-template="${nextStyle.title}"]`);
      btn?.focus({ preventScroll: true });
      btn?.scrollIntoView({ block: "nearest" });
    } else if (nextIndex === templateStyles.length) {
      backBtnRef.current?.focus({ preventScroll: true });
    } else if (nextIndex === templateStyles.length + 1) {
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
      const style = templateStyles[styleIndex];
      setProjectData((prev) => ({ ...prev, template: style.title }));
      setError("");
      setStep(4);
    }
  };

  // Step 4 Arrow navigation (Dynamic Sections -> Back -> Build)
  const currentSections = getSectionsForCategory(projectData.category);

  const navigateStep4 = (currentIndex: number, direction: 1 | -1) => {
    const total = currentSections.length + 2; // dynamic sections count + Back + Build
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
        const lastCat = categories[categories.length - 1];
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
        const lastStyle = templateStyles[templateStyles.length - 1];
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
        const firstCat = categories[0];
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
        const firstStyle = templateStyles[0];
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

  const handleBuild = () => {
    const params = new URLSearchParams({
      projectName: projectData.name.trim(),
      category: projectData.category,
      style: projectData.template,
      sections: projectData.sections.join(","),
    });

    onClose();
    setStep(1);
    setProjectData({ name: "", category: "", template: "", sections: defaultSectionIds });
    router.push(`/builder?${params.toString()}`);
  };

  if (!isOpen || !mounted) return null;
 
  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-6 overflow-hidden"
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
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Step {step} of 4</p>
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
        <div ref={stepContainerRef} className="p-4 sm:p-8 overflow-y-auto flex-grow min-h-0 overscroll-contain">
         
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
                  } autofill:!text-[#06224C] dark:autofill:!text-slate-100 autofill:!shadow-[0_0_0_1000px_white_inset] dark:autofill:!shadow-[0_0_0_1000px_#0f172a_inset]`}
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
                {categories.map((cat, index) => (
                  <button
                    key={cat.title}
                    data-category={cat.title}
                    type="button"
                    aria-pressed={projectData.category === cat.title}
                    onClick={() => {
                      const newSections = categorySections[cat.title] ?? defaultSectionIds;
                      setProjectData({ ...projectData, category: cat.title, sections: [...newSections] });
                      setError("");
                    }}
                    onKeyDown={(e) => handleCategoryKeyDown(e, index)}
                    className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 text-left transition-all cursor-pointer focus:outline-none focus-visible:outline-none ${
                      projectData.category === cat.title
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/60 shadow-xs focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/30"
                        : "border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-blue-200 dark:hover:border-blue-500/50 focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/30"
                    }`}
                  >
                    <p className="font-black text-sm sm:text-base text-[#06224C] dark:text-slate-100">{cat.title}</p>
                    <p className="text-[10px] text-slate-600 dark:text-slate-300 font-bold uppercase">{cat.description}</p>
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
                {templateStyles.map((style, index) => (
                  <button
                    key={style.title}
                    data-template={style.title}
                    type="button"
                    aria-pressed={projectData.template === style.title}
                    onClick={() => {
                      setProjectData({ ...projectData, template: style.title });
                      setError("");
                    }}
                    onKeyDown={(e) => handleTemplateKeyDown(e, index)}
                    className={`group cursor-pointer space-y-2 rounded-xl sm:rounded-2xl border-2 p-3 text-left transition-all focus:outline-none focus-visible:outline-none ${
                      projectData.template === style.title
                        ? "border-blue-500 bg-blue-50/30 dark:bg-blue-950/40 shadow-xs focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/30"
                        : "border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-blue-200 dark:hover:border-blue-500/50 focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/30"
                    }`}
                  >
                    <div className="aspect-video bg-gray-100 dark:bg-slate-800 rounded-lg sm:rounded-xl overflow-hidden flex items-center justify-center text-gray-300 dark:text-slate-600 relative w-full">
                      <img
                        src={style.image}
                        alt={`${style.title} style preview`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <p className="text-[11px] sm:text-xs font-black text-[#06224C] dark:text-slate-100">{style.title}</p>
                    <p className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">{style.description}</p>
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
                <p className="mt-1 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">These will be added to your builder canvas.</p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 p-0.5">
                {currentSections.map((section, index) => {
                  const isSelected = projectData.sections.includes(section.id);

                  return (
                    <button
                      key={section.id}
                      data-section={section.id}
                      type="button"
                      role="checkbox"
                      aria-checked={isSelected}
                      onClick={() => toggleSection(section.id)}
                      onKeyDown={(e) => handleSectionKeyDown(e, index)}
                      className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all sm:rounded-2xl sm:p-4 cursor-pointer focus:outline-none focus-visible:outline-none ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/60 shadow-xs focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/30"
                          : "border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-blue-200 dark:hover:border-blue-500/50 focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/30"
                      }`}
                    >
                      <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border ${isSelected ? "border-blue-500 bg-blue-600 text-white" : "border-gray-200 dark:border-slate-700 text-gray-300 dark:text-slate-600"}`}>
                        {isSelected && <FaCheck className="text-[10px]" />}
                      </span>
                      <span>
                        <span className="block text-sm font-black text-[#06224C] dark:text-slate-100">{section.label}</span>
                        <span className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">{section.description}</span>
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
              ref={backBtnRef}
              type="button"
              onClick={handleBack}
              onKeyDown={handleBackKeyDown}
              className="px-4 py-2 sm:px-8 sm:py-3 font-black text-[10px] sm:text-xs uppercase tracking-widest text-gray-500 dark:text-slate-500 hover:text-[#06224C] dark:hover:text-slate-200 transition-colors cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-slate-950"
            >
              Back
            </button>
          )}
         
          {step < 4 ? (
            <button
              ref={continueBtnRef}
              type="button"
              onClick={handleNext}
              onKeyDown={handleContinueKeyDown}
              disabled={!!error || !projectData.name}
              className="ml-auto bg-[#06224C] dark:bg-blue-600 text-white px-6 py-2 sm:px-10 sm:py-3 rounded-lg sm:rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-blue-900 dark:hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg whitespace-nowrap cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-slate-950"
            >
              Continue <FaArrowRight className="inline ml-1" />
            </button>
          ) : (
            <button
              ref={buildBtnRef}
              type="button"
              onClick={handleBuild}
              onKeyDown={handleBuildKeyDown}
              disabled={!projectData.template || projectData.sections.length === 0}
              className="ml-auto bg-green-600 dark:bg-green-500 text-white px-6 py-2 sm:px-10 sm:py-3 rounded-lg sm:rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-green-700 dark:hover:bg-green-600 transition-all shadow-lg disabled:opacity-50 whitespace-nowrap cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 dark:focus-visible:ring-green-300 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-slate-950"
            >
              Build <FaWandMagicSparkles className="inline ml-1" />
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
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
      triggerRef.current?.focus({ preventScroll: true });
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
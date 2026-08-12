"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronRight,
  LayoutDashboard,
  Palette,
  Sparkles,
  X,
} from "lucide-react";
import type { ComponentType } from "@/types/builder";

/* ─── Category / Goal / Style / Depth configuration ───────────────────── */

type LayoutCategory = {
  id: string;
  label: string;
  description: string;
  icon: string;
};

const CATEGORIES: LayoutCategory[] = [
  { id: "E-commerce",        label: "E-commerce",        description: "Products, collections & checkout",   icon: "🛒" },
  { id: "Portfolio",          label: "Portfolio",          description: "Work showcase & personal brand",     icon: "🎨" },
  { id: "Blog",              label: "Blog",               description: "Articles, categories & subscribers", icon: "📝" },
  { id: "Business",          label: "Business",           description: "Services, pricing & leads",          icon: "🏢" },
  { id: "Restaurant",        label: "Restaurant",         description: "Menu, reservations & location",      icon: "🍽️" },
  { id: "Construction",      label: "Construction",       description: "Projects, safety & quotes",          icon: "🏗️" },
  { id: "Digital Marketing",  label: "Digital Marketing",  description: "Growth, SEO & performance ads",     icon: "📈" },
];

const GOALS = [
  { id: "leads",       label: "Get Leads",         description: "Forms and contact CTAs" },
  { id: "sell",        label: "Sell Products",      description: "Showcase products and pricing" },
  { id: "book",        label: "Book Appointments",  description: "Reservations and scheduling" },
  { id: "showcase",    label: "Showcase Work",      description: "Portfolio and case studies" },
  { id: "audience",    label: "Grow Audience",       description: "Newsletter and social growth" },
];

const STYLES = [
  { id: "Modern",  label: "Modern",  description: "Balanced sections with soft panels" },
  { id: "Minimal", label: "Minimal", description: "Clean layout with more white space" },
  { id: "Bold",    label: "Bold",    description: "Stronger hero area and clearer action" },
];

type ContentDepth = "lean" | "balanced" | "detailed";

const DEPTHS: Array<{ id: ContentDepth; label: string; detail: string }> = [
  { id: "lean",      label: "Lean",       detail: "Fast landing page" },
  { id: "balanced",  label: "Balanced",   detail: "Standard website" },
  { id: "detailed",  label: "Detailed",   detail: "Full experience" },
];

/* ─── Section registry (mirroring CreateProjectFlow) ──────────────────── */

const SECTION_META: Record<string, { label: string; description: string; icon: string }> = {
  navigation:           { label: "Navigation",     description: "Header with links and action",  icon: "🧭" },
  hero:                 { label: "Hero",            description: "Main headline section",         icon: "⭐" },
  features:             { label: "Features",        description: "Service or value cards",        icon: "✨" },
  gallery:              { label: "Gallery",         description: "Image showcase",                icon: "🖼️" },
  contact:              { label: "Contact",         description: "Lead capture section",          icon: "📬" },
  "pricing-table":      { label: "Pricing Table",   description: "Plan comparison cards",         icon: "💰" },
  testimonial:          { label: "Testimonial",     description: "Customer review quotes",        icon: "💬" },
  form:                 { label: "Form",            description: "Custom input form",             icon: "📋" },
  footer:               { label: "Footer",          description: "Bottom links and branding",     icon: "🔻" },
  tabs:                 { label: "Tabs",            description: "Tabbed content panels",         icon: "📑" },
  map:                  { label: "Map",             description: "Embedded location map",         icon: "📍" },
};

/**
 * Full sections per category (matching `buildCategoryTemplate` in builderStore).
 */
const CATEGORY_FULL_SECTIONS: Record<string, string[]> = {
  "E-commerce":         ["navigation", "hero", "features", "gallery", "pricing-table", "testimonial", "contact", "footer"],
  "Portfolio":          ["navigation", "hero", "gallery", "features", "testimonial", "form", "footer"],
  "Blog":              ["navigation", "hero", "features", "gallery", "tabs", "contact", "footer"],
  "Business":          ["navigation", "hero", "features", "pricing-table", "testimonial", "form", "footer"],
  "Restaurant":        ["navigation", "hero", "gallery", "features", "testimonial", "map", "contact", "footer"],
  "Construction":      ["navigation", "hero", "features", "gallery", "contact", "footer"],
  "Digital Marketing":  ["navigation", "hero", "features", "testimonial", "form", "footer"],
};

/** Lean = only the essentials. Balanced = full template. Detailed = full + extras. */
function getSectionsForDepth(category: string, depth: ContentDepth): string[] {
  const full = CATEGORY_FULL_SECTIONS[category] ?? ["navigation", "hero", "features", "contact"];

  if (depth === "lean") {
    // Keep navigation, hero, one middle section, and the last section (contact/form/footer)
    const essentials = new Set(["navigation", "hero"]);
    // Add the first meaningful middle section
    const middle = full.find((s) => !essentials.has(s) && s !== "footer");
    if (middle) essentials.add(middle);
    // Always end with footer if present, otherwise last non-footer
    const lastSection = full[full.length - 1];
    if (lastSection) essentials.add(lastSection);
    // Add contact/form if present (important for leads)
    const contactOrForm = full.find((s) => s === "contact" || s === "form");
    if (contactOrForm) essentials.add(contactOrForm);
    return full.filter((s) => essentials.has(s));
  }

  if (depth === "detailed") {
    // Full template + bonus sections that make sense
    const extras: string[] = [];
    if (!full.includes("testimonial")) extras.push("testimonial");
    if (!full.includes("footer")) extras.push("footer");
    return [...full, ...extras];
  }

  // balanced = the full template as-is
  return [...full];
}

/** Color palettes mapped to styles */
const STYLE_PALETTES: Record<string, { primary: string; surface: string; accent: string }> = {
  Modern:  { primary: "#0B1D40", surface: "#f7f9fc", accent: "#3b82f6" },
  Minimal: { primary: "#1a1a2e", surface: "#ffffff", accent: "#6366f1" },
  Bold:    { primary: "#0B1D40", surface: "#eef4fb", accent: "#2563eb" },
};

/* ─── Component ───────────────────────────────────────────────────────── */

export function SmartLayoutPicker({
  open,
  onClose,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (config: { category: string; style: string; sections: string[] }) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [category, setCategory] = useState("");
  const [goal, setGoal] = useState("leads");
  const [style, setStyle] = useState("Modern");
  const [depth, setDepth] = useState<ContentDepth>("balanced");

  useEffect(() => { setMounted(true); }, []);

  const close = useCallback(() => { onClose(); }, [onClose]);

  // Keyboard handling
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, open]);

  const sections = useMemo(
    () => category ? getSectionsForDepth(category, depth) : [],
    [category, depth],
  );

  const palette = STYLE_PALETTES[style] ?? STYLE_PALETTES.Modern;

  const handleApply = () => {
    if (!category || sections.length === 0) return;
    onApply({ category, style, sections });
    close();
  };

  const dialog = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[21000] flex items-end justify-center bg-[#07142d]/55 p-3 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <motion.section
            aria-labelledby="smart-layout-title"
            aria-modal="true"
            role="dialog"
            initial={{ opacity: 0, y: 28, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.985 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            onMouseDown={(e) => e.stopPropagation()}
            className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-white/60 bg-[#fffdfb] shadow-[0_30px_90px_rgba(7,20,45,0.34)]"
          >
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-start justify-between border-b border-[#eee8e2] bg-[#fffdfb]/95 px-5 py-4 backdrop-blur sm:px-6">
              <div className="flex min-w-0 gap-3">
                <div className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-sm">
                  <LayoutDashboard className="h-4 w-4" />
                </div>
                <div>
                  <h2 id="smart-layout-title" className="text-[15px] font-extrabold text-[#0B1D40]">Smart Layout Picker</h2>
                  <p className="mt-0.5 text-xs leading-5 text-[#66738d]">Choose your business type, goal, and style — preview the structure, then apply it to your canvas.</p>
                </div>
              </div>
              <button type="button" onClick={close} aria-label="Close layout picker" className="rounded-lg p-2 text-[#66738d] transition hover:bg-slate-100 hover:text-[#0B1D40] focus:outline-none focus:ring-2 focus:ring-violet-300">
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
              {/* ── Left: Configuration ── */}
              <div className="space-y-5">
                {/* Category */}
                <fieldset>
                  <legend className="mb-2 text-xs font-bold uppercase tracking-[0.13em] text-[#52627f]">Website type</legend>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`rounded-xl border p-2.5 text-left transition focus:outline-none focus:ring-2 focus:ring-violet-300 ${
                          category === cat.id
                            ? "border-violet-500 bg-violet-50 text-violet-900 shadow-sm"
                            : "border-[#dce3ed] bg-white text-[#334563] hover:border-violet-300"
                        }`}
                      >
                        <span className="mr-1.5 text-sm">{cat.icon}</span>
                        <span className="text-xs font-extrabold">{cat.label}</span>
                        <span className="mt-0.5 block text-[10px] text-[#66738d]">{cat.description}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                {/* Goal */}
                <fieldset>
                  <legend className="mb-2 text-xs font-bold uppercase tracking-[0.13em] text-[#52627f]">Primary goal</legend>
                  <div className="flex flex-wrap gap-1.5">
                    {GOALS.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setGoal(g.id)}
                        className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition focus:outline-none focus:ring-2 focus:ring-violet-300 ${
                          goal === g.id
                            ? "border-violet-500 bg-violet-50 text-violet-800"
                            : "border-[#dce3ed] bg-white text-[#52627f] hover:border-violet-300"
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                {/* Style */}
                <fieldset>
                  <legend className="mb-2 text-xs font-bold uppercase tracking-[0.13em] text-[#52627f]">Template style</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {STYLES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setStyle(s.id)}
                        className={`rounded-xl border p-2 text-left transition focus:outline-none focus:ring-2 focus:ring-violet-300 ${
                          style === s.id
                            ? "border-violet-500 bg-violet-50 text-violet-900"
                            : "border-[#dce3ed] bg-white text-[#334563] hover:border-violet-300"
                        }`}
                      >
                        <span className="block text-xs font-extrabold">{s.label}</span>
                        <span className="mt-0.5 block text-[10px] text-[#66738d]">{s.description}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                {/* Content depth */}
                <fieldset>
                  <legend className="mb-2 text-xs font-bold uppercase tracking-[0.13em] text-[#52627f]">Content depth</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {DEPTHS.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setDepth(d.id)}
                        className={`rounded-xl border p-2 text-left transition focus:outline-none focus:ring-2 focus:ring-violet-300 ${
                          depth === d.id
                            ? "border-violet-500 bg-violet-50 text-violet-900"
                            : "border-[#dce3ed] bg-white text-[#334563] hover:border-violet-300"
                        }`}
                      >
                        <span className="block text-xs font-extrabold">{d.label}</span>
                        <span className="mt-0.5 block text-[10px] text-[#66738d]">{d.detail}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>

              {/* ── Right: Preview ── */}
              <div className="flex min-h-[360px] flex-col rounded-2xl border border-[#e5e9f0] bg-[#f8fafc] p-3 sm:p-4">
                {category ? (
                  <>
                    {/* Title */}
                    <div className="mb-4 border-b border-[#e5e9f0] px-1 pb-3">
                      <p className="text-sm font-extrabold text-[#0B1D40]">
                        {CATEGORIES.find((c) => c.id === category)?.icon}{" "}
                        {category} Layout
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#66738d]">
                        {sections.length} sections · {STYLES.find((s) => s.id === style)?.label} style · {DEPTHS.find((d) => d.id === depth)?.label} depth
                      </p>
                    </div>

                    {/* Section list */}
                    <ol className="flex-1 space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
                      {sections.map((sectionId, index) => {
                        const meta = SECTION_META[sectionId];
                        return (
                          <motion.li
                            key={sectionId}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.04 }}
                            className="flex gap-3 rounded-xl border border-[#e4e9f1] bg-white p-3"
                          >
                            <div className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-violet-100 text-[11px] font-extrabold text-violet-700">
                              {index + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold text-[#203554]">
                                <span className="mr-1">{meta?.icon ?? "📦"}</span>
                                {meta?.label ?? sectionId}
                              </p>
                              <p className="mt-0.5 text-[11px] leading-4 text-[#66738d]">
                                {meta?.description ?? ""}
                              </p>
                            </div>
                          </motion.li>
                        );
                      })}
                    </ol>

                    {/* Palette preview */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#e5e9f0] pt-3">
                      <span className="mr-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#66738d]">
                        <Palette className="h-3 w-3" /> Palette
                      </span>
                      {Object.entries(palette).map(([name, color]) => (
                        <span key={name} title={`${name}: ${color}`} className="flex items-center gap-1.5 rounded-full border border-[#e0e6ef] bg-white py-1 pl-1 pr-2 text-[10px] font-semibold text-[#52627f]">
                          <i className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: color }} />
                          {name}
                        </span>
                      ))}
                    </div>

                    {/* Warning */}
                    <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-4 text-amber-900">
                      Applying replaces the current canvas. Use Undo to restore it.
                    </div>

                    {/* Apply button */}
                    <button
                      type="button"
                      onClick={handleApply}
                      disabled={sections.length === 0}
                      className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1D40] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#102a5f] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2"
                    >
                      <Check className="h-4 w-4" />
                      Apply this layout
                    </button>
                  </>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold text-[#334563]">Select a website type to start</p>
                    <p className="mt-1 max-w-[280px] text-xs leading-5 text-[#7b879a]">
                      Pick a category on the left to preview the recommended page structure and color palette.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return mounted ? createPortal(dialog, document.body) : null;
}

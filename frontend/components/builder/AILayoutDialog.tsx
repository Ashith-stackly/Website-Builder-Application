"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  CircleDot,
  LoaderCircle,
  Palette,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";
import { suggestAILayout } from "@/lib/aiApi";
import type { AILayoutSection, AILayoutSuggestion, ComponentType } from "@/types/builder";

type ContentLength = "short" | "medium" | "long";

const SUPPORTED_TYPES = new Set<ComponentType>([
  "navigation", "hero", "heading", "text", "button", "icon", "feature-item",
  "columns", "image", "input", "divider", "features", "gallery", "contact",
  "container", "video", "map", "accordion", "tabs", "spacer", "social-links",
  "countdown", "pricing-table", "testimonial", "footer", "form", "row",
]);

const LENGTHS: Array<{ value: ContentLength; label: string; detail: string }> = [
  { value: "short", label: "Lean", detail: "Fast landing page" },
  { value: "medium", label: "Balanced", detail: "Most websites" },
  { value: "long", label: "Detailed", detail: "More discovery" },
];

const GOALS = ["Get leads", "Sell products", "Book appointments", "Showcase work", "Grow an audience"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const cleanText = (value: unknown, max = 800): string | undefined => {
  if (typeof value !== "string") return undefined;
  const clean = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
  return clean ? clean.slice(0, max) : undefined;
};

const cleanColor = (value: unknown): string | undefined =>
  typeof value === "string" && /^#[0-9a-f]{3,8}$/i.test(value.trim()) ? value.trim() : undefined;

/**
 * Treat network payloads as untrusted even though the backend validates them.
 * Only supported builder block types and a small, serializable hint object are
 * passed on to the store, which makes the Apply action safe and undoable.
 */
function normalizeSuggestion(payload: unknown): AILayoutSuggestion | null {
  const root = isRecord(payload) && isRecord(payload.suggestion) ? payload.suggestion : payload;
  if (!isRecord(root)) return null;

  const rawSections = Array.isArray(root.sections)
    ? root.sections
    : Array.isArray(root.components)
      ? root.components
      : [];

  const sections: AILayoutSection[] = rawSections.flatMap((raw) => {
    if (typeof raw === "string") {
      return SUPPORTED_TYPES.has(raw as ComponentType) ? [{ type: raw as ComponentType }] : [];
    }
    if (!isRecord(raw) || !SUPPORTED_TYPES.has(raw.type as ComponentType)) return [];

    const rawProps = isRecord(raw.props) ? raw.props : {};
    const props = Object.fromEntries(
      ["title", "heading", "description", "ctaLabel", "cta"]
        .filter((key) => {
          const value = rawProps[key];
          return typeof value === "string" || (key === "cta" && isRecord(value));
        })
        .map((key) => [key, rawProps[key]]),
    );

    return [{
      type: raw.type as ComponentType,
      ...(cleanText(raw.label, 160) ? { label: cleanText(raw.label, 160) } : {}),
      ...(cleanText(raw.purpose, 240) ? { purpose: cleanText(raw.purpose, 240) } : {}),
      ...(cleanText(raw.contentHint, 600) ? { contentHint: cleanText(raw.contentHint, 600) } : {}),
      ...(Object.keys(props).length ? { props } : {}),
    }];
  });

  if (!sections.length) return null;
  const rawPalette = isRecord(root.colorPalette) ? root.colorPalette : {};
  const palette = Object.fromEntries(
    ["primary", "secondary", "accent", "background", "text"]
      .map((key) => [key, cleanColor(rawPalette[key])])
      .filter(([, value]) => Boolean(value)),
  );

  return {
    ...(cleanText(root.title, 160) ? { title: cleanText(root.title, 160) } : {}),
    ...(cleanText(root.rationale, 500) ? { rationale: cleanText(root.rationale, 500) } : {}),
    sections,
    ...(Object.keys(palette).length ? { colorPalette: palette } : {}),
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function AILayoutDialog({
  open,
  onClose,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (suggestion: AILayoutSuggestion) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [businessType, setBusinessType] = useState("");
  const [industry, setIndustry] = useState("");
  const [goal, setGoal] = useState(GOALS[0]);
  const [services, setServices] = useState("");
  const [contentLength, setContentLength] = useState<ContentLength>("medium");
  const [suggestion, setSuggestion] = useState<AILayoutSuggestion | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const requestRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    setMounted(true);
    return () => requestRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!open) requestRef.current?.abort();
  }, [open]);

  const close = useCallback(() => {
    requestRef.current?.abort();
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, open]);

  const generate = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const requestId = ++requestIdRef.current;
    setError("");
    setIsLoading(true);

    try {
      const response = await suggestAILayout(
        {
          businessType: businessType.trim() || undefined,
          industry: industry.trim() || undefined,
          goal: goal.trim() || undefined,
          services: services
            .split(/[,\n]/)
            .map((service) => service.trim())
            .filter(Boolean)
            .slice(0, 12),
          contentLength,
        },
        controller.signal,
      );
      if (requestId !== requestIdRef.current) return;

      const next = normalizeSuggestion(response);
      if (!next) throw new Error("The AI response did not contain a usable website layout.");
      setSuggestion(next);
    } catch (requestError) {
      if (requestId !== requestIdRef.current || isAbortError(requestError)) return;
      setError(requestError instanceof Error ? requestError.message : "Unable to suggest a layout right now.");
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, [businessType, contentLength, goal, industry, services]);

  const paletteEntries = useMemo(
    () => Object.entries(suggestion?.colorPalette ?? {}).filter(([, color]) => Boolean(color)),
    [suggestion],
  );

  const apply = () => {
    if (!suggestion) return;
    onApply(suggestion);
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
          onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}
        >
          <motion.section
            aria-labelledby="ai-layout-title"
            aria-modal="true"
            role="dialog"
            initial={{ opacity: 0, y: 28, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.985 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            onMouseDown={(event) => event.stopPropagation()}
            className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-white/60 bg-[#fffdfb] shadow-[0_30px_90px_rgba(7,20,45,0.34)]"
          >
            <header className="sticky top-0 z-10 flex items-start justify-between border-b border-[#eee8e2] bg-[#fffdfb]/95 px-5 py-4 backdrop-blur sm:px-6">
              <div className="flex min-w-0 gap-3">
                <div className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-sm">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h2 id="ai-layout-title" className="text-[15px] font-extrabold text-[#0B1D40]">AI layout assistant</h2>
                  <p className="mt-0.5 text-xs leading-5 text-[#66738d]">Describe the site you need, review the plan, then apply it as one undoable canvas change.</p>
                </div>
              </div>
              <button type="button" onClick={close} aria-label="Close layout assistant" className="rounded-lg p-2 text-[#66738d] transition hover:bg-slate-100 hover:text-[#0B1D40] focus:outline-none focus:ring-2 focus:ring-violet-300">
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-[#334563]">Business type</span>
                    <input value={businessType} onChange={(event) => setBusinessType(event.target.value)} maxLength={120} placeholder="e.g. Local bakery" className="w-full rounded-lg border border-[#dce3ed] bg-white px-3 py-2 text-sm text-[#0B1D40] outline-none transition placeholder:text-[#9aa6b9] focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-[#334563]">Industry</span>
                    <input value={industry} onChange={(event) => setIndustry(event.target.value)} maxLength={120} placeholder="e.g. Food & hospitality" className="w-full rounded-lg border border-[#dce3ed] bg-white px-3 py-2 text-sm text-[#0B1D40] outline-none transition placeholder:text-[#9aa6b9] focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-[#334563]">Primary goal</span>
                  <select value={goal} onChange={(event) => setGoal(event.target.value)} className="w-full rounded-lg border border-[#dce3ed] bg-white px-3 py-2 text-sm text-[#0B1D40] outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
                    {GOALS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-[#334563]">Services or content to highlight</span>
                  <textarea value={services} onChange={(event) => setServices(event.target.value)} maxLength={900} rows={5} placeholder="Custom cakes, catering, online ordering" className="w-full resize-y rounded-lg border border-[#dce3ed] bg-white px-3 py-2 text-sm text-[#0B1D40] outline-none transition placeholder:text-[#9aa6b9] focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
                  <span className="mt-1 block text-[10px] text-[#8792a6]">Separate services with commas or new lines.</span>
                </label>

                <fieldset>
                  <legend className="mb-2 text-xs font-bold uppercase tracking-[0.13em] text-[#52627f]">Content depth</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {LENGTHS.map((option) => (
                      <button key={option.value} type="button" aria-pressed={contentLength === option.value} onClick={() => setContentLength(option.value)} className={`rounded-xl border p-2 text-left transition focus:outline-none focus:ring-2 focus:ring-violet-300 ${contentLength === option.value ? "border-violet-500 bg-violet-50 text-violet-900" : "border-[#dce3ed] bg-white text-[#334563] hover:border-violet-300"}`}>
                        <span className="block text-xs font-extrabold">{option.label}</span>
                        <span className="mt-0.5 block text-[10px] text-[#66738d]">{option.detail}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <button type="button" onClick={() => void generate()} disabled={isLoading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:from-blue-800 hover:to-violet-700 disabled:cursor-wait disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2">
                  {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
                  {isLoading ? "Planning your layout…" : suggestion ? "Regenerate layout" : "Suggest layout"}
                </button>
                {isLoading && <button type="button" onClick={() => requestRef.current?.abort()} className="mx-auto block text-xs font-semibold text-[#66738d] underline-offset-2 hover:text-[#0B1D40] hover:underline">Cancel planning</button>}
              </div>

              <div className="flex min-h-[360px] flex-col rounded-2xl border border-[#e5e9f0] bg-[#f8fafc] p-3 sm:p-4">
                {error ? (
                  <div role="alert" className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 flex-none" /><span>{error}</span></div>
                ) : suggestion ? (
                  <>
                    <div className="mb-4 border-b border-[#e5e9f0] px-1 pb-3">
                      <p className="text-sm font-extrabold text-[#0B1D40]">{suggestion.title || "Suggested website structure"}</p>
                      {suggestion.rationale && <p className="mt-1 text-xs leading-5 text-[#66738d]">{suggestion.rationale}</p>}
                    </div>

                    <ol className="flex-1 space-y-2.5 overflow-y-auto pr-1 [scrollbar-width:thin]">
                      {suggestion.sections.map((section, index) => (
                        <li key={`${section.type}-${index}`} className="flex gap-3 rounded-xl border border-[#e4e9f1] bg-white p-3">
                          <div className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-violet-100 text-[11px] font-extrabold text-violet-700">{index + 1}</div>
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold capitalize text-[#203554]">{section.label || section.type.replace(/-/g, " ")}</p>
                            {section.purpose && <p className="mt-0.5 text-[11px] leading-4 text-[#66738d]">{section.purpose}</p>}
                            {section.contentHint && <p className="mt-1 text-[10px] leading-4 text-[#8792a6]">{section.contentHint}</p>}
                          </div>
                        </li>
                      ))}
                    </ol>

                    {paletteEntries.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#e5e9f0] pt-3">
                        <span className="mr-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#66738d]"><Palette className="h-3 w-3" /> Palette</span>
                        {paletteEntries.map(([name, color]) => <span key={name} title={`${name}: ${color}`} className="flex items-center gap-1.5 rounded-full border border-[#e0e6ef] bg-white py-1 pl-1 pr-2 text-[10px] font-semibold text-[#52627f]"><i className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: color }} />{name}</span>)}
                      </div>
                    )}
                    <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-4 text-amber-900">Applying replaces the current canvas. Use Undo to restore it.</div>
                    <button type="button" onClick={apply} className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1D40] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#102a5f] focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2"><Check className="h-4 w-4" />Apply this layout</button>
                  </>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">{isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <CircleDot className="h-5 w-5" />}</div>
                    <p className="text-sm font-bold text-[#334563]">{isLoading ? "Building a page plan…" : "Your layout plan will appear here"}</p>
                    <p className="mt-1 max-w-[280px] text-xs leading-5 text-[#7b879a]">Review the recommended sections, intent, and palette before changing your canvas.</p>
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

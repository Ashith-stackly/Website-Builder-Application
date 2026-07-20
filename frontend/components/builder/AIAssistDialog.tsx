"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";
import {
  generateAIText,
  type AITextLength,
  type AITextTone,
  type GenerateAITextResult,
} from "@/lib/aiApi";

type TextTarget = {
  kind: "field";
  field: string;
  label: string;
  value: string;
  onReplace: (value: string) => void;
  onInsert: (value: string) => void;
};

type SectionTarget = {
  kind: "section";
  field: "section";
  label: string;
  values: Record<string, string>;
  onApply: (generatedText: string, generatedFields?: Record<string, unknown>) => void;
};

type AssistTarget = TextTarget | SectionTarget;

type RegisteredTextTarget = Omit<TextTarget, "kind" | "field"> & { field?: string };

type TextAssistContextValue = {
  openTextAssistant: (target: Omit<TextTarget, "kind" | "field"> & { field?: string }) => void;
  openSectionAssistant: (target: { label: string }) => void;
  registerTextField: (target: RegisteredTextTarget) => () => void;
};

const TextAssistContext = createContext<TextAssistContextValue | null>(null);

export function useAITextAssist(): TextAssistContextValue | null {
  return useContext(TextAssistContext);
}

function titleToField(label: string): string {
  const result = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+(.)/g, (_match, next: string) => next.toUpperCase())
    .replace(/[^a-z0-9]/g, "");
  return result || "content";
}

function normalizeFieldKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function fieldAliases(field: string, label: string): string[] {
  const normalizedField = normalizeFieldKey(field);
  const normalizedLabel = normalizeFieldKey(label);
  const aliases = new Set([normalizedField, normalizedLabel]);

  if (/headline|heading|title/.test(normalizedLabel)) aliases.add("title");
  if (/description|subtitle|paragraph|body|text/.test(normalizedLabel)) aliases.add("description");
  if (/button|cta/.test(normalizedLabel)) {
    aliases.add("cta");
    aliases.add("ctalabel");
    aliases.add("buttontext");
  }
  if (/brand/.test(normalizedLabel)) aliases.add("brand");
  return [...aliases];
}

/**
 * A context bridge allows every existing `ContentField` / `TextareaField` to
 * gain a generation button without coupling individual block panels to AI.
 */
export function AIAssistProvider({
  blockType,
  description,
  children,
  onSectionGenerated,
}: {
  blockType: string;
  description?: string;
  children: ReactNode;
  /**
   * Gives a typed block panel one atomic opportunity to apply structured
   * section output (arrays/objects such as FAQ items) through builder history.
   * Registered text fields still run as a safe fallback for flat fields.
   */
  onSectionGenerated?: (generatedText: string, generatedFields?: Record<string, unknown>) => void;
}) {
  const [target, setTarget] = useState<AssistTarget | null>(null);
  const registeredFieldsRef = useRef(new Map<number, TextTarget>());
  const nextFieldIdRef = useRef(0);

  const openTextAssistant = useCallback((next: Omit<TextTarget, "kind" | "field"> & { field?: string }) => {
    setTarget({ kind: "field", ...next, field: next.field || titleToField(next.label) });
  }, []);

  const registerTextField = useCallback((next: RegisteredTextTarget) => {
    const id = ++nextFieldIdRef.current;
    registeredFieldsRef.current.set(id, {
      kind: "field",
      field: next.field || titleToField(next.label),
      label: next.label,
      value: next.value,
      onReplace: next.onReplace,
      onInsert: next.onInsert,
    });
    return () => registeredFieldsRef.current.delete(id);
  }, []);

  const openSectionAssistant = useCallback((next: { label: string }) => {
    const fields = [...registeredFieldsRef.current.values()];
    const values = Object.fromEntries(fields.map((entry) => [entry.field, entry.value]));
    setTarget({
      kind: "section",
      field: "section",
      label: next.label,
      values,
      onApply: (generatedText, generatedFields) => {
        onSectionGenerated?.(generatedText, generatedFields);

        const normalizedGenerated = new Map(
          Object.entries(generatedFields ?? {}).map(([key, value]) => [normalizeFieldKey(key), value]),
        );
        let applied = 0;

        for (const entry of fields) {
          const generated = fieldAliases(entry.field, entry.label)
            .map((key) => normalizedGenerated.get(key))
            .find((value): value is string => typeof value === "string" && value.trim().length > 0);
          if (generated) {
            entry.onReplace(generated.trim());
            applied += 1;
          }
        }

        // A provider may only support a single coherent text draft. Applying it
        // only when there is one editable field avoids accidentally overwriting
        // a multi-field section with the same paragraph.
        if (applied === 0 && fields.length === 1 && generatedText.trim()) {
          fields[0].onReplace(generatedText.trim());
        }
      },
    });
  }, [onSectionGenerated]);

  const value = useMemo(
    () => ({ openTextAssistant, openSectionAssistant, registerTextField }),
    [openSectionAssistant, openTextAssistant, registerTextField],
  );

  return (
    <TextAssistContext.Provider value={value}>
      {children}
      <AIAssistDialog
        blockType={blockType}
        description={description}
        target={target}
        onClose={() => setTarget(null)}
      />
    </TextAssistContext.Provider>
  );
}

/** A compact header action for generating all content in a selected section. */
export function AIGenerateSectionButton({
  label,
}: { label: string }) {
  const assistant = useAITextAssist();
  if (!assistant) return null;

  return (
    <button
      type="button"
      onClick={() => assistant.openSectionAssistant({ label })}
      className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[11px] font-bold text-violet-800 transition hover:border-violet-300 hover:bg-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-300"
      title="Generate all text for this section"
    >
      <WandSparkles className="h-3.5 w-3.5" />
      Generate section
    </button>
  );
}

const TONES: Array<{ value: AITextTone; label: string }> = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "creative", label: "Creative" },
  { value: "corporate", label: "Corporate" },
  { value: "minimal", label: "Minimal" },
  { value: "luxury", label: "Luxury" },
  { value: "startup", label: "Startup" },
];

const LENGTHS: Array<{ value: AITextLength; label: string; detail: string }> = [
  { value: "short", label: "Short", detail: "Punchy" },
  { value: "medium", label: "Medium", detail: "Balanced" },
  { value: "long", label: "Long", detail: "Detailed" },
];

function appendText(original: string, addition: string): string {
  if (!original.trim()) return addition;
  const joiner = /[.!?]$/.test(original.trim()) ? "\n\n" : " ";
  return `${original.trimEnd()}${joiner}${addition}`;
}

function sectionContext(values: Record<string, string>): string {
  return Object.entries(values)
    .filter(([, value]) => value.trim())
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n")
    .slice(0, 8_000);
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function AIAssistDialog({
  blockType,
  description,
  target,
  onClose,
}: {
  blockType: string;
  description?: string;
  target: AssistTarget | null;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [tone, setTone] = useState<AITextTone>("professional");
  const [length, setLength] = useState<AITextLength>("medium");
  const [businessType, setBusinessType] = useState("");
  const [websiteName, setWebsiteName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [result, setResult] = useState<GenerateAITextResult | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const requestRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    setMounted(true);
    return () => requestRef.current?.abort();
  }, []);

  useEffect(() => {
    requestRef.current?.abort();
    setResult(null);
    setPreview("");
    setError("");
    setIsGenerating(false);
  }, [target]);

  useEffect(() => {
    if (!target) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        requestRef.current?.abort();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, target]);

  const close = useCallback(() => {
    requestRef.current?.abort();
    onClose();
  }, [onClose]);

  const generate = useCallback(
    async (forceRefresh = false) => {
      if (!target) return;
      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;
      const requestId = ++requestIdRef.current;
      setError("");
      setIsGenerating(true);

      try {
        const existingText =
          target.kind === "section" ? sectionContext(target.values) : target.value.slice(0, 8_000);
        const generated = await generateAIText(
          {
            blockType,
            field: target.field,
            tone,
            length,
            businessType: businessType.trim() || undefined,
            websiteName: websiteName.trim() || undefined,
            keywords: keywords.trim() || undefined,
            additionalInstructions: [
              description ? `Block context: ${description}` : "",
              additionalInstructions.trim(),
            ]
              .filter(Boolean)
              .join("\n"),
            currentText: existingText || undefined,
            wholeSection: target.kind === "section",
            sectionFields: target.kind === "section" ? Object.keys(target.values) : undefined,
          },
          { signal: controller.signal, forceRefresh },
        );

        if (requestId !== requestIdRef.current) return;
        setResult(generated);
        setPreview(generated.generatedText);
      } catch (generationError) {
        if (requestId !== requestIdRef.current || isAbortError(generationError)) return;
        setError(
          generationError instanceof Error
            ? generationError.message
            : "AI generation failed. Please try again.",
        );
      } finally {
        if (requestId === requestIdRef.current) setIsGenerating(false);
      }
    },
    [additionalInstructions, blockType, businessType, description, keywords, length, target, tone, websiteName],
  );

  const applyReplace = () => {
    if (!target || !preview.trim()) return;
    if (target.kind === "section") {
      target.onApply(preview.trim(), result?.generatedFields);
    } else {
      target.onReplace(preview.trim());
    }
    close();
  };

  const applyInsert = () => {
    if (!target || target.kind !== "field" || !preview.trim()) return;
    target.onInsert(appendText(target.value, preview.trim()));
    close();
  };

  const dialog = target ? (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-end justify-center bg-[#07142d]/45 p-3 backdrop-blur-sm sm:items-center sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <motion.section
          aria-describedby="ai-assistant-description"
          aria-labelledby="ai-assistant-title"
          aria-modal="true"
          role="dialog"
          className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/60 bg-[#fffdfb] shadow-[0_28px_85px_rgba(7,20,45,0.30)]"
          initial={{ opacity: 0, y: 24, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.985 }}
          transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <header className="sticky top-0 z-10 flex items-start justify-between border-b border-[#eee8e2] bg-[#fffdfb]/95 px-5 py-4 backdrop-blur sm:px-6">
            <div className="flex min-w-0 gap-3">
              <div className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 id="ai-assistant-title" className="text-[15px] font-extrabold text-[#0B1D40]">
                  {target.kind === "section" ? `Generate ${target.label}` : `Generate ${target.label}`}
                </h2>
                <p id="ai-assistant-description" className="mt-0.5 text-xs leading-5 text-[#66738d]">
                  Shape the result, review it, then choose how it is applied to your page.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close AI assistant"
              className="rounded-lg p-2 text-[#66738d] transition hover:bg-slate-100 hover:text-[#0B1D40] focus:outline-none focus:ring-2 focus:ring-violet-300"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="space-y-5">
              <fieldset>
                <legend className="mb-2 text-xs font-bold uppercase tracking-[0.13em] text-[#52627f]">Tone</legend>
                <div className="flex flex-wrap gap-2">
                  {TONES.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={tone === option.value}
                      onClick={() => setTone(option.value)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-violet-300 ${
                        tone === option.value
                          ? "border-violet-600 bg-violet-600 text-white"
                          : "border-[#dce3ed] bg-white text-[#334563] hover:border-violet-300 hover:bg-violet-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2 text-xs font-bold uppercase tracking-[0.13em] text-[#52627f]">Length</legend>
                <div className="grid grid-cols-3 gap-2">
                  {LENGTHS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={length === option.value}
                      onClick={() => setLength(option.value)}
                      className={`rounded-xl border p-2 text-left transition focus:outline-none focus:ring-2 focus:ring-violet-300 ${
                        length === option.value
                          ? "border-violet-500 bg-violet-50 text-violet-900"
                          : "border-[#dce3ed] bg-white text-[#334563] hover:border-violet-300"
                      }`}
                    >
                      <span className="block text-xs font-extrabold">{option.label}</span>
                      <span className="mt-0.5 block text-[10px] text-[#66738d]">{option.detail}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-[#334563]">Business type</span>
                  <input
                    value={businessType}
                    onChange={(event) => setBusinessType(event.target.value)}
                    maxLength={120}
                    placeholder="e.g. Boutique studio"
                    className="w-full rounded-lg border border-[#dce3ed] bg-white px-3 py-2 text-sm text-[#0B1D40] outline-none transition placeholder:text-[#9aa6b9] focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-[#334563]">Website name</span>
                  <input
                    value={websiteName}
                    onChange={(event) => setWebsiteName(event.target.value)}
                    maxLength={120}
                    placeholder="e.g. Northstar Coffee"
                    className="w-full rounded-lg border border-[#dce3ed] bg-white px-3 py-2 text-sm text-[#0B1D40] outline-none transition placeholder:text-[#9aa6b9] focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[#334563]">Keywords</span>
                <input
                  value={keywords}
                  onChange={(event) => setKeywords(event.target.value)}
                  maxLength={320}
                  placeholder="e.g. hand-roasted, local, sustainable"
                  className="w-full rounded-lg border border-[#dce3ed] bg-white px-3 py-2 text-sm text-[#0B1D40] outline-none transition placeholder:text-[#9aa6b9] focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[#334563]">Additional instructions</span>
                <textarea
                  value={additionalInstructions}
                  onChange={(event) => setAdditionalInstructions(event.target.value)}
                  maxLength={800}
                  rows={4}
                  placeholder="Anything the assistant should emphasize or avoid?"
                  className="w-full resize-y rounded-lg border border-[#dce3ed] bg-white px-3 py-2 text-sm text-[#0B1D40] outline-none transition placeholder:text-[#9aa6b9] focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </label>

              <button
                type="button"
                onClick={() => void generate(Boolean(result))}
                disabled={isGenerating}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:from-violet-800 hover:to-fuchsia-700 disabled:cursor-wait disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2"
              >
                {isGenerating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
                {isGenerating ? "Generating…" : result ? "Regenerate" : "Generate text"}
              </button>
              {isGenerating && (
                <button
                  type="button"
                  onClick={() => requestRef.current?.abort()}
                  className="mx-auto block text-xs font-semibold text-[#66738d] underline-offset-2 hover:text-[#0B1D40] hover:underline"
                >
                  Cancel generation
                </button>
              )}
            </div>

            <div className="flex min-h-[300px] flex-col rounded-2xl border border-[#e5e9f0] bg-[#f8fafc] p-3 sm:p-4">
              <div className="mb-2 flex items-center justify-between gap-2 px-1">
                <span className="text-xs font-bold uppercase tracking-[0.13em] text-[#52627f]">Preview</span>
                {result?.provider && <span className="text-[10px] font-medium text-[#8792a6]">{result.provider}</span>}
              </div>

              {error ? (
                <div role="alert" className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
                  <span>{error}</span>
                </div>
              ) : preview ? (
                <textarea
                  aria-label="Generated text preview"
                  value={preview}
                  onChange={(event) => setPreview(event.target.value)}
                  className="min-h-[236px] flex-1 resize-y rounded-xl border border-[#dce3ed] bg-white p-3 text-sm leading-6 text-[#1d2f4e] outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                    {isGenerating ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                  </div>
                  <p className="text-sm font-bold text-[#334563]">
                    {isGenerating ? "Creating a tailored draft…" : "Your draft will appear here"}
                  </p>
                  <p className="mt-1 max-w-[250px] text-xs leading-5 text-[#7b879a]">
                    You can edit the generated copy before it reaches the canvas.
                  </p>
                </div>
              )}

              {target.kind === "section" && result?.generatedFields && Object.keys(result.generatedFields).length > 0 && (
                <p className="mt-3 rounded-lg bg-violet-50 px-3 py-2 text-[11px] leading-4 text-violet-900">
                  The draft includes {Object.keys(result.generatedFields).length} section fields and will update the matching editable fields.
                </p>
              )}

              {preview && !isGenerating && (
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  {target.kind === "field" && (
                    <button
                      type="button"
                      onClick={applyInsert}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#cfd8e6] bg-white px-3 py-2 text-xs font-bold text-[#334563] transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-300"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Insert after
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={applyReplace}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1D40] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#102a5f] focus:outline-none focus:ring-2 focus:ring-violet-300"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {target.kind === "section" ? "Apply section" : "Replace text"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  ) : null;

  return mounted ? createPortal(dialog, document.body) : null;
}

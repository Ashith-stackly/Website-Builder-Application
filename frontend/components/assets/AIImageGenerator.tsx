"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ImagePlus, LoaderCircle, Sparkles, WandSparkles, X } from "lucide-react";
import { generateAIImage } from "@/lib/aiApi";
import { useAssetStore } from "@/store/assetStore";
import type { Asset } from "@/types/assets";

type ImageMode = "generate" | "placeholder";
type AspectRatio = "1:1" | "4:3" | "3:4" | "16:9" | "9:16";
type ImageSize = "small" | "medium" | "large";

const STYLES = [
  { value: "photorealistic", label: "Photo" },
  { value: "illustration", label: "Illustration" },
  { value: "editorial", label: "Editorial" },
  { value: "minimal", label: "Minimal" },
];

const RATIOS: Array<{ value: AspectRatio; label: string }> = [
  { value: "1:1", label: "Square" },
  { value: "4:3", label: "Landscape" },
  { value: "3:4", label: "Portrait" },
  { value: "16:9", label: "Wide" },
  { value: "9:16", label: "Tall" },
];

const SIZES: Array<{ value: ImageSize; label: string; detail: string }> = [
  { value: "small", label: "Small", detail: "Fast" },
  { value: "medium", label: "Medium", detail: "Balanced" },
  { value: "large", label: "Large", detail: "Detailed" },
];

const cleanFileStem = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "visual";

const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function useClientReady(): boolean {
  return useSyncExternalStore(subscribeToClient, getClientSnapshot, getServerSnapshot);
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export interface GeneratedAssetDetails {
  asset: Asset;
  alt?: string;
  source?: string;
}

interface AIGenerateImageFormProps {
  initialMode?: ImageMode;
  onSaved?: (details: GeneratedAssetDetails) => void | Promise<void>;
  onRequestClose?: () => void;
  compact?: boolean;
}

/**
 * Shared, credential-free image generation form. Its only persistence action
 * is `saveGeneratedImage`, so every generated visual follows the exact same
 * IndexedDB / assetId / export path as an uploaded image.
 */
export function AIGenerateImageForm({
  initialMode = "generate",
  onSaved,
  onRequestClose,
  compact = false,
}: AIGenerateImageFormProps) {
  const saveGeneratedImage = useAssetStore((state) => state.saveGeneratedImage);
  const [mode, setMode] = useState<ImageMode>(initialMode);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("photorealistic");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("4:3");
  const [size, setSize] = useState<ImageSize>("medium");
  const [previewUrl, setPreviewUrl] = useState("");
  const [savedAsset, setSavedAsset] = useState<Asset | null>(null);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const requestRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => requestRef.current?.abort();
  }, []);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const generate = useCallback(async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setError(mode === "placeholder" ? "Describe the subject for the placeholder." : "Describe the image you want to create.");
      return;
    }

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const requestId = ++requestIdRef.current;
    setError("");
    setIsGenerating(true);
    setSavedAsset(null);

    try {
      const result = await generateAIImage(
        { prompt: trimmedPrompt, style, aspectRatio, size, mode },
        controller.signal,
      );
      if (requestId !== requestIdRef.current) return;

      setPreviewUrl(result.imageUrl);
      const asset = await saveGeneratedImage(
        {
          imageUrl: result.imageUrl,
          mimeType: result.mimeType,
          name: `${mode === "placeholder" ? "placeholder" : "ai"}-${cleanFileStem(trimmedPrompt)}`,
          tags: [mode, style, aspectRatio],
        },
        controller.signal,
      );
      if (requestId !== requestIdRef.current) return;

      setSavedAsset(asset);
      await onSaved?.({ asset, alt: result.alt, source: result.source });
    } catch (generationError) {
      if (requestId !== requestIdRef.current || isAbortError(generationError)) return;
      setError(generationError instanceof Error ? generationError.message : "Image generation failed. Please try again.");
    } finally {
      if (requestId === requestIdRef.current) setIsGenerating(false);
    }
  }, [aspectRatio, mode, onSaved, prompt, saveGeneratedImage, size, style]);

  const padding = compact ? "p-4" : "p-5 sm:p-6";

  return (
    <div className={`space-y-4 ${padding}`}>
      <div className="flex rounded-xl bg-slate-100 p-1">
        {([
          { value: "generate", label: "AI image", icon: Sparkles },
          { value: "placeholder", label: "Smart placeholder", icon: ImagePlus },
        ] as const).map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => { setMode(value); setError(""); }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-bold transition ${mode === value ? "bg-white text-violet-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-bold text-[#334563]">{mode === "placeholder" ? "What should this placeholder represent?" : "Describe the visual"}</span>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          maxLength={700}
          rows={compact ? 3 : 4}
          placeholder={mode === "placeholder" ? "e.g. a warm bakery counter with pastries" : "e.g. sunlit artisan bakery interior, inviting, natural textures"}
          className="w-full resize-y rounded-xl border border-[#dce3ed] bg-white px-3 py-2.5 text-sm text-[#0B1D40] outline-none transition placeholder:text-[#9aa6b9] focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-[#334563]">Style</span>
          <select value={style} onChange={(event) => setStyle(event.target.value)} disabled={mode === "placeholder"} className="w-full rounded-lg border border-[#dce3ed] bg-white px-3 py-2 text-sm text-[#0B1D40] outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400">
            {STYLES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-[#334563]">Shape</span>
          <select value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value as AspectRatio)} className="w-full rounded-lg border border-[#dce3ed] bg-white px-3 py-2 text-sm text-[#0B1D40] outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
            {RATIOS.map((option) => <option key={option.value} value={option.value}>{option.label} ({option.value})</option>)}
          </select>
        </label>
      </div>

      <fieldset disabled={mode === "placeholder"}>
        <legend className="mb-2 text-xs font-bold uppercase tracking-[0.13em] text-[#52627f]">Resolution</legend>
        <div className="grid grid-cols-3 gap-2">
          {SIZES.map((option) => (
            <button key={option.value} type="button" aria-pressed={size === option.value} onClick={() => setSize(option.value)} className={`rounded-xl border p-2 text-left transition focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:cursor-not-allowed disabled:opacity-50 ${size === option.value ? "border-violet-500 bg-violet-50 text-violet-900" : "border-[#dce3ed] bg-white text-[#334563] hover:border-violet-300"}`}>
              <span className="block text-xs font-extrabold">{option.label}</span>
              <span className="mt-0.5 block text-[10px] text-[#66738d]">{option.detail}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {previewUrl && (
        <div className="overflow-hidden rounded-xl border border-[#dde4ef] bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Generated visual preview" className="max-h-52 w-full object-contain" />
          {savedAsset && <p className="border-t border-[#e5e9f0] px-3 py-2 text-[11px] font-semibold text-emerald-700">Saved to your asset library as {savedAsset.name}</p>}
        </div>
      )}

      {error && <div role="alert" className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 flex-none" /><span>{error}</span></div>}

      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        {onRequestClose && <button type="button" onClick={onRequestClose} disabled={isGenerating} className="rounded-lg px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50">Close</button>}
        <button type="button" onClick={() => void generate()} disabled={isGenerating} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:from-violet-800 hover:to-fuchsia-700 disabled:cursor-wait disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2">
          {isGenerating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
          {isGenerating ? "Generating…" : savedAsset ? "Generate another" : mode === "placeholder" ? "Create placeholder" : "Generate image"}
        </button>
      </div>
      {isGenerating && <button type="button" onClick={() => requestRef.current?.abort()} className="mx-auto block text-xs font-semibold text-[#66738d] underline-offset-2 hover:text-[#0B1D40] hover:underline">Cancel generation</button>}
    </div>
  );
}

export function AIImageGeneratorDialog({
  open,
  onClose,
  initialMode = "generate",
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initialMode?: ImageMode;
  onSaved?: (details: GeneratedAssetDetails) => void | Promise<void>;
}) {
  const mounted = useClientReady();
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[21000] flex items-end justify-center bg-[#07142d]/55 p-3 backdrop-blur-sm sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
          <motion.section aria-labelledby="ai-image-title" aria-modal="true" role="dialog" initial={{ opacity: 0, y: 24, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: 0.985 }} transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }} onMouseDown={(event) => event.stopPropagation()} className="max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/60 bg-[#fffdfb] shadow-[0_30px_90px_rgba(7,20,45,0.34)]">
            <header className="sticky top-0 z-10 flex items-start justify-between border-b border-[#eee8e2] bg-[#fffdfb]/95 px-5 py-4 backdrop-blur sm:px-6">
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-sm"><Sparkles className="h-4 w-4" /></div>
                <div><h2 id="ai-image-title" className="text-[15px] font-extrabold text-[#0B1D40]">Create a visual</h2><p className="mt-0.5 text-xs leading-5 text-[#66738d]">Generated images are saved to this project’s reusable asset library.</p></div>
              </div>
              <button type="button" onClick={onClose} aria-label="Close image generator" className="rounded-lg p-2 text-[#66738d] transition hover:bg-slate-100 hover:text-[#0B1D40] focus:outline-none focus:ring-2 focus:ring-violet-300"><X className="h-4 w-4" /></button>
            </header>
            <AIGenerateImageForm initialMode={initialMode} onSaved={onSaved} onRequestClose={onClose} />
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Palette, RotateCcw, Type, X } from "lucide-react";
import { useDesignStore } from "@/store/designStore";
import { useBuilderStore } from "@/store/builderStore";

const GOOGLE_FONTS = [
  "Inter, system-ui, sans-serif",
  "Roboto, sans-serif",
  "Outfit, sans-serif",
  "Poppins, sans-serif",
  "Montserrat, sans-serif",
  "Open Sans, sans-serif",
  "Lato, sans-serif",
  "Nunito, sans-serif",
  "Playfair Display, serif",
  "Merriweather, serif",
  "DM Sans, sans-serif",
  "Space Grotesk, sans-serif",
];

const DEFAULT_PANEL_TOKENS = {
  colors: {
    primary: "#0B1D40",
    secondary: "#3b82f6",
    accent: "#f59e0b",
    background: "#ffffff",
    text: "#0B1D40",
  },
  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
    baseFontSize: "16px",
    headingScale: 1.25,
  },
  buttons: {
    borderRadius: "8px",
    fontWeight: "700",
  },
  spacing: {
    base: 8,
  },
};

function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#1A315E] last:border-0">
      <button
        type="button"
        className="flex w-full items-center justify-between px-5 py-3.5 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-blue-300">
          <Icon className="h-3.5 w-3.5" />
          {title}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="space-y-3 px-5 pb-5">{children}</div>}
    </div>
  );
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded-lg border-2 border-white/10 bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0"
        />
      </div>
      <div className="flex flex-1 items-center gap-1.5">
        <span className="text-[11px] font-bold text-gray-300">{label}</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="ml-auto w-20 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-mono font-bold text-gray-200 outline-none focus:border-blue-400"
          spellCheck={false}
        />
      </div>
    </div>
  );
}

export default function GlobalStylesPanel({ onClose }: { onClose: () => void }) {
  const { tokens, setColorToken, setTokens, resetTokens } = useDesignStore();
  const applyDesignTokens = useBuilderStore((s) => s.applyDesignTokens);

  const updateColor = (key: keyof typeof tokens.colors, value: string) => {
    const next = { ...tokens, colors: { ...tokens.colors, [key]: value } };
    setColorToken(key, value);
    applyDesignTokens(next);
  };

  const updateTypography = (typography: typeof tokens.typography) => {
    const next = { ...tokens, typography };
    setTokens({ typography });
    applyDesignTokens(next);
  };

  const handleReset = () => {
    resetTokens();
    applyDesignTokens(DEFAULT_PANEL_TOKENS);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      className="absolute left-0 top-0 z-50 flex h-full w-[280px] flex-col overflow-hidden rounded-xl border border-[#183765] bg-[#0B1D40] text-white shadow-[0_18px_60px_rgba(11,29,64,0.4)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1A315E] px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/30 to-blue-500/30">
            <Palette className="h-4 w-4 text-violet-300" />
          </div>
          <span className="text-[13px] font-bold">Design System</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1.5 text-gray-400 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#1A315E_transparent]">
        {/* Colors */}
        <Section title="Color Palette" icon={Palette}>
          <ColorInput label="Primary" value={tokens.colors.primary} onChange={(v) => updateColor("primary", v)} />
          <ColorInput label="Secondary" value={tokens.colors.secondary} onChange={(v) => updateColor("secondary", v)} />
          <ColorInput label="Accent" value={tokens.colors.accent} onChange={(v) => updateColor("accent", v)} />
          <ColorInput label="Background" value={tokens.colors.background} onChange={(v) => updateColor("background", v)} />
          <ColorInput label="Text" value={tokens.colors.text} onChange={(v) => updateColor("text", v)} />
        </Section>

        {/* Typography */}
        <Section title="Typography" icon={Type}>
          <div>
            <span className="mb-1.5 block text-[11px] font-bold text-gray-400">Font Family</span>
            <select
              value={tokens.typography.fontFamily}
              onChange={(e) => updateTypography({ ...tokens.typography, fontFamily: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-[12px] font-bold text-gray-200 outline-none focus:border-blue-400"
            >
              {GOOGLE_FONTS.map((f) => (
                <option key={f} value={f} className="bg-[#0B1D40]">{f.split(",")[0]}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="mb-1.5 block text-[11px] font-bold text-gray-400">Base Size</span>
              <input
                type="text"
                value={tokens.typography.baseFontSize}
                onChange={(e) => updateTypography({ ...tokens.typography, baseFontSize: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-[12px] font-bold text-gray-200 outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <span className="mb-1.5 block text-[11px] font-bold text-gray-400">Heading Scale</span>
              <input
                type="number"
                step="0.05"
                min="1"
                max="2"
                value={tokens.typography.headingScale}
                onChange={(e) => updateTypography({ ...tokens.typography, headingScale: parseFloat(e.target.value) || 1.25 })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-[12px] font-bold text-gray-200 outline-none focus:border-blue-400"
              />
            </div>
          </div>
        </Section>
      </div>

      {/* Footer: Reset */}
      <div className="flex-shrink-0 border-t border-[#1A315E] px-5 py-3">
        <button
          type="button"
          onClick={handleReset}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 py-2 text-[11px] font-bold text-red-300 transition hover:bg-red-500/20"
        >
          <RotateCcw className="h-3 w-3" />
          Reset to Defaults
        </button>
      </div>
    </motion.div>
  );
}

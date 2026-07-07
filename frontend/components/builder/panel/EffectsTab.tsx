"use client";

import { useState, useRef } from "react";
import { ChevronDown, Monitor, RotateCcw, Smartphone, Tablet } from "lucide-react";
import { ColorSwatch } from "./controls/ColorSwatch";
import { useBuilderStore } from "@/store/builderStore";
import type { BuilderComponent, ComponentStyles, Viewport } from "@/types/builder";

/* ── Collapsible section (shared pattern with StyleTab) ───────────── */

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#f0eae6] last:border-0">
      <button
        type="button"
        className="flex w-full items-center justify-between px-5 py-3.5 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#566583]">{title}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[#566583] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="space-y-4 px-5 pb-5">{children}</div>}
    </div>
  );
}

/* ── Shadow presets ────────────────────────────────────────────────── */

const SHADOW_PRESETS: Array<{ label: string; value: string }> = [
  { label: "None",   value: "" },
  { label: "Soft",   value: "0 2px 8px rgba(0,0,0,0.08)" },
  { label: "Medium", value: "0 4px 16px rgba(0,0,0,0.12)" },
  { label: "Hard",   value: "0 8px 30px rgba(0,0,0,0.18)" },
  { label: "Glow",   value: "0 0 20px rgba(59,130,246,0.35)" },
  { label: "Inner",  value: "inset 0 2px 6px rgba(0,0,0,0.12)" },
];

/* ── Border style options ─────────────────────────────────────────── */

const BORDER_STYLES = ["none", "solid", "dashed", "dotted", "double"] as const;

/* ── Cursor options ───────────────────────────────────────────────── */

const CURSOR_OPTIONS = [
  { value: "",        label: "Default" },
  { value: "pointer", label: "Pointer" },
  { value: "grab",    label: "Grab" },
  { value: "text",    label: "Text" },
  { value: "move",    label: "Move" },
  { value: "crosshair", label: "Crosshair" },
  { value: "not-allowed", label: "Not Allowed" },
  { value: "wait",    label: "Wait" },
] as const;

/* ── Overflow options ─────────────────────────────────────────────── */

const OVERFLOW_OPTIONS = [
  { value: "",        label: "Visible" },
  { value: "hidden",  label: "Hidden" },
  { value: "scroll",  label: "Scroll" },
  { value: "auto",    label: "Auto" },
] as const;

/* ── Helper: parse shorthand border "2px solid #000" ──────────────── */

function parseBorder(raw: string): { width: string; style: string; color: string } {
  if (!raw) return { width: "", style: "solid", color: "#0B1D40" };
  const parts = raw.trim().split(/\s+/);
  return {
    width: parts[0]?.replace(/[^0-9.]/g, "") || "",
    style: parts[1] || "solid",
    color: parts[2] || "#0B1D40",
  };
}

function buildBorder(width: string, style: string, color: string): string {
  if (!width || width === "0") return "";
  return `${width}px ${style} ${color}`;
}

function OverrideDot({ hasOverride, onReset }: { hasOverride: boolean; onReset: () => void }) {
  if (!hasOverride) return null;
  return (
    <button
      type="button"
      title="This field has a viewport override. Click to reset to desktop value."
      onClick={(e) => { e.stopPropagation(); onReset(); }}
      className="inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 transition hover:bg-amber-200"
    >
      <RotateCcw className="h-2.5 w-2.5" />
    </button>
  );
}

/* ── Parse rotation from transform ────────────────────────────────── */

function parseRotation(transform: string): string {
  if (!transform) return "0";
  const match = transform.match(/rotate\((-?[\d.]+)deg\)/);
  return match ? match[1] : "0";
}

/* ── Main Component ───────────────────────────────────────────────── */

export function EffectsTab({
  component,
  onUpdate,
}: {
  component: BuilderComponent;
  onUpdate: (id: string, updates: Partial<BuilderComponent>) => void;
}) {
  const viewport = useBuilderStore((state) => state.viewport) as Viewport;
  const isResponsive = viewport !== "desktop";
  const baseStyles = component.styles;
  const vpOverrides = isResponsive ? (component.responsiveStyles?.[viewport] ?? {}) : {};
  const s: ComponentStyles = isResponsive ? { ...baseStyles, ...vpOverrides } : baseStyles;
  const opacityRef = useRef<HTMLInputElement>(null);

  const hasOverride = (key: keyof ComponentStyles) =>
    isResponsive && vpOverrides[key] !== undefined;

  const resetOverride = (key: keyof ComponentStyles) => {
    if (!isResponsive) return;
    const next = { ...vpOverrides };
    delete next[key];
    onUpdate(component.id, {
      responsiveStyles: { ...component.responsiveStyles, [viewport]: next },
    });
  };

  const set = (patch: Partial<ComponentStyles>) => {
    if (isResponsive) {
      onUpdate(component.id, {
        responsiveStyles: {
          ...component.responsiveStyles,
          [viewport]: { ...vpOverrides, ...patch },
        },
      });
      return;
    }

    onUpdate(component.id, { styles: { ...baseStyles, ...patch } });
  };

  /* ── Border sub-state ── */
  const border = parseBorder(s.border || "");
  const setBorder = (patch: Partial<{ width: string; style: string; color: string }>) => {
    const next = { ...border, ...patch };
    set({ border: buildBorder(next.width, next.style, next.color) });
  };

  /* ── Opacity ── */
  const opacityValue = s.opacity ? parseFloat(s.opacity) : 1;
  const opacityPercent = Math.round(opacityValue * 100);

  /* ── Rotation ── */
  const rotation = parseRotation(s.transform || "");
  const ViewportIcon = viewport === "tablet" ? Tablet : viewport === "mobile" ? Smartphone : Monitor;

  return (
    <div className="pb-6">
      {isResponsive && (
        <div className="mx-5 mb-3 mt-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <ViewportIcon className="h-3.5 w-3.5 text-amber-700" />
          <span className="text-[11px] font-bold text-amber-800">
            Editing {viewport === "tablet" ? "Tablet" : "Mobile"} overrides
          </span>
        </div>
      )}

      {/* ─── Opacity ──────────────────────────────────────────────── */}
      <Section title="Opacity">
        <div className="flex items-center gap-3">
          <input
            ref={opacityRef}
            type="range"
            min="0"
            max="100"
            step="1"
            value={opacityPercent}
            onChange={(e) => set({ opacity: String(parseInt(e.target.value, 10) / 100) })}
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-gradient-to-r from-[#dbe3ef] to-[#0B1D40] outline-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#0B1D40] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
          />
          <span className="w-10 text-right text-[13px] font-bold tabular-nums text-[#0B1D40]">
            {opacityPercent}%
          </span>
          <OverrideDot hasOverride={hasOverride("opacity")} onReset={() => resetOverride("opacity")} />
        </div>
        {opacityPercent < 100 && (
          <button
            type="button"
            onClick={() => set({ opacity: "1" })}
            className="mt-1 text-[11px] font-bold text-blue-500 transition hover:text-blue-700"
          >
            Reset to 100%
          </button>
        )}
      </Section>

      {/* ─── Box Shadow ───────────────────────────────────────────── */}
      <Section title="Shadow">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] font-bold uppercase tracking-wider text-[#566583]">Preset</span>
          <OverrideDot hasOverride={hasOverride("boxShadow")} onReset={() => resetOverride("boxShadow")} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {SHADOW_PRESETS.map((preset) => {
            const isActive = (s.boxShadow || "") === preset.value;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => set({ boxShadow: preset.value })}
                className={`group relative flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center transition-all duration-200 ${
                  isActive
                    ? "border-[#0B1D40] bg-[#0B1D40]/[0.06] shadow-sm"
                    : "border-[#dbe3ef] bg-white hover:border-[#0B1D40]/30 hover:bg-[#f7f9fc]"
                }`}
              >
                {/* Shadow preview box */}
                <div
                  className="h-6 w-10 rounded-md bg-white transition-shadow duration-200"
                  style={{
                    boxShadow: preset.value || "0 0 0 1px #e2e8f0",
                  }}
                />
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider transition ${
                    isActive ? "text-[#0B1D40]" : "text-[#566583]"
                  }`}
                >
                  {preset.label}
                </span>
                {/* Active indicator dot */}
                {isActive && (
                  <div className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#0B1D40]" />
                )}
              </button>
            );
          })}
        </div>
      </Section>

      {/* ─── Border ───────────────────────────────────────────────── */}
      <Section title="Border" defaultOpen={false}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] font-bold uppercase tracking-wider text-[#566583]">Border</span>
          <OverrideDot hasOverride={hasOverride("border")} onReset={() => resetOverride("border")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {/* Width */}
          <div>
            <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#566583]">
              Width
            </span>
            <div className="flex overflow-hidden rounded-lg border border-[#dbe3ef] focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
              <input
                type="number"
                min="0"
                max="20"
                value={border.width}
                placeholder="0"
                onChange={(e) => setBorder({ width: e.target.value })}
                className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-[13px] font-bold text-[#0B1D40] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="flex items-center border-l border-[#dbe3ef] bg-[#f7f9fc] px-2 text-[11px] font-bold text-[#566583]">
                px
              </span>
            </div>
          </div>

          {/* Style */}
          <div>
            <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#566583]">
              Style
            </span>
            <select
              value={border.style}
              onChange={(e) => setBorder({ style: e.target.value })}
              className="w-full rounded-lg border border-[#dbe3ef] bg-transparent px-2.5 py-2 text-[12px] font-bold capitalize text-[#0B1D40] outline-none focus:border-blue-400"
            >
              {BORDER_STYLES.map((bs) => (
                <option key={bs} value={bs}>
                  {bs.charAt(0).toUpperCase() + bs.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Border color */}
        <ColorSwatch
          label="Border Color"
          value={border.color}
          onChange={(v) => setBorder({ color: v })}
        />

        {/* Live preview strip */}
        {border.width && border.width !== "0" && (
          <div className="mt-1 rounded-lg bg-white p-3">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#566583]">
              Preview
            </span>
            <div
              className="h-10 w-full rounded-lg bg-[#f7f9fc]"
              style={{ border: buildBorder(border.width, border.style, border.color) }}
            />
          </div>
        )}
      </Section>

      {/* ─── Overflow ─────────────────────────────────────────────── */}
      <Section title="Overflow" defaultOpen={false}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] font-bold uppercase tracking-wider text-[#566583]">Mode</span>
          <OverrideDot hasOverride={hasOverride("overflow")} onReset={() => resetOverride("overflow")} />
        </div>
        <div className="flex overflow-hidden rounded-lg border border-[#dbe3ef]">
          {OVERFLOW_OPTIONS.map((opt) => {
            const isActive = (s.overflow || "") === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                title={opt.label}
                onClick={() => set({ overflow: opt.value })}
                className={`flex flex-1 items-center justify-center py-2 text-[11px] font-bold transition ${
                  isActive
                    ? "bg-[#0B1D40] text-white"
                    : "bg-transparent text-[#566583] hover:bg-[#f7f9fc] hover:text-[#0B1D40]"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] font-medium leading-5 text-[#566583]">
          Controls how content that overflows the block&apos;s boundaries is handled.
        </p>
      </Section>

      {/* ─── Cursor ───────────────────────────────────────────────── */}
      <Section title="Cursor" defaultOpen={false}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] font-bold uppercase tracking-wider text-[#566583]">Cursor</span>
          <OverrideDot hasOverride={hasOverride("cursor")} onReset={() => resetOverride("cursor")} />
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {CURSOR_OPTIONS.map((opt) => {
            const isActive = (s.cursor || "") === opt.value;
            return (
              <button
                key={opt.value || "default"}
                type="button"
                title={opt.label}
                onClick={() => set({ cursor: opt.value })}
                style={{ cursor: opt.value || "default" }}
                className={`rounded-lg border-2 px-1 py-2 text-[10px] font-bold transition-all ${
                  isActive
                    ? "border-[#0B1D40] bg-[#0B1D40]/[0.06] text-[#0B1D40]"
                    : "border-[#dbe3ef] text-[#566583] hover:border-[#0B1D40]/30 hover:bg-[#f7f9fc]"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] font-medium text-[#566583]">
          Hover each button to preview the cursor style.
        </p>
      </Section>

      {/* ─── Transform (Rotate) ───────────────────────────────────── */}
      <Section title="Transform" defaultOpen={false}>
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="block text-[12px] font-bold uppercase tracking-wider text-[#566583]">
              Rotation
            </span>
            <OverrideDot hasOverride={hasOverride("transform")} onReset={() => resetOverride("transform")} />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              value={rotation}
              onChange={(e) => {
                const deg = e.target.value;
                set({ transform: deg === "0" ? "" : `rotate(${deg}deg)` });
              }}
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-gradient-to-r from-[#dbe3ef] via-[#0B1D40] to-[#dbe3ef] outline-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#0B1D40] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
            />
            <span className="w-12 text-right text-[13px] font-bold tabular-nums text-[#0B1D40]">
              {rotation}°
            </span>
          </div>
          {rotation !== "0" && (
            <button
              type="button"
              onClick={() => set({ transform: "" })}
              className="mt-1 text-[11px] font-bold text-blue-500 transition hover:text-blue-700"
            >
              Reset rotation
            </button>
          )}
        </div>

        {/* Rotation live preview */}
        <div className="mt-1 flex items-center justify-center rounded-lg bg-white p-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1D40] to-[#3b82f6] text-[10px] font-black text-white shadow-lg transition-transform duration-300"
            style={{ transform: rotation !== "0" ? `rotate(${rotation}deg)` : undefined }}
          >
            {component.type.charAt(0).toUpperCase()}
          </div>
        </div>
      </Section>

      {/* ─── Transition ───────────────────────────────────────────── */}
      <Section title="Transition" defaultOpen={false}>
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="block text-[12px] font-bold uppercase tracking-wider text-[#566583]">
              CSS Transition
            </span>
            <OverrideDot hasOverride={hasOverride("transition")} onReset={() => resetOverride("transition")} />
          </div>
          <input
            type="text"
            value={s.transition || ""}
            placeholder="all 0.3s ease"
            onChange={(e) => set({ transition: e.target.value })}
            className="w-full rounded-lg border border-[#dbe3ef] bg-transparent px-2.5 py-2 text-[12px] font-semibold text-[#0B1D40] outline-none transition placeholder:text-[#566583]/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            spellCheck={false}
          />
          <p className="mt-1.5 text-[11px] font-medium leading-5 text-[#566583]">
            Smooth transitions for hover & state changes.<br />
            Example: <code className="rounded bg-[#f0eae6] px-1 py-0.5 font-mono text-[10px]">all 0.3s ease</code>
          </p>
        </div>
        {/* Quick transition presets */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: "None",  value: "" },
            { label: "Fast",  value: "all 0.15s ease" },
            { label: "Smooth", value: "all 0.3s ease" },
            { label: "Slow",  value: "all 0.5s ease-in-out" },
            { label: "Spring", value: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" },
          ].map((preset) => {
            const isActive = (s.transition || "") === preset.value;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => set({ transition: preset.value })}
                className={`rounded-lg border-2 px-2.5 py-1.5 text-[10px] font-bold transition-all ${
                  isActive
                    ? "border-[#0B1D40] bg-[#0B1D40]/[0.06] text-[#0B1D40]"
                    : "border-[#dbe3ef] text-[#566583] hover:border-[#0B1D40]/30"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { AlignCenter, AlignLeft, AlignRight, ChevronDown, Monitor, RotateCcw, Smartphone, Tablet } from "lucide-react";
import { ColorSwatch } from "./controls/ColorSwatch";
import { UnitInput } from "./controls/UnitInput";
import { SegmentedControl } from "./controls/SegmentedControl";
import { useBuilderStore } from "@/store/builderStore";
import type { BuilderComponent, ComponentStyles, Viewport } from "@/types/builder";

const FONT_WEIGHTS = [
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semi" },
  { value: "700", label: "Bold" },
];

const FONT_FAMILIES = [
  { label: "Inter", value: "Inter, system-ui, sans-serif", google: "Inter" },
  { label: "Roboto", value: "Roboto, Arial, sans-serif", google: "Roboto" },
  { label: "Outfit", value: "Outfit, Arial, sans-serif", google: "Outfit" },
  { label: "Poppins", value: "Poppins, Arial, sans-serif", google: "Poppins" },
  { label: "Lato", value: "Lato, Arial, sans-serif", google: "Lato" },
  { label: "Montserrat", value: "Montserrat, Arial, sans-serif", google: "Montserrat" },
  { label: "Playfair Display", value: "\"Playfair Display\", Georgia, serif", google: "Playfair Display" },
  { label: "Merriweather", value: "Merriweather, Georgia, serif", google: "Merriweather" },
  { label: "System", value: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif" },
];

function loadGoogleFont(fontFamily?: string) {
  if (typeof document === "undefined" || !fontFamily) return;
  const match = FONT_FAMILIES.find((font) => font.value === fontFamily && font.google);
  if (!match?.google) return;

  const id = `stackly-font-${match.google.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  if (document.getElementById(id)) return;

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(match.google).replace(/%20/g, "+")}:wght@400;500;600;700;800&display=swap`;
  document.head.appendChild(link);
}

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

/** Small dot indicator showing a field has a viewport override */
function OverrideDot({ hasOverride, onReset }: { hasOverride: boolean; onReset: () => void }) {
  if (!hasOverride) return null;
  return (
    <button
      type="button"
      title="This field has a viewport override. Click to reset to desktop value."
      onClick={(e) => { e.stopPropagation(); onReset(); }}
      className="ml-1 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 transition hover:bg-amber-200"
    >
      <RotateCcw className="h-2.5 w-2.5" />
    </button>
  );
}

export function StyleTab({
  component,
  onUpdate,
}: {
  component: BuilderComponent;
  onUpdate: (id: string, updates: Partial<BuilderComponent>) => void;
}) {
  const viewport = useBuilderStore((s) => s.viewport) as Viewport;
  const isResponsive = viewport !== "desktop";

  /* ── Resolve styles for current viewport ── */
  const baseStyles = component.styles;
  const vpOverrides = isResponsive ? (component.responsiveStyles?.[viewport] ?? {}) : {};
  const s: ComponentStyles = isResponsive ? { ...baseStyles, ...vpOverrides } : baseStyles;

  const selectedTextStyleTarget = useBuilderStore((state) => state.selectedTextStyleTarget);
  const selectTextStyleTarget = useBuilderStore((state) => state.selectTextStyleTarget);
  const textTarget =
    selectedTextStyleTarget?.componentId === component.id
      ? selectedTextStyleTarget
      : null;
  const activeTextStyles = textTarget ? component.textStyles?.[textTarget.key] ?? {} : s;
  const defaultTextColor = component.type === "button" || textTarget?.key.endsWith(".cta") ? "#ffffff" : "#000000";
  const isButtonTarget =
    component.type === "button" ||
    textTarget?.key.endsWith(".cta") ||
    textTarget?.key.toLowerCase().includes("button");
  const defaultButtonBackground =
    component.type === "button"
      ? s.backgroundColor || "#0B1D40"
      : textTarget
        ? activeTextStyles.backgroundColor || "#0B1D40"
        : "#0B1D40";

  /** Check if a specific style key has a viewport override */
  const hasOverride = (key: keyof ComponentStyles) =>
    isResponsive && vpOverrides[key] !== undefined;

  /** Reset a specific field's viewport override back to desktop */
  const resetOverride = (key: keyof ComponentStyles) => {
    if (!isResponsive) return;
    const current = component.responsiveStyles?.[viewport] ?? {};
    const next = { ...current };
    delete next[key];
    onUpdate(component.id, {
      responsiveStyles: { ...component.responsiveStyles, [viewport]: next },
    });
  };

  /** Write a style patch — to responsiveStyles if on a breakpoint, else to base styles */
  const set = (patch: Partial<ComponentStyles>) => {
    if (isResponsive) {
      // Write only the delta to the viewport override
      onUpdate(component.id, {
        responsiveStyles: {
          ...component.responsiveStyles,
          [viewport]: { ...vpOverrides, ...patch },
        },
      });
    } else {
      onUpdate(component.id, { styles: { ...baseStyles, ...patch } });
    }
  };

  const setTypography = (patch: Partial<ComponentStyles>) => {
    if (!textTarget) {
      set(patch);
      return;
    }

    onUpdate(component.id, {
      textStyles: {
        ...(component.textStyles ?? {}),
        [textTarget.key]: {
          ...(component.textStyles?.[textTarget.key] ?? {}),
          ...patch,
        },
      },
    });
  };

  const ViewportIcon = viewport === "tablet" ? Tablet : viewport === "mobile" ? Smartphone : Monitor;

  useEffect(() => {
    loadGoogleFont(activeTextStyles.fontFamily || s.fontFamily);
  }, [activeTextStyles.fontFamily, s.fontFamily]);

  return (
    <div className="pb-6">
      {/* Viewport editing banner */}
      {isResponsive && (
        <div className="mx-5 mb-3 mt-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <ViewportIcon className="h-3.5 w-3.5 text-amber-700" />
          <span className="text-[11px] font-bold text-amber-800">
            Editing {viewport === "tablet" ? "Tablet" : "Mobile"} overrides
          </span>
        </div>
      )}

      {/* Typography */}
      <Section title="Typography">
        {textTarget && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-[11px] font-bold text-blue-800">
                Editing {textTarget.label}
              </span>
              <button
                type="button"
                onClick={() => selectTextStyleTarget(null)}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800"
              >
                Clear
              </button>
            </div>
          </div>
        )}
        <div>
          <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#566583]">Font Family</span>
          <select
            value={activeTextStyles.fontFamily || ""}
            onChange={(e) => {
              const value = e.target.value;
              loadGoogleFont(value);
              setTypography({ fontFamily: value });
            }}
            className="w-full rounded-lg border border-[#dbe3ef] bg-transparent px-2.5 py-2 text-[12px] font-bold text-[#0B1D40] outline-none focus:border-blue-400"
          >
            <option value="">Inherit</option>
            {FONT_FAMILIES.map((font) => (
              <option key={font.value} value={font.value}>{font.label}</option>
            ))}
          </select>
        </div>
        <div>
          <div className="flex items-center">
            <ColorSwatch
              label="Text Color"
              value={activeTextStyles.color || defaultTextColor}
              onChange={(v) => setTypography({ color: v })}
            />
            <OverrideDot hasOverride={hasOverride("color")} onReset={() => resetOverride("color")} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-end gap-0.5">
            <div className="flex-1">
              <UnitInput
                label="Font Size"
                value={activeTextStyles.fontSize || ""}
                onChange={(v) => setTypography({ fontSize: v })}
                placeholder="16"
              />
            </div>
            <OverrideDot hasOverride={hasOverride("fontSize")} onReset={() => resetOverride("fontSize")} />
          </div>
          <div>
            <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#566583]">Weight</span>
            <select
              value={activeTextStyles.fontWeight || "400"}
              onChange={(e) => setTypography({ fontWeight: e.target.value })}
              className="w-full rounded-lg border border-[#dbe3ef] bg-transparent px-2.5 py-2 text-[12px] font-bold text-[#0B1D40] outline-none focus:border-blue-400"
            >
              {FONT_WEIGHTS.map((fw) => (
                <option key={fw.value} value={fw.value}>{fw.label}</option>
              ))}
            </select>
          </div>
        </div>
        <SegmentedControl
          label="Alignment"
          value={(activeTextStyles.textAlign as string) || "left"}
          options={[
            { value: "left",   icon: <AlignLeft className="h-3.5 w-3.5" />,   title: "Left" },
            { value: "center", icon: <AlignCenter className="h-3.5 w-3.5" />, title: "Center" },
            { value: "right",  icon: <AlignRight className="h-3.5 w-3.5" />,  title: "Right" },
          ]}
          onChange={(v) => setTypography({ textAlign: v as ComponentStyles["textAlign"] })}
        />
      </Section>

      {/* Button appearance */}
      {isButtonTarget && (
        <Section title="Button">
          <ColorSwatch
            label="Button Color"
            value={(textTarget ? activeTextStyles.backgroundColor : s.backgroundColor) || defaultButtonBackground}
            onChange={(v) => (textTarget ? setTypography({ backgroundColor: v }) : set({ backgroundColor: v }))}
          />
          <UnitInput
            label="Button Radius"
            value={(textTarget ? activeTextStyles.borderRadius : s.borderRadius) || ""}
            onChange={(v) => (textTarget ? setTypography({ borderRadius: v }) : set({ borderRadius: v }))}
            placeholder="6"
          />
        </Section>
      )}

      {/* Background */}
      <Section title="Background" defaultOpen={!isButtonTarget}>
        <div className="flex items-center">
          <ColorSwatch
            label={component.type === "button" ? "Block Background" : "Background Color"}
            value={s.backgroundColor || "#ffffff"}
            onChange={(v) => set({ backgroundColor: v })}
          />
          <OverrideDot hasOverride={hasOverride("backgroundColor")} onReset={() => resetOverride("backgroundColor")} />
        </div>
      </Section>

      {/* Spacing */}
      <Section title="Spacing" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-end gap-0.5">
            <div className="flex-1">
              <UnitInput
                label="Padding"
                value={s.padding || ""}
                onChange={(v) => set({ padding: v })}
                placeholder="16"
              />
            </div>
            <OverrideDot hasOverride={hasOverride("padding")} onReset={() => resetOverride("padding")} />
          </div>
          <div className="flex items-end gap-0.5">
            <div className="flex-1">
              <UnitInput
                label="Margin"
                value={s.margin || ""}
                onChange={(v) => set({ margin: v })}
                placeholder="0"
              />
            </div>
            <OverrideDot hasOverride={hasOverride("margin")} onReset={() => resetOverride("margin")} />
          </div>
        </div>
      </Section>

      {/* Size */}
      <Section title="Size" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-end gap-0.5">
            <div className="flex-1">
              <UnitInput
                label="Width"
                value={s.width || ""}
                onChange={(v) => set({ width: v })}
                placeholder="100"
              />
            </div>
            <OverrideDot hasOverride={hasOverride("width")} onReset={() => resetOverride("width")} />
          </div>
          <div className="flex items-end gap-0.5">
            <div className="flex-1">
              <UnitInput
                label="Height"
                value={s.height || ""}
                onChange={(v) => set({ height: v })}
                placeholder="auto"
              />
            </div>
            <OverrideDot hasOverride={hasOverride("height")} onReset={() => resetOverride("height")} />
          </div>
        </div>
        <div className="flex items-end gap-0.5">
          <div className="flex-1">
            <UnitInput
              label="Border Radius"
              value={s.borderRadius || ""}
              onChange={(v) => set({ borderRadius: v })}
              placeholder="8"
            />
          </div>
          <OverrideDot hasOverride={hasOverride("borderRadius")} onReset={() => resetOverride("borderRadius")} />
        </div>
      </Section>

      {/* Position */}
      <Section title="Position" defaultOpen={false}>
        <div>
          <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#566583]">Mode</span>
          <div className="flex overflow-hidden rounded-lg border border-[#dbe3ef]">
            {(["", "relative", "absolute"] as const).map((mode) => {
              const label = mode === "" ? "Static" : mode.charAt(0).toUpperCase() + mode.slice(1);
              const isActive = (s.position || "") === mode;
              return (
                <button
                  key={mode || "static"}
                  type="button"
                  onClick={() => set({ position: mode })}
                  className={`flex flex-1 items-center justify-center py-2 text-[11px] font-bold transition ${
                    isActive
                      ? "bg-[#0B1D40] text-white"
                      : "bg-transparent text-[#566583] hover:bg-[#f7f9fc] hover:text-[#0B1D40]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        {s.position === "absolute" && (
          <div className="grid grid-cols-2 gap-3">
            <UnitInput
              label="Left (X)"
              value={s.left || ""}
              onChange={(v) => set({ left: v })}
              placeholder="0"
            />
            <UnitInput
              label="Top (Y)"
              value={s.top || ""}
              onChange={(v) => set({ top: v })}
              placeholder="0"
            />
          </div>
        )}
      </Section>

      {/* Layer (Z-Index) */}
      <Section title="Layer" defaultOpen={false}>
        <div>
          <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#566583]">Z-Index</span>
          <div className="flex overflow-hidden rounded-lg border border-[#dbe3ef] focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
            <input
              type="number"
              min="0"
              max="9999"
              value={s.zIndex || ""}
              placeholder="auto"
              onChange={(e) => set({ zIndex: e.target.value })}
              className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-[13px] font-bold text-[#0B1D40] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
          <p className="mt-1.5 text-[11px] font-medium text-[#566583]">
            Higher values appear on top of lower ones.
          </p>
        </div>
      </Section>

      {/* ── Reset all styles ── */}
      <div className="border-t border-[#f0eae6] px-5 py-4">
        <button
          type="button"
          onClick={() => {
            if (isResponsive) {
              onUpdate(component.id, {
                responsiveStyles: { ...component.responsiveStyles, [viewport]: {} },
              });
            } else {
              onUpdate(component.id, { styles: {} });
            }
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#dbe3ef] bg-white px-3 py-2 text-[11px] font-bold text-[#566583] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <RotateCcw className="h-3 w-3" />
          {isResponsive ? `Reset ${viewport} overrides` : "Reset all styles"}
        </button>
      </div>
    </div>
  );
}

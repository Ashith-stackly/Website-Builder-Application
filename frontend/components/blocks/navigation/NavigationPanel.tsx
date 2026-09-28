"use client";

import { useState } from "react";
import { ImageIcon, Link as LinkIcon, X } from "lucide-react";
import { ImagePicker } from "@/components/assets/ImagePicker";
import { useAssetStore } from "@/store/assetStore";
import { ContentField } from "@/components/builder/PanelFields";
import type { PanelProps } from "@/lib/blockRegistry";
import type { NavLink, NavigationLogoConfig, NavigationProps } from "@/types/builder";

const LOGO_TYPES: Array<{ value: NavigationLogoConfig["type"]; label: string; desc: string }> = [
  { value: "text",       label: "Text",         desc: "Brand name only" },
  { value: "image",      label: "Image",        desc: "Logo image only" },
  { value: "image-text", label: "Image + Text",  desc: "Logo image & brand name" },
];

const LOGO_MIN_WIDTH = 20;
const LOGO_MAX_WIDTH = 400;

export function NavigationPanel({ data, setProp }: PanelProps<NavigationProps>) {
  const getDataUrl = useAssetStore((s) => s.getDataUrl);
  const [pickerOpen, setPickerOpen] = useState(false);

  const logo: NavigationLogoConfig = data.logo ?? { type: "text" };

  const updateLogo = (patch: Partial<NavigationLogoConfig>) => {
    setProp("logo", { ...logo, ...patch });
  };

  const updateLink = (i: number, patch: Partial<NavLink>) => {
    const next = data.links.map((link, idx) => (idx === i ? { ...link, ...patch } : link));
    setProp("links", next);
  };

  const addLink = () => {
    setProp("links", [...data.links, { label: "New Link", href: "#" }]);
  };

  const removeLink = (i: number) => {
    if (data.links.length <= 1) return;
    setProp("links", data.links.filter((_, idx) => idx !== i));
  };

  const selectLogoImage = async (url: string, assetId?: string) => {
    let logoUrl = url;

    if (assetId) {
      const dataUrl = await getDataUrl(assetId);
      if (dataUrl) logoUrl = dataUrl;
    }

    updateLogo({
      src: logoUrl,
      assetId: assetId ?? "",
    });
    // Also update legacy fields for backward compat
    setProp("logoUrl", logoUrl);
    setProp("logoAssetId", assetId ?? "");
    setPickerOpen(false);
  };

  const removeLogo = () => {
    updateLogo({ src: "", assetId: "" });
    setProp("logoUrl", "");
    setProp("logoAssetId", "");
  };

  const hasLogoImage = !!(logo.src);

  return (
    <div className="space-y-5">
      {/* ─── Logo Section ─── */}
      <div className="space-y-3">
        <span className="block text-[13px] font-bold text-[#0B1D40]">Logo</span>

        {/* Logo Type Selector */}
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-[#0B1D40]/15 bg-white/50 p-1">
          {LOGO_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => updateLogo({ type: value })}
              className={`cursor-pointer rounded-lg px-2 py-2 text-[11px] font-bold transition-all duration-150 ${
                logo.type === value
                  ? "bg-[#0B1D40] text-white shadow-sm"
                  : "text-[#566583] hover:bg-[#0B1D40]/5 hover:text-[#0B1D40]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Logo Type Description */}
        <p className="text-[11px] font-medium text-[#566583]">
          {LOGO_TYPES.find((t) => t.value === logo.type)?.desc}
        </p>
      </div>

      {/* ─── Brand Name ─── */}
      {(logo.type === "text" || logo.type === "image-text") && (
        <ContentField
          label="Brand Name"
          value={data.brand}
          onChange={(v) => setProp("brand", v)}
          placeholder="Stackly Studio"
        />
      )}

      {/* ─── Logo Image Settings (shown for image and image-text) ─── */}
      {(logo.type === "image" || logo.type === "image-text") && (
        <div className="space-y-3 rounded-xl border border-[#0B1D40]/10 bg-white/50 p-3">
          <span className="block text-[12px] font-bold text-[#0B1D40]">Logo Image</span>

          {/* Preview + actions */}
          {hasLogoImage ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-lg border border-[#0B1D40]/10 bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo.src}
                  alt={logo.alt || "Logo preview"}
                  className="h-12 w-auto max-w-[100px] rounded bg-[#f7f9fc] object-contain p-1"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
                <div className="flex flex-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="flex-1 cursor-pointer rounded-lg bg-[#0B1D40] px-2 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#152B52]"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="cursor-pointer rounded-lg border border-red-200 px-2 py-1.5 text-[11px] font-bold text-red-500 transition hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#0B1D40] px-3 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#152B52]"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              Choose Image
            </button>
          )}

          {/* Width Slider */}
          {hasLogoImage && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#566583]">Width</span>
                <span className="text-[11px] font-bold text-[#0B1D40]">{logo.width ?? 120}px</span>
              </div>
              <input
                type="range"
                min={LOGO_MIN_WIDTH}
                max={LOGO_MAX_WIDTH}
                step={5}
                value={logo.width ?? 120}
                onChange={(e) => updateLogo({ width: parseInt(e.target.value) })}
                className="w-full accent-[#0B1D40]"
              />
              <div className="flex justify-between text-[9px] text-[#94a3b8]">
                <span>{LOGO_MIN_WIDTH}px</span>
                <span>{LOGO_MAX_WIDTH}px</span>
              </div>
            </div>
          )}

          {/* Alt Text */}
          {hasLogoImage && (
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[#566583]">Alt Text</span>
              <input
                value={logo.alt ?? ""}
                onChange={(e) => updateLogo({ alt: e.target.value })}
                placeholder="Company Logo"
                className="w-full rounded-lg border border-[#0B1D40]/15 bg-white px-3 py-2 text-[12px] outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          )}

          {/* Link URL */}
          {hasLogoImage && (
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <LinkIcon className="h-3 w-3 text-[#566583]" />
                <span className="text-[11px] font-bold text-[#566583]">Link</span>
              </div>
              <input
                value={logo.href ?? "/"}
                onChange={(e) => updateLogo({ href: e.target.value })}
                placeholder="/"
                className="w-full rounded-lg border border-[#0B1D40]/15 bg-white px-3 py-2 text-[12px] outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          )}

          {/* Open in New Tab */}
          {hasLogoImage && (
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={logo.openInNewTab ?? false}
                onChange={(e) => updateLogo({ openInNewTab: e.target.checked })}
                className="h-3.5 w-3.5 rounded border-[#0B1D40]/20 accent-[#0B1D40]"
              />
              <span className="text-[11px] font-bold text-[#566583]">Open in new tab</span>
            </label>
          )}
        </div>
      )}

      {/* ─── Nav Links ─── */}
      <div>
        <span className="mb-2 block text-[13px] font-bold text-[#0B1D40]">Nav Links</span>
        <div className="space-y-2">
          {data.links.map((link, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <ContentField
                  field={`navLink${i + 1}`}
                  label={`Link ${i + 1}`}
                  value={link.label}
                  onChange={(value) => updateLink(i, { label: value })}
                  placeholder="Link label"
                />
              </div>
              <button
                type="button"
                onClick={() => removeLink(i)}
                className="mt-7 shrink-0 cursor-pointer rounded p-1 text-[#566583] transition hover:bg-red-50 hover:text-red-500"
                aria-label="Remove link"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addLink}
          className="mt-2 cursor-pointer text-[12px] font-bold text-[#0B1D40] transition hover:underline"
        >
          + Add Link
        </button>
      </div>

      {/* ─── CTA Button ─── */}
      <ContentField
        label="Button Text"
        value={data.cta.label}
        onChange={(v) => setProp("cta", { ...data.cta, label: v })}
        placeholder="Get Started"
      />

      {/* ─── Image Picker Modal ─── */}
      <ImagePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={selectLogoImage}
        currentUrl={logo.src}
      />
    </div>
  );
}
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { ImagePicker } from "@/components/assets/ImagePicker";
import { useAssetStore } from "@/store/assetStore";
import { ContentField, contentInputClass } from "@/components/builder/PanelFields";
import type { PanelProps } from "@/lib/blockRegistry";
import type { NavLink, NavigationProps } from "@/types/builder";

const logoPresets = [
  "/stackly-logo.png",
  "/stackly-logo.webp",
  "/logoplan.png",
  "/portfoliologo.webp",
];

export function NavigationPanel({ data, setProp }: PanelProps<NavigationProps>) {
  const getDataUrl = useAssetStore((s) => s.getDataUrl);
  const [pickerOpen, setPickerOpen] = useState(false);

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

  const selectLogo = async (url: string, assetId?: string) => {
    let logoUrl = url;

    if (assetId) {
      const dataUrl = await getDataUrl(assetId);
      if (dataUrl) logoUrl = dataUrl;
    }

    setProp("logoUrl", logoUrl);
    setProp("logoAssetId", assetId ?? "");
    setPickerOpen(false);
  };

  return (
    <div className="space-y-4">
      <ContentField
        label="Brand Name"
        value={data.brand}
        onChange={(v) => setProp("brand", v)}
        placeholder="Stackly Studio"
      />
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="block text-[13px] font-bold text-[#0B1D40]">Brand Logo</span>
          {data.logoUrl && (
            <button
              type="button"
              onClick={() => setProp("logoUrl", "")}
              className="text-[11px] font-bold text-red-500 transition hover:underline"
            >
              Remove
            </button>
          )}
        </div>
        {data.logoUrl ? (
          <div className="flex items-center gap-3 rounded-xl border border-[#0B1D40]/10 bg-white/70 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.logoUrl}
              alt="Brand logo preview"
              className="h-12 w-20 rounded-lg bg-white object-contain"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex-1 rounded-lg bg-[#0B1D40] px-3 py-2 text-[12px] font-bold text-white transition hover:bg-[#152B52]"
            >
              Replace from Assets
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="w-full rounded-lg bg-[#0B1D40] px-3 py-2 text-[12px] font-bold text-white transition hover:bg-[#152B52]"
          >
            Choose from Assets
          </button>
        )}
        <div className="grid grid-cols-2 gap-2">
          {logoPresets.map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => {
                setProp("logoUrl", src);
                setProp("logoAssetId", "");
              }}
              className="truncate rounded-lg border border-[#0B1D40]/20 bg-white/60 px-2 py-2 text-[10px] font-bold text-[#0B1D40] transition hover:bg-[#0B1D40]/5"
            >
              {src.split("/").pop()}
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className="mb-2 block text-[13px] font-bold text-[#0B1D40]">Nav Links</span>
        <div className="space-y-2">
          {data.links.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className={`${contentInputClass} flex-1`}
                value={link.label}
                onChange={(e) => updateLink(i, { label: e.target.value })}
                placeholder="Link label"
              />
              <button
                type="button"
                onClick={() => removeLink(i)}
                className="shrink-0 rounded p-1 text-[#566583] transition hover:bg-red-50 hover:text-red-500"
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
          className="mt-2 text-[12px] font-bold text-[#0B1D40] transition hover:underline"
        >
          + Add Link
        </button>
      </div>
      <ContentField
        label="Button Text"
        value={data.cta.label}
        onChange={(v) => setProp("cta", { ...data.cta, label: v })}
        placeholder="Get Started"
      />
      <ImagePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={selectLogo}
        currentUrl={data.logoUrl}
      />
    </div>
  );
}

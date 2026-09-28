import { useState } from "react";
import { ContentField, TextareaField } from "@/components/builder/PanelFields";
import type { PanelProps } from "@/lib/blockRegistry";
import type { HeroProps } from "@/types/builder";
import { ImagePicker } from "@/components/assets/ImagePicker";
import { Image as ImageIcon } from "lucide-react";

export function HeroPanel({ data, setProp }: PanelProps<HeroProps>) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const media = data.media ?? { type: "placeholder" };

  return (
    <div className="space-y-4">
      <ContentField
        label="Headline"
        value={data.title}
        onChange={(v) => setProp("title", v)}
        placeholder="Create a website in minutes"
      />
      <TextareaField
        label="Description"
        value={data.description}
        onChange={(v) => setProp("description", v)}
        placeholder="Design, edit, and export a clean landing page."
        minHeight="min-h-[86px]"
      />
      <ContentField
        label="Button Text"
        value={data.cta.label}
        onChange={(v) => setProp("cta", { ...data.cta, label: v })}
        placeholder="Start Building"
      />
      <ContentField
        label="Button Link"
        value={data.cta.href ?? ""}
        onChange={(v) => setProp("cta", { ...data.cta, href: v })}
        placeholder="#contact or https://..."
      />

      {/* Media / Visual */}
      <div className="rounded-xl border border-[#dbe3ef] bg-[#f8faff] p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-bold text-[#0B1D40]">Hero Visual</span>
          <span className="text-[11px] font-medium text-[#566583]">Split layout only</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`cursor-pointer py-1.5 text-xs font-bold rounded-lg border transition ${
              media.type === "image"
                ? "border-[#0B1D40] bg-[#0B1D40] text-white"
                : "border-[#dbe3ef] bg-white text-[#566583] hover:bg-slate-50"
            }`}
            onClick={() => setProp("media", { ...media, type: "image" })}
          >
            Image
          </button>
          <button
            type="button"
            className={`cursor-pointer py-1.5 text-xs font-bold rounded-lg border transition ${
              media.type === "placeholder"
                ? "border-[#0B1D40] bg-[#0B1D40] text-white"
                : "border-[#dbe3ef] bg-white text-[#566583] hover:bg-slate-50"
            }`}
            onClick={() => setProp("media", { ...media, type: "placeholder" })}
          >
            Abstract Visual
          </button>
        </div>

        {media.type === "image" && (
          <div className="space-y-2 pt-1">
            <div className="flex gap-2">
              <input
                type="text"
                value={media.src || ""}
                onChange={(e) => setProp("media", { ...media, type: "image", src: e.target.value })}
                placeholder="https://... or choose image"
                className="h-[36px] flex-1 rounded-lg border border-[#dbe3ef] bg-white px-3 text-[12px] font-medium text-[#0B1D40] outline-none transition focus:border-[#0B1D40]"
              />
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="flex items-center gap-1 rounded-lg bg-[#0B1D40] px-3 text-[12px] font-bold text-white transition hover:bg-[#1a346e]"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>Browse</span>
              </button>
            </div>
            <input
              type="text"
              value={media.alt || ""}
              onChange={(e) => setProp("media", { ...media, alt: e.target.value })}
              placeholder="Image alt text"
              className="h-[36px] w-full rounded-lg border border-[#dbe3ef] bg-white px-3 text-[12px] font-medium text-[#0B1D40] outline-none transition focus:border-[#0B1D40]"
            />
          </div>
        )}
      </div>

      {/* Layout */}
      <div>
        <span className="mb-2 block text-[13px] font-bold text-[#0B1D40]">Layout</span>
        <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-[#0B1D40]">
          {(["split", "centered", "stacked"] as const).map((layout) => (
            <button
              key={layout}
              type="button"
              className={`cursor-pointer py-2 text-xs font-bold capitalize transition ${data.layout === layout ? "bg-[#0B1D40] text-white" : "text-[#0B1D40] hover:bg-black/5"}`}
              onClick={() => setProp("layout", layout)}
            >
              {layout}
            </button>
          ))}
        </div>
      </div>

      {/* Alignment */}
      <div>
        <span className="mb-2 block text-[13px] font-bold text-[#0B1D40]">Alignment</span>
        <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-[#0B1D40]">
          {(["left", "center"] as const).map((align) => (
            <button
              key={align}
              type="button"
              className={`cursor-pointer py-2 text-xs font-bold capitalize transition ${data.align === align ? "bg-[#0B1D40] text-white" : "text-[#0B1D40] hover:bg-black/5"}`}
              onClick={() => setProp("align", align)}
            >
              {align}
            </button>
          ))}
        </div>
      </div>

      <ImagePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => {
          setProp("media", { ...media, type: "image", src: url });
          setPickerOpen(false);
        }}
        currentUrl={media.src}
      />
    </div>
  );
}

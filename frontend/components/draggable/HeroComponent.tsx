"use client";

import InlineText from "@/components/builder/InlineText";
import { readHero } from "@/components/blocks/hero/spec";
import type { BuilderComponent } from "@/types/builder";
import { getItemStyle, getTargetTextStyles, getTextStyles, toReactStyle } from "./componentStyles";
import { useBuilderStore } from "@/store/builderStore";
import { Image as ImageIcon } from "lucide-react";

export default function HeroComponent({
  component,
  onPatch,
}: {
  component: BuilderComponent;
  isEditing?: boolean;
  onUpdate?: (content: string | null) => void;
  onPatch?: (patch: Partial<BuilderComponent>) => void;
}) {
  // Typed read — falls back to legacy pipe `content` for pre-migration documents.
  const { title, description, cta, layout, align, media } = readHero(component);
  const textStyle = getTextStyles(component.styles);
  const viewport = useBuilderStore((s) => s.viewport);
  const selectSubItem = useBuilderStore((s) => s.selectSubItem);
  const selectedSubItem = useBuilderStore((s) => s.selectedSubItem);

  /**
   * Update one field of one item immutably.
   * Creates a new array with only the patched item replaced — all other
   * items and their fields are preserved exactly as stored.
   */
  function saveProp(field: "title" | "description", value: string) {
    onPatch?.({ props: { [field]: value } });
  }

  function saveCtaLabel(value: string) {
    onPatch?.({ props: { cta: { ...cta, label: value } } });
  }

  const isCentered = layout === "centered" || align === "center";
  const isMobile = viewport === "mobile";
  const isVisualSelected =
    selectedSubItem?.componentId === component.id && selectedSubItem.element === "visual";

  const gridStyle = isCentered
    ? { display: "flex", flexDirection: "column" as const, alignItems: "center", textAlign: "center" as const }
    : isMobile
      ? { gridTemplateColumns: "1fr" }
      : { gridTemplateColumns: "1.15fr 0.85fr", alignItems: "center" };

  return (
    <section className="w-full overflow-hidden border border-[#dbe3ef]" style={toReactStyle(component.styles)}>
      <div className={isCentered ? "flex flex-col items-center justify-center py-4" : "grid gap-6"} style={gridStyle}>
        <div className={isCentered ? "flex flex-col items-center text-center max-w-[760px] mx-auto" : ""}>
          <InlineText componentId={component.id} textKey="hero.title" textLabel="Hero title" as="h1" value={title} onSave={(v) => saveProp("title", v)} className="text-[34px] font-bold leading-tight" style={getTargetTextStyles(component, "hero.title", textStyle)} />
          <InlineText componentId={component.id} textKey="hero.description" textLabel="Hero description" as="p" value={description} onSave={(v) => saveProp("description", v)} className={`mt-4 max-w-[560px] text-base font-medium leading-7 ${isCentered ? "mx-auto" : ""}`} style={getTargetTextStyles(component, "hero.description", textStyle)} />
          <InlineText componentId={component.id} textKey="hero.cta" textLabel="Hero button" as="button" value={cta.label} onSave={(v) => saveCtaLabel(v)} className={`mt-6 px-5 py-3 text-sm font-bold shadow-sm transition hover:opacity-90 ${isCentered ? "mx-auto inline-block" : ""}`} style={getTargetTextStyles(component, "hero.cta", { color: "#ffffff", backgroundColor: "#0B1D40", borderRadius: "6px" })} />
        </div>
        {!isCentered && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              selectSubItem({
                componentId: component.id,
                itemIndex: 0,
                element: "visual",
              });
            }}
            className={`cursor-pointer overflow-hidden transition-all duration-200 ${
              isVisualSelected ? "ring-2 ring-violet-500 ring-offset-2" : ""
            }`}
            style={getItemStyle(media?.style, {
              minHeight: "220px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f7f9fc",
              border: "1px solid #dbe3ef",
              borderRadius: "12px",
              padding: "16px",
            })}
          >
            {media?.type === "image" && media.src ? (
              <img
                src={media.src}
                alt={media.alt || title || "Hero visual"}
                className="max-h-[360px] w-full object-cover rounded-lg"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center w-full">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-[#0B1D40]">Hero Visual Area</p>
                <p className="mt-1 text-xs text-[#566583]">Select to customize background, border, or set image in panel</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}


"use client";

import InlineText from "@/components/builder/InlineText";
import { readHero } from "@/components/blocks/hero/spec";
import type { BuilderComponent } from "@/types/builder";
import { getTargetTextStyles, getTextStyles, toReactStyle } from "./componentStyles";

import { useBuilderStore } from "@/store/builderStore";

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
  const { title, description, cta, layout, align } = readHero(component);
  const textStyle = getTextStyles(component.styles);
  const viewport = useBuilderStore((s) => s.viewport);

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
          <div className="min-h-[180px] rounded-lg border border-[#dbe3ef] bg-white p-4 shadow-sm">
            <div className="mb-3 h-3 w-24 rounded-full bg-[#dbe3ef]" />
            <div className="grid gap-3">
              <div className="h-16 rounded bg-[#f7f9fc]" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-20 rounded bg-[#f7f9fc]" />
                <div className="h-20 rounded bg-[#f7f9fc]" />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}


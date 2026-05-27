"use client";

import InlineText from "@/components/builder/InlineText";
import { readHero } from "@/components/blocks/hero/spec";
import type { BuilderComponent } from "@/types/builder";
import { toReactStyle } from "./componentStyles";

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
  const { title, description, cta } = readHero(component);

  /**
   * Inline save helper: writes a single prop via `onPatch` so the store
   * shallow-merges only the changed field (no full-object overwrite).
   * Nested objects (like `cta`) are spread-merged to preserve sibling keys.
   */
  function saveProp(field: "title" | "description", value: string) {
    onPatch?.({ props: { [field]: value } });
  }

  function saveCtaLabel(value: string) {
    onPatch?.({ props: { cta: { ...cta, label: value } } });
  }

  return (
    <section className="w-full overflow-hidden border border-[#dbe3ef]" style={toReactStyle(component.styles)}>
      <div className="grid gap-6 md:grid-cols-[1.15fr_0.85fr] md:items-center">
        <div>
          <InlineText as="h1" value={title} onSave={(v) => saveProp("title", v)} className="text-[34px] font-bold leading-tight text-[#0B1D40]" />
          <InlineText as="p" value={description} onSave={(v) => saveProp("description", v)} className="mt-4 max-w-[560px] text-base font-medium leading-7 text-[#566583]" />
          <InlineText as="button" value={cta.label} onSave={(v) => saveCtaLabel(v)} className="mt-6 rounded-md bg-[#0B1D40] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#152B52]" />
        </div>
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
      </div>
    </section>
  );
}

"use client";

import InlineText from "@/components/builder/InlineText";
import { readContact } from "@/components/blocks/contact/spec";
import type { BuilderComponent } from "@/types/builder";
import { toReactStyle } from "./componentStyles";

export default function ContactComponent({
  component,
  onPatch,
}: {
  component: BuilderComponent;
  isEditing?: boolean;
  onUpdate?: (content: string | null) => void;
  onPatch?: (patch: Partial<BuilderComponent>) => void;
}) {
  // Typed read — falls back to legacy pipe `content` for pre-migration documents.
  const { title, description, inputPlaceholder, cta } = readContact(component);

  /** Patch one top-level scalar field; store shallow-merges the rest. */
  function saveProp(field: "title" | "description", value: string) {
    onPatch?.({ props: { [field]: value } });
  }

  /** Spread-merge cta so href and other future fields are preserved. */
  function saveCtaLabel(value: string) {
    onPatch?.({ props: { cta: { ...cta, label: value } } });
  }

  return (
    <section className="w-full border border-[#dbe3ef] shadow-sm" style={toReactStyle(component.styles)}>
      <div className="grid gap-5 md:grid-cols-[1fr_1fr] md:items-end">
        <div>
          <InlineText as="h2" value={title} onSave={(v) => saveProp("title", v)} className="text-2xl font-bold text-[#0B1D40]" />
          <InlineText as="p" value={description} onSave={(v) => saveProp("description", v)} className="mt-2 text-sm font-medium leading-6 text-[#566583]" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input className="min-w-0 flex-1 rounded-md border border-[#dbe3ef] px-4 py-3 text-sm font-semibold text-[#0B1D40] outline-none focus:ring-2 focus:ring-blue-100" placeholder={inputPlaceholder} readOnly />
          <InlineText as="button" value={cta.label} onSave={(v) => saveCtaLabel(v)} className="rounded-md bg-[#0B1D40] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#152B52]" />
        </div>
      </div>
    </section>
  );
}

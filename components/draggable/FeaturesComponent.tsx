"use client";

import InlineText from "@/components/builder/InlineText";
import { readFeatures } from "@/components/blocks/features/spec";
import type { BuilderComponent } from "@/types/builder";
import { toReactStyle } from "./componentStyles";

export default function FeaturesComponent({
  component,
  onPatch,
}: {
  component: BuilderComponent;
  isEditing?: boolean;
  onUpdate?: (content: string | null) => void;
  onPatch?: (patch: Partial<BuilderComponent>) => void;
}) {
  // Typed read — falls back to legacy newline+pipe `content` for pre-migration documents.
  const { items } = readFeatures(component);

  /**
   * Update one field of one item immutably.
   * Creates a new array with only the patched item replaced — all other
   * items and their fields are preserved exactly as stored.
   */
  function saveItemField(i: number, field: "title" | "description", value: string) {
    const next = items.map((item, idx) => (idx === i ? { ...item, [field]: value } : item));
    onPatch?.({ props: { items: next } });
  }

  return (
    <section className="w-full border border-[#dbe3ef] shadow-sm" style={toReactStyle(component.styles)}>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item, index) => (
          <article className="rounded-lg border border-[#dbe3ef] bg-[#f7f9fc] p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-md" key={index}>
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-md bg-[#0B1D40] text-sm font-bold text-white">
              {index + 1}
            </div>
            <InlineText as="h3" value={item.title} onSave={(v) => saveItemField(index, "title", v)} className="text-base font-bold text-[#0B1D40]" />
            <InlineText as="p" value={item.description} onSave={(v) => saveItemField(index, "description", v)} className="mt-2 text-sm font-medium leading-6 text-[#566583]" />
          </article>
        ))}
      </div>
    </section>
  );
}

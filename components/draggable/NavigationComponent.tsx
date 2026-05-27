"use client";

import InlineText from "@/components/builder/InlineText";
import { readNavigation } from "@/components/blocks/navigation/spec";
import type { BuilderComponent } from "@/types/builder";
import { toReactStyle } from "./componentStyles";

export default function NavigationComponent({
  component,
  onPatch,
}: {
  component: BuilderComponent;
  isEditing?: boolean;
  onUpdate?: (content: string | null) => void;
  onPatch?: (patch: Partial<BuilderComponent>) => void;
}) {
  // Typed read — falls back to legacy pipe `content` for pre-migration documents.
  const { brand, links, cta } = readNavigation(component);

  /** Patch a single top-level prop; store shallow-merges the rest. */
  function saveProp<K extends "brand">(key: K, value: string) {
    onPatch?.({ props: { [key]: value } });
  }

  /** Update one link label by index, preserving all other link fields. */
  function saveLinkLabel(i: number, label: string) {
    const next = links.map((link, idx) => (idx === i ? { ...link, label } : link));
    onPatch?.({ props: { links: next } });
  }

  /** Update the CTA label, spreading existing cta fields (href, variant, …). */
  function saveCtaLabel(label: string) {
    onPatch?.({ props: { cta: { ...cta, label } } });
  }

  return (
    <nav className="flex w-full flex-wrap items-center justify-between gap-4 border border-[#dbe3ef] shadow-sm" style={toReactStyle(component.styles)}>
      <InlineText as="span" value={brand} onSave={(v) => saveProp("brand", v)} className="text-lg font-bold text-[#0B1D40]" />
      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-[#566583]">
        {links.map((link, i) => (
          <InlineText key={i} as="span" value={link.label} onSave={(v) => saveLinkLabel(i, v)} className="transition hover:text-[#0B1D40]" />
        ))}
      </div>
      <InlineText as="button" value={cta.label} onSave={(v) => saveCtaLabel(v)} className="rounded-md bg-[#0B1D40] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#152B52]" />
    </nav>
  );
}

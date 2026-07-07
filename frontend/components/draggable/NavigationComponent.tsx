"use client";

import InlineText from "@/components/builder/InlineText";
import { readNavigation } from "@/components/blocks/navigation/spec";
import type { BuilderComponent } from "@/types/builder";
import { getTargetTextStyles, getTextStyles, toReactStyle } from "./componentStyles";

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
  const { brand, logoUrl, links, cta } = readNavigation(component);
  const textStyle = getTextStyles(component.styles);

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
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={`${brand} logo`}
            className="h-9 w-auto max-w-[120px] shrink-0 object-contain"
          />
        )}
        <InlineText componentId={component.id} textKey="navigation.brand" textLabel="Navigation brand" as="span" value={brand} onSave={(v) => saveProp("brand", v)} className="text-lg font-bold" style={getTargetTextStyles(component, "navigation.brand", textStyle)} />
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-[#566583]">
        {links.map((link, i) => (
          <InlineText key={i} componentId={component.id} textKey={`navigation.link.${i}`} textLabel={`Navigation link ${i + 1}`} as="span" value={link.label} onSave={(v) => saveLinkLabel(i, v)} className="transition" style={getTargetTextStyles(component, `navigation.link.${i}`, textStyle)} />
        ))}
      </div>
      <InlineText componentId={component.id} textKey="navigation.cta" textLabel="Navigation button" as="button" value={cta.label} onSave={(v) => saveCtaLabel(v)} className="px-4 py-2 text-sm font-bold shadow-sm transition hover:opacity-90" style={getTargetTextStyles(component, "navigation.cta", { color: "#ffffff", backgroundColor: "#0B1D40", borderRadius: "6px" })} />
    </nav>
  );
}


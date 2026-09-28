"use client";

import InlineText from "@/components/builder/InlineText";
import { readFeatures } from "@/components/blocks/features/spec";
import type { BuilderComponent, ComponentStyles } from "@/types/builder";
import { getTargetTextStyles, getTextStyles, toReactStyle } from "./componentStyles";

import { useBuilderStore } from "@/store/builderStore";
import type { CSSProperties } from "react";

/**
 * Merge per-item style overrides onto hardcoded defaults.
 * Per-item `style` from the data model wins over renderer defaults.
 */
function itemCardStyle(itemStyle?: Partial<ComponentStyles>): CSSProperties {
  const defaults: CSSProperties = {
    backgroundColor: "#f7f9fc",
    borderRadius: "8px",
    border: "1px solid #dbe3ef",
    padding: "20px",
    transition: "all 0.2s ease",
  };
  if (!itemStyle) return defaults;
  // Merge: per-item style values override defaults
  return {
    ...defaults,
    ...(itemStyle.backgroundColor ? { backgroundColor: itemStyle.backgroundColor } : {}),
    ...(itemStyle.borderRadius ? { borderRadius: itemStyle.borderRadius } : {}),
    ...(itemStyle.border ? { border: itemStyle.border } : {}),
    ...(itemStyle.padding ? { padding: itemStyle.padding } : {}),
    ...(itemStyle.boxShadow ? { boxShadow: itemStyle.boxShadow } : {}),
    ...(itemStyle.color ? { color: itemStyle.color } : {}),
  };
}

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
  const textStyle = getTextStyles(component.styles);
  const viewport = useBuilderStore((s) => s.viewport);
  const selectSubItem = useBuilderStore((s) => s.selectSubItem);
  const selectedSubItem = useBuilderStore((s) => s.selectedSubItem);
  const selectTextStyleTarget = useBuilderStore((s) => s.selectTextStyleTarget);
  const selectedTextStyleTarget = useBuilderStore((s) => s.selectedTextStyleTarget);

  /**
   * Update one field of one item immutably.
   * Creates a new array with only the patched item replaced — all other
   * items and their fields are preserved exactly as stored.
   */
  function saveItemField(i: number, field: "title" | "description", value: string) {
    const next = items.map((item, idx) => (idx === i ? { ...item, [field]: value } : item));
    onPatch?.({ props: { items: next } });
  }

  const currentCols = viewport === "mobile"
    ? 1
    : (viewport === "tablet" ? 2 : 3);

  /** Check if a specific item card is currently sub-selected */
  const isCardSelected = (index: number) =>
    selectedSubItem?.componentId === component.id && selectedSubItem.itemIndex === index;

  return (
    <section className="w-full border border-[#dbe3ef] shadow-sm" style={toReactStyle(component.styles)}>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${currentCols}, minmax(0, 1fr))` }}>
        {items.map((item, index) => (
          <article
            key={index}
            className={`group cursor-pointer transition hover:-translate-y-1 hover:shadow-md ${
              isCardSelected(index) ? "ring-2 ring-violet-500 ring-offset-2" : ""
            }`}
            style={itemCardStyle(item.style)}
            onClick={(e) => {
              e.stopPropagation();
              selectSubItem({
                componentId: component.id,
                itemIndex: index,
                element: "card",
              });
            }}
          >
            <div
              className={`mb-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-sm font-bold transition hover:scale-105 ${
                selectedTextStyleTarget?.componentId === component.id &&
                selectedTextStyleTarget?.key === `features.${index}.icon`
                  ? "ring-2 ring-blue-500 ring-offset-2"
                  : ""
              }`}
              style={getTargetTextStyles(component, `features.${index}.icon`, {
                color: item.style?.color || "#ffffff",
                backgroundColor: "#0B1D40",
              })}
              onClick={(e) => {
                e.stopPropagation();
                selectTextStyleTarget({
                  componentId: component.id,
                  key: `features.${index}.icon`,
                  label: `Feature ${index + 1} badge`,
                });
              }}
            >
              {index + 1}
            </div>
            <InlineText componentId={component.id} textKey={`features.${index}.title`} textLabel={`Feature ${index + 1} title`} as="h3" value={item.title} onSave={(v) => saveItemField(index, "title", v)} className="text-base font-bold" style={getTargetTextStyles(component, `features.${index}.title`, textStyle)} />
            <InlineText componentId={component.id} textKey={`features.${index}.description`} textLabel={`Feature ${index + 1} description`} as="p" value={item.description} onSave={(v) => saveItemField(index, "description", v)} className="mt-2 text-sm font-medium leading-6" style={getTargetTextStyles(component, `features.${index}.description`, textStyle)} />
          </article>
        ))}
      </div>
    </section>
  );
}

"use client";

import { X } from "lucide-react";
import { ContentField, TextareaField } from "@/components/builder/PanelFields";
import type { PanelProps } from "@/lib/blockRegistry";
import type { FeatureRecord, FeaturesProps } from "@/types/builder";

export function FeaturesPanel({ data, setProp }: PanelProps<FeaturesProps>) {
  const setItems = (next: FeatureRecord[]) => setProp("items", next);

  const updateItem = (i: number, patch: Partial<FeatureRecord>) =>
    setItems(data.items.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));

  const addItem = () =>
    setItems([...data.items, { title: "New Feature", description: "Describe this feature." }]);

  const removeItem = (i: number) => {
    if (data.items.length <= 1) return;
    setItems(data.items.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-3">
      <span className="block text-[13px] font-bold text-[#0B1D40]">Features</span>
      {data.items.map((item, i) => (
        <div key={i} className="space-y-2 rounded-xl border border-[#dbe3ef] p-3">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <ContentField
                field={`feature${i + 1}Title`}
                label={`Feature ${i + 1} title`}
                value={item.title}
                onChange={(value) => updateItem(i, { title: value })}
                placeholder="Feature title"
              />
            </div>
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="mt-7 shrink-0 rounded p-1 text-[#566583] transition hover:bg-red-50 hover:text-red-500"
              aria-label="Remove feature"
            >
              <X size={14} />
            </button>
          </div>
          <TextareaField
            field={`feature${i + 1}Description`}
            label={`Feature ${i + 1} description`}
            minHeight="min-h-[56px]"
            value={item.description}
            onChange={(value) => updateItem(i, { description: value })}
            placeholder="Feature description"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="text-[12px] font-bold text-[#0B1D40] transition hover:underline"
      >
        + Add Feature
      </button>
    </div>
  );
}

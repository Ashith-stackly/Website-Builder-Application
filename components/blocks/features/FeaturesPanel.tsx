"use client";

import { X } from "lucide-react";
import { contentInputClass } from "@/components/builder/PanelFields";
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
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-[11px] font-bold text-[#566583]">#{i + 1}</span>
            <input
              className={`${contentInputClass} flex-1 py-1.5`}
              value={item.title}
              onChange={(e) => updateItem(i, { title: e.target.value })}
              placeholder="Feature title"
            />
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="shrink-0 rounded p-1 text-[#566583] transition hover:bg-red-50 hover:text-red-500"
              aria-label="Remove feature"
            >
              <X size={14} />
            </button>
          </div>
          <textarea
            className={`${contentInputClass} min-h-[56px] resize-none text-[13px]`}
            value={item.description}
            onChange={(e) => updateItem(i, { description: e.target.value })}
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

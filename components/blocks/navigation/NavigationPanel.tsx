"use client";

import { X } from "lucide-react";
import { ContentField, contentInputClass } from "@/components/builder/PanelFields";
import type { PanelProps } from "@/lib/blockRegistry";
import type { NavLink, NavigationProps } from "@/types/builder";

export function NavigationPanel({ data, setProp }: PanelProps<NavigationProps>) {
  const updateLink = (i: number, patch: Partial<NavLink>) => {
    const next = data.links.map((link, idx) => (idx === i ? { ...link, ...patch } : link));
    setProp("links", next);
  };

  const addLink = () => {
    setProp("links", [...data.links, { label: "New Link", href: "#" }]);
  };

  const removeLink = (i: number) => {
    if (data.links.length <= 1) return;
    setProp("links", data.links.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-4">
      <ContentField
        label="Brand Name"
        value={data.brand}
        onChange={(v) => setProp("brand", v)}
        placeholder="Stackly Studio"
      />
      <div>
        <span className="mb-2 block text-[13px] font-bold text-[#0B1D40]">Nav Links</span>
        <div className="space-y-2">
          {data.links.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className={`${contentInputClass} flex-1`}
                value={link.label}
                onChange={(e) => updateLink(i, { label: e.target.value })}
                placeholder="Link label"
              />
              <button
                type="button"
                onClick={() => removeLink(i)}
                className="shrink-0 rounded p-1 text-[#566583] transition hover:bg-red-50 hover:text-red-500"
                aria-label="Remove link"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addLink}
          className="mt-2 text-[12px] font-bold text-[#0B1D40] transition hover:underline"
        >
          + Add Link
        </button>
      </div>
      <ContentField
        label="Button Text"
        value={data.cta.label}
        onChange={(v) => setProp("cta", { ...data.cta, label: v })}
        placeholder="Get Started"
      />
    </div>
  );
}

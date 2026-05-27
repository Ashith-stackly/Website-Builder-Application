"use client";

import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ICON_NAMES } from "@/components/draggable/IconComponent";
import { ContentField } from "@/components/builder/PanelFields";
import type { PanelProps } from "@/lib/blockRegistry";
import type { FeatureItemProps } from "@/types/builder";

export function FeatureItemPanel({ data, setProp }: PanelProps<FeatureItemProps>) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <span className="block text-[13px] font-bold text-[#0B1D40]">Icon</span>
        <div className="grid max-h-[180px] grid-cols-7 gap-1 overflow-y-auto rounded-xl border border-[#0B1D40] p-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#0B1D40]/20">
          {ICON_NAMES.map((name) => {
            const Icon = (LucideIcons as unknown as Record<string, LucideIcon | undefined>)[name];
            if (!Icon) return null;
            const isActive = data.icon === name;
            return (
              <button
                key={name}
                title={name}
                type="button"
                className={`flex items-center justify-center rounded p-2 transition-all duration-150 ${isActive ? "bg-[#0B1D40]" : "hover:bg-[#0B1D40]/10"}`}
                onClick={() => setProp("icon", name)}
              >
                <Icon size={14} color={isActive ? "white" : "#0B1D40"} />
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-[#566583]">
          Icon: <span className="font-bold text-[#0B1D40]">{data.icon}</span>
        </p>
      </div>

      <div>
        <span className="mb-2 block text-[13px] font-bold text-[#0B1D40]">Layout</span>
        <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-[#0B1D40]">
          {(["horizontal", "card"] as const).map((layout) => (
            <button
              key={layout}
              type="button"
              className={`py-2 text-xs font-bold capitalize transition ${data.layout === layout ? "bg-[#0B1D40] text-white" : "text-[#0B1D40] hover:bg-black/5"}`}
              onClick={() => setProp("layout", layout)}
            >
              {layout}
            </button>
          ))}
        </div>
      </div>

      <ContentField label="Title"        value={data.title}       onChange={(v) => setProp("title", v)}       placeholder="Feature Title" />
      <ContentField label="Description"  value={data.description} onChange={(v) => setProp("description", v)} placeholder="Describe this feature..." />
      <ContentField label="Button (opt)" value={data.cta}         onChange={(v) => setProp("cta", v)}         placeholder="Learn More" />
    </div>
  );
}

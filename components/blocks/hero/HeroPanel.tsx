"use client";

import { ContentField, TextareaField } from "@/components/builder/PanelFields";
import type { PanelProps } from "@/lib/blockRegistry";
import type { HeroProps } from "@/types/builder";

export function HeroPanel({ data, setProp }: PanelProps<HeroProps>) {
  return (
    <div className="space-y-4">
      <ContentField
        label="Headline"
        value={data.title}
        onChange={(v) => setProp("title", v)}
        placeholder="Create a website in minutes"
      />
      <TextareaField
        label="Description"
        value={data.description}
        onChange={(v) => setProp("description", v)}
        placeholder="Design, edit, and export a clean landing page."
        minHeight="min-h-[86px]"
      />
      <ContentField
        label="Button Text"
        value={data.cta.label}
        onChange={(v) => setProp("cta", { ...data.cta, label: v })}
        placeholder="Start Building"
      />
    </div>
  );
}

"use client";

import { ContentField, TextareaField } from "@/components/builder/PanelFields";
import type { PanelProps } from "@/lib/blockRegistry";
import type { ContactProps } from "@/types/builder";

export function ContactPanel({ data, setProp }: PanelProps<ContactProps>) {
  return (
    <div className="space-y-4">
      <ContentField
        label="Title"
        value={data.title}
        onChange={(v) => setProp("title", v)}
        placeholder="Ready to launch?"
      />
      <TextareaField
        label="Subtitle"
        value={data.description}
        onChange={(v) => setProp("description", v)}
        placeholder="Leave your email and we will help you go live."
        minHeight="min-h-[72px]"
      />
      <ContentField
        label="Input Placeholder"
        value={data.inputPlaceholder}
        onChange={(v) => setProp("inputPlaceholder", v)}
        placeholder="Email address"
      />
      <ContentField
        label="Button Text"
        value={data.cta.label}
        onChange={(v) => setProp("cta", { ...data.cta, label: v })}
        placeholder="Contact Us"
      />
    </div>
  );
}

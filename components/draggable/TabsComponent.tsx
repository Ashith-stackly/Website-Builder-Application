"use client";

import { useState } from "react";
import type { BuilderComponent, TabsProps } from "@/types/builder";
import { getBaseStyles } from "./componentStyles";

export const tabsDefaults: TabsProps = {
  items: [
    { label: "Overview", content: "Get a comprehensive overview of all our features and services. Our platform is designed to help you build beautiful, responsive websites with ease." },
    { label: "Features", content: "Drag-and-drop editor, responsive design, custom domains, SEO optimization, e-commerce integration, and much more. Everything you need to build a professional website." },
    { label: "Pricing", content: "We offer flexible pricing plans starting from $9/month. All plans include core features, with premium tiers unlocking advanced analytics, priority support, and team collaboration." },
  ],
  variant: "underline",
};

export default function TabsComponent({
  component,
}: {
  component: BuilderComponent;
  children?: React.ReactNode;
  isEditing?: boolean;
  onUpdate?: (content: string | null) => void;
  onPatch?: (patch: Partial<BuilderComponent>) => void;
}) {
  const props = (component.props as unknown as TabsProps) || tabsDefaults;
  const base = getBaseStyles(component);
  const [active, setActive] = useState(0);
  const variant = props.variant || "underline";

  const tabClasses: Record<string, (isActive: boolean) => string> = {
    underline: (a: boolean) =>
      `px-4 py-2.5 text-sm font-bold transition-all duration-200 border-b-2 ${
        a ? "border-[#0B1D40] text-[#0B1D40]" : "border-transparent text-[#566583] hover:text-[#0B1D40] hover:border-[#dbe3ef]"
      }`,
    pills: (a: boolean) =>
      `px-4 py-2 text-sm font-bold rounded-full transition-all duration-200 ${
        a ? "bg-[#0B1D40] text-white shadow-md" : "text-[#566583] hover:bg-[#f7f9fc] hover:text-[#0B1D40]"
      }`,
    boxed: (a: boolean) =>
      `px-4 py-2.5 text-sm font-bold transition-all duration-200 border-2 ${
        a ? "border-[#0B1D40] bg-[#0B1D40] text-white rounded-lg" : "border-[#e6edf5] text-[#566583] rounded-lg hover:border-[#0B1D40]/30 hover:text-[#0B1D40]"
      }`,
  };

  return (
    <div style={base} className="w-full py-4">
      {/* Tab header */}
      <div
        className={`flex gap-1 ${
          variant === "underline" ? "border-b border-[#e6edf5]" : ""
        }`}
      >
        {props.items.map((item, i) => (
          <button
            key={i}
            type="button"
            className={tabClasses[variant]?.(i === active) || tabClasses.underline(i === active)}
            onClick={() => setActive(i)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-5 rounded-xl border border-[#e6edf5] bg-white p-6 shadow-[0_2px_12px_rgba(15,35,75,0.04)]">
        <p className="text-sm font-medium leading-relaxed text-[#566583]">
          {props.items[active]?.content}
        </p>
      </div>
    </div>
  );
}


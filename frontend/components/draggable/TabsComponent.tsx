"use client";

import { useState } from "react";
import type { BuilderComponent, TabsProps, TabItem } from "@/types/builder";
import { getItemStyle, getTargetTextStyles, getTextStyles, toReactStyle } from "./componentStyles";
import { useBuilderStore } from "@/store/builderStore";
import InlineText from "@/components/builder/InlineText";

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
  onPatch,
}: {
  component: BuilderComponent;
  children?: React.ReactNode;
  isEditing?: boolean;
  onUpdate?: (content: string | null) => void;
  onPatch?: (patch: Partial<BuilderComponent>) => void;
}) {
  const props = (component.props as unknown as TabsProps) || tabsDefaults;
  const [active, setActive] = useState(0);
  const variant = props.variant || "underline";
  const selectSubItem = useBuilderStore((s) => s.selectSubItem);
  const selectedSubItem = useBuilderStore((s) => s.selectedSubItem);
  const textStyle = getTextStyles(component.styles);

  const isTabSelected =
    selectedSubItem?.componentId === component.id && selectedSubItem.itemIndex === active;

  function saveTabField(index: number, field: keyof TabItem, value: string) {
    const next = props.items.map((it, idx) => (idx === index ? { ...it, [field]: value } : it));
    onPatch?.({ props: { items: next } });
  }

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

  const activeItem = props.items[active];

  return (
    <div style={toReactStyle(component.styles)} className="w-full py-4">
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
            <InlineText
              componentId={component.id}
              textKey={`tabs.${i}.label`}
              textLabel={`Tab ${i + 1} label`}
              as="span"
              value={item.label}
              onSave={(v) => saveTabField(i, "label", v)}
            />
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          selectSubItem({
            componentId: component.id,
            itemIndex: active,
            element: "tab",
          });
        }}
        className={`mt-5 cursor-pointer rounded-xl transition-all duration-200 ${
          isTabSelected ? "ring-2 ring-violet-500 ring-offset-2" : ""
        }`}
        style={getItemStyle(activeItem?.style, {
          backgroundColor: "#ffffff",
          border: "1px solid #e6edf5",
          padding: "24px",
          borderRadius: "12px",
          boxShadow: "0 2px 12px rgba(15,35,75,0.04)",
        })}
      >
        <InlineText
          componentId={component.id}
          textKey={`tabs.${active}.content`}
          textLabel={`Tab ${active + 1} content`}
          as="p"
          value={activeItem?.content || ""}
          onSave={(v) => saveTabField(active, "content", v)}
          className="text-sm font-medium leading-relaxed text-[#566583]"
          style={getTargetTextStyles(component, `tabs.${active}.content`, textStyle)}
        />
      </div>
    </div>
  );
}


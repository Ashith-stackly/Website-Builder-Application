"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { BuilderComponent, AccordionProps } from "@/types/builder";
import { getItemStyle, getTargetTextStyles, getTextStyles, toReactStyle } from "./componentStyles";
import { useBuilderStore } from "@/store/builderStore";
import InlineText from "@/components/builder/InlineText";

export const accordionDefaults: AccordionProps = {
  items: [
    { title: "What is Stackly?", content: "Stackly is a powerful drag-and-drop website builder that lets you create professional websites in minutes without any coding knowledge." },
    { title: "How do I get started?", content: "Simply sign up for a free account, choose a template or start from scratch, and begin adding blocks to build your website." },
    { title: "Can I use my own domain?", content: "Yes! You can connect your custom domain on any paid plan. We also provide free subdomains for all users." },
    { title: "Is there a free plan?", content: "Absolutely. Our free plan includes all core builder features, basic templates, and a stackly.studio subdomain." },
  ],
  allowMultiple: false,
};

export default function AccordionComponent({
  component,
  onPatch,
}: {
  component: BuilderComponent;
  children?: React.ReactNode;
  isEditing?: boolean;
  onUpdate?: (content: string | null) => void;
  onPatch?: (patch: Partial<BuilderComponent>) => void;
}) {
  const props = (component.props as unknown as AccordionProps) || accordionDefaults;
  const [openIndexes, setOpenIndexes] = useState<number[]>([0]);
  const selectSubItem = useBuilderStore((s) => s.selectSubItem);
  const selectedSubItem = useBuilderStore((s) => s.selectedSubItem);
  const textStyle = getTextStyles(component.styles);

  const toggle = (index: number) => {
    setOpenIndexes((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index);
      return props.allowMultiple ? [...prev, index] : [index];
    });
  };

  const isItemSelected = (index: number) =>
    selectedSubItem?.componentId === component.id && selectedSubItem.itemIndex === index;

  function saveItemField(index: number, field: "title" | "content", value: string) {
    const next = props.items.map((it, idx) => (idx === index ? { ...it, [field]: value } : it));
    onPatch?.({ props: { items: next } });
  }

  return (
    <div style={toReactStyle(component.styles)} className="mx-auto w-full max-w-[720px] py-4">
      <div className="flex flex-col gap-2">
        {props.items.map((item, i) => {
          const isOpen = openIndexes.includes(i);
          return (
            <div
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                selectSubItem({
                  componentId: component.id,
                  itemIndex: i,
                  element: "item",
                });
              }}
              className={`cursor-pointer overflow-hidden rounded-xl transition-all duration-200 ${
                isItemSelected(i) ? "ring-2 ring-violet-500 ring-offset-2" : ""
              }`}
              style={getItemStyle(item.style, {
                border: isOpen ? "2px solid rgba(11,29,64,0.2)" : "2px solid #e6edf5",
                backgroundColor: isOpen ? "#f8faff" : "#ffffff",
                boxShadow: isOpen ? "0 4px 16px rgba(11,29,64,0.06)" : undefined,
                borderRadius: "12px",
              })}
            >
              <div
                className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-black/5"
              >
                <div className="flex-1 mr-3">
                  <InlineText
                    componentId={component.id}
                    textKey={`accordion.${i}.title`}
                    textLabel={`Accordion ${i + 1} title`}
                    as="span"
                    value={item.title}
                    onSave={(v) => saveItemField(i, "title", v)}
                    className="text-[15px] font-bold text-[#0B1D40]"
                    style={getTargetTextStyles(component, `accordion.${i}.title`, { color: "#0B1D40" })}
                  />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(i);
                  }}
                  className="p-1 hover:bg-black/5 rounded-md"
                >
                  <ChevronDown
                    className={`h-5 w-5 flex-shrink-0 text-[#566583] transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
              <div
                className="overflow-hidden transition-all duration-300"
                style={{
                  maxHeight: isOpen ? "500px" : "0px",
                  opacity: isOpen ? 1 : 0,
                }}
              >
                <div className="border-t border-[#e6edf5] px-5 py-4">
                  <InlineText
                    componentId={component.id}
                    textKey={`accordion.${i}.content`}
                    textLabel={`Accordion ${i + 1} content`}
                    as="p"
                    value={item.content}
                    onSave={(v) => saveItemField(i, "content", v)}
                    className="text-sm font-medium leading-relaxed text-[#566583]"
                    style={getTargetTextStyles(component, `accordion.${i}.content`, textStyle)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { BuilderComponent, AccordionProps } from "@/types/builder";
import { getBaseStyles } from "./componentStyles";

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
}: {
  component: BuilderComponent;
  children?: React.ReactNode;
  isEditing?: boolean;
  onUpdate?: (content: string | null) => void;
  onPatch?: (patch: Partial<BuilderComponent>) => void;
}) {
  const props = (component.props as unknown as AccordionProps) || accordionDefaults;
  const base = getBaseStyles(component);
  const [openIndexes, setOpenIndexes] = useState<number[]>([0]);

  const toggle = (index: number) => {
    setOpenIndexes((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index);
      return props.allowMultiple ? [...prev, index] : [index];
    });
  };

  return (
    <div style={base} className="mx-auto w-full max-w-[720px] py-4">
      <div className="flex flex-col gap-2">
        {props.items.map((item, i) => {
          const isOpen = openIndexes.includes(i);
          return (
            <div
              key={i}
              className={`overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                isOpen
                  ? "border-[#0B1D40]/20 bg-[#f8faff] shadow-[0_4px_16px_rgba(11,29,64,0.06)]"
                  : "border-[#e6edf5] bg-white"
              }`}
            >
              <button
                type="button"
                className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-[#f7f9fc]"
                onClick={() => toggle(i)}
              >
                <span className="text-[15px] font-bold text-[#0B1D40]">{item.title}</span>
                <ChevronDown
                  className={`h-5 w-5 flex-shrink-0 text-[#566583] transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className="overflow-hidden transition-all duration-300"
                style={{
                  maxHeight: isOpen ? "500px" : "0px",
                  opacity: isOpen ? 1 : 0,
                }}
              >
                <div className="border-t border-[#e6edf5] px-5 py-4">
                  <p className="text-sm font-medium leading-relaxed text-[#566583]">
                    {item.content}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


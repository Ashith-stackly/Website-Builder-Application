"use client";

import { Star } from "lucide-react";
import InlineText from "@/components/builder/InlineText";
import type { BuilderComponent, TestimonialProps, TestimonialItem } from "@/types/builder";
import { getItemStyle, getTargetTextStyles, getTextStyles, toReactStyle } from "./componentStyles";
import { useBuilderStore } from "@/store/builderStore";

export const testimonialDefaults: TestimonialProps = {
  heading: "What Our Customers Say",
  items: [
    {
      quote: "This platform has transformed how we build websites. The drag-and-drop interface is incredibly intuitive.",
      name: "Sarah Johnson",
      role: "CEO, TechStart",
      rating: 5,
    },
    {
      quote: "The best website builder I've ever used. Clean, fast, and professional results every time.",
      name: "Michael Chen",
      role: "Designer, CreativeLab",
      rating: 5,
    },
    {
      quote: "We went from zero to a fully functional website in under an hour. Absolutely incredible experience.",
      name: "Emily Rodriguez",
      role: "Founder, GreenLeaf",
      rating: 4,
    },
  ],
  layout: "cards",
};

/* ── Safe reader ────────────────────────────────────────────────────── */
function readTestimonialData(component: BuilderComponent): TestimonialProps {
  const p = component.props as Record<string, unknown> | undefined;
  if (!p || typeof p !== "object") return testimonialDefaults;
  const layout = p.layout === "carousel" || p.layout === "stack" ? p.layout : "cards";
  return {
    heading: typeof p.heading === "string" ? p.heading : testimonialDefaults.heading,
    items: Array.isArray(p.items) ? (p.items as TestimonialItem[]) : testimonialDefaults.items,
    layout,
  };
}

export default function TestimonialComponent({
  component,
  onPatch,
}: {
  component: BuilderComponent;
  children?: React.ReactNode;
  isEditing?: boolean;
  onUpdate?: (content: string | null) => void;
  onPatch?: (patch: Partial<BuilderComponent>) => void;
}) {
  const data = readTestimonialData(component);
  const textStyle = getTextStyles(component.styles);
  const viewport = useBuilderStore((s) => s.viewport);
  const selectSubItem = useBuilderStore((s) => s.selectSubItem);
  const selectedSubItem = useBuilderStore((s) => s.selectedSubItem);

  const items = data.items;
  const heading = data.heading ?? "";

  const colCount = Math.min(items.length, 3);
  const currentCols = viewport === "mobile"
    ? 1
    : (viewport === "tablet" ? 2 : colCount);

  const isCardSelected = (index: number) =>
    selectedSubItem?.componentId === component.id && selectedSubItem.itemIndex === index;

  function saveHeading(value: string) {
    onPatch?.({ props: { heading: value } });
  }

  function saveItemField(index: number, field: keyof TestimonialItem, value: string | number) {
    const next = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onPatch?.({ props: { items: next } });
  }

  return (
    <div className="w-full py-6" style={toReactStyle(component.styles)}>
      {heading && (
        <InlineText
          componentId={component.id}
          textKey="testimonial.heading"
          textLabel="Testimonial heading"
          as="h2"
          value={heading}
          onSave={saveHeading}
          className="mb-8 text-center text-2xl font-extrabold sm:text-3xl"
          style={getTargetTextStyles(component, "testimonial.heading", textStyle)}
        />
      )}

      <div
        className="mx-auto grid w-full gap-5"
        style={{
          gridTemplateColumns: `repeat(${currentCols}, minmax(0, 1fr))`,
          maxWidth: 960,
        }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              selectSubItem({
                componentId: component.id,
                itemIndex: i,
                element: "testimonial",
              });
            }}
            className={`flex flex-col cursor-pointer transition-all duration-200 hover:shadow-[0_8px_30px_rgba(15,35,75,0.12)] hover:-translate-y-1 ${
              isCardSelected(i) ? "ring-2 ring-violet-500 ring-offset-2" : ""
            }`}
            style={getItemStyle(item.style, {
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e6edf5",
              padding: "24px",
              boxShadow: "0 4px 16px rgba(15,35,75,0.06)",
            })}
          >
            {/* Stars */}
            {item.rating && (
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className={`h-4 w-4 ${j < item.rating! ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`}
                  />
                ))}
              </div>
            )}

            <InlineText
              componentId={component.id}
              textKey={`testimonial.${i}.quote`}
              textLabel={`Testimonial ${i + 1} quote`}
              as="p"
              value={`\u201c${item.quote}\u201d`}
              onSave={(v) => {
                // Strip smart quotes on save
                const clean = v.replace(/[\u201c\u201d""]/g, "").trim();
                saveItemField(i, "quote", clean);
              }}
              className="flex-1 text-[15px] font-medium italic leading-relaxed text-[#566583]"
              style={getTargetTextStyles(component, `testimonial.${i}.quote`, { color: "#566583" })}
            />

            <div className="mt-5 flex items-center gap-3 border-t border-[#f0f3f8] pt-4">
              {/* Avatar */}
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#0B1D40] to-[#3b82f6] text-sm font-black text-white shadow-md">
                {item.name.charAt(0)}
              </div>
              <div>
                <InlineText
                  componentId={component.id}
                  textKey={`testimonial.${i}.name`}
                  textLabel={`Testimonial ${i + 1} author`}
                  as="p"
                  value={item.name}
                  onSave={(v) => saveItemField(i, "name", v)}
                  className="text-sm font-bold text-[#0B1D40]"
                  style={getTargetTextStyles(component, `testimonial.${i}.name`, { color: "#0B1D40" })}
                />
                <InlineText
                  componentId={component.id}
                  textKey={`testimonial.${i}.role`}
                  textLabel={`Testimonial ${i + 1} role`}
                  as="p"
                  value={item.role}
                  onSave={(v) => saveItemField(i, "role", v)}
                  className="text-xs font-medium text-[#94a3b8]"
                  style={getTargetTextStyles(component, `testimonial.${i}.role`, { color: "#94a3b8" })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { Star } from "lucide-react";
import type { BuilderComponent, TestimonialProps } from "@/types/builder";
import { getBaseStyles } from "./componentStyles";

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

import { useBuilderStore } from "@/store/builderStore";

export default function TestimonialComponent({
  component,
}: {
  component: BuilderComponent;
  children?: React.ReactNode;
  isEditing?: boolean;
  onUpdate?: (content: string | null) => void;
  onPatch?: (patch: Partial<BuilderComponent>) => void;
}) {
  const props = (component.props as unknown as TestimonialProps) || testimonialDefaults;
  const base = getBaseStyles(component);
  const viewport = useBuilderStore((s) => s.viewport);

  const colCount = Math.min(props.items.length, 3);
  const currentCols = viewport === "mobile"
    ? 1
    : (viewport === "tablet" ? 2 : colCount);

  return (
    <div style={base} className="w-full py-6">
      {props.heading && (
        <h2
          className="mb-8 text-center text-2xl font-extrabold sm:text-3xl"
          style={{ color: base.color || "#0B1D40" }}
        >
          {props.heading}
        </h2>
      )}

      <div
        className="mx-auto grid w-full gap-5"
        style={{
          gridTemplateColumns: `repeat(${currentCols}, minmax(0, 1fr))`,
          maxWidth: 960,
        }}
      >
        {props.items.map((item, i) => (
          <div
            key={i}
            className="flex flex-col rounded-2xl border border-[#e6edf5] bg-white p-6 shadow-[0_4px_16px_rgba(15,35,75,0.06)] transition-all duration-200 hover:shadow-[0_8px_30px_rgba(15,35,75,0.12)] hover:-translate-y-1"
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

            <p className="flex-1 text-[15px] font-medium italic leading-relaxed text-[#566583]">
              &ldquo;{item.quote}&rdquo;
            </p>

            <div className="mt-5 flex items-center gap-3 border-t border-[#f0f3f8] pt-4">
              {/* Avatar */}
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#0B1D40] to-[#3b82f6] text-sm font-black text-white shadow-md">
                {item.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-[#0B1D40]">{item.name}</p>
                <p className="text-xs font-medium text-[#94a3b8]">{item.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


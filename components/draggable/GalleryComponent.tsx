"use client";

import Image from "next/image";
import InlineText from "@/components/builder/InlineText";
import type { BuilderComponent } from "@/types/builder";
import { toReactStyle } from "./componentStyles";

export default function GalleryComponent({ component, onUpdate }: { component: BuilderComponent; onUpdate?: (content: string | null) => void }) {
  const lines = component.content.split("\n");
  const images = lines
    .map((item) => {
      const [src = "", caption = "Website image"] = item.split("|");
      return { caption: caption.trim(), src: src.trim() };
    })
    .filter((image) => image.src);

  function saveCaption(lineIdx: number, val: string) {
    const updated = [...lines];
    const parts = (updated[lineIdx] ?? "").split("|");
    parts[1] = val;
    updated[lineIdx] = parts.join("|");
    onUpdate?.(updated.join("\n"));
  }

  return (
    <section className="w-full border border-[#dbe3ef] shadow-sm" style={toReactStyle(component.styles)}>
      <div className="grid gap-4 md:grid-cols-3">
        {images.map((image, index) => (
          <figure className="overflow-hidden rounded-lg border border-[#dbe3ef] bg-[#f7f9fc]" key={`${image.src}-${index}`}>
            <div className="relative h-[170px] w-full">
              <Image alt={image.caption || "Website image"} className="object-cover" fill sizes="(min-width: 768px) 280px, 100vw" src={image.src} unoptimized />
            </div>
            {image.caption && (
              <InlineText as="figcaption" value={image.caption} onSave={(v) => saveCaption(index, v)} className="px-4 py-3 text-sm font-bold text-[#0B1D40]" />
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}


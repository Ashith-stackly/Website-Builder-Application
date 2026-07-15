"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import InlineText from "@/components/builder/InlineText";
import type { BuilderComponent } from "@/types/builder";
import { getTargetTextStyles, getTextStyles, toReactStyle } from "./componentStyles";
import { useAssetStore } from "@/store/assetStore";
import { ImageIcon } from "lucide-react";

import { useBuilderStore } from "@/store/builderStore";

interface GalleryItem {
  src: string;
  caption: string;
  assetId?: string;
}

/** Parse legacy pipe-delimited content string into gallery items. */
function parseLegacyContent(content: string): GalleryItem[] {
  return content
    .split("\n")
    .map((item) => {
      const [src = "", caption = "Website image"] = item.split("|");
      return { caption: caption.trim(), src: src.trim() };
    })
    .filter((image) => image.src);
}

/** Read gallery items from structured props or legacy content. */
function readGalleryItems(component: BuilderComponent): GalleryItem[] {
  const props = component.props as Record<string, unknown> | undefined;
  if (props && Array.isArray(props.items) && props.items.length > 0) {
    return (props.items as Array<Record<string, unknown>>)
      .map((item) => ({
        src: typeof item.src === "string" ? item.src : "",
        caption: typeof item.caption === "string" ? item.caption : "Website image",
        assetId: typeof item.assetId === "string" ? item.assetId : undefined,
      }))
      .filter((item) => item.src);
  }
  return parseLegacyContent(component.content);
}

export default function GalleryComponent({ component, onUpdate }: { component: BuilderComponent; onUpdate?: (content: string | null) => void }) {
  const viewport = useBuilderStore((s) => s.viewport);
  const textStyle = getTextStyles(component.styles);
  const images = readGalleryItems(component);

  // Resolve asset URLs with caching to prevent re-creating object URLs
  const getUrl = useAssetStore((s) => s.getUrl);
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});
  const resolvedRef = useRef<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const assetIds = images
      .map((img) => img.assetId)
      .filter((id): id is string => !!id && !resolvedRef.current[id]);

    if (assetIds.length === 0) return;

    Promise.all(
      assetIds.map(async (id) => {
        const url = await getUrl(id);
        return { id, url };
      }),
    ).then((results) => {
      if (cancelled) return;
      const updates: Record<string, string> = {};
      for (const { id, url } of results) {
        if (url) {
          updates[id] = url;
          resolvedRef.current[id] = url;
        }
      }
      if (Object.keys(updates).length > 0) {
        setResolvedUrls((prev) => ({ ...prev, ...updates }));
      }
    });

    return () => { cancelled = true; };
  }, [images, getUrl]);

  /** Get the display URL for an image, resolving asset IDs. */
  const getDisplaySrc = (image: GalleryItem): string => {
    if (image.assetId && resolvedUrls[image.assetId]) {
      return resolvedUrls[image.assetId];
    }
    return image.src;
  };

  function saveCaption(lineIdx: number, val: string) {
    const lines = component.content.split("\n");
    const updated = [...lines];
    const parts = (updated[lineIdx] ?? "").split("|");
    parts[1] = val;
    updated[lineIdx] = parts.join("|");
    onUpdate?.(updated.join("\n"));
  }

  // Empty state
  if (images.length === 0) {
    return (
      <section
        className="w-full border border-[#dbe3ef] shadow-sm"
        style={toReactStyle(component.styles)}
      >
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-[#dbe3ef] bg-[#f7f9fc] p-8 text-center">
          <ImageIcon className="h-10 w-10 text-[#0B1D40]/20" />
          <p className="text-sm font-medium text-[#566583]">
            Gallery is empty
          </p>
          <p className="text-xs text-[#566583]/70">
            Select this block and add images from the property panel
          </p>
        </div>
      </section>
    );
  }

  const currentCols = viewport === "mobile"
    ? 1
    : (viewport === "tablet" ? 2 : 3);

  return (
    <section className="w-full border border-[#dbe3ef] shadow-sm" style={toReactStyle(component.styles)}>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${currentCols}, minmax(0, 1fr))` }}>
        {images.map((image, index) => {
          const displaySrc = getDisplaySrc(image);
          return (
            <figure className="overflow-hidden rounded-lg border border-[#dbe3ef] bg-[#f7f9fc]" key={`${image.src}-${index}`}>
              <div className="relative h-[170px] w-full">
                {displaySrc ? (
                  <Image
                    alt={image.caption || "Website image"}
                    className="object-cover"
                    fill
                    sizes="(min-width: 768px) 280px, 100vw"
                    src={displaySrc}
                    unoptimized
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#eef4fb]">
                    <ImageIcon className="h-8 w-8 text-[#0B1D40]/20" />
                  </div>
                )}
              </div>
              {image.caption && (
                <InlineText componentId={component.id} textKey={`gallery.${index}.caption`} textLabel={`Gallery caption ${index + 1}`} as="figcaption" value={image.caption} onSave={(v) => saveCaption(index, v)} className="px-4 py-3 text-sm font-bold" style={getTargetTextStyles(component, `gallery.${index}.caption`, textStyle)} />
              )}
            </figure>
          );
        })}
      </div>
    </section>
  );
}

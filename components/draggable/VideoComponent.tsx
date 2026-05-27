"use client";

import { Play } from "lucide-react";
import { readVideo } from "@/components/blocks/video/spec";
import { toReactStyle } from "@/components/draggable/componentStyles";
import type { RendererProps } from "@/lib/blockRegistry";

/** Converts a raw YouTube / Vimeo URL to the corresponding embed URL. */
function getEmbedUrl(url: string): string | null {
  if (!url.trim()) return null;
  if (url.includes("/embed/") || url.includes("player.vimeo.com/video/")) return url;

  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0`;

  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;

  return null;
}

const PADDING: Record<string, string> = {
  "16/9": "56.25%",
  "4/3": "75%",
  "1/1": "100%",
};

export default function VideoComponent({ component }: RendererProps) {
  const data = readVideo(component);
  const embedUrl = getEmbedUrl(data.url);
  const paddingTop = PADDING[data.aspectRatio ?? "16/9"] ?? "56.25%";

  return (
    <section className="w-full overflow-hidden" style={toReactStyle(component.styles)}>
      <div className="relative w-full" style={{ paddingTop }}>
        {embedUrl ? (
          <iframe
            title={data.title || "Video"}
            src={embedUrl}
            className="absolute inset-0 h-full w-full rounded-lg border-0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-[#dbe3ef] bg-[#f7f9fc]">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eef4fb] text-[#0B1D40]">
              <Play className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-[#0B1D40]">Add a video</p>
              <p className="mt-1 text-xs text-[#566583]">Paste a YouTube or Vimeo URL in the settings panel</p>
            </div>
          </div>
        )}
      </div>
      {data.title && (
        <p className="mt-3 text-center text-sm font-bold text-[#0B1D40]">{data.title}</p>
      )}
    </section>
  );
}

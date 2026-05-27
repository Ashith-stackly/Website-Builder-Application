"use client";

import { ContentField } from "@/components/builder/PanelFields";
import type { PanelProps } from "@/lib/blockRegistry";
import type { VideoProps } from "@/types/builder";

export function VideoPanel({ data, setProp }: PanelProps<VideoProps>) {
  return (
    <div className="space-y-4">
      <ContentField
        label="YouTube or Vimeo URL"
        value={data.url}
        onChange={(v) => setProp("url", v)}
        placeholder="https://youtube.com/watch?v=..."
      />
      <ContentField
        label="Caption (optional)"
        value={data.title ?? ""}
        onChange={(v) => setProp("title", v)}
        placeholder="Video title or caption"
      />
      <div>
        <span className="mb-2 block text-[13px] font-bold text-[#0B1D40]">Aspect Ratio</span>
        <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-[#0B1D40]">
          {(["16/9", "4/3", "1/1"] as const).map((ratio) => (
            <button
              key={ratio}
              type="button"
              className={`py-2 text-xs font-bold transition ${(data.aspectRatio ?? "16/9") === ratio ? "bg-[#0B1D40] text-white" : "text-[#0B1D40] hover:bg-black/5"}`}
              onClick={() => setProp("aspectRatio", ratio)}
            >
              {ratio}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

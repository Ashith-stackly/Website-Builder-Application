/**
 * Video — block spec.
 *
 * Supports YouTube and Vimeo embed URLs.
 * Legacy fallback: `content` string is treated as the raw video URL.
 */

import type { BlockSpec } from "@/lib/blockRegistry";
import type { BuilderComponent, VideoProps } from "@/types/builder";
import VideoComponent from "@/components/draggable/VideoComponent";
import { VideoPanel } from "./VideoPanel";
import { escapeHtml } from "@/lib/htmlUtils";
import { Play } from "lucide-react";

export const videoDefaults: VideoProps = {
  url: "",
  title: "",
  aspectRatio: "16/9",
};

/* ─── reader ────────────────────────────────────────────────────────── */

export function readVideo(component: BuilderComponent): VideoProps {
  const p = component.props;

  if (p && typeof p === "object") {
    return {
      url: typeof p.url === "string" ? p.url : "",
      title: typeof p.title === "string" ? p.title : "",
      aspectRatio:
        p.aspectRatio === "16/9" || p.aspectRatio === "4/3" || p.aspectRatio === "1/1"
          ? p.aspectRatio
          : "16/9",
    };
  }

  return { url: component.content || "", title: "", aspectRatio: "16/9" };
}

/* ─── BlockSpec ──────────────────────────────────────────────────────── */

export const videoSpec: BlockSpec<VideoProps> = {
  type: "video",
  label: "Video",
  group: "media",
  icon: Play,
  defaults: videoDefaults,
  read: readVideo,
  Renderer: VideoComponent,
  Panel: VideoPanel,
  exportHtml: (data, styleAttr) => {
    if (!data.url) {
      return `<div${styleAttr} style="padding:24px;border:2px dashed #dbe3ef;border-radius:8px;text-align:center"><p>Video placeholder</p></div>`;
    }

    const yt = data.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const vm = data.url.match(/vimeo\.com\/(\d+)/);
    const embedUrl = yt
      ? `https://www.youtube.com/embed/${yt[1]}`
      : vm
        ? `https://player.vimeo.com/video/${vm[1]}`
        : data.url;

    const caption = data.title
      ? `<p style="margin:12px 0 0;font-weight:700;text-align:center">${escapeHtml(data.title)}</p>`
      : "";

    return `<div${styleAttr}><div style="position:relative;padding-top:56.25%"><iframe src="${escapeHtml(embedUrl)}" title="${escapeHtml(data.title || "Video")}" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:8px"></iframe></div>${caption}</div>`;
  },
  ai: {
    description: "An embedded video block supporting YouTube and Vimeo URLs with configurable aspect ratio.",
    exampleOutput: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Product Demo", aspectRatio: "16/9" },
  },
};

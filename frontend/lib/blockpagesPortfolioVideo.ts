export const PORTFOLIO_WATCH_VIDEO_TARGET = "video_block";

function escapeAttr(value: string) {
  return typeof CSS !== "undefined" && "escape" in CSS ? CSS.escape(value) : value.replace(/"/g, '\\"');
}

export function findPortfolioVideoSlot(scope: ParentNode, videoId = PORTFOLIO_WATCH_VIDEO_TARGET): HTMLElement | null {
  const escaped = escapeAttr(videoId);
  return (
    scope.querySelector<HTMLElement>(`[data-blockpages-video-slot="true"][data-blockpages-video-id="${escaped}"]`) ??
    scope.querySelector<HTMLElement>(`[data-blockpages-video-id="${escaped}"]`)
  );
}

/** Play the portfolio showreel video (upload or embed) within a template root. */
export function playPortfolioBlockpagesVideo(scope: ParentNode, videoId = PORTFOLIO_WATCH_VIDEO_TARGET) {
  const slot = findPortfolioVideoSlot(scope, videoId);
  if (!slot) return;

  slot.scrollIntoView({ behavior: "smooth", block: "center" });

  const video = slot.querySelector<HTMLVideoElement>("video");
  if (video) {
    video.controls = true;
    void video.play().catch(() => {});
    return;
  }

  const iframe = slot.querySelector<HTMLIFrameElement>("iframe");
  if (!iframe?.src) return;

  try {
    const url = new URL(iframe.src, window.location.href);
    if (url.hostname.includes("youtube.com") || url.hostname.includes("youtu.be")) {
      url.searchParams.set("autoplay", "1");
      url.searchParams.set("mute", "0");
    }
    if (iframe.src !== url.toString()) {
      iframe.src = url.toString();
    }
  } catch {
    // Keep existing embed URL when parsing fails.
  }
}

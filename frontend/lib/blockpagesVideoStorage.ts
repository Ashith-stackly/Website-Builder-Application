import type { VideoBlockData, VideoBlockProps } from "@/app/blockpages/videoblock/types";
import type { BlockpagesTemplateId } from "./blockpagesTemplates";
import { assetPath } from "@/lib/paths";

const LEGACY_PORTFOLIO_KEY = "portfolioVideoData";

/** Bundled sample showreel used until the user uploads/embeds their own. */
export const DEFAULT_PORTFOLIO_VIDEO_SRC = "/portfolio-showreel.mp4";

export const DEFAULT_PORTFOLIO_VIDEO_PROPS: VideoBlockProps = {
  sourceType: "upload",
  uploadUrl: DEFAULT_PORTFOLIO_VIDEO_SRC,
  uploadFileName: "portfolio-showreel.mp4",
  uploadFileSize: "1.1 MB",
  autoplay: false,
  loop: false,
  muted: false,
  showControls: true,
};

export function resolveVideoMediaUrl(url?: string) {
  if (!url) return "";
  if (/^(https?:|blob:|data:)/i.test(url)) return url;
  return assetPath(url);
}

export function hasPlayableVideoProps(props: VideoBlockProps | null | undefined): props is VideoBlockProps {
  if (!props) return false;
  if (props.sourceType === "upload" && Boolean(props.uploadUrl?.trim())) return true;
  if (props.sourceType === "embed" && Boolean(props.embedCode?.trim())) return true;
  return false;
}

export function getDefaultPortfolioVideoProps(): VideoBlockProps {
  return {
    ...DEFAULT_PORTFOLIO_VIDEO_PROPS,
    uploadUrl: resolveVideoMediaUrl(DEFAULT_PORTFOLIO_VIDEO_SRC),
  };
}

/** Normalize stored/editor props; fall back to the sample showreel when empty. */
export function normalizePortfolioVideoProps(props: VideoBlockProps | null | undefined): VideoBlockProps {
  if (!hasPlayableVideoProps(props)) {
    return getDefaultPortfolioVideoProps();
  }
  if (props.sourceType === "upload" && props.uploadUrl) {
    return {
      ...props,
      uploadUrl: resolveVideoMediaUrl(props.uploadUrl),
    };
  }
  return props;
}

/** Map template slot ids (e.g. video_block) to editor video block state. */
export function resolveVideoBlockPropsForSlot(
  slotVideoId: string,
  blocks: VideoBlockData[]
): VideoBlockProps | null {
  const direct = blocks.find((block) => block.id === slotVideoId);
  if (direct) return normalizePortfolioVideoProps(direct.props);
  if (slotVideoId === "video_block" && blocks[0]) {
    return normalizePortfolioVideoProps(blocks[0].props);
  }
  if (blocks[0]) return normalizePortfolioVideoProps(blocks[0].props);
  return getDefaultPortfolioVideoProps();
}

const APPLIED_PREFIX = "stackly-blockpages-video-applied-";
const PROPS_PREFIX = "stackly-blockpages-video-props-";

function propsKey(template: BlockpagesTemplateId) {
  return `${PROPS_PREFIX}${template}`;
}

function appliedKey(template: BlockpagesTemplateId) {
  return `${APPLIED_PREFIX}${template}`;
}

export function isBlockpagesVideoApplied(template: BlockpagesTemplateId): boolean {
  if (typeof window === "undefined") return false;

  if (template === "portfolio") {
    return Boolean(window.localStorage.getItem(LEGACY_PORTFOLIO_KEY));
  }

  return window.localStorage.getItem(appliedKey(template)) === "true";
}

export function loadBlockpagesVideoProps(template: BlockpagesTemplateId): VideoBlockProps | null {
  if (typeof window === "undefined") return null;

  const raw =
    template === "portfolio"
      ? window.localStorage.getItem(LEGACY_PORTFOLIO_KEY) ?? window.localStorage.getItem(propsKey(template))
      : window.localStorage.getItem(propsKey(template));

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as VideoBlockProps;
    // Migrate away from the old external sample URL that often fails to load.
    if (
      parsed.sourceType === "upload" &&
      typeof parsed.uploadUrl === "string" &&
      (parsed.uploadUrl.includes("cdn.pixabay.com") || !parsed.uploadUrl.trim())
    ) {
      return null;
    }
    return hasPlayableVideoProps(parsed) ? normalizePortfolioVideoProps(parsed) : null;
  } catch {
    return null;
  }
}

export function saveBlockpagesVideoProps(template: BlockpagesTemplateId, props: VideoBlockProps) {
  if (typeof window === "undefined") return;

  const toStore = hasPlayableVideoProps(props) ? props : DEFAULT_PORTFOLIO_VIDEO_PROPS;

  window.localStorage.setItem(propsKey(template), JSON.stringify(toStore));
  window.localStorage.setItem(appliedKey(template), "true");

  if (template === "portfolio") {
    window.localStorage.setItem(LEGACY_PORTFOLIO_KEY, JSON.stringify(toStore));
  }
}

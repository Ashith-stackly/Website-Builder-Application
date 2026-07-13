import type { VideoBlockProps } from "@/app/blockpages/videoblock/types";
import type { BlockpagesTemplateId } from "./blockpagesTemplates";

const LEGACY_PORTFOLIO_KEY = "portfolioVideoData";
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
    return JSON.parse(raw) as VideoBlockProps;
  } catch {
    return null;
  }
}

export function saveBlockpagesVideoProps(template: BlockpagesTemplateId, props: VideoBlockProps) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(propsKey(template), JSON.stringify(props));
  window.localStorage.setItem(appliedKey(template), "true");

  if (template === "portfolio") {
    window.localStorage.setItem(LEGACY_PORTFOLIO_KEY, JSON.stringify(props));
  }
}

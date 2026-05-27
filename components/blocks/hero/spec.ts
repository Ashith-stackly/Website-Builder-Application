/**
 * Hero — block spec.
 *
 * Single source of truth for the `hero` block. Mirrors the
 * `feature-item` pattern; copy this file as the template for
 * future block migrations.
 *
 * Inline editing path: renderers should call `onPatch({ props: ... })`
 * (provided by `CanvasItem`) — never write the legacy `content` string.
 */

import type { BlockSpec } from "@/lib/blockRegistry";
import type { BuilderComponent, HeroProps } from "@/types/builder";
import HeroComponent from "@/components/draggable/HeroComponent";
import { HeroPanel } from "./HeroPanel";
import { escapeHtml } from "@/lib/htmlUtils";
import { LayoutTemplate } from "lucide-react";

export const HERO_SCHEMA_VERSION = 1;

export const heroDefaults: HeroProps = {
  schemaVersion: HERO_SCHEMA_VERSION,
  title: "Create a website in minutes",
  description: "Design, edit, and export a clean landing page without leaving the builder.",
  cta: { label: "Start Building" },
  layout: "split",
  align: "left",
  media: { type: "placeholder" },
};

/* ─── narrow validators (zero-dependency; swap for zod later) ───────── */

const isString = (v: unknown): v is string => typeof v === "string";
const asString = (v: unknown, fb: string) => (isString(v) ? v : fb);
const asOpt = <T extends string>(v: unknown, allowed: readonly T[]): T | undefined =>
  isString(v) && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;

const HERO_LAYOUTS = ["split", "centered", "stacked"] as const;
const HERO_ALIGNS = ["left", "center"] as const;
const MEDIA_TYPES = ["image", "placeholder"] as const;

function readCta(v: unknown): HeroProps["cta"] {
  if (v && typeof v === "object") {
    const obj = v as Record<string, unknown>;
    return {
      label: asString(obj.label, heroDefaults.cta.label),
      href: isString(obj.href) ? obj.href : undefined,
    };
  }
  // Tolerate legacy/AI shapes where someone sent just a string.
  if (isString(v)) return { label: v };
  return { ...heroDefaults.cta };
}

function readMedia(v: unknown): HeroProps["media"] {
  if (!v || typeof v !== "object") return heroDefaults.media;
  const obj = v as Record<string, unknown>;
  return {
    type: asOpt(obj.type, MEDIA_TYPES) ?? "placeholder",
    src: isString(obj.src) ? obj.src : undefined,
    alt: isString(obj.alt) ? obj.alt : undefined,
  };
}

/* ─── reader ────────────────────────────────────────────────────────── */

/**
 * Returns fully-typed HeroProps from a `BuilderComponent`.
 *
 * Resolution order:
 *   1. `component.props` (typed, current format)
 *   2. legacy pipe-delimited `content` ("title|description|cta")
 *   3. spec defaults
 *
 * The reader is **total**: it always returns a valid `HeroProps`,
 * never throws, never returns `undefined`. Renderers and the editor
 * can rely on every field being defined.
 */
export function readHero(component: BuilderComponent): Required<Pick<HeroProps, "title" | "description" | "cta" | "layout" | "align" | "media" | "schemaVersion">> {
  const p = component.props;

  if (p && typeof p === "object") {
    return {
      schemaVersion: typeof p.schemaVersion === "number" ? p.schemaVersion : HERO_SCHEMA_VERSION,
      title: asString(p.title, heroDefaults.title),
      description: asString(p.description, heroDefaults.description),
      cta: readCta(p.cta),
      layout: asOpt(p.layout, HERO_LAYOUTS) ?? heroDefaults.layout!,
      align: asOpt(p.align, HERO_ALIGNS) ?? heroDefaults.align!,
      media: readMedia(p.media)!,
    };
  }

  // Legacy fallback: "title|description|ctaLabel"
  const [t, d, c] = (component.content || "").split("|");
  return {
    schemaVersion: HERO_SCHEMA_VERSION,
    title: t || heroDefaults.title,
    description: d || heroDefaults.description,
    cta: { label: c || heroDefaults.cta.label },
    layout: heroDefaults.layout!,
    align: heroDefaults.align!,
    media: heroDefaults.media!,
  };
}

/* ─── BlockSpec ──────────────────────────────────────────────────────── */

export const heroSpec: BlockSpec<HeroProps> = {
  type: "hero",
  label: "Hero",
  group: "content",
  icon: LayoutTemplate,
  defaults: heroDefaults,
  read: readHero,
  Renderer: HeroComponent,
  Panel: HeroPanel,
  exportHtml: (data, styleAttr) => {
    const href = data.cta.href ?? "#";
    const mediaHtml =
      data.media?.type === "image" && data.media.src
        ? `<img src="${escapeHtml(data.media.src)}" alt="${escapeHtml(data.media.alt ?? data.title)}" style="max-width:100%;height:auto;border-radius:12px;" />`
        : "";
    const textHtml =
      `<div class="hero-text">` +
      `<h1>${escapeHtml(data.title)}</h1>` +
      `<p>${escapeHtml(data.description)}</p>` +
      `<a href="${escapeHtml(href)}" role="button">${escapeHtml(data.cta.label)}</a>` +
      `</div>`;
    const inner =
      mediaHtml
        ? `<div class="hero-split">${textHtml}<div class="hero-media">${mediaHtml}</div></div>`
        : textHtml;
    return `<section${styleAttr}>${inner}</section>`;
  },
  ai: {
    description: "A full-width hero section with a bold headline, supporting description, and a call-to-action button.",
    exampleOutput: heroDefaults,
  },
};

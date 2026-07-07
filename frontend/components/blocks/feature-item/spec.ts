/**
 * Feature Item — block spec.
 *
 * This file is the **single source of truth** for the `feature-item` block:
 * - Default props for new instances
 * - Narrow runtime validator (no zod yet — easy to swap later)
 * - Reader that yields fully-typed props with safe fallbacks
 * - Legacy migration: parses old pipe-delimited `content` strings
 *
 * Pattern to copy for migrating other blocks (`hero`, `navigation`, ...):
 *   1. Define typed `*Props` in `types/builder.ts`
 *   2. Create this `spec.ts` with defaults + `read*` helper
 *   3. Renderer + PropertyEditor consume `read*(component)` only
 */

import type { BlockSpec } from "@/lib/blockRegistry";
import type { BuilderComponent, FeatureItemProps } from "@/types/builder";
import FeatureItemComponent from "@/components/draggable/FeatureItemComponent";
import { FeatureItemPanel } from "./FeatureItemPanel";
import { escapeHtml } from "@/lib/htmlUtils";
import { Star } from "lucide-react";

export const featureItemDefaults: FeatureItemProps = {
  icon: "Zap",
  layout: "horizontal",
  title: "Fast Performance",
  description: "Blazing fast setup with zero configuration needed.",
  cta: "",
};

/* ─── narrow validators ─────────────────────────────────────────────── */

const isLayout = (v: unknown): v is FeatureItemProps["layout"] =>
  v === "horizontal" || v === "card";

const asString = (v: unknown, fallback: string): string =>
  typeof v === "string" ? v : fallback;

/* ─── reader ────────────────────────────────────────────────────────── */

/**
 * Returns fully-typed FeatureItemProps from a `BuilderComponent`.
 *
 * Resolution order:
 *   1. If `component.props` is present and valid → use it.
 *   2. Else fall back to the legacy pipe-delimited `content` string.
 *   3. Else use the spec defaults.
 *
 * This guarantees safe rendering for any component instance — including
 * old documents created before the typed-props migration.
 */
export function readFeatureItem(component: BuilderComponent): FeatureItemProps {
  const p = component.props;

  if (p && typeof p === "object") {
    return {
      icon: asString(p.icon, featureItemDefaults.icon),
      layout: isLayout(p.layout) ? p.layout : featureItemDefaults.layout,
      title: asString(p.title, featureItemDefaults.title),
      description: asString(p.description, featureItemDefaults.description),
      cta: asString(p.cta, ""),
    };
  }

  // Legacy fallback: parse pipe-delimited `content`
  const parts = (component.content || "").split("|");
  return {
    icon: parts[0] || featureItemDefaults.icon,
    layout: parts[1] === "card" ? "card" : "horizontal",
    title: parts[2] || featureItemDefaults.title,
    description: parts[3] || featureItemDefaults.description,
    cta: parts[4] || "",
  };
}

/* ─── BlockSpec ──────────────────────────────────────────────────────── */

export const featureItemSpec: BlockSpec<FeatureItemProps> = {
  type: "feature-item",
  label: "Feature Item",
  group: "content",
  icon: Star,
  defaults: featureItemDefaults,
  read: readFeatureItem,
  Renderer: FeatureItemComponent,
  Panel: FeatureItemPanel,
  exportHtml: (data, styleAttr) => {
    const cta = data.cta
      ? `<a href="#" role="button">${escapeHtml(data.cta)}</a>`
      : "";
    return `<article${styleAttr}><h3>${escapeHtml(data.title)}</h3><p>${escapeHtml(data.description)}</p>${cta}</article>`;
  },
  ai: {
    description: "A single feature card with an icon, title, description, and optional CTA. Used inside a columns layout for feature grids.",
    exampleOutput: featureItemDefaults,
  },
};

/**
 * Features — block spec.
 *
 * Single source of truth for the `features` block. Replaces the old
 * newline+pipe `content` string with a typed `FeatureRecord[]` array.
 *
 * Legacy fallback: `readFeatures` parses the old
 *   "Title|Description\nTitle|Description\n..."
 * format so existing saved documents keep rendering without data migration.
 *
 * This is the first block in this codebase to introduce an
 * **array-of-objects** field (`items`). The pattern for the editor is:
 *   • updateItem(i, patch)  — patch a single field of one item
 *   • addItem()             — append a new item with defaults
 *   • removeItem(i)         — filter out by index
 * All three write via `onPatch({ props: { items: nextArray } })` so the
 * store shallow-merges only the `items` key.
 */

import type { BlockSpec } from "@/lib/blockRegistry";
import type { BuilderComponent, FeatureRecord, FeaturesProps } from "@/types/builder";
import FeaturesComponent from "@/components/draggable/FeaturesComponent";
import { FeaturesPanel } from "./FeaturesPanel";
import { escapeHtml } from "@/lib/htmlUtils";
import { LayoutGrid } from "lucide-react";

export const FEATURES_SCHEMA_VERSION = 1;

export const featuresDefaults: FeaturesProps = {
  schemaVersion: FEATURES_SCHEMA_VERSION,
  items: [
    { title: "Fast setup",       description: "Drag ready-made sections into place" },
    { title: "Responsive layout", description: "Build pages that export cleanly" },
    { title: "Easy editing",     description: "Update content and styling from the sidebar" },
  ],
  layout: "grid",
  columns: 3,
};

/* ─── narrow validators ─────────────────────────────────────────────── */

const isString = (v: unknown): v is string => typeof v === "string";
const asString = (v: unknown, fb: string): string => (isString(v) ? v : fb);

/**
 * Coerce one raw value into a `FeatureRecord`.
 *
 * Accepted shapes:
 *   • `{ title, description, icon?, badge? }` — typed object (current)
 *   • `"Title|Description"` — bare pipe string (AI / legacy per-item)
 */
function readFeatureRecord(v: unknown): FeatureRecord {
  if (v && typeof v === "object") {
    const obj = v as Record<string, unknown>;
    const record: FeatureRecord = {
      title: asString(obj.title, "Feature"),
      description: asString(obj.description, ""),
    };
    if (isString(obj.icon)) record.icon = obj.icon;
    if (isString(obj.badge)) record.badge = obj.badge;
    return record;
  }
  if (isString(v)) {
    const [title, description] = v.split("|");
    return { title: title?.trim() || "Feature", description: description?.trim() || "" };
  }
  return { title: "Feature", description: "" };
}

function readItems(v: unknown): FeatureRecord[] {
  if (Array.isArray(v) && v.length > 0) return v.map(readFeatureRecord);
  return featuresDefaults.items.map((item) => ({ ...item }));
}

const FEATURES_LAYOUTS = ["grid", "list", "masonry"] as const;
const FEATURES_COLUMNS = [2, 3, 4] as const;

/* ─── reader ────────────────────────────────────────────────────────── */

/**
 * Returns fully-typed FeaturesProps from a `BuilderComponent`.
 *
 * Resolution order:
 *   1. `component.props` (typed, current format)
 *   2. legacy newline+pipe `content` ("Title|Desc\nTitle|Desc")
 *   3. spec defaults
 *
 * The reader is **total**: always returns a valid `FeaturesProps`,
 * never throws, never returns `undefined`.
 */
export function readFeatures(component: BuilderComponent): Required<
  Pick<FeaturesProps, "schemaVersion" | "items" | "layout" | "columns">
> &
  Pick<FeaturesProps, "heading"> {
  const p = component.props;

  if (p && typeof p === "object") {
    return {
      schemaVersion: typeof p.schemaVersion === "number" ? p.schemaVersion : FEATURES_SCHEMA_VERSION,
      heading: isString(p.heading) ? p.heading : undefined,
      items: readItems(p.items),
      layout:
        isString(p.layout) && (FEATURES_LAYOUTS as readonly string[]).includes(p.layout)
          ? (p.layout as NonNullable<FeaturesProps["layout"]>)
          : featuresDefaults.layout!,
      columns:
        typeof p.columns === "number" && (FEATURES_COLUMNS as readonly number[]).includes(p.columns)
          ? (p.columns as NonNullable<FeaturesProps["columns"]>)
          : featuresDefaults.columns!,
    };
  }

  // Legacy fallback: "Title|Description\nTitle|Description\n..."
  const legacyItems: FeatureRecord[] = (component.content || "")
    .split("\n")
    .map((line) => line.split("|"))
    .filter(([title]) => title?.trim())
    .map(([title, description]) => ({
      title: title.trim(),
      description: (description ?? "").trim(),
    }));

  return {
    schemaVersion: FEATURES_SCHEMA_VERSION,
    heading: undefined,
    items: legacyItems.length > 0 ? legacyItems : featuresDefaults.items.map((item) => ({ ...item })),
    layout: featuresDefaults.layout!,
    columns: featuresDefaults.columns!,
  };
}

/* ─── BlockSpec ──────────────────────────────────────────────────────── */

export const featuresSpec: BlockSpec<FeaturesProps> = {
  type: "features",
  label: "Features",
  group: "content",
  icon: LayoutGrid,
  defaults: featuresDefaults,
  read: readFeatures,
  Renderer: FeaturesComponent,
  Panel: FeaturesPanel,
  exportHtml: (data, styleAttr) => {
    const heading = data.heading
      ? `<h2>${escapeHtml(data.heading)}</h2>`
      : "";
    const cards = data.items
      .map(({ title, description }) => `<article><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p></article>`)
      .join("");
    return `<section${styleAttr}>${heading}${cards}</section>`;
  },
  ai: {
    description: "A features grid section containing an array of titled cards, each with a title and description. Optional heading above the grid.",
    exampleOutput: featuresDefaults,
  },
};

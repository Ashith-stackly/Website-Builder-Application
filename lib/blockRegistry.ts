"use client";

/**
 * BlockSpec registry — single source of truth for every migrated block.
 *
 * Architecture:
 * - `BlockSpec<P>` is the contract each migrated block must fulfill.
 * - `blockRegistry` is a Partial map so unmigrated blocks return `undefined`
 *   and callers (PropertyEditor, exportHtml) fall through to legacy paths.
 * - Individual spec objects are fully typed at their declaration site (`P`
 *   is concrete there). The registry stores `BlockSpec<any>` to allow a
 *   heterogeneous collection without a discriminated union.
 *
 * Extension points in BlockSpec:
 * - `accepts`    → slot/container behaviour (future nested blocks)
 * - `ai`         → LLM prompt + example output for AI generation
 * - `group`      → palette grouping
 * - `icon`       → palette icon (Lucide component)
 *
 * Adding a new block = one new spec.ts + Panel + register here.
 * Zero other files need to change.
 */

import type React from "react";
import type { BuilderComponent, ComponentType } from "@/types/builder";
import { heroSpec }        from "@/components/blocks/hero/spec";
import { navigationSpec }  from "@/components/blocks/navigation/spec";
import { featureItemSpec } from "@/components/blocks/feature-item/spec";
import { contactSpec }     from "@/components/blocks/contact/spec";
import { featuresSpec }    from "@/components/blocks/features/spec";
import { videoSpec }       from "@/components/blocks/video/spec";

/* ─── Renderer props ─────────────────────────────────────────────────
   Mirrors BuilderRenderer in componentRegistry.ts — kept here so
   Panel files can import a single type without touching the old file.
   ─────────────────────────────────────────────────────────────────── */
export interface RendererProps {
  component: BuilderComponent;
  children?: React.ReactNode;
  isEditing?: boolean;
  /** Legacy: write back the pipe-delimited `content` string. */
  onUpdate?: (content: string | null) => void;
  /** Typed: write a structured `Partial<BuilderComponent>` patch. */
  onPatch?: (patch: Partial<BuilderComponent>) => void;
}

/* ─── Panel props ────────────────────────────────────────────────────
   Each Panel component receives pre-read, typed data and a pre-bound
   `setProp` that calls `updateComponent` for this specific block.
   Panels never receive `component.id` or the raw store — only typed
   data + typed setters. This decouples the panel UI from storage.
   ─────────────────────────────────────────────────────────────────── */
export interface PanelProps<P> {
  /** Pre-read, fully typed component props from `spec.read(component)`. */
  data: P;
  /**
   * Type-checked setter for one top-level prop key.
   * The store shallow-merges `props`, so this patches a single field
   * without clobbering siblings.
   */
  setProp: <K extends keyof P & string>(key: K, value: P[K]) => void;
}

/* ─── BlockSpec ──────────────────────────────────────────────────────
   The full contract for a registered block. `P` is the typed props
   interface for this block (e.g. HeroProps, NavigationProps, …).
   ─────────────────────────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface BlockSpec<P = Record<string, any>> {
  type: ComponentType;

  /* ── Identity ──────────────────────────────────────────────────── */
  label: string;
  group: "layout" | "content" | "media" | "form" | "navigation";
  /** Lucide icon component for the palette and layer panel. */
  icon: React.ComponentType<{ size?: number; className?: string }>;

  /* ── Schema ────────────────────────────────────────────────────── */
  defaults: P;
  /**
   * Total reader: always returns a valid `P`, never throws.
   * Handles typed `props`, legacy `content` strings, and spec defaults
   * — in that resolution order.
   */
  read: (component: BuilderComponent) => P;

  /* ── Canvas renderer ───────────────────────────────────────────── */
  Renderer: React.ComponentType<RendererProps>;

  /* ── Property panel ────────────────────────────────────────────── */
  Panel: React.ComponentType<PanelProps<P>>;

  /* ── HTML export ───────────────────────────────────────────────── */
  /**
   * Receives pre-read typed `data` and a pre-formatted `styleAttr`
   * string (e.g. ` style="color:#fff;padding:12px"`).
   * Returns a self-contained HTML string for the exported document.
   */
  exportHtml: (data: P, styleAttr: string) => string;

  /* ── Container behaviour (future) ──────────────────────────────── */
  /**
   * Which child block types this block accepts as direct children.
   * `"none"` = leaf block (default).
   * `"any"`  = generic container.
   * `string[]` = slot-typed container.
   */
  accepts?: ComponentType[] | "any" | "none";

  /* ── AI generation hints (future) ──────────────────────────────── */
  ai?: {
    /** Plain-English description of the block for LLM system prompts. */
    description: string;
    /**
     * A concrete example of the block's props in the AI's output schema.
     * Used to build structured-output tool definitions (e.g. Zod, JSON Schema).
     */
    exampleOutput: P;
  };
}

/* ─── Registry ───────────────────────────────────────────────────────
   Partial so unmigrated blocks return `undefined`.
   Callers should always guard: `const spec = blockRegistry[type]; if (spec) { … }`

   Each entry is keyed by ComponentType and typed as BlockSpec<any> to
   allow a heterogeneous collection. Individual spec objects are fully
   typed at their declaration site, so type safety is not lost — only
   the registry access loses the generic parameter, which is intentional.
   ─────────────────────────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const blockRegistry: Partial<Record<ComponentType, BlockSpec<any>>> = {
  hero:           heroSpec,
  navigation:     navigationSpec,
  "feature-item": featureItemSpec,
  contact:        contactSpec,
  features:       featuresSpec,
  video:          videoSpec,
};

import type { BuilderComponent } from "@/types/builder";
import {
  FREEFORM_DEFAULT_WIDTH,
  FREEFORM_DESIGN_WIDTH,
  FREEFORM_MIN_HEIGHT,
  FREEFORM_MIN_WIDTH,
  getFreeformDefaultHeight,
} from "@/lib/freeformLayout";

/**
 * Export layout is deliberately optional: old projects and callers continue to
 * produce the established flow document until they explicitly opt into the
 * freeform canvas mode.
 */
export type HtmlExportCanvasMode = "flow" | "freeform";

export interface HtmlExportLayoutOptions {
  canvasMode?: HtmlExportCanvasMode;
}

export interface FreeformExportGeometry {
  x: number;
  y: number;
  width: number;
  height?: number;
  zIndex: number;
}

const DEFAULT_X = 40;
const DEFAULT_Y = 40;
const DEFAULT_WIDTH = FREEFORM_DEFAULT_WIDTH;
const MAX_COORDINATE = 20_000;
const MAX_SIZE = 20_000;
const MAX_LAYER = 9_999;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const finiteNumber = (value: unknown, fallback: number, min: number, max: number) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return clamp(Math.round(value), min, max);
};

const optionalFiniteNumber = (value: unknown, min: number, max: number) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return clamp(Math.round(value), min, max);
};

const styleLayer = (value: unknown) => {
  if (typeof value !== "string" || !/^-?\d+(?:\.\d+)?$/.test(value.trim())) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const cssNumber = (value: number) => `${Math.round(value * 100) / 100}px`;

const fallbackIndex = (index: number) =>
  Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;

export const isFreeformHtmlExport = (options?: HtmlExportLayoutOptions) =>
  options?.canvasMode === "freeform";

/** A stable, CSS-safe class for an exported top-level freeform item. */
export const freeformItemClassName = (id: string) => {
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "-") || "component";
  return `stackly-freeform-${safeId}`;
};

/**
 * Coerce persisted freeform metadata into finite, bounded pixel values before
 * it is interpolated into the exported document. This also makes old or
 * partially populated projects render predictably.
 */
export const resolveFreeformExportGeometry = (
  component: BuilderComponent,
  index = 0,
): FreeformExportGeometry => {
  const safeIndex = fallbackIndex(index);
  const storedStyleLayer = styleLayer(component.styles?.zIndex);
  const componentLayer = optionalFiniteNumber(component.zIndex, 0, MAX_LAYER);

  return {
    // Imported/manual Freeform JSON can legitimately lack coordinates. Keep
    // those items visibly staggered instead of placing every legacy item at
    // the same origin. Normal mode switches materialize their own frames.
    x: finiteNumber(component.position?.x, DEFAULT_X + (safeIndex % 5) * 24, 0, MAX_COORDINATE),
    y: finiteNumber(component.position?.y, DEFAULT_Y + safeIndex * 36, 0, MAX_COORDINATE),
    width: finiteNumber(component.freeformSize?.width, DEFAULT_WIDTH, FREEFORM_MIN_WIDTH, MAX_SIZE),
    height: optionalFiniteNumber(component.freeformSize?.height, FREEFORM_MIN_HEIGHT, MAX_SIZE),
    // Layer controls update styles.zIndex; retain the legacy numeric field as
    // a fallback for already-saved projects that predate that control.
    zIndex: finiteNumber(storedStyleLayer ?? componentLayer, 1, 0, MAX_LAYER),
  };
};

/**
 * The FreeformCanvas has a 1280px desktop design surface. Tablet/mobile rules
 * scale explicitly resized frames down from that surface while keeping the
 * item within the exported page's content bounds. Moved-only legacy blocks
 * keep their top coordinate: their height is content-driven, so scaling their
 * Y position can make an otherwise safe page overlap at a narrow breakpoint.
 */
export const buildFreeformResponsiveCss = (components: BuilderComponent[]) => {
  const visibleComponents = components.filter((component) => !component.hidden);

  const rulesForScale = (scale: number) =>
    visibleComponents.map((component, index) => {
      const geometry = resolveFreeformExportGeometry(component, index);
      // A FreeformItem only has a fixed visual height after a user resize.
      // Keep content-sized items on their persisted vertical track instead of
      // guessing at their mobile height in a static export.
      if (geometry.height === undefined) return "";
      const width = geometry.width * scale;
      const height = geometry.height * scale;
      const className = freeformItemClassName(component.id);

      return `        .${className} { left:clamp(0px,${cssNumber(geometry.x * scale)},calc(100% - min(${cssNumber(width)},100%))); top:${cssNumber(geometry.y * scale)}; width:min(${cssNumber(width)},100%); height:${cssNumber(height)}; }`;
    }).filter(Boolean);

  const tabletRules = rulesForScale(768 / FREEFORM_DESIGN_WIDTH);
  const mobileRules = rulesForScale(390 / FREEFORM_DESIGN_WIDTH);

  return `
      /* Freeform canvas export. Geometry is data-driven, bounded and scoped to root items. */
      main.stackly-freeform-canvas { display:block; width:min(1280px,calc(100% - 32px)); min-height:var(--stackly-freeform-min-height, 900px); }
      .stackly-freeform-item { position:absolute; left:clamp(0px,var(--stackly-freeform-x),calc(100% - min(var(--stackly-freeform-width),100%))); top:var(--stackly-freeform-y); width:min(var(--stackly-freeform-width),100%); height:var(--stackly-freeform-height,auto); max-width:100%; overflow:hidden; }
      .stackly-freeform-item > * { min-width:0; max-width:100%; }
      @media (max-width: 768px) {
${tabletRules.join("\n")}
      }
      @media (max-width: 390px) {
${mobileRules.join("\n")}
      }
    `;
};

/** Minimum page height needed to keep the lowest freeform item reachable. */
export const getFreeformCanvasMinHeight = (components: BuilderComponent[]) =>
  components.reduce((height, component, index) => {
    if (component.hidden) return height;
    const geometry = resolveFreeformExportGeometry(component, index);
    return Math.max(height, geometry.y + (geometry.height ?? getFreeformDefaultHeight(component.type)) + 80);
  }, 900);

/** Wrap only root components; nested children retain their existing flow layout. */
export const wrapFreeformExportComponent = (
  component: BuilderComponent,
  html: string,
  index = 0,
) => {
  if (!html) return html;
  const geometry = resolveFreeformExportGeometry(component, index);
  const height = geometry.height === undefined ? "" : `--stackly-freeform-height:${geometry.height}px;`;

  return `<div class="stackly-freeform-item ${freeformItemClassName(component.id)}" data-stackly-freeform="true" style="--stackly-freeform-x:${geometry.x}px;--stackly-freeform-y:${geometry.y}px;--stackly-freeform-width:${geometry.width}px;${height}z-index:${geometry.zIndex};">${html}</div>`;
};

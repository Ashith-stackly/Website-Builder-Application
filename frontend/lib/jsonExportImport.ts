/**
 * JSON export/import utilities for the Stackly builder.
 *
 * Provides standalone file-based JSON persistence independent of the
 * backend API (which handles autosave / project load). Users can
 * export their work as a `.json` file and re-import it later.
 */

import { v4 as uuidv4 } from "uuid";
import type { BuilderComponent, ComponentType } from "@/types/builder";
import type { SEOMetadata } from "@/types/builder";

/* ─── Valid component types (for validation) ──────────────────────────── */

const VALID_TYPES: ReadonlySet<string> = new Set<ComponentType>([
  "navigation", "hero", "heading", "text", "button", "icon", "feature-item",
  "columns", "image", "input", "divider", "features", "gallery", "contact",
  "container", "video", "map", "accordion", "tabs", "spacer", "social-links",
  "countdown", "pricing-table", "testimonial", "footer", "form", "row",
]);

/* ─── Export schema ───────────────────────────────────────────────────── */

export interface ProjectJSON {
  _stacklyVersion: 1;
  exportedAt: string;
  components: BuilderComponent[];
  designTokens?: {
    colors: { primary: string; secondary: string; accent: string; background: string; text: string };
    typography: { fontFamily: string; baseFontSize: string; headingScale: number };
    buttons: { borderRadius: string; fontWeight: string };
    spacing: { base: number };
  };
  seo?: SEOMetadata;
  canvasMode?: "flow" | "freeform";
  projectName?: string;
}

/* ─── Export ──────────────────────────────────────────────────────────── */

export function buildProjectJSON(
  components: BuilderComponent[],
  designTokens?: ProjectJSON["designTokens"],
  seo?: SEOMetadata,
  canvasMode?: "flow" | "freeform",
  projectName?: string,
): ProjectJSON {
  return {
    _stacklyVersion: 1,
    exportedAt: new Date().toISOString(),
    components,
    designTokens,
    seo,
    canvasMode,
    projectName,
  };
}

export function downloadProjectJSON(data: ProjectJSON, filename = "stackly-project.json") {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/* ─── Import & Validation ─────────────────────────────────────────────── */

export interface ParseResult {
  components: BuilderComponent[];
  designTokens?: ProjectJSON["designTokens"];
  seo?: SEOMetadata;
  canvasMode?: "flow" | "freeform";
  projectName?: string;
}

/**
 * Parse and validate a JSON string as a Stackly project.
 * Throws a descriptive error string if the JSON is invalid.
 */
export function parseProjectJSON(jsonString: string): ParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error("Invalid JSON: the file could not be parsed.");
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Invalid format: expected a JSON object.");
  }

  const obj = parsed as Record<string, unknown>;

  // Accept both wrapped format { _stacklyVersion, components } and raw array
  let components: unknown[];
  if (Array.isArray(obj.components)) {
    components = obj.components;
  } else if (Array.isArray(obj.sections)) {
    // Legacy format compatibility
    components = obj.sections;
  } else {
    throw new Error("Invalid format: no 'components' array found in the JSON.");
  }

  if (components.length === 0) {
    throw new Error("The imported project has no components.");
  }

  // Validate and sanitize the component tree
  const validated = validateComponentTree(components);

  return {
    components: validated,
    designTokens: isDesignTokens(obj.designTokens) ? obj.designTokens : undefined,
    seo: isSEO(obj.seo) ? obj.seo : undefined,
    canvasMode: obj.canvasMode === "flow" || obj.canvasMode === "freeform" ? obj.canvasMode : undefined,
    projectName: typeof obj.projectName === "string" ? obj.projectName : undefined,
  };
}

/* ─── Component tree validation ───────────────────────────────────────── */

const MAX_DEPTH = 20;

function validateComponentTree(components: unknown[], depth = 0): BuilderComponent[] {
  if (depth > MAX_DEPTH) {
    throw new Error(`Component nesting exceeds maximum depth of ${MAX_DEPTH}.`);
  }

  const seenIds = new Set<string>();
  const validated: BuilderComponent[] = [];

  for (const raw of components) {
    if (typeof raw !== "object" || raw === null) continue;
    const comp = raw as Record<string, unknown>;

    // Validate type
    const type = comp.type;
    if (typeof type !== "string" || !VALID_TYPES.has(type)) {
      continue; // Skip unknown component types silently
    }

    // Ensure unique id
    let id = typeof comp.id === "string" ? comp.id : uuidv4();
    if (seenIds.has(id)) {
      id = uuidv4();
    }
    seenIds.add(id);

    // Build validated component
    const component: BuilderComponent = {
      id,
      type: type as ComponentType,
      content: typeof comp.content === "string" ? comp.content : "",
      props: comp.props && typeof comp.props === "object" ? comp.props as Record<string, unknown> : undefined,
      styles: validateStyles(comp.styles),
      textStyles: comp.textStyles && typeof comp.textStyles === "object"
        ? comp.textStyles as Record<string, Record<string, string>>
        : undefined,
      children: Array.isArray(comp.children)
        ? validateComponentTree(comp.children, depth + 1)
        : [],
      order: typeof comp.order === "number" ? comp.order : validated.length,
      locked: typeof comp.locked === "boolean" ? comp.locked : undefined,
      hidden: typeof comp.hidden === "boolean" ? comp.hidden : undefined,
      position: isPosition(comp.position) ? comp.position : undefined,
      zIndex: typeof comp.zIndex === "number" ? comp.zIndex : undefined,
      freeformSize: isFreeformSize(comp.freeformSize) ? comp.freeformSize : undefined,
      responsiveStyles: isResponsiveStyles(comp.responsiveStyles) ? comp.responsiveStyles : undefined,
    };

    validated.push(component);
  }

  return validated;
}

function validateStyles(raw: unknown): BuilderComponent["styles"] {
  if (typeof raw !== "object" || raw === null) return {};
  const styles = raw as Record<string, unknown>;
  const clean: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(styles)) {
    if (typeof value === "string") {
      clean[key] = value;
    }
  }
  return clean as BuilderComponent["styles"];
}

function isPosition(val: unknown): val is { x: number; y: number } {
  return typeof val === "object" && val !== null && typeof (val as Record<string, unknown>).x === "number" && typeof (val as Record<string, unknown>).y === "number";
}

function isFreeformSize(val: unknown): val is { width: number; height: number } {
  return typeof val === "object" && val !== null && typeof (val as Record<string, unknown>).width === "number" && typeof (val as Record<string, unknown>).height === "number";
}

function isResponsiveStyles(val: unknown): val is BuilderComponent["responsiveStyles"] {
  return typeof val === "object" && val !== null;
}

function isDesignTokens(val: unknown): val is ProjectJSON["designTokens"] {
  if (typeof val !== "object" || val === null) return false;
  const obj = val as Record<string, unknown>;
  return typeof obj.colors === "object" && typeof obj.typography === "object";
}

function isSEO(val: unknown): val is SEOMetadata {
  if (typeof val !== "object" || val === null) return false;
  const obj = val as Record<string, unknown>;
  return typeof obj.title === "string";
}

/**
 * Trigger a file input dialog and return the selected file's text content.
 */
export function openJSONFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.style.display = "none";

    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    });

    input.addEventListener("cancel", () => resolve(null));

    document.body.appendChild(input);
    input.click();
    input.remove();
  });
}

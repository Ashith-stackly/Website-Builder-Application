/**
 * Centralized project-to-editor routing.
 *
 * Every place in the app that opens a project should call
 * `getProjectEditorRoute(project)` to get the correct URL.
 *
 * The route is determined ONLY from persisted project metadata
 * (`editorType`, `category`), NEVER from the project name.
 */

import { parseBlockpagesTemplate, type BlockpagesTemplateId } from "@/lib/blockpagesTemplates";

/**
 * Minimal project shape needed for routing.
 * Accepts both the `Project` (store type) and `ProjectApiProject` shapes.
 */
interface RoutableProject {
  id?: string;
  _id?: string;
  editorType?: "builder" | "ecommerce" | "blockpages" | string;
  category?: string;
  builderData?: { blockPagesData?: unknown } | Record<string, unknown> | null;
}

/**
 * Known blockpages category slugs (the template IDs).
 * Used to detect legacy projects that were created before the
 * 'blockpages' editorType existed but already have a recognisable
 * category slug or display name.
 */
const BLOCKPAGES_CATEGORY_SLUGS = new Set<string>([
  "portfolio",
  "ecommerce",
  "blog",
  "construction",
  "restaurant",
  "digital-marketing",
  "business",
  "blockpages",
]);

/** Display-name → slug mapping for legacy category values */
const CATEGORY_DISPLAY_TO_SLUG: Record<string, BlockpagesTemplateId> = {
  "portfolio": "portfolio",
  "e-commerce": "ecommerce",
  "blog": "blog",
  "construction": "construction",
  "restaurant": "restaurant",
  "digital-marketing": "digital-marketing",
  "business": "business",
};

function getProjectId(project: RoutableProject): string {
  return project.id || project._id || "";
}

/**
 * Resolve a project's category string to a blockpages template slug.
 * Returns null if the category doesn't map to a known blockpages template.
 */
function resolveBlockpagesTemplate(category: string | undefined): BlockpagesTemplateId | null {
  if (!category) return null;
  const lower = category.trim().toLowerCase();
  if (lower === "blockpages") return "ecommerce";

  // Use the comprehensive alias parser
  const parsed = parseBlockpagesTemplate(lower);
  if (parsed) return parsed;

  return null;
}

/**
 * Determine the correct editor route for a project based on its
 * persisted metadata. Never uses the project name.
 */
export function getProjectEditorRoute(project: RoutableProject): string {
  const id = getProjectId(project);
  const editorType = project.editorType || "";
  const category = project.category || "";

  // ── 1. Explicit builder editor ────────────────────────────────────
  if (editorType === "builder") {
    return `/builder?projectId=${id}`;
  }

  // ── 2. Explicit ecommerce editor ──────────────────────────────────
  if (editorType === "ecommerce") {
    return `/e-commerce?projectId=${id}`;
  }

  // Extract saved blockPagesData template if present
  const blockPagesData = project.builderData && typeof project.builderData === "object" && "blockPagesData" in project.builderData
    ? (project.builderData as { blockPagesData?: { template?: string } }).blockPagesData
    : null;
  const savedTemplate = blockPagesData && typeof blockPagesData.template === "string"
    ? parseBlockpagesTemplate(blockPagesData.template)
    : null;

  const tpl = savedTemplate || resolveBlockpagesTemplate(category) || "ecommerce";

  // ── 3. Explicit blockpages editor ─────────────────────────────────
  if (editorType === "blockpages") {
    return `/blockpages?projectId=${id}&template=${encodeURIComponent(tpl)}`;
  }

  // ── 4. Legacy detection: project has blockpages builder data ──────
  if (blockPagesData) {
    return `/blockpages?projectId=${id}&template=${encodeURIComponent(tpl)}`;
  }

  // ── 5. Default: builder ───────────────────────────────────────────
  return `/builder?projectId=${id}`;
}

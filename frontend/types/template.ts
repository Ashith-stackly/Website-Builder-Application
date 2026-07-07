import type { BuilderComponent, SEOMetadata } from "@/types/builder";
import type { DesignTokens } from "@/store/designStore";

// ── Template Categories ────────────────────────────────────────────────

/** Supported template categories */
export type TemplateCategory =
  | "All"
  | "Portfolio"
  | "Blog"
  | "E-Commerce"
  | "Restaurant"
  | "Construction";

export const TEMPLATE_CATEGORIES: readonly TemplateCategory[] = [
  "All",
  "Portfolio",
  "Blog",
  "E-Commerce",
  "Restaurant",
  "Construction",
] as const;

// ── Template Types ─────────────────────────────────────────────────────

/** Template builder data — same shape as Project.builderData */
export interface TemplateBuilderData {
  schemaVersion?: number;
  components: BuilderComponent[];
  designTokens?: DesignTokens;
  seo?: SEOMetadata;
}

/** Template list item (returned by GET /api/templates) */
export interface TemplateListItem {
  _id: string;
  name: string;
  slug: string;
  category: TemplateCategory;
  style: string;
  description: string;
  thumbnail: string;
  isPremium: boolean;
  tags: string[];
  usageCount: number;
  createdAt: string;
}

/** Full template with builderData (returned by GET /api/templates/:id) */
export interface Template extends TemplateListItem {
  builderData: TemplateBuilderData;
  sections: string[];
}

// ── API Response Types ─────────────────────────────────────────────────

/** Response from GET /api/templates */
export interface TemplateListResponse {
  success: boolean;
  templates: TemplateListItem[];
}

/** Response from GET /api/templates/:id */
export interface TemplateDetailResponse {
  success: boolean;
  template: Template;
}

/** Response from POST /api/templates/:id/clone */
export interface CloneTemplateResponse {
  success: boolean;
  projectId: string;
}

// ── Query Parameters ───────────────────────────────────────────────────

/** Optional filters for the template list endpoint */
export interface TemplateQueryParams {
  category?: TemplateCategory;
  search?: string;
  isPremium?: boolean;
}

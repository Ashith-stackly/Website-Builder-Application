import type { BuilderComponent, SEOMetadata } from "@/types/builder";
import type { DesignTokens } from "@/store/designStore";
import type { ProjectApiProject } from "@/lib/projectApi";

// Template categories are API values, not presentation labels. Keeping the
// lowercase values here makes listing filters and persisted templates match.
export type TemplateCategory =
  | "portfolio"
  | "blog"
  | "store"
  | "business"
  | "restaurant";

export type TemplateCategoryFilter = "all" | TemplateCategory;

export const TEMPLATE_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "portfolio", label: "Portfolio" },
  { value: "blog", label: "Blog" },
  { value: "store", label: "Store" },
  { value: "business", label: "Business" },
  { value: "restaurant", label: "Restaurant" },
] as const satisfies ReadonlyArray<{
  value: TemplateCategoryFilter;
  label: string;
}>;

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  portfolio: "Portfolio",
  blog: "Blog",
  store: "Store",
  business: "Business",
  restaurant: "Restaurant",
};

export function getTemplateCategoryLabel(category: TemplateCategory): string {
  return TEMPLATE_CATEGORY_LABELS[category];
}

// Same serializable builder document used by a saved project. It is returned
// on template detail and copied unchanged into the user's project on clone.
export interface TemplateBuilderData {
  schemaVersion?: number;
  projectName?: string;
  canvasMode?: "flow" | "freeform";
  components: BuilderComponent[];
  designTokens?: DesignTokens;
  seo?: SEOMetadata;
}

export interface TemplatePage {
  id: string;
  name: string;
  path: string;
}

// Lightweight record returned by the catalog endpoint. Large Builder JSON is
// deliberately omitted until a user opens one preview.
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
  createdAt?: string;
  updatedAt?: string;
}

export interface Template extends TemplateListItem {
  sections: string[];
  pages: TemplatePage[];
  builderData: TemplateBuilderData;
  componentCount: number;
}

export interface TemplatePagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface TemplateListResponse {
  success: true;
  templates: TemplateListItem[];
  pagination: TemplatePagination;
}

export interface TemplateDetailResponse {
  success: true;
  template: Template;
}

export interface CloneTemplateResponse {
  success: true;
  message: string;
  projectId: string;
  workspaceId: string;
  project: ProjectApiProject;
  builderData: TemplateBuilderData;
  template: TemplateListItem;
}

export interface TemplateQueryParams {
  category?: TemplateCategoryFilter;
  search?: string;
  isPremium?: boolean;
}

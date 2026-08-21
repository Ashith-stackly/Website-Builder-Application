import type { DesignTokens } from "@/store/designStore";
import type { BuilderComponent } from "@/types/builder";
import type { ProjectBuilderData } from "@/lib/projectApi";

/**
 * Project type definitions for Stackly Dashboard.
 * Used by the project store, dashboard, and project settings.
 */

export interface Project {
  id: string;
  name: string;
  description?: string;
  category: string;
  style: string;
  sections: string[];
  thumbnail?: string;
  components?: BuilderComponent[];
  designTokens?: DesignTokens;
  builderData?: ProjectBuilderData | Record<string, unknown>;
  ecommerceData?: Record<string, unknown>;
  editorType?: "builder" | "ecommerce" | "blockpages";
  status?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectSortKey = "updatedAt" | "createdAt" | "name";
export type ProjectSortOrder = "asc" | "desc";

export interface ProjectSort {
  key: ProjectSortKey;
  order: ProjectSortOrder;
}

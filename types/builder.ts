import type { CSSProperties } from "react";

export type ComponentType =
  | "navigation"
  | "hero"
  | "heading"
  | "text"
  | "button"
  | "image"
  | "input"
  | "divider"
  | "features"
  | "gallery"
  | "contact"
  | "container";

export interface ComponentStyles {
  color?: string;
  backgroundColor?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  fontSize?: string;
  width?: string;
  height?: string;
  textAlign?: CSSProperties["textAlign"];
}

export interface BuilderComponent {
  id: string;
  type: ComponentType;
  content: string;
  styles: ComponentStyles;
  children: BuilderComponent[];
  order: number;
}

export interface BuilderRequirements {
  projectName: string;
  category: string;
  style: string;
  sections: string[];
}

export interface BuilderState {
  components: BuilderComponent[];
  selectedComponentId: string | null;
  addComponent: (type: ComponentType, parentId?: string | null) => void;
  updateComponent: (id: string, updates: Partial<Omit<BuilderComponent, "id" | "children">> & { styles?: ComponentStyles }) => void;
  duplicateComponent: (id: string) => void;
  deleteComponent: (id: string) => void;
  selectComponent: (id: string | null) => void;
  reorderComponents: (activeId: string, overId: string) => void;
  loadStarterWebsite: () => void;
  loadWebsiteFromRequirements: (requirements: BuilderRequirements) => void;
  clearCanvas: () => void;
  exportHtml: () => string;
}

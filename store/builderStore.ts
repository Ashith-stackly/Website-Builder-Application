"use client";

import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { arrayMove } from "@dnd-kit/sortable";
import { generateHtml } from "@/lib/exportHtml";
import { featureItemDefaults } from "@/components/blocks/feature-item/spec";
import { heroDefaults } from "@/components/blocks/hero/spec";
import { navigationDefaults } from "@/components/blocks/navigation/spec";
import { contactDefaults } from "@/components/blocks/contact/spec";
import { featuresDefaults } from "@/components/blocks/features/spec";
import { videoDefaults }    from "@/components/blocks/video/spec";
import type { BuilderComponent, BuilderRequirements, BuilderState, ComponentType, FeatureRecord, Viewport } from "@/types/builder";

type ComponentDefault = Pick<BuilderComponent, "content" | "styles" | "children"> & {
  props?: BuilderComponent["props"];
};

const defaults: Record<ComponentType, ComponentDefault> = {
  navigation: {
    // Migrated to typed `props`. `content` kept empty for legacy callers.
    content: "",
    props: { ...navigationDefaults },
    styles: { color: "#0B1D40", backgroundColor: "#ffffff", padding: "16px 20px", margin: "0 0 16px", borderRadius: "8px", width: "100%" },
    children: [],
  },
  hero: {
    // Migrated to typed `props`. `content` kept empty for legacy callers.
    content: "",
    props: { ...heroDefaults },
    styles: { color: "#0B1D40", backgroundColor: "#eef4fb", padding: "42px 32px", margin: "0 0 16px", borderRadius: "8px", width: "100%", textAlign: "left" },
    children: [],
  },
  heading: {
    content: "Build a better page",
    styles: { color: "#0B1D40", fontSize: "34px", padding: "8px", margin: "0 0 12px", textAlign: "left", width: "100%" },
    children: [],
  },
  text: {
    content: "Add supporting copy for this section.",
    styles: { color: "#566583", fontSize: "16px", padding: "8px", margin: "0 0 12px", textAlign: "left", width: "100%" },
    children: [],
  },
  button: {
    content: "Click Me",
    styles: { color: "#ffffff", backgroundColor: "#0B1D40", fontSize: "15px", padding: "12px 22px", margin: "0 0 12px", borderRadius: "6px", width: "auto", textAlign: "center" },
    children: [],
  },
  icon: {
    content: "Star",
    styles: { color: "#0B1D40", fontSize: "32px", margin: "0 0 12px", textAlign: "center", width: "auto" },
    children: [],
  },
  "feature-item": {
    // Migrated to typed `props`. `content` is kept empty for legacy callers.
    content: "",
    props: { ...featureItemDefaults },
    styles: { color: "#0B1D40", margin: "0 0 12px", width: "100%" },
    children: [],
  },
  columns: {
    content: "3",
    styles: { margin: "0 0 16px", width: "100%" },
    children: [],
  },
  image: {
    content: "/showcase.webp",
    styles: { width: "100%", height: "220px", borderRadius: "8px", margin: "0 0 12px" },
    children: [],
  },
  input: {
    content: "Enter your email",
    styles: { color: "#0B1D40", backgroundColor: "#ffffff", fontSize: "15px", padding: "12px 14px", margin: "0 0 12px", borderRadius: "6px", width: "100%" },
    children: [],
  },
  divider: {
    content: "",
    styles: { backgroundColor: "#dbe3ef", height: "1px", margin: "18px 0", width: "100%" },
    children: [],
  },
  features: {
    // Migrated to typed `props`. `content` kept empty for legacy callers.
    content: "",
    props: { ...featuresDefaults },
    styles: { color: "#0B1D40", backgroundColor: "#ffffff", padding: "24px", margin: "0 0 16px", borderRadius: "8px", width: "100%" },
    children: [],
  },
  gallery: {
    content: "/landing-optimized/portfolio03.webp|Project showcase\n/landing-optimized/ecommerce.webp|Storefront preview\n/landing-optimized/business09.webp|Business website",
    styles: { color: "#0B1D40", backgroundColor: "#ffffff", padding: "24px", margin: "0 0 16px", borderRadius: "8px", width: "100%" },
    children: [],
  },
  contact: {
    // Migrated to typed `props`. `content` kept empty for legacy callers.
    content: "",
    props: { ...contactDefaults },
    styles: { color: "#0B1D40", backgroundColor: "#ffffff", padding: "28px", margin: "0 0 16px", borderRadius: "8px", width: "100%", textAlign: "left" },
    children: [],
  },
  container: {
    content: "",
    styles: { backgroundColor: "#ffffff", padding: "24px", margin: "0 0 16px", borderRadius: "8px", width: "100%" },
    children: [],
  },
  video: {
    content: "",
    props: { ...videoDefaults },
    styles: { margin: "0 0 16px", borderRadius: "8px", width: "100%" },
    children: [],
  },
};

const orderComponents = (components: BuilderComponent[]) =>
  components.map((component, index) => ({ ...component, order: index }));

// --- Recursive tree helpers ---

const findComponentById = (components: BuilderComponent[], id: string): BuilderComponent | null => {
  for (const c of components) {
    if (c.id === id) return c;
    const found = findComponentById(c.children, id);
    if (found) return found;
  }
  return null;
};

const updateNodeById = (
  components: BuilderComponent[],
  id: string,
  updater: (c: BuilderComponent) => BuilderComponent,
): BuilderComponent[] => {
  let mutated = false;
  const result = components.map((c) => {
    if (c.id === id) {
      mutated = true;
      return updater(c);
    }
    if (c.children.length === 0) return c;
    const newChildren = updateNodeById(c.children, id, updater);
    if (newChildren === c.children) return c;
    mutated = true;
    return { ...c, children: newChildren };
  });
  return mutated ? result : components;
};

const deleteNodeById = (components: BuilderComponent[], id: string): BuilderComponent[] => {
  const topIdx = components.findIndex((c) => c.id === id);

  if (topIdx >= 0) {
    return [...components.slice(0, topIdx), ...components.slice(topIdx + 1)];
  }

  let mutated = false;
  const result = components.map((c) => {
    if (c.children.length === 0) return c;
    const newChildren = deleteNodeById(c.children, id);
    if (newChildren === c.children) return c;
    mutated = true;
    return { ...c, children: newChildren };
  });
  return mutated ? result : components;
};

const insertAfterNodeById = (
  components: BuilderComponent[],
  id: string,
  newNode: BuilderComponent,
): BuilderComponent[] | null => {
  const index = components.findIndex((c) => c.id === id);

  if (index >= 0) {
    return [...components.slice(0, index + 1), newNode, ...components.slice(index + 1)];
  }

  for (let i = 0; i < components.length; i++) {
    const newChildren = insertAfterNodeById(components[i].children, id, newNode);

    if (newChildren !== null) {
      return [
        ...components.slice(0, i),
        { ...components[i], children: newChildren },
        ...components.slice(i + 1),
      ];
    }
  }

  return null;
};

const deepCloneComponent = (component: BuilderComponent): BuilderComponent => ({
  ...component,
  id: uuidv4(),
  styles: { ...component.styles },
  props: component.props ? { ...component.props } : undefined,
  children: component.children.map(deepCloneComponent),
});

const createComponent = (type: ComponentType, order: number): BuilderComponent => ({
  id: uuidv4(),
  type,
  ...defaults[type],
  order,
});

const categoryCopy: Record<string, { hero: string; description: string; features: FeatureRecord[] }> = {
  "E-commerce": {
    hero: "Launch your online store with Stackly",
    description: "Create a product-first storefront with clean sections, strong calls to action, and export-ready HTML.",
    features: [
      { title: "Product-ready pages", description: "Showcase collections and best sellers" },
      { title: "Fast checkout path",  description: "Guide shoppers from discovery to action" },
      { title: "Brand control",       description: "Edit colors, copy, spacing, and sections" },
    ],
  },
  Portfolio: {
    hero: "Showcase your work beautifully",
    description: "Build a focused portfolio with a strong introduction, project highlights, and a simple contact path.",
    features: [
      { title: "Project showcase", description: "Present your best work with clear sections" },
      { title: "Personal brand",   description: "Shape the page around your story" },
      { title: "Easy inquiries",   description: "Help clients contact you quickly" },
    ],
  },
  Blog: {
    hero: "Start publishing with a clean blog site",
    description: "Create a readable home for articles, updates, and audience growth.",
    features: [
      { title: "Readable layout",   description: "Keep stories clear and easy to scan" },
      { title: "Category sections", description: "Organize posts around topics" },
      { title: "Newsletter ready",  description: "Collect reader interest from day one" },
    ],
  },
  Business: {
    hero: "Build a professional business website",
    description: "Create a polished company site with service highlights, trust-building content, and a contact section.",
    features: [
      { title: "Service sections", description: "Explain what your business offers" },
      { title: "Trust signals",    description: "Create a polished first impression" },
      { title: "Lead capture",     description: "Make contact and inquiry simple" },
    ],
  },
};

const createRequirementComponents = (requirements: BuilderRequirements) => {
  const projectName = requirements.projectName || "Stackly Studio";
  const category = requirements.category || "Business";
  const style = requirements.style || "Modern";
  const copy = categoryCopy[category] || categoryCopy.Business;
  const selectedSections = requirements.sections.length > 0 ? requirements.sections : ["navigation", "hero", "features", "contact"];
  const sectionTypes: ComponentType[] = selectedSections
    .map((section) => {
      if (section === "gallery") return "gallery";
      if (section === "leadForm") return "contact";
      return section as ComponentType;
    })
    .filter((section): section is ComponentType =>
      ["navigation", "hero", "heading", "text", "button", "icon", "feature-item", "columns", "image", "input", "divider", "features", "gallery", "contact", "container"].includes(section),
    );

  return sectionTypes.map((type, index) => {
    const component = createComponent(type, index);

    if (type === "navigation") {
      // Write typed props; AI generation follows the same NavigationProps shape.
      return {
        ...component,
        props: {
          ...navigationDefaults,
          brand: projectName,
          cta: { label: "Get Started" },
        },
      };
    }

    if (type === "hero") {
      return {
        ...component,
        // Write typed props; AI generation follows the same HeroProps shape.
        props: {
          ...heroDefaults,
          title: copy.hero,
          description: copy.description,
          cta: { label: "Start Building" },
        },
        styles: {
          ...component.styles,
          backgroundColor: style === "Minimal" ? "#ffffff" : style === "Bold" ? "#eef4fb" : "#f7f9fc",
        },
      };
    }

    if (type === "features") {
      return {
        ...component,
        props: {
          ...featuresDefaults,
          items: copy.features,
        },
      };
    }

    if (type === "contact") {
      return {
        ...component,
        props: {
          ...contactDefaults,
          title: `Ready to grow ${projectName}?`,
          description: `Share your email and start shaping your ${category.toLowerCase()} website.`,
        },
      };
    }

    return component;
  });
};

/* ─── History helpers ────────────────────────────────────────────────────── */

const MAX_HISTORY = 50;

/** Push current components onto the history stack and clear redo future. */
function captureHistory(
  state: Pick<BuilderState, "components" | "history">,
): Pick<BuilderState, "history" | "future"> {
  return {
    history: [...state.history.slice(-(MAX_HISTORY - 1)), state.components],
    future: [],
  };
}

const STORAGE_KEY = "stackly-builder-draft";

export const useBuilderStore = create<BuilderState>((set, get) => ({
  components: [],
  selectedComponentId: null,
  isInlineEditing: false,
  history: [],
  future: [],
  viewport: "desktop",
  setViewport: (v: Viewport) => set({ viewport: v }),
  setInlineEditing: (v) => set({ isInlineEditing: v }),
  addComponent: (type, parentId, afterId) =>
    set((state) => {
      if (parentId) {
        const parent = findComponentById(state.components, parentId);
        const component = createComponent(type, parent ? parent.children.length : 0);
        const components = updateNodeById(state.components, parentId, (p) => ({
          ...p,
          children: [...p.children, component],
        }));

        return { ...captureHistory(state), components, selectedComponentId: component.id };
      }

      const component = createComponent(type, state.components.length);

      if (afterId) {
        const result = insertAfterNodeById(state.components, afterId, component);
        const components = result ? orderComponents(result) : [...state.components, component];

        return { ...captureHistory(state), components, selectedComponentId: component.id };
      }

      return {
        ...captureHistory(state),
        components: [...state.components, component],
        selectedComponentId: component.id,
      };
    }),
  updateComponent: (id, updates) =>
    set((state) => ({
      components: updateNodeById(state.components, id, (c) => ({
        ...c,
        ...updates,
        styles: { ...c.styles, ...updates.styles },
        // Shallow-merge typed `props` so callers can patch a single field
        // without clobbering the rest (mirrors the styles merge pattern).
        props: updates.props ? { ...(c.props ?? {}), ...updates.props } : c.props,
      })),
    })),
  duplicateComponent: (id) =>
    set((state) => {
      const source = findComponentById(state.components, id);

      if (!source) return state;

      const copy = deepCloneComponent(source);
      const components = insertAfterNodeById(state.components, id, copy);

      if (!components) return state;

      return { ...captureHistory(state), components: orderComponents(components), selectedComponentId: copy.id };
    }),
  deleteComponent: (id) =>
    set((state) => ({
      ...captureHistory(state),
      components: orderComponents(deleteNodeById(state.components, id)),
      selectedComponentId: state.selectedComponentId === id ? null : state.selectedComponentId,
    })),
  selectComponent: (id) => set({ selectedComponentId: id }),
  reorderComponents: (activeId, overId) =>
    set((state) => {
      const oldIndex = state.components.findIndex((component) => component.id === activeId);
      const newIndex = state.components.findIndex((component) => component.id === overId);

      if (oldIndex < 0 || newIndex < 0) return state;

      return { ...captureHistory(state), components: orderComponents(arrayMove(state.components, oldIndex, newIndex)) };
    }),
  loadStarterWebsite: () =>
    set((state) => {
      const components: BuilderComponent[] = ["navigation", "hero", "features", "gallery", "contact"].map((type, index) =>
        createComponent(type as ComponentType, index),
      );
      return { ...captureHistory(state), components, selectedComponentId: components[0]?.id || null };
    }),
  loadWebsiteFromRequirements: (requirements) =>
    set((state) => {
      const components = createRequirementComponents(requirements);
      return { ...captureHistory(state), components, selectedComponentId: components[0]?.id || null };
    }),
  clearCanvas: () =>
    set((state) => ({ ...captureHistory(state), components: [], selectedComponentId: null })),
  exportHtml: () => generateHtml(get().components),
  undo: () =>
    set((state) => {
      if (state.history.length === 0) return state;
      const prev = state.history[state.history.length - 1];
      return {
        history: state.history.slice(0, -1),
        future: [state.components, ...state.future.slice(0, MAX_HISTORY - 1)],
        components: prev,
        selectedComponentId: null,
      };
    }),
  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        history: [...state.history.slice(-(MAX_HISTORY - 1)), state.components],
        future: state.future.slice(1),
        components: next,
        selectedComponentId: null,
      };
    }),
  saveToLocalStorage: () => {
    try {
      const payload = JSON.stringify({ components: get().components, savedAt: Date.now() });
      localStorage.setItem(STORAGE_KEY, payload);
    } catch { /* storage unavailable */ }
  },
  loadFromLocalStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const { components } = JSON.parse(raw) as { components: BuilderComponent[] };
      if (!Array.isArray(components)) return false;
      set((state) => ({ ...captureHistory(state), components, selectedComponentId: null }));
      return true;
    } catch {
      return false;
    }
  },
}));

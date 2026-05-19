"use client";

import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { arrayMove } from "@dnd-kit/sortable";
import { generateHtml } from "@/lib/exportHtml";
import type { BuilderComponent, BuilderRequirements, BuilderState, ComponentType } from "@/types/builder";

const defaults: Record<ComponentType, Pick<BuilderComponent, "content" | "styles" | "children">> = {
  navigation: {
    content: "Stackly Studio|Home,About,Services,Contact|Get Started",
    styles: { color: "#0B1D40", backgroundColor: "#ffffff", padding: "16px 20px", margin: "0 0 16px", borderRadius: "8px", width: "100%" },
    children: [],
  },
  hero: {
    content: "Create a website in minutes|Design, edit, and export a clean landing page without leaving the builder.|Start Building",
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
    content: "Fast setup|Drag ready-made sections into place\nResponsive layout|Build pages that export cleanly\nEasy editing|Update content and styling from the sidebar",
    styles: { color: "#0B1D40", backgroundColor: "#ffffff", padding: "24px", margin: "0 0 16px", borderRadius: "8px", width: "100%" },
    children: [],
  },
  gallery: {
    content: "/landing-optimized/portfolio03.webp|Project showcase\n/landing-optimized/ecommerce.webp|Storefront preview\n/landing-optimized/business09.webp|Business website",
    styles: { color: "#0B1D40", backgroundColor: "#ffffff", padding: "24px", margin: "0 0 16px", borderRadius: "8px", width: "100%" },
    children: [],
  },
  contact: {
    content: "Ready to launch?|Leave your email and we will help you go live.|Email address|Contact Us",
    styles: { color: "#0B1D40", backgroundColor: "#ffffff", padding: "28px", margin: "0 0 16px", borderRadius: "8px", width: "100%", textAlign: "left" },
    children: [],
  },
  container: {
    content: "",
    styles: { backgroundColor: "#ffffff", padding: "24px", margin: "0 0 16px", borderRadius: "8px", width: "100%" },
    children: [],
  },
};

const orderComponents = (components: BuilderComponent[]) =>
  components.map((component, index) => ({ ...component, order: index }));

const createComponent = (type: ComponentType, order: number): BuilderComponent => ({
  id: uuidv4(),
  type,
  ...defaults[type],
  order,
});

const categoryCopy: Record<string, { hero: string; description: string; features: string }> = {
  "E-commerce": {
    hero: "Launch your online store with Stackly",
    description: "Create a product-first storefront with clean sections, strong calls to action, and export-ready HTML.",
    features: "Product-ready pages|Showcase collections and best sellers\nFast checkout path|Guide shoppers from discovery to action\nBrand control|Edit colors, copy, spacing, and sections",
  },
  Portfolio: {
    hero: "Showcase your work beautifully",
    description: "Build a focused portfolio with a strong introduction, project highlights, and a simple contact path.",
    features: "Project showcase|Present your best work with clear sections\nPersonal brand|Shape the page around your story\nEasy inquiries|Help clients contact you quickly",
  },
  Blog: {
    hero: "Start publishing with a clean blog site",
    description: "Create a readable home for articles, updates, and audience growth.",
    features: "Readable layout|Keep stories clear and easy to scan\nCategory sections|Organize posts around topics\nNewsletter ready|Collect reader interest from day one",
  },
  Business: {
    hero: "Build a professional business website",
    description: "Create a polished company site with service highlights, trust-building content, and a contact section.",
    features: "Service sections|Explain what your business offers\nTrust signals|Create a polished first impression\nLead capture|Make contact and inquiry simple",
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
      ["navigation", "hero", "heading", "text", "button", "image", "input", "divider", "features", "gallery", "contact", "container"].includes(section),
    );

  return sectionTypes.map((type, index) => {
    const component = createComponent(type, index);

    if (type === "navigation") {
      return { ...component, content: `${projectName}|Home,About,Services,Contact|Get Started` };
    }

    if (type === "hero") {
      return {
        ...component,
        content: `${copy.hero}|${copy.description}|Start Building`,
        styles: {
          ...component.styles,
          backgroundColor: style === "Minimal" ? "#ffffff" : style === "Bold" ? "#eef4fb" : "#f7f9fc",
        },
      };
    }

    if (type === "features") {
      return { ...component, content: copy.features };
    }

    if (type === "contact") {
      return { ...component, content: `Ready to grow ${projectName}?|Share your email and start shaping your ${category.toLowerCase()} website.|Email address|Contact Us` };
    }

    return component;
  });
};

export const useBuilderStore = create<BuilderState>((set, get) => ({
  components: [],
  selectedComponentId: null,
  addComponent: (type) =>
    set((state) => {
      const component = createComponent(type, state.components.length);

      return {
        components: [...state.components, component],
        selectedComponentId: component.id,
      };
    }),
  updateComponent: (id, updates) =>
    set((state) => ({
      components: state.components.map((component) =>
        component.id === id
          ? { ...component, ...updates, styles: { ...component.styles, ...updates.styles } }
          : component,
      ),
    })),
  duplicateComponent: (id) =>
    set((state) => {
      const index = state.components.findIndex((component) => component.id === id);

      if (index < 0) {
        return state;
      }

      const source = state.components[index];
      const copy: BuilderComponent = {
        ...source,
        id: uuidv4(),
        content: source.content,
        styles: { ...source.styles },
        children: source.children.map((child, childIndex) => ({ ...child, id: uuidv4(), order: childIndex })),
      };
      const components = [...state.components.slice(0, index + 1), copy, ...state.components.slice(index + 1)];

      return { components: orderComponents(components), selectedComponentId: copy.id };
    }),
  deleteComponent: (id) =>
    set((state) => ({
      components: orderComponents(state.components.filter((component) => component.id !== id)),
      selectedComponentId: state.selectedComponentId === id ? null : state.selectedComponentId,
    })),
  selectComponent: (id) => set({ selectedComponentId: id }),
  reorderComponents: (activeId, overId) =>
    set((state) => {
      const oldIndex = state.components.findIndex((component) => component.id === activeId);
      const newIndex = state.components.findIndex((component) => component.id === overId);

      if (oldIndex < 0 || newIndex < 0) {
        return state;
      }

      return { components: orderComponents(arrayMove(state.components, oldIndex, newIndex)) };
    }),
  loadStarterWebsite: () => {
    const components: BuilderComponent[] = ["navigation", "hero", "features", "gallery", "contact"].map((type, index) =>
      createComponent(type as ComponentType, index),
    );

    set({ components, selectedComponentId: components[0]?.id || null });
  },
  loadWebsiteFromRequirements: (requirements) => {
    const components = createRequirementComponents(requirements);

    set({ components, selectedComponentId: components[0]?.id || null });
  },
  clearCanvas: () => set({ components: [], selectedComponentId: null }),
  exportHtml: () => generateHtml(get().components),
}));

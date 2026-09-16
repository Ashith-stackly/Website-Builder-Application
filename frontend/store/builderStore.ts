"use client";

import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { generateHtml } from "@/lib/exportHtml";
import {
  createDeploymentPackage,
  serializeDeploymentPackage,
  summarizeDeploymentPackage,
  type DeploymentPackage,
} from "@/lib/deploymentPackage";
import { getFreeformDefaultHeight, getFreeformDefaultWidth } from "@/lib/freeformLayout";
import { autosaveProject, createProject, getProject, isProjectConnectionError, saveHtml as saveProjectHtml, type ProjectBuilderData } from "@/lib/projectApi";
import { saveWorkspaceState } from "@/lib/publishApi";
import { featureItemDefaults } from "@/components/blocks/feature-item/spec";
import { heroDefaults } from "@/components/blocks/hero/defaults";
import { navigationDefaults } from "@/components/blocks/navigation/spec";
import { contactDefaults } from "@/components/blocks/contact/spec";
import { featuresDefaults } from "@/components/blocks/features/spec";
import { videoDefaults }    from "@/components/blocks/video/spec";
import { socialLinksDefaults } from "@/components/draggable/SocialLinksComponent";
import { countdownDefaults } from "@/components/draggable/CountdownComponent";
import { pricingTableDefaults } from "@/components/draggable/PricingTableComponent";
import { productCollectionDefaults } from "@/components/blocks/product-collection/spec";
import { testimonialDefaults } from "@/components/draggable/TestimonialComponent";
import { footerDefaults } from "@/components/draggable/FooterComponent";
import { formDefaults } from "@/components/draggable/FormComponent";
import { accordionDefaults } from "@/components/draggable/AccordionComponent";
import { tabsDefaults } from "@/components/draggable/TabsComponent";
import { mapDefaults } from "@/components/draggable/MapComponent";
import { rowDefaults } from "@/components/draggable/RowComponent";
import {
  findComponentById,
  updateNodeById,
  deleteNodeById,
  insertAfterNodeById,
  deepCloneComponent,
  cloneComponentTree,
  orderComponents,
  moveInSiblings,
  reorderTreeComponents,
  findParentOf,
  isAncestorOf,
} from "@/lib/treeHelpers";
import { buildProjectJSON, downloadProjectJSON, parseProjectJSON } from "@/lib/jsonExportImport";
import type { AILayoutSection, AILayoutSuggestion, BuilderComponent, BuilderRequirements, BuilderState, ComponentStyles, ComponentType, FeatureRecord, Viewport } from "@/types/builder";
import { useDesignStore } from "@/store/designStore";
import { useAssetStore } from "@/store/assetStore";
import type { DesignTokens } from "@/store/designStore";

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
    styles: { color: "#ffffff", backgroundColor: "#0B1D40", fontSize: "15px", fontWeight: "700", padding: "12px 22px", margin: "0 0 12px", borderRadius: "6px", width: "auto", textAlign: "center" },
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
  map: {
    content: "",
    props: { ...mapDefaults },
    styles: { margin: "0 0 16px", borderRadius: "8px", width: "100%", padding: "16px" },
    children: [],
  },
  accordion: {
    content: "",
    props: { ...accordionDefaults },
    styles: { color: "#0B1D40", backgroundColor: "#ffffff", padding: "24px", margin: "0 0 16px", borderRadius: "8px", width: "100%" },
    children: [],
  },
  tabs: {
    content: "",
    props: { ...tabsDefaults },
    styles: { color: "#0B1D40", backgroundColor: "#ffffff", padding: "24px", margin: "0 0 16px", borderRadius: "8px", width: "100%" },
    children: [],
  },
  spacer: {
    content: "60px",
    props: { height: "60px" },
    styles: { margin: "0", width: "100%" },
    children: [],
  },
  "social-links": {
    content: "",
    props: { ...socialLinksDefaults },
    styles: { padding: "12px", margin: "0 0 12px", width: "100%" },
    children: [],
  },
  countdown: {
    content: "",
    props: { ...countdownDefaults },
    styles: { color: "#0B1D40", backgroundColor: "#ffffff", padding: "32px", margin: "0 0 16px", borderRadius: "8px", width: "100%" },
    children: [],
  },
  "pricing-table": {
    content: "",
    props: { ...pricingTableDefaults },
    styles: { color: "#0B1D40", backgroundColor: "#f7f9fc", padding: "40px 24px", margin: "0 0 16px", borderRadius: "8px", width: "100%" },
    children: [],
  },
  "product-collection": {
    content: "",
    props: {
      ...productCollectionDefaults,
      products: productCollectionDefaults.products.map((product) => ({ ...product })),
      productIds: [...productCollectionDefaults.productIds],
    },
    styles: { color: "#0B1D40", backgroundColor: "#ffffff", padding: "40px 24px", margin: "0 0 16px", borderRadius: "8px", width: "100%" },
    children: [],
  },
  testimonial: {
    content: "",
    props: { ...testimonialDefaults },
    styles: { color: "#0B1D40", backgroundColor: "#ffffff", padding: "40px 24px", margin: "0 0 16px", borderRadius: "8px", width: "100%" },
    children: [],
  },
  footer: {
    content: "",
    props: { ...footerDefaults },
    styles: { color: "#ffffff", backgroundColor: "#0B1D40", padding: "0", margin: "0", borderRadius: "8px", width: "100%" },
    children: [],
  },
  form: {
    content: "",
    props: { ...formDefaults },
    styles: { color: "#0B1D40", backgroundColor: "#ffffff", padding: "32px", margin: "0 0 16px", borderRadius: "8px", width: "100%" },
    children: [],
  },
  row: {
    content: "50/50",
    props: { ...rowDefaults },
    styles: { backgroundColor: "#ffffff", padding: "24px", margin: "0 0 16px", borderRadius: "8px", width: "100%" },
    children: [],
  },
};


const applyTokensToComponent = (component: BuilderComponent, tokens: DesignTokens): BuilderComponent => {
  const nextStyles = { ...component.styles, fontFamily: tokens.typography.fontFamily };
  let nextTextStyles = component.textStyles ? { ...component.textStyles } : undefined;
  const headingSize = `${Math.round(parseFloat(tokens.typography.baseFontSize) * tokens.typography.headingScale * 1.7)}px`;

  if (["heading"].includes(component.type)) {
    nextStyles.color = tokens.colors.primary;
    nextStyles.fontSize = component.styles.fontSize || headingSize;
  } else if (["text", "input"].includes(component.type)) {
    nextStyles.color = tokens.colors.text;
    nextStyles.fontSize = tokens.typography.baseFontSize;
  } else if (component.type === "button") {
    nextStyles.color = "#ffffff";
    nextStyles.backgroundColor = tokens.colors.primary;
    nextStyles.borderRadius = tokens.buttons.borderRadius;
    nextStyles.fontWeight = tokens.buttons.fontWeight;
    nextStyles.fontFamily = tokens.typography.fontFamily;
  } else if (component.type === "divider") {
    nextStyles.backgroundColor = tokens.colors.secondary;
  } else if (!["image", "video", "map", "spacer"].includes(component.type)) {
    nextStyles.color = tokens.colors.text;
    nextStyles.backgroundColor = component.type === "footer" ? tokens.colors.primary : tokens.colors.background;
  }

  const buttonTargets = ["navigation.cta", "hero.cta"];
  buttonTargets.forEach((key) => {
    nextTextStyles ??= {};
    nextTextStyles[key] = {
      ...(nextTextStyles[key] ?? {}),
      color: "#ffffff",
      backgroundColor: tokens.colors.primary,
      borderRadius: tokens.buttons.borderRadius,
      fontWeight: tokens.buttons.fontWeight,
      fontFamily: tokens.typography.fontFamily,
    };
  });

  return {
    ...component,
    styles: nextStyles,
    textStyles: nextTextStyles,
    children: component.children.map((child) => applyTokensToComponent(child, tokens)),
  };
};

const createComponent = (type: ComponentType, order: number): BuilderComponent => {
  const component: BuilderComponent = {
    id: uuidv4(),
    type,
    ...defaults[type],
    props: defaults[type].props ? { ...defaults[type].props } : undefined,
    styles: { ...defaults[type].styles },
    children: defaults[type].children.map(deepCloneComponent),
    order,
  };

  return component;
};

const isKnownComponentType = (value: unknown): value is ComponentType =>
  typeof value === "string" && Object.prototype.hasOwnProperty.call(defaults, value);

const cleanAIText = (value: unknown, maxLength = 800): string | undefined => {
  if (typeof value !== "string") return undefined;
  const text = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
  return text ? text.slice(0, maxLength) : undefined;
};

const readAICtaLabel = (section: AILayoutSection) => {
  const explicit = cleanAIText(section.props?.ctaLabel, 80);
  if (explicit) return explicit;
  const cta = section.props?.cta;
  return cta && typeof cta === "object" && !Array.isArray(cta)
    ? cleanAIText((cta as Record<string, unknown>).label, 80)
    : undefined;
};

const safePaletteColor = (value: unknown): string | undefined =>
  typeof value === "string" && /^#[0-9a-f]{3,8}$/i.test(value.trim())
    ? value.trim()
    : undefined;

/**
 * Map a reviewed, server-validated layout suggestion onto existing block
 * defaults. The AI is intentionally not allowed to write arbitrary props or
 * component trees; this preserves renderer compatibility and makes one
 * layout application a single undoable builder action.
 */
const createAISectionComponent = (
  section: AILayoutSection,
  order: number,
  palette?: AILayoutSuggestion["colorPalette"],
): BuilderComponent | null => {
  if (!isKnownComponentType(section.type)) return null;

  const component = createComponent(section.type, order);
  const title = cleanAIText(section.props?.title, 160)
    ?? cleanAIText(section.props?.heading, 160)
    ?? cleanAIText(section.label, 160);
  const description = cleanAIText(section.props?.description, 600)
    ?? cleanAIText(section.contentHint, 600);
  const ctaLabel = readAICtaLabel(section);
  const primary = safePaletteColor(palette?.primary);
  const background = safePaletteColor(palette?.background);
  const text = safePaletteColor(palette?.text);

  if (background && !["navigation", "hero", "footer", "image", "video", "map", "spacer", "divider"].includes(component.type)) {
    component.styles = { ...component.styles, backgroundColor: background };
  }
  if (text && !["hero", "footer", "image", "video", "map", "spacer", "divider"].includes(component.type)) {
    component.styles = { ...component.styles, color: text };
  }
  if (primary && component.type === "button") {
    component.styles = { ...component.styles, backgroundColor: primary };
  }
  if (primary && component.type === "hero") {
    component.styles = { ...component.styles, backgroundColor: primary, color: "#ffffff" };
  }
  if (primary && component.type === "footer") {
    component.styles = { ...component.styles, backgroundColor: primary, color: "#ffffff" };
  }

  switch (component.type) {
    case "heading":
    case "text":
    case "input":
    case "feature-item":
      component.content = title ?? description ?? component.content;
      break;
    case "button":
      component.content = ctaLabel ?? title ?? component.content;
      break;
    case "hero":
      component.props = {
        ...(component.props ?? {}),
        ...(title ? { title } : {}),
        ...(description ? { description } : {}),
        ...(ctaLabel ? { cta: { label: ctaLabel, href: "#contact" } } : {}),
      };
      break;
    case "navigation":
      component.props = {
        ...(component.props ?? {}),
        ...(title ? { brand: title } : {}),
        ...(ctaLabel ? { cta: { label: ctaLabel, href: "#contact" } } : {}),
      };
      break;
    case "features":
    case "pricing-table":
    case "product-collection":
    case "testimonial":
      component.props = {
        ...(component.props ?? {}),
        ...(title ? { heading: title } : {}),
      };
      break;
    case "contact":
      component.props = {
        ...(component.props ?? {}),
        ...(title ? { title } : {}),
        ...(description ? { description } : {}),
        ...(ctaLabel ? { cta: { label: ctaLabel, href: "#contact" } } : {}),
      };
      break;
    case "form":
      component.props = {
        ...(component.props ?? {}),
        ...(title ? { heading: title } : {}),
        ...(description ? { description } : {}),
        ...(ctaLabel ? { submitLabel: ctaLabel } : {}),
      };
      break;
    case "footer":
      component.props = {
        ...(component.props ?? {}),
        ...(title ? { brand: title } : {}),
        ...(description ? { tagline: description } : {}),
      };
      break;
    default:
      break;
  }

  return component;
};

const withComponentOverrides = (
  type: ComponentType,
  order: number,
  overrides: Partial<Omit<BuilderComponent, "id" | "type" | "order" | "children">> & {
    children?: BuilderComponent[];
  } = {},
): BuilderComponent => {
  const component = createComponent(type, order);

  return {
    ...component,
    ...overrides,
    content: overrides.content ?? component.content,
    props: overrides.props ? { ...(component.props ?? {}), ...overrides.props } : component.props,
    styles: { ...component.styles, ...(overrides.styles ?? {}) },
    textStyles: overrides.textStyles ?? component.textStyles,
    children: overrides.children ?? component.children,
  };
};

const templateNav = (projectName: string, links: Array<{ label: string; href?: string }>, cta = "Get Started") => ({
  ...navigationDefaults,
  brand: projectName,
  links,
  cta: { label: cta, href: "#contact" },
});

const templateFooter = (brand: string, tagline: string) => ({
  ...footerDefaults,
  brand,
  tagline,
  copyright: `Copyright ${new Date().getFullYear()} ${brand}. All rights reserved.`,
});

const buildCategoryTemplate = (category: string, projectName: string, style: string, selectedSections?: string[]): BuilderComponent[] | null => {
  const bold = style === "Bold";
  const minimal = style === "Minimal";

  // ── Style-driven design tokens ──────────────────────────────────────────
  // These tokens propagate the user's Modern / Minimal / Bold choice across
  // every section so the three styles are clearly visually distinct.
  //
  // MINIMAL  → flat white, no radius, generous whitespace, understated
  // MODERN   → tinted surfaces, medium radius, subtle depth, contemporary
  // BOLD     → dark hero, high-contrast cards, large radius, expressive

  const surface        = minimal ? "#ffffff" : bold ? "#0e1726" : "#f0f4fb";
  const surfaceText    = bold ? "#e8edf5" : "#0B1D40";
  const cardBg         = minimal ? "#ffffff" : bold ? "#162032" : "#ffffff";
  const cardText       = bold ? "#e8edf5" : "#0B1D40";

  // Section-level chrome: Modern → clean edges, Bold → rounded cards, Minimal → flat
  const sectionRadius  = minimal ? "0" : bold ? "20px" : "0";
  const sectionPadding = minimal ? "48px 24px" : bold ? "48px 36px" : "48px 36px";
  const sectionMargin  = minimal ? "0" : bold ? "0 0 12px" : "0";
  const sectionBorder  = minimal ? undefined : bold ? "1px solid rgba(255,255,255,0.08)" : undefined;
  const sectionShadow  = minimal ? undefined : bold ? "0 12px 36px -8px rgba(15, 23, 42, 0.3)" : undefined;

  const cardPadding    = minimal ? "40px 20px" : bold ? "48px 36px" : "44px 32px";
  const footerRadius   = minimal ? "0" : bold ? "20px" : "0";
  const galleryBg      = minimal ? "#f8f8f8" : bold ? "#111b2e" : "#f5f7fc";
  const galleryPadding = minimal ? "32px 16px" : bold ? "40px 32px" : "36px 28px";
  const contactBg      = minimal ? "#f5f5f5" : bold ? "#0B1D40" : "#eef4fb";
  const contactColor   = bold ? "#ffffff" : "#0B1D40";
  const navBg          = minimal ? "#ffffff" : bold ? "#070d18" : "#ffffff";
  const navColor       = minimal ? "#0B1D40" : bold ? "#e8edf5" : "#0B1D40";

  // Hero — the most visually impactful section and key differentiator
  const heroBg    = bold ? "#0B1D40" : minimal ? "#ffffff" : "#eef4fb";
  const heroColor = bold ? "#ffffff" : "#0B1D40";
  const heroLayout: "centered" | "split" = minimal ? "centered" : "split";

  const baseHeroStyles: Partial<ComponentStyles> = {
    backgroundColor: heroBg,
    backgroundImage: bold
      ? "radial-gradient(ellipse at 80% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 65%), linear-gradient(135deg, #070d19 0%, #0B1D40 50%, #1e1b4b 100%)"
      : minimal ? undefined
      : "linear-gradient(135deg, #e0e7ff 0%, #eef4fb 50%, #f0fdf4 100%)",
    color: heroColor,
    padding: bold ? "72px 48px" : minimal ? "56px 32px" : "60px 40px",
    borderRadius: minimal ? "0" : bold ? "24px" : "0",
    margin: minimal ? "0" : bold ? "0 0 12px" : "0",
    border: minimal ? undefined : bold ? "1px solid rgba(59, 130, 246, 0.2)" : undefined,
    boxShadow: minimal ? undefined : bold ? "0 25px 60px -15px rgba(11, 29, 64, 0.4)" : undefined,
    ...(minimal ? { textAlign: "center" as const } : {}),
  };

  const navStyles = {
    backgroundColor: navBg,
    color: navColor,
    borderRadius: minimal ? "0" : bold ? "16px" : "0",
    border: minimal ? undefined : bold ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
    boxShadow: minimal ? undefined : "0 4px 20px -2px rgba(11, 29, 64, 0.06)",
  };

  const featuresStyles: Partial<ComponentStyles> = {
    backgroundColor: surface,
    backgroundImage: bold
      ? "linear-gradient(145deg, #0e1726 0%, #162032 100%)"
      : minimal ? undefined
      : "linear-gradient(180deg, #ffffff 0%, #f0f4fb 100%)",
    color: surfaceText,
    padding: sectionPadding,
    borderRadius: sectionRadius,
    margin: sectionMargin,
    border: sectionBorder,
    boxShadow: sectionShadow,
  };
  const galleryStyles: Partial<ComponentStyles> = {
    backgroundColor: galleryBg,
    backgroundImage: bold ? "linear-gradient(180deg, #111b2e 0%, #0e1726 100%)" : undefined,
    color: bold ? "#e8edf5" : "#0B1D40",
    padding: galleryPadding,
    borderRadius: sectionRadius,
    margin: sectionMargin,
    border: sectionBorder,
    boxShadow: sectionShadow,
  };
  const pricingStyles: Partial<ComponentStyles> = {
    backgroundColor: surface,
    backgroundImage: bold
      ? "linear-gradient(180deg, #0e1726 0%, #111b2e 100%)"
      : minimal ? undefined
      : "linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%)",
    color: surfaceText,
    padding: cardPadding,
    borderRadius: sectionRadius,
    margin: sectionMargin,
    border: sectionBorder,
    boxShadow: sectionShadow,
  };
  const testimonialStyles: Partial<ComponentStyles> = {
    backgroundColor: cardBg,
    backgroundImage: bold
      ? "linear-gradient(135deg, #162032 0%, #1a2840 100%)"
      : minimal ? undefined
      : "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f4fb 100%)",
    color: cardText,
    padding: cardPadding,
    borderRadius: sectionRadius,
    margin: sectionMargin,
    border: minimal ? undefined : bold ? "1px solid rgba(255,255,255,0.06)" : undefined,
    boxShadow: sectionShadow,
  };
  const footerStyles: Partial<ComponentStyles> = {
    borderRadius: footerRadius,
    backgroundColor: bold ? "#050a14" : "#0B1D40",
    backgroundImage: bold ? "linear-gradient(180deg, #090f20 0%, #030712 100%)" : "linear-gradient(180deg, #0B1D40 0%, #070d19 100%)",
    color: bold ? "#c0c8d8" : "#cbd5e1",
    border: minimal ? undefined : bold ? "1px solid rgba(255,255,255,0.08)" : undefined,
    boxShadow: bold ? "0 -4px 20px rgba(0, 0, 0, 0.15)" : undefined,
    padding: "40px 36px 28px",
    margin: sectionMargin,
  };
  const contactStyles: Partial<ComponentStyles> = {
    backgroundColor: contactBg,
    backgroundImage: bold
      ? "radial-gradient(circle at 100% 0%, rgba(59, 130, 246, 0.3) 0%, transparent 50%), linear-gradient(135deg, #0B1D40 0%, #0f172a 100%)"
      : minimal ? undefined
      : "linear-gradient(135deg, #eef4fb 0%, #e0e7ff 100%)",
    color: contactColor,
    borderRadius: sectionRadius,
    margin: sectionMargin,
    border: minimal ? undefined : bold ? "1px solid rgba(59, 130, 246, 0.2)" : undefined,
    boxShadow: sectionShadow,
  };

  // Persisted template categories use the API value "store", while the
  // original requirements flow used the display value "E-Commerce".
  // Normalize both to the existing storefront starter without changing the
  // Builder's component architecture.
  const rawCategoryKey = category.toLowerCase().trim();
  const categoryKey = ["store", "ecommerce", "e-commerce"].includes(rawCategoryKey)
    ? "e-commerce"
    : ["construction", "building"].includes(rawCategoryKey)
      ? "construction"
      : ["digital-marketing", "marketing", "digital"].includes(rawCategoryKey)
        ? "digital-marketing"
        : ["nexora", "agency"].includes(rawCategoryKey)
          ? "nexora"
          : rawCategoryKey;

  const templates: Record<string, () => BuilderComponent[]> = {
    "e-commerce": () => [
      withComponentOverrides("navigation", 0, { props: templateNav(projectName, [{ label: "Shop" }, { label: "Collections" }, { label: "Reviews" }, { label: "Contact" }], "Shop Now"), styles: navStyles }),
      withComponentOverrides("hero", 1, {
        props: { ...heroDefaults, title: "Launch a storefront customers trust", description: "Showcase collections, highlight offers, and guide shoppers from discovery to checkout with a polished commerce homepage.", cta: { label: "Explore Products", href: "#products" }, layout: heroLayout, align: minimal ? "center" : "left" },
        styles: {
          ...baseHeroStyles,
          backgroundColor: bold ? "#042f2e" : minimal ? "#ffffff" : "#ecfdf5",
          backgroundImage: bold
            ? "radial-gradient(ellipse at 80% 20%, rgba(16, 185, 129, 0.3) 0%, transparent 65%), linear-gradient(135deg, #022c22 0%, #064e3b 50%, #042f2e 100%)"
            : minimal ? undefined
            : "linear-gradient(135deg, #d1fae5 0%, #ecfdf5 50%, #f0fdf4 100%)",
          border: minimal ? undefined : bold ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid #a7f3d0",
          boxShadow: minimal ? undefined : bold ? "0 25px 60px -15px rgba(4, 47, 46, 0.4)" : "0 12px 35px -5px rgba(16, 185, 129, 0.08)",
        },
      }),
      withComponentOverrides("features", 2, {
        props: { ...featuresDefaults, heading: "Built for selling", items: [
          { title: "Curated collections", description: "Organize products into easy-to-scan shopping paths." },
          { title: "Trust-first layout", description: "Use reviews, guarantees, and clear CTAs to reduce friction." },
          { title: "Mobile shopping", description: "Responsive sections keep carts and offers easy to reach." },
        ] },
        styles: featuresStyles,
      }),
      withComponentOverrides("gallery", 3, { content: "/landing-optimized/store11.webp|Featured store layout\n/landing-optimized/fashion06.webp|Fashion collection\n/landing-optimized/jewellery07.webp|Premium product showcase", styles: galleryStyles }),
      withComponentOverrides("pricing-table", 4, { props: { ...pricingTableDefaults, heading: "Simple launch packages" }, styles: pricingStyles }),
      withComponentOverrides("testimonial", 5, { props: { ...testimonialDefaults, heading: "Loved by growing stores" }, styles: testimonialStyles }),
      withComponentOverrides("contact", 6, { props: { ...contactDefaults, title: "Ready to open your store?", description: "Share your email and start shaping your product-first website.", cta: { label: "Start Selling", href: "#contact" } }, styles: contactStyles }),
      withComponentOverrides("footer", 7, { props: templateFooter(projectName, "A modern storefront built with Stackly."), styles: footerStyles }),
    ],
    portfolio: () => [
      withComponentOverrides("navigation", 0, { props: templateNav(projectName, [{ label: "Work" }, { label: "About" }, { label: "Services" }, { label: "Contact" }], "Hire Me"), styles: navStyles }),
      withComponentOverrides("hero", 1, {
        props: { ...heroDefaults, title: "Showcase your work with clarity", description: "Present your best projects, tell your story, and make it simple for clients to start a conversation.", cta: { label: "View Work", href: "#work" }, layout: heroLayout, align: minimal ? "center" : "left" },
        styles: {
          ...baseHeroStyles,
          backgroundColor: bold ? "#190d2e" : minimal ? "#ffffff" : "#faf5ff",
          backgroundImage: bold
            ? "radial-gradient(ellipse at 80% 20%, rgba(168, 85, 247, 0.3) 0%, transparent 65%), linear-gradient(135deg, #120726 0%, #2e1065 50%, #1e1b4b 100%)"
            : minimal ? undefined
            : "linear-gradient(135deg, #ede9fe 0%, #faf5ff 50%, #fdf4ff 100%)",
          border: minimal ? undefined : bold ? "1px solid rgba(168, 85, 247, 0.25)" : "1px solid #ddd6fe",
          boxShadow: minimal ? undefined : bold ? "0 25px 60px -15px rgba(46, 16, 101, 0.4)" : "0 12px 35px -5px rgba(168, 85, 247, 0.08)",
        },
      }),
      withComponentOverrides("gallery", 2, { content: "/landing-optimized/port.webp|Signature portfolio homepage\n/landing-optimized/portfolio03.webp|Agency case study\n/landing-optimized/portfolio04.webp|Minimal project grid", styles: galleryStyles }),
      withComponentOverrides("features", 3, { props: { ...featuresDefaults, heading: "What you bring to clients", items: [
        { title: "Project storytelling", description: "Frame outcomes, process, and creative thinking." },
        { title: "Personal brand", description: "Shape a memorable introduction around your strengths." },
        { title: "Easy inquiries", description: "Turn interest into contact with clear next steps." },
      ] }, styles: featuresStyles }),
      withComponentOverrides("testimonial", 4, { props: { ...testimonialDefaults, heading: "Client notes" }, styles: testimonialStyles }),
      withComponentOverrides("form", 5, { props: { ...formDefaults, heading: "Start a project", description: "Tell visitors how to reach you for work, collaborations, or speaking.", submitLabel: "Send Inquiry" } }),
      withComponentOverrides("footer", 6, { props: templateFooter(projectName, "Portfolio, selected work, and contact."), styles: footerStyles }),
    ],
    blog: () => [
      withComponentOverrides("navigation", 0, { props: templateNav(projectName, [{ label: "Stories" }, { label: "Categories" }, { label: "Guides" }, { label: "Subscribe" }], "Subscribe"), styles: navStyles }),
      withComponentOverrides("hero", 1, {
        props: { ...heroDefaults, title: "Create a blog worth returning to", description: "Build a readable home for essays, guides, and updates with sections that support discovery and reader growth.", cta: { label: "Start Reading", href: "#posts" }, layout: heroLayout, align: minimal ? "center" : "left" },
        styles: baseHeroStyles,
      }),
      withComponentOverrides("features", 2, { props: { ...featuresDefaults, heading: "Editorial foundations", items: [
        { title: "Featured posts", description: "Lead with timely stories and high-value guides." },
        { title: "Clear categories", description: "Help readers browse topics without friction." },
        { title: "Newsletter path", description: "Convert loyal readers into subscribers." },
      ] }, styles: featuresStyles }),
      withComponentOverrides("gallery", 3, { content: "/landing-optimized/blog1.webp|Personal blog layout\n/landing-optimized/blog2.webp|Tech insights template\n/blog/template-food.webp|Restaurant story blog", styles: galleryStyles }),
      withComponentOverrides("tabs", 4, { props: { ...tabsDefaults, items: [
        { label: "Ideas", content: "Publish essays, explainers, guides, and behind-the-scenes stories." },
        { label: "Categories", content: "Organize posts around practical topics your readers revisit." },
        { label: "Growth", content: "Use subscription CTAs and featured content to build an audience." },
      ] } }),
      withComponentOverrides("contact", 5, { props: { ...contactDefaults, title: "Join the newsletter", description: "Invite readers to subscribe for new posts and updates.", inputPlaceholder: "reader@example.com", cta: { label: "Subscribe", href: "#subscribe" } }, styles: contactStyles }),
      withComponentOverrides("footer", 6, { props: templateFooter(projectName, "Stories, ideas, and reader updates."), styles: footerStyles }),
    ],
    business: () => [
      withComponentOverrides("navigation", 0, { props: templateNav(projectName, [{ label: "Services" }, { label: "Results" }, { label: "Pricing" }, { label: "Contact" }], "Book a Call"), styles: navStyles }),
      withComponentOverrides("hero", 1, {
        props: { ...heroDefaults, title: "Build trust for your business", description: "Explain services, show credibility, and create a direct path from visitor interest to qualified leads.", cta: { label: "Book a Consultation", href: "#contact" }, layout: heroLayout, align: minimal ? "center" : "left" },
        styles: baseHeroStyles,
      }),
      withComponentOverrides("features", 2, { props: { ...featuresDefaults, heading: "How you help", items: [
        { title: "Service clarity", description: "Explain what you offer with structured, scannable sections." },
        { title: "Trust signals", description: "Use testimonials and proof points to support decisions." },
        { title: "Lead capture", description: "Make contact simple with forms and strong CTAs." },
      ] }, styles: featuresStyles }),
      withComponentOverrides("pricing-table", 3, { props: { ...pricingTableDefaults, heading: "Service packages" }, styles: pricingStyles }),
      withComponentOverrides("testimonial", 4, { props: { ...testimonialDefaults, heading: "What clients say" }, styles: testimonialStyles }),
      withComponentOverrides("form", 5, { props: { ...formDefaults, heading: "Talk to our team", description: "Collect qualified business inquiries with a focused contact form.", submitLabel: "Request Consultation" } }),
      withComponentOverrides("footer", 6, { props: templateFooter(projectName, "Professional services and business growth."), styles: footerStyles }),
    ],
    restaurant: () => [
      withComponentOverrides("navigation", 0, { props: templateNav(projectName, [{ label: "Menu" }, { label: "About" }, { label: "Reservations" }, { label: "Contact" }], "Reserve"), styles: navStyles }),
      withComponentOverrides("hero", 1, {
        props: { ...heroDefaults, title: "Create a mouth-watering restaurant website", description: "Showcase signature dishes, share your story, and help guests find, call, or reserve from any device.", cta: { label: "View Menu", href: "#menu" }, layout: heroLayout, align: minimal ? "center" : "left" },
        styles: {
          ...baseHeroStyles,
          backgroundColor: bold ? "#2a0a0a" : minimal ? "#ffffff" : "#fff7ed",
          backgroundImage: bold
            ? "radial-gradient(ellipse at 80% 20%, rgba(245, 158, 11, 0.25) 0%, transparent 65%), linear-gradient(135deg, #1c0505 0%, #3f1212 50%, #451a03 100%)"
            : minimal ? undefined
            : "linear-gradient(135deg, #ffedd5 0%, #fff7ed 50%, #fef2f2 100%)",
          color: bold ? "#ffffff" : "#431407",
          border: minimal ? undefined : bold ? "1px solid rgba(245, 158, 11, 0.25)" : "1px solid #fed7aa",
          boxShadow: minimal ? undefined : bold ? "0 25px 60px -15px rgba(69, 26, 3, 0.4)" : "0 12px 35px -5px rgba(154, 52, 18, 0.08)",
        },
      }),
      withComponentOverrides("gallery", 2, { content: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop|Premium ribeye steak\nhttps://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=800&auto=format&fit=crop|Wood-fired pizza\nhttps://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop|Classic cheeseburger", styles: galleryStyles }),
      withComponentOverrides("features", 3, { props: { ...featuresDefaults, heading: "Restaurant essentials", items: [
        { title: "Signature menu", description: "Highlight best sellers, prices, and seasonal dishes." },
        { title: "Guest confidence", description: "Tell your story and show atmosphere before guests arrive." },
        { title: "Reservation path", description: "Make contact, hours, and booking details easy to find." },
      ] }, styles: {
        ...featuresStyles,
        backgroundColor: bold ? "#220a0a" : minimal ? "#ffffff" : "#fffbf5",
        backgroundImage: bold
          ? "linear-gradient(145deg, #1c0606 0%, #2a0a0a 100%)"
          : minimal ? undefined
          : "linear-gradient(180deg, #ffffff 0%, #fff7ed 100%)",
        color: bold ? "#ffffff" : "#431407",
        border: minimal ? undefined : bold ? "1px solid rgba(255,255,255,0.08)" : "1px solid #fed7aa",
      } }),
      withComponentOverrides("testimonial", 4, { props: { ...testimonialDefaults, heading: "Guest reviews" }, styles: testimonialStyles }),
      withComponentOverrides("map", 5, { props: { ...mapDefaults, address: "123 Culinary Avenue, Food District", zoom: 14, height: "320px" }, styles: { backgroundColor: cardBg, padding: "20px", borderRadius: sectionRadius } }),
      withComponentOverrides("contact", 6, { props: { ...contactDefaults, title: "Book a table", description: "Invite guests to reserve, call, or ask about private dining.", inputPlaceholder: "guest@example.com", cta: { label: "Reserve Now", href: "#contact" } }, styles: contactStyles }),
      withComponentOverrides("footer", 7, { props: templateFooter(projectName, "Fresh flavors, warm service, and easy reservations."), styles: footerStyles }),
    ],
    construction: () => [
      withComponentOverrides("navigation", 0, { props: templateNav(projectName, [{ label: "Services" }, { label: "Projects" }, { label: "Safety" }, { label: "Contact" }], "Request Quote"), styles: navStyles }),
      withComponentOverrides("hero", 1, {
        props: { ...heroDefaults, title: "Building Excellence with Precision", description: "Heavy machinery, project showcases, safety commitments, and expert building contracting.", cta: { label: "Explore Projects", href: "#projects" }, layout: heroLayout, align: minimal ? "center" : "left" },
        styles: {
          ...baseHeroStyles,
          backgroundColor: bold ? "#090d16" : minimal ? "#ffffff" : "#f1f5f9",
          backgroundImage: bold
            ? "radial-gradient(ellipse at 80% 20%, rgba(234, 179, 8, 0.2) 0%, transparent 65%), linear-gradient(135deg, #070c16 0%, #1e293b 50%, #0f172a 100%)"
            : minimal ? undefined
            : "linear-gradient(135deg, #e2e8f0 0%, #f1f5f9 50%, #fef3c7 100%)",
          color: minimal ? "#0f172a" : "#ffffff",
          border: minimal ? undefined : bold ? "1px solid rgba(234, 179, 8, 0.3)" : "1px solid #cbd5e1",
          boxShadow: minimal ? undefined : bold ? "0 25px 60px -15px rgba(15, 23, 42, 0.5)" : "0 12px 35px -5px rgba(15, 23, 42, 0.08)",
        },
      }),
      withComponentOverrides("features", 2, { props: { ...featuresDefaults, heading: "Construction & Engineering Services", items: [
        { title: "Commercial Construction", description: "State-of-the-art office buildings and retail developments." },
        { title: "Heavy Civil & Infrastructure", description: "Roads, bridges, and large-scale site preparation." },
        { title: "Safety & Quality Control", description: "Uncompromising safety standards on every job site." },
      ] }, styles: {
        ...featuresStyles,
        backgroundColor: bold ? "#0f172a" : minimal ? "#ffffff" : "#f8fafc",
        backgroundImage: bold
          ? "linear-gradient(145deg, #0b1329 0%, #1e293b 100%)"
          : minimal ? undefined
          : "linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)",
        color: bold ? "#ffffff" : "#0f172a",
        border: minimal ? undefined : bold ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
      } }),
      withComponentOverrides("gallery", 3, { content: "/landing-optimized/construction02.webp|Industrial project site\n/landing-optimized/constrctio10.webp|Heavy equipment operation", styles: galleryStyles }),
      withComponentOverrides("contact", 4, { props: { ...contactDefaults, title: "Request a Project Quote", description: "Speak with our contracting engineers about your next build.", inputPlaceholder: "contractor@example.com", cta: { label: "Get Quote", href: "#contact" } }, styles: contactStyles }),
      withComponentOverrides("footer", 5, { props: templateFooter(projectName, "Heavy construction, infrastructure, and contracting."), styles: footerStyles }),
    ],
    "digital-marketing": () => [
      withComponentOverrides("navigation", 0, { props: templateNav(projectName, [{ label: "Services" }, { label: "Growth Stats" }, { label: "Reviews" }, { label: "Contact" }], "Book Strategy Call"), styles: navStyles }),
      withComponentOverrides("hero", 1, {
        props: { ...heroDefaults, title: "Accelerate Your Business Growth", description: "High-converting digital marketing strategies, SEO, brand positioning, and performance campaigns.", cta: { label: "Get Started", href: "#services" }, layout: heroLayout, align: minimal ? "center" : "left" },
        styles: {
          ...baseHeroStyles,
          backgroundColor: bold ? "#060919" : minimal ? "#ffffff" : "#eef2ff",
          backgroundImage: bold
            ? "radial-gradient(ellipse at 80% 20%, rgba(6, 182, 212, 0.35) 0%, transparent 65%), linear-gradient(135deg, #060818 0%, #1e1b4b 50%, #082f49 100%)"
            : minimal ? undefined
            : "linear-gradient(135deg, #e0e7ff 0%, #eef2ff 50%, #ecfeff 100%)",
          color: minimal ? "#0f172a" : "#ffffff",
          border: minimal ? undefined : bold ? "1px solid rgba(6, 182, 212, 0.3)" : "1px solid #c7d2fe",
          boxShadow: minimal ? undefined : bold ? "0 25px 60px -15px rgba(30, 27, 75, 0.45)" : "0 12px 35px -5px rgba(99, 102, 241, 0.08)",
        },
      }),
      withComponentOverrides("features", 2, { props: { ...featuresDefaults, heading: "Growth & Marketing Capabilities", items: [
        { title: "SEO & Organic Search", description: "Drive targeted search traffic and rank higher." },
        { title: "Performance Marketing", description: "Data-driven ad campaigns focused on ROI." },
        { title: "Brand & Content Strategy", description: "Position your brand as an industry authority." },
      ] }, styles: featuresStyles }),
      withComponentOverrides("testimonial", 3, { props: { ...testimonialDefaults, heading: "Client Growth Reviews" }, styles: testimonialStyles }),
      withComponentOverrides("form", 4, { props: { ...formDefaults, heading: "Schedule a Growth Consultation", description: "Let us analyze your current marketing channels.", submitLabel: "Request Call" } }),
      withComponentOverrides("footer", 5, { props: templateFooter(projectName, "Digital marketing, brand growth, and performance ads."), styles: footerStyles }),
    ],

    /* ── Nexora / Agency ─────────────────────────────────────────── */
    nexora: () => {
      let order = 0;
      return [
        // 1. HEADER / NAVIGATION
        withComponentOverrides("navigation", order++, {
          props: {
            ...navigationDefaults,
            brand: "NEXORA",
            links: [
              { label: "Home" },
              { label: "About" },
              { label: "Services" },
              { label: "Work" },
              { label: "Process" },
              { label: "Pricing" },
              { label: "Contact" },
            ],
            cta: { label: "Let's Talk", href: "#contact" },
          },
          styles: {
            ...navStyles,
            backgroundColor: "#ffffff",
            color: "#0B1D40",
            padding: "16px 32px",
            borderRadius: bold ? "16px" : "0",
            border: bold ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
            boxShadow: "0 4px 20px -2px rgba(11, 29, 64, 0.07)",
          },
        }),

        // 2. HERO SECTION
        withComponentOverrides("hero", order++, {
          props: {
            ...heroDefaults,
            title: "Transforming Ideas Into Digital Experiences",
            description: "We design and build high-performance digital products that help ambitious brands grow, connect and lead.",
            cta: { label: "Start a Project", href: "#contact" },
            layout: "split",
            align: "left",
          },
          styles: {
            ...baseHeroStyles,
            backgroundColor: "#070d19",
            backgroundImage: "radial-gradient(ellipse at 85% 20%, rgba(59, 130, 246, 0.35) 0%, rgba(15, 23, 42, 0) 70%), linear-gradient(135deg, #070d19 0%, #0B1D40 50%, #1e1b4b 100%)",
            color: "#ffffff",
            padding: "80px 48px",
            borderRadius: bold ? "24px" : "0",
            border: bold ? "1px solid rgba(59, 130, 246, 0.25)" : undefined,
            boxShadow: bold ? "0 25px 65px -15px rgba(11, 29, 64, 0.4)" : undefined,
          },
        }),

        // 3. TRUSTED BY - COMPACT STRIP
        withComponentOverrides("features", order++, {
          props: {
            ...featuresDefaults,
            heading: "Trusted by teams building what comes next",
            items: [
              { title: "ORBIT", description: "Enterprise SaaS" },
              { title: "VERTEX", description: "Cloud Infrastructure" },
              { title: "NOVA", description: "FinTech Solutions" },
              { title: "LUMEN", description: "Digital Commerce" },
              { title: "APEX", description: "Data Analytics" },
              { title: "QUANTUM", description: "AI Research" },
            ],
            columns: 3,
          },
          styles: {
            backgroundColor: "#ffffff",
            color: "#0B1D40",
            padding: "36px 32px",
            borderRadius: "0",
            border: undefined,
            boxShadow: undefined,
          },
        }),

        // 4. ABOUT SECTION - EDITORIAL LAYOUT
        withComponentOverrides("features", order++, {
          props: {
            ...featuresDefaults,
            heading: "Built for ambitious digital teams",
            items: [
              { title: "120+ Projects Delivered", description: "From startups to global enterprises, we've shipped products that scale." },
              { title: "48 Global Clients", description: "Nexora partners with forward-thinking businesses to turn complex ideas into simple, engaging and scalable digital experiences." },
              { title: "12 Countries Reached", description: "Our distributed team delivers world-class work across time zones." },
              { title: "98% Client Satisfaction", description: "Consistently exceeding expectations through collaboration and craft." },
            ],
            columns: 2,
          },
          styles: {
            backgroundColor: "#f8fafc",
            backgroundImage: "linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%)",
            color: "#0B1D40",
            padding: "64px 40px",
            borderRadius: bold ? "20px" : "0",
            border: bold ? "1px solid #c7d2fe" : undefined,
            boxShadow: bold ? "0 12px 35px -5px rgba(99, 102, 241, 0.1)" : undefined,
          },
        }),

        // 5. SERVICES
        withComponentOverrides("features", order++, {
          props: {
            ...featuresDefaults,
            heading: "Everything you need to move faster",
            items: [
              { title: "Product Design", description: "Human-centered interfaces designed for clarity and conversion." },
              { title: "Web Development", description: "Fast, scalable and responsive experiences built for modern businesses." },
              { title: "Mobile Applications", description: "Intuitive mobile products designed around real customer needs." },
              { title: "AI & Automation", description: "Intelligent workflows that reduce complexity and unlock productivity." },
              { title: "E-Commerce", description: "High-converting digital storefronts built for growth." },
              { title: "Digital Strategy", description: "Clear product and growth strategies backed by research and insight." },
            ],
            columns: 3,
          },
          styles: {
            backgroundColor: "#ffffff",
            color: "#0B1D40",
            padding: "64px 40px",
            borderRadius: bold ? "20px" : "0",
            border: undefined,
            boxShadow: undefined,
          },
        }),

        // 6. WHY CHOOSE US / STATS - HIGH IMPACT BAND
        withComponentOverrides("features", order++, {
          props: {
            ...featuresDefaults,
            heading: "Built to create measurable impact",
            items: [
              { title: "4.9/5 Average Client Rating", description: "Strategy First — Every project starts with deep research and a clear plan." },
              { title: "2.4M+ Users Reached", description: "Design That Converts — Interfaces crafted for engagement and results." },
              { title: "35% Average Conversion Lift", description: "Engineering Excellence — Clean, scalable code built for performance." },
              { title: "99.9% Platform Reliability", description: "Long-Term Partnership — We grow with you beyond launch day." },
            ],
            columns: 2,
          },
          styles: {
            backgroundColor: "#070e1b",
            backgroundImage: "radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.35) 0%, transparent 50%), radial-gradient(circle at 90% 80%, rgba(6, 182, 212, 0.3) 0%, transparent 50%), linear-gradient(145deg, #070e1b 0%, #0d1e3d 50%, #050a14 100%)",
            color: "#ffffff",
            padding: "68px 40px",
            borderRadius: bold ? "24px" : "0",
            border: bold ? "1px solid rgba(99, 102, 241, 0.3)" : undefined,
            boxShadow: bold ? "0 25px 60px -10px rgba(15, 35, 75, 0.45)" : undefined,
          },
        }),

        // 7. FEATURED WORK / PORTFOLIO
        withComponentOverrides("features", order++, {
          props: {
            ...featuresDefaults,
            heading: "Selected work",
            items: [
              { title: "AURORA — Digital Banking Experience", description: "A complete digital banking platform redesign that increased user engagement by 40% and reduced support tickets by 60%." },
              { title: "VITALIS — Healthcare Platform", description: "An intuitive patient-provider platform serving 200K+ users across 12 hospitals." },
              { title: "MONARCH — Luxury E-Commerce", description: "A premium online shopping experience with a 52% increase in average order value." },
              { title: "PULSE — AI Productivity Platform", description: "An intelligent workspace tool that saves teams an average of 12 hours per week." },
            ],
            columns: 2,
          },
          styles: {
            backgroundColor: "#f8fafc",
            color: "#0B1D40",
            padding: "64px 40px",
            borderRadius: bold ? "20px" : "0",
            border: undefined,
            boxShadow: undefined,
          },
        }),

        // 8. PROCESS — HOW WE WORK
        withComponentOverrides("features", order++, {
          props: {
            ...featuresDefaults,
            heading: "From first idea to lasting impact",
            items: [
              { title: "01 — Discover", description: "We understand your users, goals and business challenges." },
              { title: "02 — Define", description: "We turn insights into a focused product strategy." },
              { title: "03 — Design", description: "We create intuitive experiences that people love to use." },
              { title: "04 — Build", description: "We engineer fast, reliable and scalable products." },
              { title: "05 — Launch & Grow", description: "We measure, optimize and continuously improve." },
            ],
            columns: 3,
          },
          styles: {
            backgroundColor: "#ffffff",
            color: "#0B1D40",
            padding: "64px 40px",
            borderRadius: bold ? "20px" : "0",
            border: undefined,
            boxShadow: undefined,
          },
        }),

        // 9. TESTIMONIALS
        withComponentOverrides("testimonial", order++, {
          props: {
            ...testimonialDefaults,
            heading: "What our clients say",
            items: [
              {
                quote: "Working with Nexora transformed the way we think about our digital product. The team delivered beyond expectations.",
                name: "Sarah Mitchell",
                role: "VP Product, Aurora",
                rating: 5,
              },
              {
                quote: "From strategy to launch, every stage was handled with clarity and precision.",
                name: "Daniel Carter",
                role: "Founder, Vertex",
                rating: 5,
              },
              {
                quote: "Nexora helped us turn a complicated idea into an experience our customers immediately understood.",
                name: "Maya Rodriguez",
                role: "Head of Growth, Lumen",
                rating: 5,
              },
            ],
            layout: "cards",
          },
          styles: {
            backgroundColor: "#f0fdf4",
            backgroundImage: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f4fb 100%)",
            color: "#0B1D40",
            padding: "64px 40px",
            borderRadius: bold ? "20px" : "0",
            border: bold ? "1px solid #bbf7d0" : undefined,
            boxShadow: bold ? "0 12px 35px -5px rgba(34, 197, 94, 0.08)" : undefined,
          },
        }),

        // 10. TECHNOLOGY / EXPERTISE
        withComponentOverrides("features", order++, {
          props: {
            ...featuresDefaults,
            heading: "Technology that moves business forward",
            items: [
              { title: "AI & Machine Learning", description: "Custom models and intelligent automation for smarter products." },
              { title: "Cloud Platforms", description: "Scalable infrastructure on AWS, GCP and Azure." },
              { title: "Modern Web", description: "React, Next.js, TypeScript — fast and maintainable." },
              { title: "Mobile", description: "Native and cross-platform apps for iOS and Android." },
              { title: "Data & Analytics", description: "Dashboards, pipelines and insights that drive decisions." },
              { title: "Automation", description: "CI/CD, testing and workflow automation at scale." },
            ],
            columns: 3,
          },
          styles: {
            backgroundColor: "#090f20",
            backgroundImage: "radial-gradient(circle at 50% 0%, rgba(37, 99, 235, 0.3) 0%, transparent 60%), linear-gradient(180deg, #090f20 0%, #0f1c3f 100%)",
            color: "#ffffff",
            padding: "68px 40px",
            borderRadius: bold ? "22px" : "0",
            border: bold ? "1px solid rgba(59, 130, 246, 0.3)" : undefined,
            boxShadow: bold ? "0 25px 60px -10px rgba(11, 29, 64, 0.45)" : undefined,
          },
        }),

        // 11. PRICING / PACKAGES
        withComponentOverrides("pricing-table", order++, {
          props: {
            ...pricingTableDefaults,
            heading: "Choose the right way to start",
            tiers: [
              {
                name: "Starter",
                price: "$1,500",
                period: "per project",
                features: ["Product strategy", "UX/UI design", "Landing page", "Basic analytics"],
                cta: "Get Started",
                highlighted: false,
              },
              {
                name: "Growth",
                price: "$4,500",
                period: "per project",
                features: ["Product strategy", "UX/UI design", "Full website", "Integrations", "Analytics", "Optimization"],
                cta: "Start Growing",
                highlighted: true,
              },
              {
                name: "Scale",
                price: "Custom",
                period: "contact us",
                features: ["Product strategy", "Design system", "Web/mobile development", "AI & automation", "Continuous optimization"],
                cta: "Contact Us",
                highlighted: false,
              },
            ],
          },
          styles: {
            ...pricingStyles,
            backgroundColor: "#ffffff",
            color: "#0B1D40",
            padding: "68px 40px",
            borderRadius: bold ? "22px" : "0",
            border: undefined,
            boxShadow: undefined,
          },
        }),

        // 12. FAQ
        withComponentOverrides("accordion", order++, {
          props: {
            items: [
              { title: "How long does a project take?", content: "Most projects take 4–12 weeks depending on scope and complexity. We provide a clear timeline during the Define phase so you always know what to expect." },
              { title: "What industries do you work with?", content: "We work across technology, finance, healthcare, e-commerce, education and more. Our process adapts to the specific needs of each industry." },
              { title: "Can you redesign an existing website?", content: "Absolutely. We regularly help companies modernize their digital presence — from visual refresh to full architecture overhaul." },
              { title: "Do you provide ongoing support?", content: "Yes. After launch we offer maintenance, optimization and growth packages to ensure your product keeps performing." },
              { title: "Can you integrate AI and automation?", content: "Yes — it is one of our core capabilities. We build custom AI features, workflow automation and intelligent analytics into digital products." },
            ],
            allowMultiple: false,
          },
          styles: {
            backgroundColor: "#f8fafc",
            color: "#0B1D40",
            padding: "52px 32px",
            borderRadius: bold ? "18px" : "0",
            border: undefined,
            boxShadow: undefined,
          },
        }),

        // 13. FINAL CTA
        withComponentOverrides("contact", order++, {
          props: {
            ...contactDefaults,
            title: "Have an idea worth building?",
            description: "Let's turn your next big idea into a digital experience people remember.",
            inputPlaceholder: "your@email.com",
            cta: { label: "Start a Conversation", href: "#contact" },
          },
          styles: {
            backgroundColor: "#070d19",
            backgroundImage: "radial-gradient(circle at 100% 0%, rgba(244, 63, 94, 0.3) 0%, transparent 45%), radial-gradient(circle at 0% 100%, rgba(59, 130, 246, 0.35) 0%, transparent 45%), linear-gradient(135deg, #070d19 0%, #0f172a 50%, #1e1b4b 100%)",
            color: "#ffffff",
            padding: "72px 44px",
            borderRadius: bold ? "24px" : "0",
            border: bold ? "1px solid rgba(168, 85, 247, 0.35)" : undefined,
            boxShadow: bold ? "0 25px 60px -10px rgba(17, 34, 77, 0.45)" : undefined,
          },
        }),

        // 14. CONTACT FORM
        withComponentOverrides("form", order++, {
          props: {
            ...formDefaults,
            heading: "Let's build something remarkable",
            description: "hello@nexora.example  ·  +1 555 014 2026  ·  Global / Remote",
            fields: [
              { name: "name", type: "text" as const, label: "Name", placeholder: "Your name", required: true },
              { name: "email", type: "email" as const, label: "Email", placeholder: "you@company.com", required: true },
              { name: "company", type: "text" as const, label: "Company", placeholder: "Company name" },
              { name: "projectType", type: "select" as const, label: "Project Type", placeholder: "Select type", options: ["Product Design", "Web Development", "Mobile App", "AI & Automation", "E-Commerce", "Digital Strategy"] },
              { name: "message", type: "textarea" as const, label: "Message", placeholder: "Tell us about your project...", required: true },
            ],
            submitLabel: "Send Inquiry",
            successMessage: "Thank you! We'll be in touch shortly.",
          },
          styles: {
            backgroundColor: "#ffffff",
            color: "#0B1D40",
            padding: "60px 40px",
            borderRadius: bold ? "20px" : "0",
            border: undefined,
            boxShadow: undefined,
          },
        }),

        // 15. FOOTER
        withComponentOverrides("footer", order++, {
          props: {
            brand: "NEXORA",
            tagline: "Transforming Ideas Into Digital Experiences",
            columns: [
              {
                title: "Company",
                links: [
                  { label: "About", href: "#" },
                  { label: "Work", href: "#" },
                  { label: "Careers", href: "#" },
                  { label: "Contact", href: "#" },
                ],
              },
              {
                title: "Services",
                links: [
                  { label: "Product Design", href: "#" },
                  { label: "Development", href: "#" },
                  { label: "AI & Automation", href: "#" },
                  { label: "E-Commerce", href: "#" },
                ],
              },
              {
                title: "Resources",
                links: [
                  { label: "Insights", href: "#" },
                  { label: "Case Studies", href: "#" },
                  { label: "FAQ", href: "#" },
                  { label: "Support", href: "#" },
                ],
              },
            ],
            copyright: "© 2026 Nexora. All rights reserved.  ·  Privacy Policy  ·  Terms",
            socials: [
              { platform: "linkedin", url: "#" },
              { platform: "instagram", url: "#" },
              { platform: "twitter", url: "#" },
            ],
          },
          styles: {
            ...footerStyles,
            backgroundColor: "#050a14",
            backgroundImage: "linear-gradient(180deg, #090f20 0%, #030712 100%)",
            color: "#cbd5e1",
            borderRadius: bold ? "24px" : "0",
            border: bold ? "1px solid rgba(255, 255, 255, 0.08)" : undefined,
            boxShadow: undefined,
            padding: "52px 40px 32px",
          },
        }),
      ];
    },
    agency: () => templates.nexora!(),
  };

  const allComponents = templates[categoryKey]?.() ?? null;

  // ── Filter to user-selected sections ────────────────────────────────────
  // When selectedSections is provided and non-empty, keep only the
  // components whose type matches a section id the user checked in step 4.
  if (!allComponents || !selectedSections || selectedSections.length === 0) {
    return allComponents;
  }

  const allowed = new Set(selectedSections);
  const filtered = allComponents.filter((c) => allowed.has(c.type));

  // Re-index the order field so there are no gaps after filtering.
  return filtered.map((c, i) => ({ ...c, order: i }));
};

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
  Restaurant: {
    hero: "Create a mouth-watering restaurant website",
    description: "Showcase menus, reservations, location details, and guest-friendly contact sections.",
    features: [
      { title: "Menu highlights", description: "Feature signature dishes and seasonal specials" },
      { title: "Reservation ready", description: "Guide guests toward booking or contact" },
      { title: "Location clarity", description: "Make hours, map, and phone details easy to find" },
    ],
  },
  Construction: {
    hero: "Build a strong construction & contracting website",
    description: "Showcase project highlights, engineering services, safety commitments, and quote requests.",
    features: [
      { title: "Project highlights", description: "Showcase completed construction builds" },
      { title: "Service clarity", description: "List civil, commercial, and engineering capabilities" },
      { title: "Quote requests", description: "Make inquiries simple for prospective clients" },
    ],
  },
  "Digital Marketing": {
    hero: "Build a high-converting digital marketing website",
    description: "Showcase performance stats, marketing capabilities, client reviews, and strategy bookings.",
    features: [
      { title: "Growth capabilities", description: "Detail SEO, ads, content, and strategy" },
      { title: "Client reviews", description: "Build trust with client case studies" },
      { title: "Consultation path", description: "Guide visitors to book a strategy call" },
    ],
  },
};

const createRequirementComponents = (requirements: BuilderRequirements) => {
  const projectName = requirements.projectName || "Stackly Studio";
  const category = requirements.category || "Business";
  const style = requirements.style || "Modern";
  const selectedSections = requirements.sections?.length ? requirements.sections : undefined;
  const categoryTemplate = buildCategoryTemplate(category, projectName, style, selectedSections);
  if (categoryTemplate) return categoryTemplate;
  const copy = categoryCopy[category] || categoryCopy.Business;
  const fallbackSections = requirements.sections?.length ? requirements.sections : ["navigation", "hero", "features", "contact"];
  const sectionTypes: ComponentType[] = fallbackSections
    .map((section) => {
      if (section === "gallery") return "gallery";
      if (section === "leadForm") return "contact";
      return section as ComponentType;
    })
    .filter((section): section is ComponentType =>
      ["navigation", "hero", "heading", "text", "button", "icon", "feature-item", "columns", "image", "input", "divider", "features", "gallery", "contact", "container", "video", "map", "accordion", "tabs", "spacer", "social-links", "countdown", "pricing-table", "product-collection", "testimonial", "footer", "form", "row"].includes(section),
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
      const isMinimal = style === "Minimal";
      const isBold = style === "Bold";
      return {
        ...component,
        // Write typed props; AI generation follows the same HeroProps shape.
        props: {
          ...heroDefaults,
          title: copy.hero,
          description: copy.description,
          cta: { label: "Start Building" },
          layout: isMinimal ? "centered" : "split",
          align: isMinimal ? "center" : "left",
        },
        styles: {
          ...component.styles,
          backgroundColor: isMinimal ? "#ffffff" : isBold ? "#0B1D40" : "#eef4fb",
          color: isBold ? "#ffffff" : "#0B1D40",
          borderRadius: isMinimal ? "0" : isBold ? "24px" : "0",
          padding: isBold ? "72px 48px" : isMinimal ? "64px 32px" : "60px 40px",
          ...(isMinimal ? { textAlign: "center" as const } : {}),
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
const GROUP_MARKER_PROP = "__stacklyGroup";

/** Push current components onto the history stack and clear redo future. */
function captureHistory(
  state: Pick<BuilderState, "components" | "history">,
): Pick<BuilderState, "history" | "future"> {
  return {
    history: [...state.history.slice(-(MAX_HISTORY - 1)), state.components],
    future: [],
  };
}

/**
 * Explicitly entering freeform is the only time we seed positions for an
 * existing flow page. Loading, importing, and previewing never mutate legacy
 * documents, preserving backwards compatibility until the user opts in.
 */
function materializeFreeformFrames(components: BuilderComponent[]): BuilderComponent[] {
  let nextY = 40;
  const canvasWidth = 1280;
  return components.map((component) => {
    const width = component.freeformSize?.width ?? getFreeformDefaultWidth(canvasWidth, component.type);
    const estimatedHeight = component.freeformSize?.height
      ?? getFreeformDefaultHeight(component.type);
    const defaultX = Math.max(0, Math.round((canvasWidth - width) / 2));
    const position = component.position ?? { x: defaultX, y: nextY };
    nextY = Math.max(nextY, position.y + estimatedHeight + 24);
    return component.position ? component : { ...component, position };
  });
}

/** Place click/quick-inserted roots beneath the current Freeform document. */
function positionNewFreeformRoot(
  component: BuilderComponent,
  siblings: BuilderComponent[],
): BuilderComponent {
  let nextY = 40;
  const canvasWidth = 1280;
  siblings.forEach((sibling, index) => {
    const width = sibling.freeformSize?.width ?? getFreeformDefaultWidth(canvasWidth, sibling.type);
    const defaultX = Math.max(0, Math.round((canvasWidth - width) / 2));
    const fallbackY = 40 + index * (getFreeformDefaultHeight(sibling.type) + 24);
    const position = sibling.position ?? { x: defaultX, y: fallbackY };
    const height = sibling.freeformSize?.height ?? getFreeformDefaultHeight(sibling.type);
    nextY = Math.max(nextY, position.y + height + 24);
  });
  const width = component.freeformSize?.width ?? getFreeformDefaultWidth(canvasWidth, component.type);
  const defaultX = Math.max(0, Math.round((canvasWidth - width) / 2));
  return { ...component, position: { x: defaultX, y: nextY } };
}

/** Freeform frames belong to top-level blocks; nested children retain flow layout. */
function resolveFreeformSelectionId(components: BuilderComponent[], id: string | null): string | null {
  if (!id) return null;
  const root = components.find((component) =>
    component.id === id || Boolean(findComponentById(component.children, id)),
  );
  return root?.id ?? null;
}

/** Offset a copied root just enough to make a Freeform duplicate discoverable. */
function offsetFreeformCopy(component: BuilderComponent, offset = 24): BuilderComponent {
  if (!component.position) return component;
  return {
    ...component,
    position: {
      x: Math.max(0, Math.round(component.position.x + offset)),
      y: Math.max(0, Math.round(component.position.y + offset)),
    },
  };
}

/**
 * Update selected nodes in one tree walk. Returning untouched array/object
 * references keeps the large-page Freeform canvas from re-rendering branches
 * that did not participate in a bulk style operation.
 */
function patchSelectedStyles(
  components: BuilderComponent[],
  selectedIds: Set<string>,
  styles: Partial<ComponentStyles>,
): BuilderComponent[] {
  let changed = false;
  const next = components.map((component) => {
    const children = patchSelectedStyles(component.children, selectedIds, styles);
    const isSelected = selectedIds.has(component.id);
    if (!isSelected && children === component.children) return component;
    changed = true;
    return {
      ...component,
      ...(isSelected ? { styles: { ...component.styles, ...styles } } : {}),
      children,
    };
  });
  return changed ? next : components;
}

type FreeformPositionUpdate = { id: string; x: number; y: number };

/** Apply a batch of drag coordinates in one immutable tree walk (no history). */
function patchFreeformPositions(
  components: BuilderComponent[],
  positions: Map<string, Omit<FreeformPositionUpdate, "id">>,
  snap = true,
): BuilderComponent[] {
  let changed = false;
  const normalize = (value: number) => Math.max(
    0,
    snap ? Math.round(value / 8) * 8 : Math.round(value),
  );
  const next = components.map((component) => {
    const children = patchFreeformPositions(component.children, positions, snap);
    const position = positions.get(component.id);
    if (!position && children === component.children) return component;
    changed = true;
    return {
      ...component,
      ...(position
        ? { position: { x: normalize(position.x), y: normalize(position.y) } }
        : {}),
      children,
    };
  });
  return changed ? next : components;
}

const STORAGE_KEY = "stackly-builder-draft";

let autosaveController: AbortController | null = null;
let saveHtmlController: AbortController | null = null;
let autosaveSeq = 0;
let saveHtmlSeq = 0;

function linkedAbortController(signal?: AbortSignal): AbortController {
  const controller = new AbortController();
  if (signal?.aborted) {
    controller.abort();
  } else if (signal) {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  return controller;
}

function buildProjectData(state: BuilderState): ProjectBuilderData {
  return {
    schemaVersion: 1,
    components: state.components,
    sections: state.components,
    designTokens: useDesignStore.getState().tokens,
    seo: useDesignStore.getState().seo,
    canvasMode: state.canvasMode,
    projectName: state.currentProjectName ?? undefined,
  };
}

/**
 * Build a publish-only snapshot from the current canvas. It intentionally does
 * not mutate `components`: local asset ids/data URLs remain available to the
 * editor while the deployment copy is rewritten to stable `assets/...` paths.
 */
async function buildDeploymentPackageForState(state: BuilderState): Promise<DeploymentPackage> {
  const assetStore = useAssetStore.getState();
  await assetStore.loadAssets();
  const latestAssets = useAssetStore.getState();

  return createDeploymentPackage({
    builderData: buildProjectData(state),
    workspaceId: state.currentProjectId,
    projectName: state.currentProjectName,
    assetResolver: {
      assets: latestAssets.assets,
      getDataUrl: latestAssets.getDataUrl,
    },
  });
}

function getSaveErrorMessage(error: unknown, fallback: string): string {
  if (isProjectConnectionError(error)) {
    return "Unable to reach the project service. Your work is still on the canvas.";
  }

  return error instanceof Error ? error.message : fallback;
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
  components: [],
  selectedComponentId: null,
  selectedTextStyleTarget: null,
  currentProjectId: null,
  currentProjectName: null,
  isDirty: false,
  lastSaved: null,
  isSaving: false,
  saveStatus: "idle",
  saveError: null,
  selectedComponentIds: [],
  clipboard: null,
  isInlineEditing: false,
  history: [],
  future: [],
  viewport: "desktop",
  setViewport: (v: Viewport) => set({ viewport: v }),
  canvasMode: "flow",
  toggleCanvasMode: () =>
    set((state) => {
      const canvasMode = state.canvasMode === "flow" ? "freeform" : "flow";
      if (canvasMode !== "freeform") return { canvasMode };
      const components = materializeFreeformFrames(state.components);
      const selectedComponentIds = [...new Set(
        state.selectedComponentIds
          .map((id) => resolveFreeformSelectionId(components, id))
          .filter((id): id is string => Boolean(id)),
      )];
      return {
        canvasMode,
        components,
        selectedComponentIds,
        selectedComponentId: selectedComponentIds[0] ?? null,
        selectedTextStyleTarget: null,
      };
    }),
  setCanvasMode: (canvasMode) =>
    set((state) => {
      if (canvasMode !== "freeform") return { canvasMode };
      const components = materializeFreeformFrames(state.components);
      const selectedComponentIds = [...new Set(
        state.selectedComponentIds
          .map((id) => resolveFreeformSelectionId(components, id))
          .filter((id): id is string => Boolean(id)),
      )];
      return {
        canvasMode,
        components,
        selectedComponentIds,
        selectedComponentId: selectedComponentIds[0] ?? null,
        selectedTextStyleTarget: null,
      };
    }),
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
        const selectionId = state.canvasMode === "freeform"
          ? resolveFreeformSelectionId(state.components, parentId)
          : component.id;

        return {
          ...captureHistory(state),
          components,
          selectedComponentId: selectionId,
          selectedComponentIds: selectionId ? [selectionId] : [],
          selectedTextStyleTarget: null,
        };
      }

      const baseComponent = createComponent(type, state.components.length);
      const component = state.canvasMode === "freeform"
        ? positionNewFreeformRoot(baseComponent, state.components)
        : baseComponent;

      if (afterId) {
        const result = insertAfterNodeById(state.components, afterId, component);
        const components = result ? orderComponents(result) : [...state.components, component];
        const selectionId = state.canvasMode === "freeform"
          ? resolveFreeformSelectionId(components, component.id)
          : component.id;

        return {
          ...captureHistory(state),
          components,
          selectedComponentId: selectionId,
          selectedComponentIds: selectionId ? [selectionId] : [],
          selectedTextStyleTarget: null,
        };
      }

      return {
        ...captureHistory(state),
        components: [...state.components, component],
        selectedComponentId: component.id,
        selectedComponentIds: [component.id],
        selectedTextStyleTarget: null,
      };
    }),
  insertComponentBefore: (type, beforeId) =>
    set((state) => {
      const idx = state.components.findIndex((c) => c.id === beforeId);
      const baseComponent = createComponent(type, 0);
      const component = state.canvasMode === "freeform"
        ? positionNewFreeformRoot(baseComponent, state.components)
        : baseComponent;

      if (idx >= 0) {
        const next = [
          ...state.components.slice(0, idx),
          component,
          ...state.components.slice(idx),
        ];
        return {
          ...captureHistory(state),
          components: orderComponents(next),
          selectedComponentId: component.id,
          selectedComponentIds: [component.id],
          selectedTextStyleTarget: null,
        };
      }

      // Fallback: append if beforeId not found at top level
      return {
        ...captureHistory(state),
        components: [...state.components, component],
        selectedComponentId: component.id,
        selectedComponentIds: [component.id],
        selectedTextStyleTarget: null,
      };
    }),
  updateComponent: (id, updates) =>
    set((state) => ({
      ...captureHistory(state),
      components: updateNodeById(state.components, id, (c) => ({
        ...c,
        ...updates,
        styles: { ...c.styles, ...updates.styles },
        // Shallow-merge typed `props` so callers can patch a single field
        // without clobbering the rest (mirrors the styles merge pattern).
        props: updates.props ? { ...(c.props ?? {}), ...updates.props } : c.props,
        textStyles: updates.textStyles ? { ...(c.textStyles ?? {}), ...updates.textStyles } : c.textStyles,
        responsiveStyles: updates.responsiveStyles
          ? {
              ...c.responsiveStyles,
              ...updates.responsiveStyles,
            }
          : c.responsiveStyles,
      })),
    })),
  duplicateComponent: (id) =>
    set((state) => {
      const source = findComponentById(state.components, id);

      if (!source) return state;

      const copy = state.canvasMode === "freeform"
        ? offsetFreeformCopy(deepCloneComponent(source))
        : deepCloneComponent(source);
      const components = insertAfterNodeById(state.components, id, copy);

      if (!components) return state;
      const selectionId = state.canvasMode === "freeform"
        ? resolveFreeformSelectionId(components, copy.id)
        : copy.id;

      return {
        ...captureHistory(state),
        components: orderComponents(components),
        selectedComponentId: selectionId,
        selectedComponentIds: selectionId ? [selectionId] : [],
        selectedTextStyleTarget: null,
      };
    }),
  deleteComponent: (id) =>
    set((state) => {
      if (!findComponentById(state.components, id)) return state;
      const remainingSelected = state.selectedComponentIds.filter(
        (selectedId) => selectedId !== id && !isAncestorOf(state.components, id, selectedId),
      );
      return {
        ...captureHistory(state),
        components: orderComponents(deleteNodeById(state.components, id)),
        selectedComponentId: remainingSelected[0] ?? null,
        selectedComponentIds: remainingSelected,
        selectedTextStyleTarget: null,
      };
    }),
  selectComponent: (id) => set((state) => {
    const selectionId = state.canvasMode === "freeform"
      ? resolveFreeformSelectionId(state.components, id)
      : id;
    return {
      selectedComponentId: selectionId,
      selectedComponentIds: selectionId ? [selectionId] : [],
      selectedTextStyleTarget: null,
    };
  }),
  selectTextStyleTarget: (target) => set((state) => {
    const selectionId = state.canvasMode === "freeform"
      ? resolveFreeformSelectionId(state.components, target?.componentId ?? null)
      : target?.componentId ?? null;
    return {
      selectedTextStyleTarget: state.canvasMode === "freeform" ? null : target,
      selectedComponentId: selectionId,
      selectedComponentIds: selectionId ? [selectionId] : [],
    };
  }),
  reorderComponents: (activeId, overId) =>
    set((state) => {
      const result = reorderTreeComponents(state.components, activeId, overId);
      return { ...captureHistory(state), components: orderComponents(result) };
    }),
  loadStarterWebsite: () =>
    set((state) => {
      const generated: BuilderComponent[] = ["navigation", "hero", "features", "gallery", "contact"].map((type, index) =>
        createComponent(type as ComponentType, index),
      );
      const components = state.canvasMode === "freeform"
        ? materializeFreeformFrames(generated)
        : generated;
      return {
        ...captureHistory(state),
        components,
        selectedComponentId: components[0]?.id || null,
        selectedComponentIds: components[0] ? [components[0].id] : [],
        selectedTextStyleTarget: null,
      };
    }),
  loadWebsiteFromRequirements: (requirements) =>
    set((state) => {
      const generated = createRequirementComponents(requirements);
      const components = state.canvasMode === "freeform"
        ? materializeFreeformFrames(generated)
        : generated;
      return {
        ...captureHistory(state),
        components,
        selectedComponentId: components[0]?.id || null,
        selectedComponentIds: components[0] ? [components[0].id] : [],
        selectedTextStyleTarget: null,
      };
    }),
  applyAILayout: (suggestion) =>
    set((state) => {
      const generated = suggestion.sections
        .map((section, index) => createAISectionComponent(section, index, suggestion.colorPalette))
        .filter((component): component is BuilderComponent => component !== null)
        .map((component, index) => ({ ...component, order: index }));

      // Do not clear a working canvas for a malformed or empty response.
      if (generated.length === 0) return state;
      const components = state.canvasMode === "freeform"
        ? materializeFreeformFrames(generated)
        : generated;

      return {
        ...captureHistory(state),
        components,
        selectedComponentId: components[0]?.id ?? null,
        selectedComponentIds: components[0] ? [components[0].id] : [],
        selectedTextStyleTarget: null,
      };
    }),
  loadComponents: (components) =>
    set((state) => ({
      ...captureHistory(state),
      components: orderComponents(cloneComponentTree(components)),
      selectedComponentId: null,
      selectedComponentIds: [],
    })),
  applyDesignTokens: (tokens) =>
    set((state) => ({
      ...captureHistory(state),
      components: state.components.map((component) => applyTokensToComponent(component, tokens)),
    })),
  clearCanvas: () =>
    set((state) => ({
      ...captureHistory(state),
      components: [],
      selectedComponentId: null,
      selectedComponentIds: [],
      selectedTextStyleTarget: null,
    })),
  exportHtml: () => generateHtml(
    get().components,
    useDesignStore.getState().seo,
    get().currentProjectId || undefined,
    useDesignStore.getState().tokens,
    { canvasMode: get().canvasMode },
  ),
  prepareDeploymentPackage: async () => buildDeploymentPackageForState(get()),
  undo: () =>
    set((state) => {
      if (state.history.length === 0) return state;
      const prev = state.history[state.history.length - 1];
      return {
        history: state.history.slice(0, -1),
        future: [state.components, ...state.future.slice(0, MAX_HISTORY - 1)],
        components: prev,
        selectedComponentId: null,
        selectedComponentIds: [],
        selectedTextStyleTarget: null,
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
        selectedComponentIds: [],
        selectedTextStyleTarget: null,
      };
    }),
  saveToLocalStorage: () => {
    void get().autosave();
  },
  loadFromLocalStorage: () => false,
  markDirty: () => set({ isDirty: true, saveStatus: "idle", saveError: null }),
  loadProject: async (id, signal) => {
    set({ isSaving: true, saveStatus: "saving", saveError: null });

    try {
      const project = await getProject(id, signal);
      const builderData = project.builderData ?? {};
      const savedComponents = Array.isArray(builderData.components)
        ? builderData.components
        : Array.isArray(builderData.sections)
          ? builderData.sections
          : [];

      // A freshly created project has no saved components yet. Populate the
      // canvas from its requirement metadata (category / style / sections)
      // by reusing the same generator the requirements flow uses.
      const isBlockPagesProject = Boolean(builderData?.blockPagesData) || project.category === "blockpages";
      const hasRequirements = Boolean(project.category) || (project.sections?.length ?? 0) > 0;
      const shouldGenerate = savedComponents.length === 0 && hasRequirements && !isBlockPagesProject;
      const components = shouldGenerate
        ? createRequirementComponents({
            projectName: project.projectName || builderData.projectName || "My Website",
            category: project.category || "Business",
            style: project.style || "Modern",
            sections: project.sections ?? [],
          })
        : savedComponents;

      if (builderData.designTokens) {
        useDesignStore.getState().setTokens(builderData.designTokens);
      }
      if (builderData.seo) {
        useDesignStore.getState().setSEO(builderData.seo);
      }

      set(() => ({
        components: orderComponents(cloneComponentTree(components)),
        selectedComponentId: null,
        selectedTextStyleTarget: null,
        selectedComponentIds: [],
        currentProjectId: project._id,
        currentProjectName: project.projectName || builderData.projectName || "Untitled Project",
        canvasMode: builderData.canvasMode ?? "flow",
        isDirty: shouldGenerate,
        lastSaved: project.updatedAt ?? null,
        isSaving: false,
        saveStatus: "saved",
        saveError: null,
        history: [],
        future: [],
      }));

      // Persist the generated starter layout once so a reopen restores it
      // (and so htmlContent is available for publishing) without needing an edit.
      if (shouldGenerate) {
        void get().autosave();
      }
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        set({ isSaving: false, saveStatus: "idle" });
        return false;
      }

      set({
        isSaving: false,
        saveStatus: "error",
        saveError: getSaveErrorMessage(error, "Unable to open this project."),
      });
      return false;
    }
  },
  autosave: async (signal) => {
    const state = get();
    if (!state.currentProjectId || state.components.length === 0) return false;

    autosaveController?.abort();
    autosaveController = linkedAbortController(signal);
    const seq = ++autosaveSeq;

    set({ isSaving: true, saveStatus: "saving", saveError: null });

    try {
      const savedAt = new Date().toISOString();
      await autosaveProject(
        state.currentProjectId,
        {
          builderData: buildProjectData(state),
          htmlContent: state.exportHtml(),
        },
        autosaveController.signal,
      );

      if (seq === autosaveSeq) {
        set({ isDirty: false, lastSaved: savedAt, isSaving: false, saveStatus: "saved", saveError: null });
      }
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        if (seq === autosaveSeq) set({ isSaving: false, saveStatus: "idle" });
        return false;
      }

      if (seq === autosaveSeq) {
        set({
          isSaving: false,
          saveStatus: "error",
          saveError: getSaveErrorMessage(error, "Autosave failed. Your work is still on the canvas."),
        });
      }
      return false;
    }
  },
  saveHtml: async (signal) => {
    const state = get();
    if (!state.currentProjectId) {
      set({
        saveStatus: "error",
        saveError: "Open a saved backend project before saving HTML.",
      });
      return false;
    }

    saveHtmlController?.abort();
    saveHtmlController = linkedAbortController(signal);
    const seq = ++saveHtmlSeq;

    set({ isSaving: true, saveStatus: "saving", saveError: null });

    try {
      const savedAt = new Date().toISOString();
      await saveProjectHtml(state.currentProjectId, state.exportHtml(), saveHtmlController.signal);

      if (seq === saveHtmlSeq) {
        set({ lastSaved: savedAt, isSaving: false, saveStatus: "saved", saveError: null });
      }
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        if (seq === saveHtmlSeq) set({ isSaving: false, saveStatus: "idle" });
        return false;
      }

      if (seq === saveHtmlSeq) {
        set({
          isSaving: false,
          saveStatus: "error",
          saveError: getSaveErrorMessage(error, "Unable to save generated HTML."),
        });
      }
      return false;
    }
  },
  saveDraft: async (signal) => {
    const state = get();
    if (state.components.length === 0) return false;

    // Cancel any in-flight autosave to avoid conflicts
    autosaveController?.abort();
    autosaveController = linkedAbortController(signal);
    const seq = ++autosaveSeq;

    set({ isSaving: true, saveStatus: "saving", saveError: null });

    try {
      let projectId = state.currentProjectId;

      // First save: create the project in the backend
      if (!projectId) {
        const name = (state.currentProjectName || "My Website").trim();
        const project = await createProject(
          { projectName: name, category: "website-builder" },
          autosaveController.signal,
        );
        projectId = project._id;
        set({ currentProjectId: projectId });

        // Update URL so page reloads re-open this project
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.set("projectId", projectId);
          window.history.replaceState({}, "", url.toString());
        }
      }

      // Persist builder data + rendered HTML
      const savedAt = new Date().toISOString();
      await autosaveProject(
        projectId,
        {
          builderData: buildProjectData(get()),
          htmlContent: get().exportHtml(),
        },
        autosaveController.signal,
      );

      if (seq === autosaveSeq) {
        set({ isDirty: false, lastSaved: savedAt, isSaving: false, saveStatus: "saved", saveError: null });
      }
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        if (seq === autosaveSeq) set({ isSaving: false, saveStatus: "idle" });
        return false;
      }

      if (seq === autosaveSeq) {
        set({
          isSaving: false,
          saveStatus: "error",
          saveError: getSaveErrorMessage(error, "Unable to save draft. Your work is still on the canvas."),
        });
      }
      return false;
    }
  },
  prepareForPublish: async () => {
    const beforeSave = get();
    if (beforeSave.components.length === 0) {
      throw new Error("Add at least one block before publishing your website.");
    }

    const saved = await get().saveDraft();
    if (!saved) {
      throw new Error(get().saveError || "Unable to save the latest builder changes.");
    }

    // A user can make a final edit while the draft request is in flight. Take a
    // fresh snapshot after it completes and persist it when it differs, so the
    // deployment never receives stale JSON, HTML, or design tokens.
    const latest = get();
    const workspaceId = latest.currentProjectId;
    if (!workspaceId) {
      throw new Error("A workspace could not be created for this website.");
    }

    const latestBuilderData = buildProjectData(latest);
    const latestHtml = latest.exportHtml();
    const initialSnapshot = JSON.stringify(buildProjectData(beforeSave));
    const latestSnapshot = JSON.stringify(latestBuilderData);

    try {
      const deploymentPackage = await buildDeploymentPackageForState(latest);
      if (deploymentPackage.errors.length > 0) {
        const firstError = deploymentPackage.errors[0];
        throw new Error(
          `Fix ${deploymentPackage.errors.length} asset issue${deploymentPackage.errors.length === 1 ? "" : "s"} before publishing. ${firstError.message}`,
        );
      }
      const serializedPackage = serializeDeploymentPackage(deploymentPackage);

      if (initialSnapshot !== latestSnapshot) {
        await autosaveProject(workspaceId, {
          builderData: latestBuilderData,
          htmlContent: latestHtml,
        });
      }
      await saveWorkspaceState(workspaceId, {
        // WorkspaceState is publish-only compatibility data. Store the
        // rewritten deployment copy here while the editable Workspace keeps
        // its local asset ids/data URLs through the regular draft save.
        builderData: serializedPackage.builderData,
        htmlContent: serializedPackage.indexHtml,
        deploymentPackage: serializedPackage,
      });
      return {
        workspaceId,
        deploymentPackage: serializedPackage,
        summary: summarizeDeploymentPackage(deploymentPackage),
      };
    } catch (error) {
      const message = getSaveErrorMessage(error, "Unable to prepare this website for publishing.");
      set({ saveStatus: "error", saveError: message, isSaving: false });
      throw new Error(message);
    }
  },
  resetBuilder: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("stackly-clipboard");
      localStorage.removeItem("stackly-style-clipboard");
    } catch { /* storage unavailable */ }

    set({
      components: [],
      selectedComponentId: null,
      selectedTextStyleTarget: null,
      selectedComponentIds: [],
      clipboard: null,
      isInlineEditing: false,
      history: [],
      future: [],
      viewport: "desktop",
      canvasMode: "flow",
      currentProjectId: null,
      currentProjectName: null,
      isDirty: false,
      lastSaved: null,
      isSaving: false,
      saveStatus: "idle",
      saveError: null,
    });
  },

  /* ── Wix-style freeform editing actions ──────────────────────────── */

  toggleSelectComponent: (id) =>
    set((state) => {
      const selectionId = state.canvasMode === "freeform"
        ? resolveFreeformSelectionId(state.components, id)
        : id;
      if (!selectionId) return state;
      const ids = state.selectedComponentIds.includes(selectionId)
        ? state.selectedComponentIds.filter((i) => i !== selectionId)
        : [...state.selectedComponentIds, selectionId];
      return {
        selectedComponentIds: ids,
        selectedComponentId: ids[0] ?? null,
        selectedTextStyleTarget: null,
      };
    }),

  setSelectedComponentIds: (ids) =>
    set((state) => {
      const selectedIds = [...new Set(
        ids
          .map((id) => state.canvasMode === "freeform"
            ? resolveFreeformSelectionId(state.components, id)
            : id)
          .filter((id): id is string => Boolean(id)),
      )].filter((id) => Boolean(findComponentById(state.components, id)));
      return {
        selectedComponentIds: selectedIds,
        selectedComponentId: selectedIds[0] ?? null,
        selectedTextStyleTarget: null,
      };
    }),

  copyComponents: () => {
    const { selectedComponentIds, components } = get();
    if (selectedComponentIds.length === 0) return;
    const copies = selectedComponentIds
      .map((id) => findComponentById(components, id))
      .filter(Boolean) as BuilderComponent[];
    if (copies.length === 0) return;
    set({ clipboard: copies.map(deepCloneComponent) });
    // Also persist to localStorage for cross-tab paste
    try {
      localStorage.setItem("stackly-clipboard", JSON.stringify(copies.map(deepCloneComponent)));
    } catch { /* storage unavailable */ }
  },

  pasteComponents: (parentId) =>
    set((state) => {
      let clipData = state.clipboard;
      // Try localStorage fallback for cross-tab paste
      if (!clipData) {
        try {
          const raw = localStorage.getItem("stackly-clipboard");
          if (raw) clipData = JSON.parse(raw) as BuilderComponent[];
        } catch { /* ignore */ }
      }
      if (!clipData || clipData.length === 0) return state;

      const cloned = clipData
        .map(deepCloneComponent)
        // A copied Freeform root would otherwise land exactly on its source.
        // Nested children keep their parent-local layout intact.
        .map((component) => state.canvasMode === "freeform" && !parentId
          ? offsetFreeformCopy(component)
          : component);

      if (parentId) {
        const components = updateNodeById(state.components, parentId, (p) => ({
          ...p,
          children: [...p.children, ...cloned],
        }));
        const selectionId = state.canvasMode === "freeform"
          ? resolveFreeformSelectionId(state.components, parentId)
          : cloned[0]?.id ?? null;
        return {
          ...captureHistory(state),
          components,
          selectedComponentId: selectionId,
          selectedComponentIds: selectionId ? [selectionId] : [],
          selectedTextStyleTarget: null,
        };
      }

      const components = orderComponents([...state.components, ...cloned]);
      const selectedIds = state.canvasMode === "freeform"
        ? [...new Set(cloned
          .map((component) => resolveFreeformSelectionId(components, component.id))
          .filter((id): id is string => Boolean(id)))]
        : cloned.map((component) => component.id);
      return {
        ...captureHistory(state),
        components,
        selectedComponentId: selectedIds[0] ?? null,
        selectedComponentIds: selectedIds,
        selectedTextStyleTarget: null,
      };
    }),

  duplicateSelectedComponents: () =>
    set((state) => {
      const selectedIds = [...new Set(state.selectedComponentIds)]
        .filter((id) => Boolean(findComponentById(state.components, id)))
        .filter((id) => !state.selectedComponentIds.some((candidate) => candidate !== id && isAncestorOf(state.components, candidate, id)));
      if (selectedIds.length === 0) return state;

      let components = state.components;
      const copyIds: string[] = [];
      for (const id of selectedIds) {
        const source = findComponentById(components, id);
        if (!source) continue;
        const copy = state.canvasMode === "freeform"
          ? offsetFreeformCopy(deepCloneComponent(source))
          : deepCloneComponent(source);
        const inserted = insertAfterNodeById(components, id, copy);
        if (!inserted) continue;
        components = inserted;
        copyIds.push(copy.id);
      }

      if (copyIds.length === 0) return state;
      const selectedCopyIds = state.canvasMode === "freeform"
        ? [...new Set(copyIds
          .map((id) => resolveFreeformSelectionId(components, id))
          .filter((id): id is string => Boolean(id)))]
        : copyIds;
      return {
        ...captureHistory(state),
        components: orderComponents(components),
        selectedComponentId: selectedCopyIds[0] ?? null,
        selectedComponentIds: selectedCopyIds,
        selectedTextStyleTarget: null,
      };
    }),

  deleteSelectedComponents: () =>
    set((state) => {
      const selectedIds = [...new Set(state.selectedComponentIds)]
        .filter((id) => Boolean(findComponentById(state.components, id)))
        .filter((id) => !state.selectedComponentIds.some((candidate) => candidate !== id && isAncestorOf(state.components, candidate, id)));
      if (selectedIds.length === 0) return state;

      const components = selectedIds.reduce(
        (tree, id) => deleteNodeById(tree, id),
        state.components,
      );
      return {
        ...captureHistory(state),
        components: orderComponents(components),
        selectedComponentId: null,
        selectedComponentIds: [],
        selectedTextStyleTarget: null,
      };
    }),

  groupSelectedComponents: () =>
    set((state) => {
      // Flow grouping is safe because Container already supports nested blocks.
      // Freeform keeps top-level absolute items independent, so grouping there
      // would change the visual coordinate system; leave those pages untouched.
      if (state.canvasMode !== "flow") return state;

      const selectedIds = [...new Set(state.selectedComponentIds)]
        .filter((id) => Boolean(findComponentById(state.components, id)));
      if (selectedIds.length < 2) return state;
      if (selectedIds.some((id) => selectedIds.some((candidate) => candidate !== id && isAncestorOf(state.components, candidate, id)))) {
        return state;
      }

      const firstParent = findParentOf(state.components, selectedIds[0]);
      const parentId = firstParent?.id ?? null;
      const sameParent = selectedIds.every((id) => (findParentOf(state.components, id)?.id ?? null) === parentId);
      if (!sameParent) return state;

      const siblings = firstParent ? firstParent.children : state.components;
      const selectedSet = new Set(selectedIds);
      const selected = siblings.filter((component) => selectedSet.has(component.id));
      if (selected.length < 2) return state;

      const firstIndex = siblings.findIndex((component) => selectedSet.has(component.id));
      const selectedIndexes = siblings
        .map((component, index) => selectedSet.has(component.id) ? index : -1)
        .filter((index) => index >= 0);
      if (selectedIndexes.some((index, offset) => index !== firstIndex + offset)) return state;
      const group = createComponent("container", firstIndex);
      group.props = {
        ...(group.props ?? {}),
        __stacklyLayerName: "Group",
        [GROUP_MARKER_PROP]: true,
      };
      group.children = selected.map((component, index) => ({ ...component, order: index }));

      const replacement = [
        ...siblings.slice(0, firstIndex).filter((component) => !selectedSet.has(component.id)),
        group,
        ...siblings.slice(firstIndex).filter((component) => !selectedSet.has(component.id)),
      ].map((component, index) => ({ ...component, order: index }));

      const components = parentId
        ? updateNodeById(state.components, parentId, (parent) => ({ ...parent, children: replacement }))
        : replacement;

      return {
        ...captureHistory(state),
        components,
        selectedComponentId: group.id,
        selectedComponentIds: [group.id],
        selectedTextStyleTarget: null,
      };
    }),

  ungroupComponent: (id) =>
    set((state) => {
      // Grouping has a parent-local flow coordinate system. Flattening that
      // structure while the parent is an absolute Freeform item would change
      // its visual placement, so keep the operation in the safe Flow mode.
      if (state.canvasMode !== "flow") return state;
      const group = findComponentById(state.components, id);
      if (
        !group
        || group.type !== "container"
        || group.children.length === 0
        || group.props?.[GROUP_MARKER_PROP] !== true
      ) return state;

      const parent = findParentOf(state.components, id);
      const siblings = parent ? parent.children : state.components;
      const index = siblings.findIndex((component) => component.id === id);
      if (index < 0) return state;

      const replacement = [
        ...siblings.slice(0, index),
        ...group.children,
        ...siblings.slice(index + 1),
      ].map((component, childIndex) => ({ ...component, order: childIndex }));
      const components = parent
        ? updateNodeById(state.components, parent.id, (node) => ({ ...node, children: replacement }))
        : replacement;
      const selectedIds = group.children.map((child) => child.id);

      return {
        ...captureHistory(state),
        components,
        selectedComponentId: selectedIds[0] ?? null,
        selectedComponentIds: selectedIds,
        selectedTextStyleTarget: null,
      };
    }),

  moveLayer: (id, direction) =>
    set((state) => {
      const comp = findComponentById(state.components, id);
      if (!comp) return state;
      const styleZ = parseInt(comp.styles.zIndex || "", 10);
      const currentZ = Number.isFinite(styleZ)
        ? styleZ
        : Number.isFinite(comp.zIndex)
          ? comp.zIndex!
          : 0;
      let newZ: number;
      switch (direction) {
        case "front":    newZ = 999; break;
        case "back":     newZ = 0;   break;
        case "forward":  newZ = currentZ + 1; break;
        case "backward": newZ = Math.max(0, currentZ - 1); break;
      }
      return {
        ...captureHistory(state),
        components: updateNodeById(state.components, id, (c) => ({
          ...c,
          styles: { ...c.styles, position: c.styles.position || "relative", zIndex: String(newZ) },
        })),
      };
    }),

  moveComponent: (id, x, y, options) =>
    set((state) => ({
      components: patchFreeformPositions(
        state.components,
        new Map([[id, { x, y }]]),
        options?.snap !== false,
      ),
    })),

  moveComponents: (positions, options) =>
    set((state) => {
      const nextPositions = new Map(
        positions
          .filter((position) => Number.isFinite(position.x) && Number.isFinite(position.y))
          .map((position) => [position.id, { x: position.x, y: position.y }]),
      );
      if (nextPositions.size === 0) return state;
      const components = patchFreeformPositions(
        state.components,
        nextPositions,
        options?.snap !== false,
      );
      return components === state.components ? state : { components };
    }),

  resizeComponent: (id, width, height, options) =>
    set((state) => ({
      components: updateNodeById(state.components, id, (c) => ({
        ...c,
        freeformSize: {
          width: Math.max(120, options?.snap === false ? Math.round(width) : Math.round(width / 8) * 8),
          height: Math.max(40, options?.snap === false ? Math.round(height) : Math.round(height / 8) * 8),
        },
      })),
    })),

  beginFreeformInteraction: () =>
    set((state) => ({
      ...captureHistory(state),
    })),

  nudgeSelectedComponents: (x, y) =>
    set((state) => {
      const selectedIds = [...new Set(state.selectedComponentIds)]
        .filter((id) => {
          const component = findComponentById(state.components, id);
          const isFreeformRoot = state.canvasMode !== "freeform"
            || state.components.some((root) => root.id === id);
          return Boolean(component && !component.locked && isFreeformRoot);
        });
      if (selectedIds.length === 0 || (x === 0 && y === 0)) return state;
      const positions = new Map(
        selectedIds.flatMap((id) => {
          const component = findComponentById(state.components, id);
          if (!component) return [];
          const defaultX = Math.max(0, Math.round((1280 - (component.freeformSize?.width ?? getFreeformDefaultWidth(1280, component.type))) / 2));
          const position = component.position ?? { x: defaultX, y: 40 };
          return [[id, { x: position.x + x, y: position.y + y }] as const];
        }),
      );
      const components = patchFreeformPositions(state.components, positions, false);
      return {
        ...captureHistory(state),
        components,
      };
    }),

  applyStylesToSelected: (styles) =>
    set((state) => {
      if (Object.keys(styles).length === 0) return state;
      const selectedIds = new Set(
        state.selectedComponentIds.filter((id) => {
          const component = findComponentById(state.components, id);
          return Boolean(component && !component.locked);
        }),
      );
      if (selectedIds.size === 0) return state;

      const components = patchSelectedStyles(state.components, selectedIds, styles);
      if (components === state.components) return state;
      return { ...captureHistory(state), components };
    }),

  toggleLock: (id) =>
    set((state) => ({
      ...captureHistory(state),
      components: updateNodeById(state.components, id, (c) => ({
        ...c,
        locked: !c.locked,
      })),
    })),

  /* ── Module 4: additional management actions ──────────────────────── */

  moveComponentUp: (id) =>
    set((state) => {
      const result = moveInSiblings(state.components, id, "up");
      if (!result) return state;
      return { ...captureHistory(state), components: orderComponents(result) };
    }),

  moveComponentDown: (id) =>
    set((state) => {
      const result = moveInSiblings(state.components, id, "down");
      if (!result) return state;
      return { ...captureHistory(state), components: orderComponents(result) };
    }),

  hideComponent: (id) =>
    set((state) => ({
      ...captureHistory(state),
      components: updateNodeById(state.components, id, (c) => ({
        ...c,
        hidden: !c.hidden,
      })),
    })),

  exportJSON: () => {
    const state = get();
    const designStore = useDesignStore.getState();
    const data = buildProjectJSON(
      state.components,
      designStore.tokens,
      designStore.seo,
      state.canvasMode,
      state.currentProjectName ?? undefined,
    );
    downloadProjectJSON(data);
    return JSON.stringify(data, null, 2);
  },

  importJSON: (json) => {
    try {
      const result = parseProjectJSON(json);

      if (!result.components || result.components.length === 0) {
        return "The imported file contains no components.";
      }

      // Apply design tokens and SEO if present
      if (result.designTokens) {
        useDesignStore.getState().setTokens(result.designTokens);
      }
      if (result.seo) {
        useDesignStore.getState().setSEO(result.seo);
      }

      set((state) => ({
        ...captureHistory(state),
        components: orderComponents(cloneComponentTree(result.components)),
        selectedComponentId: null,
        selectedComponentIds: [],
        canvasMode: result.canvasMode ?? state.canvasMode,
        currentProjectName: result.projectName ?? state.currentProjectName,
      }));

      return null; // success
    } catch (error) {
      return error instanceof Error ? error.message : "Failed to import JSON.";
    }
  },
}));

if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).__builderStore = useBuilderStore;
}



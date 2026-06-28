"use client";

import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { arrayMove } from "@dnd-kit/sortable";
import { generateHtml } from "@/lib/exportHtml";
import { autosaveProject, getProject, isProjectConnectionError, saveHtml as saveProjectHtml, type ProjectBuilderData } from "@/lib/projectApi";
import { featureItemDefaults } from "@/components/blocks/feature-item/spec";
import { heroDefaults } from "@/components/blocks/hero/spec";
import { navigationDefaults } from "@/components/blocks/navigation/spec";
import { contactDefaults } from "@/components/blocks/contact/spec";
import { featuresDefaults } from "@/components/blocks/features/spec";
import { videoDefaults }    from "@/components/blocks/video/spec";
import { socialLinksDefaults } from "@/components/draggable/SocialLinksComponent";
import { countdownDefaults } from "@/components/draggable/CountdownComponent";
import { pricingTableDefaults } from "@/components/draggable/PricingTableComponent";
import { testimonialDefaults } from "@/components/draggable/TestimonialComponent";
import { footerDefaults } from "@/components/draggable/FooterComponent";
import { formDefaults } from "@/components/draggable/FormComponent";
import { accordionDefaults } from "@/components/draggable/AccordionComponent";
import { tabsDefaults } from "@/components/draggable/TabsComponent";
import { mapDefaults } from "@/components/draggable/MapComponent";
import type { BuilderComponent, BuilderRequirements, BuilderState, ComponentType, FeatureRecord, Viewport } from "@/types/builder";
import { useDesignStore } from "@/store/designStore";
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
  textStyles: component.textStyles ? { ...component.textStyles } : undefined,
  props: component.props ? { ...component.props } : undefined,
  responsiveStyles: component.responsiveStyles
    ? {
        tablet: component.responsiveStyles.tablet ? { ...component.responsiveStyles.tablet } : undefined,
        mobile: component.responsiveStyles.mobile ? { ...component.responsiveStyles.mobile } : undefined,
      }
    : undefined,
  children: component.children.map(deepCloneComponent),
});

const cloneComponentTree = (components: BuilderComponent[]): BuilderComponent[] =>
  components.map((component) => ({
    ...component,
    styles: { ...component.styles },
    textStyles: component.textStyles ? { ...component.textStyles } : undefined,
    props: component.props ? { ...component.props } : undefined,
    responsiveStyles: component.responsiveStyles
      ? {
          tablet: component.responsiveStyles.tablet ? { ...component.responsiveStyles.tablet } : undefined,
          mobile: component.responsiveStyles.mobile ? { ...component.responsiveStyles.mobile } : undefined,
        }
      : undefined,
    children: cloneComponentTree(component.children ?? []),
  }));

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

const buildCategoryTemplate = (category: string, projectName: string, style: string): BuilderComponent[] | null => {
  const bold = style === "Bold";
  const minimal = style === "Minimal";
  const surface = minimal ? "#ffffff" : "#f7f9fc";
  const heroBg = bold ? "#0B1D40" : minimal ? "#ffffff" : "#eef4fb";
  const heroColor = bold ? "#ffffff" : "#0B1D40";

  const baseHeroStyles = {
    backgroundColor: heroBg,
    color: heroColor,
    padding: "56px 40px",
    borderRadius: minimal ? "0" : "18px",
    margin: "0 0 20px",
  };

  const categoryKey = category.toLowerCase();

  const templates: Record<string, () => BuilderComponent[]> = {
    "e-commerce": () => [
      withComponentOverrides("navigation", 0, { props: templateNav(projectName, [{ label: "Shop" }, { label: "Collections" }, { label: "Reviews" }, { label: "Contact" }], "Shop Now") }),
      withComponentOverrides("hero", 1, {
        props: { ...heroDefaults, title: "Launch a storefront customers trust", description: "Showcase collections, highlight offers, and guide shoppers from discovery to checkout with a polished commerce homepage.", cta: { label: "Explore Products", href: "#products" }, layout: "split" },
        styles: baseHeroStyles,
      }),
      withComponentOverrides("features", 2, {
        props: { ...featuresDefaults, heading: "Built for selling", items: [
          { title: "Curated collections", description: "Organize products into easy-to-scan shopping paths." },
          { title: "Trust-first layout", description: "Use reviews, guarantees, and clear CTAs to reduce friction." },
          { title: "Mobile shopping", description: "Responsive sections keep carts and offers easy to reach." },
        ] },
        styles: { backgroundColor: surface, padding: "36px", borderRadius: "16px" },
      }),
      withComponentOverrides("gallery", 3, { content: "/landing-optimized/store11.webp|Featured store layout\n/landing-optimized/fashion06.webp|Fashion collection\n/landing-optimized/jewellery07.webp|Premium product showcase", styles: { backgroundColor: "#ffffff", padding: "28px", borderRadius: "16px" } }),
      withComponentOverrides("pricing-table", 4, { props: { ...pricingTableDefaults, heading: "Simple launch packages" }, styles: { backgroundColor: surface, padding: "42px 24px", borderRadius: "16px" } }),
      withComponentOverrides("testimonial", 5, { props: { ...testimonialDefaults, heading: "Loved by growing stores" }, styles: { backgroundColor: "#ffffff", padding: "40px 24px", borderRadius: "16px" } }),
      withComponentOverrides("contact", 6, { props: { ...contactDefaults, title: "Ready to open your store?", description: "Share your email and start shaping your product-first website.", cta: { label: "Start Selling", href: "#contact" } } }),
      withComponentOverrides("footer", 7, { props: templateFooter(projectName, "A modern storefront built with Stackly."), styles: { borderRadius: "16px" } }),
    ],
    portfolio: () => [
      withComponentOverrides("navigation", 0, { props: templateNav(projectName, [{ label: "Work" }, { label: "About" }, { label: "Services" }, { label: "Contact" }], "Hire Me") }),
      withComponentOverrides("hero", 1, {
        props: { ...heroDefaults, title: "Showcase your work with clarity", description: "Present your best projects, tell your story, and make it simple for clients to start a conversation.", cta: { label: "View Work", href: "#work" }, layout: "split" },
        styles: baseHeroStyles,
      }),
      withComponentOverrides("gallery", 2, { content: "/landing-optimized/port.webp|Signature portfolio homepage\n/landing-optimized/portfolio03.webp|Agency case study\n/landing-optimized/portfolio04.webp|Minimal project grid", styles: { backgroundColor: "#ffffff", padding: "28px", borderRadius: "16px" } }),
      withComponentOverrides("features", 3, { props: { ...featuresDefaults, heading: "What you bring to clients", items: [
        { title: "Project storytelling", description: "Frame outcomes, process, and creative thinking." },
        { title: "Personal brand", description: "Shape a memorable introduction around your strengths." },
        { title: "Easy inquiries", description: "Turn interest into contact with clear next steps." },
      ] }, styles: { backgroundColor: surface, padding: "36px", borderRadius: "16px" } }),
      withComponentOverrides("testimonial", 4, { props: { ...testimonialDefaults, heading: "Client notes" }, styles: { backgroundColor: "#ffffff", padding: "40px 24px", borderRadius: "16px" } }),
      withComponentOverrides("form", 5, { props: { ...formDefaults, heading: "Start a project", description: "Tell visitors how to reach you for work, collaborations, or speaking.", submitLabel: "Send Inquiry" } }),
      withComponentOverrides("footer", 6, { props: templateFooter(projectName, "Portfolio, selected work, and contact."), styles: { borderRadius: "16px" } }),
    ],
    blog: () => [
      withComponentOverrides("navigation", 0, { props: templateNav(projectName, [{ label: "Stories" }, { label: "Categories" }, { label: "Guides" }, { label: "Subscribe" }], "Subscribe") }),
      withComponentOverrides("hero", 1, {
        props: { ...heroDefaults, title: "Create a blog worth returning to", description: "Build a readable home for essays, guides, and updates with sections that support discovery and reader growth.", cta: { label: "Start Reading", href: "#posts" }, layout: "split" },
        styles: baseHeroStyles,
      }),
      withComponentOverrides("features", 2, { props: { ...featuresDefaults, heading: "Editorial foundations", items: [
        { title: "Featured posts", description: "Lead with timely stories and high-value guides." },
        { title: "Clear categories", description: "Help readers browse topics without friction." },
        { title: "Newsletter path", description: "Convert loyal readers into subscribers." },
      ] }, styles: { backgroundColor: surface, padding: "36px", borderRadius: "16px" } }),
      withComponentOverrides("gallery", 3, { content: "/landing-optimized/blog1.webp|Personal blog layout\n/landing-optimized/blog2.webp|Tech insights template\n/blog/template-food.webp|Restaurant story blog", styles: { backgroundColor: "#ffffff", padding: "28px", borderRadius: "16px" } }),
      withComponentOverrides("tabs", 4, { props: { ...tabsDefaults, items: [
        { label: "Ideas", content: "Publish essays, explainers, guides, and behind-the-scenes stories." },
        { label: "Categories", content: "Organize posts around practical topics your readers revisit." },
        { label: "Growth", content: "Use subscription CTAs and featured content to build an audience." },
      ] } }),
      withComponentOverrides("contact", 5, { props: { ...contactDefaults, title: "Join the newsletter", description: "Invite readers to subscribe for new posts and updates.", inputPlaceholder: "reader@example.com", cta: { label: "Subscribe", href: "#subscribe" } } }),
      withComponentOverrides("footer", 6, { props: templateFooter(projectName, "Stories, ideas, and reader updates."), styles: { borderRadius: "16px" } }),
    ],
    business: () => [
      withComponentOverrides("navigation", 0, { props: templateNav(projectName, [{ label: "Services" }, { label: "Results" }, { label: "Pricing" }, { label: "Contact" }], "Book a Call") }),
      withComponentOverrides("hero", 1, {
        props: { ...heroDefaults, title: "Build trust for your business", description: "Explain services, show credibility, and create a direct path from visitor interest to qualified leads.", cta: { label: "Book a Consultation", href: "#contact" }, layout: "split" },
        styles: baseHeroStyles,
      }),
      withComponentOverrides("features", 2, { props: { ...featuresDefaults, heading: "How you help", items: [
        { title: "Service clarity", description: "Explain what you offer with structured, scannable sections." },
        { title: "Trust signals", description: "Use testimonials and proof points to support decisions." },
        { title: "Lead capture", description: "Make contact simple with forms and strong CTAs." },
      ] }, styles: { backgroundColor: surface, padding: "36px", borderRadius: "16px" } }),
      withComponentOverrides("pricing-table", 3, { props: { ...pricingTableDefaults, heading: "Service packages" }, styles: { backgroundColor: "#ffffff", padding: "42px 24px", borderRadius: "16px" } }),
      withComponentOverrides("testimonial", 4, { props: { ...testimonialDefaults, heading: "What clients say" }, styles: { backgroundColor: surface, padding: "40px 24px", borderRadius: "16px" } }),
      withComponentOverrides("form", 5, { props: { ...formDefaults, heading: "Talk to our team", description: "Collect qualified business inquiries with a focused contact form.", submitLabel: "Request Consultation" } }),
      withComponentOverrides("footer", 6, { props: templateFooter(projectName, "Professional services and business growth."), styles: { borderRadius: "16px" } }),
    ],
    restaurant: () => [
      withComponentOverrides("navigation", 0, { props: templateNav(projectName, [{ label: "Menu" }, { label: "About" }, { label: "Reservations" }, { label: "Contact" }], "Reserve") }),
      withComponentOverrides("hero", 1, {
        props: { ...heroDefaults, title: "Create a mouth-watering restaurant website", description: "Showcase signature dishes, share your story, and help guests find, call, or reserve from any device.", cta: { label: "View Menu", href: "#menu" }, layout: "split" },
        styles: { ...baseHeroStyles, backgroundColor: bold ? "#3A1111" : minimal ? "#ffffff" : "#FFF5F5", color: bold ? "#ffffff" : "#0A1E3D" },
      }),
      withComponentOverrides("gallery", 2, { content: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop|Premium ribeye steak\nhttps://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=800&auto=format&fit=crop|Wood-fired pizza\nhttps://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop|Classic cheeseburger", styles: { backgroundColor: "#ffffff", padding: "28px", borderRadius: "16px" } }),
      withComponentOverrides("features", 3, { props: { ...featuresDefaults, heading: "Restaurant essentials", items: [
        { title: "Signature menu", description: "Highlight best sellers, prices, and seasonal dishes." },
        { title: "Guest confidence", description: "Tell your story and show atmosphere before guests arrive." },
        { title: "Reservation path", description: "Make contact, hours, and booking details easy to find." },
      ] }, styles: { backgroundColor: "#FFF5F5", padding: "36px", borderRadius: "16px" } }),
      withComponentOverrides("testimonial", 4, { props: { ...testimonialDefaults, heading: "Guest reviews" }, styles: { backgroundColor: "#ffffff", padding: "40px 24px", borderRadius: "16px" } }),
      withComponentOverrides("map", 5, { props: { ...mapDefaults, address: "123 Culinary Avenue, Food District", zoom: 14, height: "320px" }, styles: { backgroundColor: "#ffffff", padding: "20px", borderRadius: "16px" } }),
      withComponentOverrides("contact", 6, { props: { ...contactDefaults, title: "Book a table", description: "Invite guests to reserve, call, or ask about private dining.", inputPlaceholder: "guest@example.com", cta: { label: "Reserve Now", href: "#contact" } } }),
      withComponentOverrides("footer", 7, { props: templateFooter(projectName, "Fresh flavors, warm service, and easy reservations."), styles: { borderRadius: "16px" } }),
    ],
  };

  return templates[categoryKey]?.() ?? null;
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
};

const createRequirementComponents = (requirements: BuilderRequirements) => {
  const projectName = requirements.projectName || "Stackly Studio";
  const category = requirements.category || "Business";
  const style = requirements.style || "Modern";
  const categoryTemplate = buildCategoryTemplate(category, projectName, style);
  if (categoryTemplate) return categoryTemplate;
  const copy = categoryCopy[category] || categoryCopy.Business;
  const selectedSections = requirements.sections.length > 0 ? requirements.sections : ["navigation", "hero", "features", "contact"];
  const sectionTypes: ComponentType[] = selectedSections
    .map((section) => {
      if (section === "gallery") return "gallery";
      if (section === "leadForm") return "contact";
      return section as ComponentType;
    })
    .filter((section): section is ComponentType =>
      ["navigation", "hero", "heading", "text", "button", "icon", "feature-item", "columns", "image", "input", "divider", "features", "gallery", "contact", "container", "video", "map", "accordion", "tabs", "spacer", "social-links", "countdown", "pricing-table", "testimonial", "footer", "form"].includes(section),
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
    set((state) => ({ canvasMode: state.canvasMode === "flow" ? "freeform" : "flow" })),
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
  insertComponentBefore: (type, beforeId) =>
    set((state) => {
      const idx = state.components.findIndex((c) => c.id === beforeId);
      const component = createComponent(type, 0);

      if (idx >= 0) {
        const next = [
          ...state.components.slice(0, idx),
          component,
          ...state.components.slice(idx),
        ];
        return { ...captureHistory(state), components: orderComponents(next), selectedComponentId: component.id };
      }

      // Fallback: append if beforeId not found at top level
      return {
        ...captureHistory(state),
        components: [...state.components, component],
        selectedComponentId: component.id,
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
  selectComponent: (id) => set({ selectedComponentId: id, selectedComponentIds: id ? [id] : [], selectedTextStyleTarget: null }),
  selectTextStyleTarget: (target) => set({
    selectedTextStyleTarget: target,
    selectedComponentId: target?.componentId ?? null,
    selectedComponentIds: target ? [target.componentId] : [],
  }),
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
    set((state) => ({ ...captureHistory(state), components: [], selectedComponentId: null })),
  exportHtml: () => generateHtml(get().components, useDesignStore.getState().seo),
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
    void get().autosave();
  },
  loadFromLocalStorage: () => false,
  markDirty: () => set({ isDirty: true, saveStatus: "idle", saveError: null }),
  loadProject: async (id, signal) => {
    set({ isSaving: true, saveStatus: "saving", saveError: null });

    try {
      const project = await getProject(id, signal);
      const builderData = project.builderData ?? {};
      const components = Array.isArray(builderData.components)
        ? builderData.components
        : Array.isArray(builderData.sections)
          ? builderData.sections
          : [];

      if (builderData.designTokens) {
        useDesignStore.getState().setTokens(builderData.designTokens);
      }
      if (builderData.seo) {
        useDesignStore.getState().setSEO(builderData.seo);
      }

      set((state) => ({
        ...captureHistory(state),
        components: orderComponents(cloneComponentTree(components)),
        selectedComponentId: null,
        selectedTextStyleTarget: null,
        selectedComponentIds: [],
        currentProjectId: project._id,
        currentProjectName: project.projectName || builderData.projectName || "Untitled Project",
        canvasMode: builderData.canvasMode ?? "flow",
        isDirty: false,
        lastSaved: project.updatedAt ?? null,
        isSaving: false,
        saveStatus: "saved",
        saveError: null,
      }));
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
      const ids = state.selectedComponentIds.includes(id)
        ? state.selectedComponentIds.filter((i) => i !== id)
        : [...state.selectedComponentIds, id];
      return {
        selectedComponentIds: ids,
        selectedComponentId: ids.length === 1 ? ids[0] : ids.length === 0 ? null : state.selectedComponentId,
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

      const cloned = clipData.map(deepCloneComponent);

      if (parentId) {
        const components = updateNodeById(state.components, parentId, (p) => ({
          ...p,
          children: [...p.children, ...cloned],
        }));
        return { ...captureHistory(state), components, selectedComponentId: cloned[0]?.id ?? null, selectedComponentIds: cloned.map((c) => c.id) };
      }

      return {
        ...captureHistory(state),
        components: orderComponents([...state.components, ...cloned]),
        selectedComponentId: cloned[0]?.id ?? null,
        selectedComponentIds: cloned.map((c) => c.id),
      };
    }),

  moveLayer: (id, direction) =>
    set((state) => {
      const comp = findComponentById(state.components, id);
      if (!comp) return state;
      const currentZ = parseInt(comp.styles.zIndex || "0", 10);
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

  moveComponent: (id, x, y) =>
    set((state) => ({
      components: updateNodeById(state.components, id, (c) => ({
        ...c,
        position: {
          x: Math.round(x / 8) * 8,  // snap to 8px grid
          y: Math.round(y / 8) * 8,
        },
      })),
    })),

  resizeComponent: (id, width, height) =>
    set((state) => ({
      components: updateNodeById(state.components, id, (c) => ({
        ...c,
        freeformSize: {
          width: Math.max(120, Math.round(width / 8) * 8),
          height: Math.max(40, Math.round(height / 8) * 8),
        },
      })),
    })),

  toggleLock: (id) =>
    set((state) => ({
      ...captureHistory(state),
      components: updateNodeById(state.components, id, (c) => ({
        ...c,
        locked: !c.locked,
      })),
    })),
}));

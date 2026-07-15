import type { BlockpagesTemplateId } from "@/lib/blockpagesTemplates";

export type BlockpagesTemplateSection = {
  id: string;
  label: string;
};

const PORTFOLIO_SECTIONS: BlockpagesTemplateSection[] = [
  { id: "home", label: "Home" },
  { id: "about", label: "About Me" },
  { id: "projects", label: "Projects" },
  { id: "video", label: "Video Block" },
  { id: "contact", label: "Contact" },
  { id: "footer", label: "Footer" },
];

const ECOMMERCE_SECTIONS: BlockpagesTemplateSection[] = [
  { id: "buyscreen-home", label: "Home" },
  { id: "buyscreen-about", label: "About Us" },
  { id: "buyscreen-categories", label: "Categories" },
  { id: "buyscreen-products", label: "Our Products" },
  { id: "buyscreen-video", label: "Video Block" },
  { id: "buyscreen-contact", label: "Contact" },
];

const BLOG_SECTIONS: BlockpagesTemplateSection[] = [
  { id: "blog-home", label: "Home" },
  { id: "blog-categories", label: "Categories" },
  { id: "blog-trending", label: "Trending" },
  { id: "blog-about", label: "About" },
  { id: "blog-contact", label: "Contact" },
];

const CONSTRUCTION_SECTIONS: BlockpagesTemplateSection[] = [
  { id: "const-home", label: "Home" },
  { id: "const-projects", label: "Projects" },
  { id: "const-features", label: "Services" },
  { id: "const-process", label: "Process" },
  { id: "const-faq", label: "FAQ" },
  { id: "const-contact", label: "Contact" },
  { id: "const-footer", label: "Footer" },
];

const RESTAURANT_SECTIONS: BlockpagesTemplateSection[] = [
  { id: "restaurant-home", label: "Home" },
  { id: "restaurant-menu", label: "Menu" },
  { id: "restaurant-about", label: "About" },
  { id: "restaurant-why-choose-us", label: "Why Choose Us" },
  { id: "restaurant-features", label: "Features" },
  { id: "restaurant-faq", label: "FAQ" },
  { id: "restaurant-testimonials", label: "Testimonials" },
  { id: "restaurant-contact", label: "Contact" },
  { id: "restaurant-footer", label: "Footer" },
];

const DIGITAL_MARKETING_SECTIONS: BlockpagesTemplateSection[] = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
  { id: "blog", label: "Testimonials" },
  { id: "contact", label: "Contact" },
  { id: "footer", label: "Footer" },
];

export const BLOCKPAGES_TEMPLATE_SECTIONS: Record<BlockpagesTemplateId, BlockpagesTemplateSection[]> = {
  portfolio: PORTFOLIO_SECTIONS,
  ecommerce: ECOMMERCE_SECTIONS,
  blog: BLOG_SECTIONS,
  construction: CONSTRUCTION_SECTIONS,
  restaurant: RESTAURANT_SECTIONS,
  "digital-marketing": DIGITAL_MARKETING_SECTIONS,
  business: DIGITAL_MARKETING_SECTIONS,
};

export function getBlockpagesTemplateSections(template: BlockpagesTemplateId): BlockpagesTemplateSection[] {
  return BLOCKPAGES_TEMPLATE_SECTIONS[template] ?? PORTFOLIO_SECTIONS;
}

export function getBlockpagesDefaultSectionId(template: BlockpagesTemplateId): string {
  return getBlockpagesTemplateSections(template)[0]?.id ?? "home";
}

export function getBlockpagesHeaderScrollId(template: BlockpagesTemplateId): string {
  return getBlockpagesDefaultSectionId(template);
}

export function getBlockpagesFooterScrollId(template: BlockpagesTemplateId): string {
  const sections = getBlockpagesTemplateSections(template);
  const footerSection = sections.find(
    (section) => section.id.includes("footer") || section.label.toLowerCase() === "footer"
  );
  if (footerSection) return footerSection.id;

  const contactSection = sections.find((section) => section.label.toLowerCase().includes("contact"));
  return contactSection?.id ?? sections[sections.length - 1]?.id ?? "home";
}

export function getBlockpagesAboutScrollId(template: BlockpagesTemplateId): string {
  const sections = getBlockpagesTemplateSections(template);
  const aboutSection = sections.find(
    (section) =>
      section.id.includes("about") || section.label.toLowerCase().includes("about")
  );
  return aboutSection?.id ?? getBlockpagesDefaultSectionId(template);
}

export function getBlockpagesVideoScrollId(template: BlockpagesTemplateId): string {
  const sections = getBlockpagesTemplateSections(template);
  const videoSection = sections.find(
    (section) =>
      section.id.includes("video") || section.label.toLowerCase().includes("video")
  );
  return videoSection?.id ?? getBlockpagesDefaultSectionId(template);
}

export function getBlockpagesIconScrollId(template: BlockpagesTemplateId): string {
  switch (template) {
    case "construction":
      return "const-features";
    case "restaurant":
      return "restaurant-why-choose-us";
    case "ecommerce":
      return "buyscreen-about";
    case "digital-marketing":
    case "business":
      return "dm-stats";
    case "blog":
      return "blog-about";
    default:
      return getBlockpagesAboutScrollId(template);
  }
}

export function dispatchBlockpagesScrollToSection(sectionId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("scrollToSectionEvent", { detail: sectionId }));
}

export function scrollBlockpagesCanvasToSection(sectionId: string) {
  if (typeof document === "undefined" || !sectionId.trim()) return;

  const escaped =
    typeof CSS !== "undefined" && "escape" in CSS ? CSS.escape(sectionId) : sectionId.replace(/"/g, '\\"');

  const scrollRoot = document.querySelector<HTMLElement>("[data-blockpages-scroll-root], [data-textblock-canvas]");
  const target =
    scrollRoot?.querySelector<HTMLElement>(`#${escaped}`) ?? document.getElementById(sectionId);

  if (!target) return;

  if (scrollRoot) {
    const rootRect = scrollRoot.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const nextTop = scrollRoot.scrollTop + (targetRect.top - rootRect.top) - 8;
    scrollRoot.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function buildBlockpagesSectionStylesCss(sectionStyles: Record<string, { backgroundColor?: string; gradientBackground?: string; backgroundImage?: string }> = {}) {
  return Object.entries(sectionStyles)
    .map(([id, styles]) => {
      const rules: string[] = [];
      if (styles.gradientBackground) {
        rules.push(`background: ${styles.gradientBackground} !important;`);
      } else if (styles.backgroundColor) {
        rules.push(`background-color: ${styles.backgroundColor} !important;`);
      }
      if (styles.backgroundImage) {
        rules.push(`background-image: url(${styles.backgroundImage}) !important;`);
        rules.push("background-size: cover !important;");
        rules.push("background-position: center !important;");
      }
      if (!rules.length) return "";
      const escapedId = typeof CSS !== "undefined" && "escape" in CSS ? CSS.escape(id) : id.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
      return `[data-textblock-canvas] #${escapedId} { ${rules.join(" ")} }`;
    })
    .filter(Boolean)
    .join("\n");
}

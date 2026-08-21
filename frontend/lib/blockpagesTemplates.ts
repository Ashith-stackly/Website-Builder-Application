export type BlockpagesTemplateId =
  | "portfolio"
  | "ecommerce"
  | "blog"
  | "construction"
  | "restaurant"
  | "digital-marketing"
  | "business";

export const BLOCKPAGES_TEXT_TEMPLATES: BlockpagesTemplateId[] = [
  "portfolio",
  "ecommerce",
  "blog",
  "construction",
  "restaurant",
  "digital-marketing",
  "business",
];

const TEMPLATE_ALIASES: Record<string, BlockpagesTemplateId> = {
  portfolio: "portfolio",
  "portfolio website": "portfolio",
  ecommerce: "ecommerce",
  "e-commerce": "ecommerce",
  "e-commerce templates": "ecommerce",
  "ecommerce store": "ecommerce",
  store: "ecommerce",
  shop: "ecommerce",
  blog: "blog",
  blogging: "blog",
  "blogging website": "blog",
  construction: "construction",
  "construction themes": "construction",
  "construction & building": "construction",
  "construction-building": "construction",
  building: "construction",
  restaurant: "restaurant",
  "restaurant & cafe": "restaurant",
  "restaurant & café": "restaurant",
  "restaurant-cafe": "restaurant",
  cafe: "restaurant",
  café: "restaurant",
  "digital-marketing": "digital-marketing",
  "digital marketing": "digital-marketing",
  "digital marketing templates": "digital-marketing",
  "digital-marketing-business": "digital-marketing",
  "digital marketing & business": "digital-marketing",
  marketing: "digital-marketing",
  business: "business",
  "business & services": "business",
};

const TEMPLATE_LABELS: Record<BlockpagesTemplateId, string> = {
  portfolio: "Portfolio",
  ecommerce: "E-Commerce",
  blog: "Blog",
  construction: "Construction",
  restaurant: "Restaurant",
  "digital-marketing": "Digital Marketing",
  business: "Business",
};

/** Preview routes for templates rendered inside the block-pages editor iframe. */
export const BLOCKPAGES_PREVIEW_ROUTES: Partial<Record<BlockpagesTemplateId, string>> = {
  portfolio: "/portfolio",
  ecommerce: "/e-commerce",
  blog: "/blog",
  construction: "/construction",
  restaurant: "/restaurant",
  "digital-marketing": "/digital-marketing",
  business: "/digital-marketing",
};

export function parseBlockpagesTemplate(param: string | null): BlockpagesTemplateId {
  const normalized = (param ?? "ecommerce").trim().toLowerCase();
  return TEMPLATE_ALIASES[normalized] ?? "ecommerce";
}

export function isTextEditorTemplate(template: BlockpagesTemplateId): boolean {
  return BLOCKPAGES_TEXT_TEMPLATES.includes(template);
}

export function getBlockpagesTemplateLabel(template: BlockpagesTemplateId): string {
  return TEMPLATE_LABELS[template];
}

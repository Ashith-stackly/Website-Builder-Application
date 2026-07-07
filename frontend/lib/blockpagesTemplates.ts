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
  ecommerce: "ecommerce",
  "e-commerce": "ecommerce",
  blog: "blog",
  blogging: "blog",
  construction: "construction",
  restaurant: "restaurant",
  "digital-marketing": "digital-marketing",
  business: "business",
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

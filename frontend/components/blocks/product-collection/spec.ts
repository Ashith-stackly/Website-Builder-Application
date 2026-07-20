/**
 * Product Collection block
 *
 * This is deliberately a presentation-only catalog block. Its `products`
 * array is persisted as safe editor mock data and never calls the commerce
 * API. Published-site runtime code may later replace the sample cards using
 * the stable data attributes emitted by `exportHtml`.
 */

import { ShoppingBag } from "lucide-react";
import type { BlockSpec } from "@/lib/blockRegistry";
import type { BuilderComponent, ProductCollectionData, ProductMock } from "@/types/builder";
import { escapeHtml } from "@/lib/htmlUtils";
import ProductCollectionComponent from "@/components/draggable/ProductCollectionComponent";
import { ProductCollectionPanel } from "./ProductCollectionPanel";

export const PRODUCT_COLLECTION_SCHEMA_VERSION = 1;

const VARIANTS = [
  "grid",
  "featured",
  "carousel",
  "collection",
  "category",
  "best-sellers",
  "latest",
  "single",
] as const;

const SELECTIONS = ["manual", "category", "best-sellers", "latest"] as const;
const SORTS = ["manual", "newest", "price-asc", "price-desc", "best-selling"] as const;

export const productCollectionDefaults: ProductCollectionData = {
  schemaVersion: PRODUCT_COLLECTION_SCHEMA_VERSION,
  heading: "Shop the collection",
  subheading: "Sample products shown here are editable in the builder before a live catalog is connected.",
  products: [
    {
      id: "sample-aurora-bottle",
      name: "Aurora Bottle",
      price: "$34",
      compareAtPrice: "$42",
      description: "Insulated steel bottle with a soft-touch finish.",
      image: "/landing-optimized/ecommerce.webp",
      alt: "Aurora insulated bottle sample product",
      badge: "Best seller",
      ctaLabel: "Add to cart",
    },
    {
      id: "sample-weekend-tote",
      name: "Weekend Tote",
      price: "$58",
      description: "A roomy, everyday carryall made for the long weekend.",
      image: "/landing-optimized/fashion06.webp",
      alt: "Weekend tote sample product",
      badge: "New",
      ctaLabel: "Add to cart",
    },
    {
      id: "sample-studio-set",
      name: "Studio Set",
      price: "$76",
      compareAtPrice: "$92",
      description: "A considered desk set for a calmer daily routine.",
      image: "/landing-optimized/jewellery07.webp",
      alt: "Studio set sample product",
      ctaLabel: "Add to cart",
    },
  ],
  columns: 3,
  variant: "grid",
  category: "Featured",
  selection: "manual",
  productIds: [],
  limit: 3,
  sort: "manual",
  showFilters: false,
  pagination: false,
  showPrices: true,
  showBadges: true,
  ctaLabel: "Add to cart",
  emptyStateLabel: "Add sample products from the Product Collection settings.",
};

const asString = (value: unknown, fallback = "", max = 400): string =>
  typeof value === "string" ? value.trim().slice(0, max) || fallback : fallback;

const asBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === "boolean" ? value : fallback;

const asOneOf = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? value as T
    : fallback;

const asColumns = (value: unknown): 2 | 3 | 4 =>
  value === 2 || value === 3 || value === 4 ? value : productCollectionDefaults.columns ?? 3;

const asLimit = (value: unknown): number => {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue)
    ? Math.min(12, Math.max(1, Math.round(numberValue)))
    : productCollectionDefaults.limit ?? 3;
};

const copyDefaultProducts = (): ProductMock[] =>
  productCollectionDefaults.products.map((product) => ({ ...product }));

function readProduct(value: unknown, index: number): ProductMock | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const product = value as Record<string, unknown>;
  const name = asString(product.name, "", 120);
  if (!name) return null;

  return {
    id: asString(product.id, `sample-product-${index + 1}`, 80),
    name,
    price: asString(product.price, "$0", 48),
    compareAtPrice: asString(product.compareAtPrice, "", 48) || undefined,
    description: asString(product.description, "", 360) || undefined,
    image: asString(product.image, "/showcase.webp", 2_000),
    alt: asString(product.alt, name, 180),
    badge: asString(product.badge, "", 60) || undefined,
    ctaLabel: asString(product.ctaLabel, "", 80) || undefined,
  };
}

function readProducts(value: unknown): ProductMock[] {
  if (!Array.isArray(value)) return copyDefaultProducts();
  const products = value
    .slice(0, 12)
    .map((product, index) => readProduct(product, index))
    .filter((product): product is ProductMock => Boolean(product));
  return products.length ? products : copyDefaultProducts();
}

function readProductIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [...(productCollectionDefaults.productIds ?? [])];
  return [...new Set(
    value
      .filter((id): id is string => typeof id === "string")
      .map((id) => id.trim().slice(0, 80))
      .filter(Boolean),
  )].slice(0, 24);
}

/** Total reader: old or malformed JSON still produces an editable sample catalog. */
export function readProductCollection(component: BuilderComponent): ProductCollectionData {
  const props = component.props && typeof component.props === "object"
    ? component.props
    : {};

  return {
    schemaVersion: typeof props.schemaVersion === "number"
      ? props.schemaVersion
      : PRODUCT_COLLECTION_SCHEMA_VERSION,
    heading: asString(props.heading, productCollectionDefaults.heading ?? "", 180),
    subheading: asString(props.subheading, productCollectionDefaults.subheading ?? "", 500),
    products: readProducts(props.products),
    columns: asColumns(props.columns),
    variant: asOneOf(props.variant, VARIANTS, productCollectionDefaults.variant ?? "grid"),
    category: asString(props.category, productCollectionDefaults.category ?? "", 100),
    selection: asOneOf(props.selection, SELECTIONS, productCollectionDefaults.selection ?? "manual"),
    productIds: readProductIds(props.productIds),
    limit: asLimit(props.limit),
    sort: asOneOf(props.sort, SORTS, productCollectionDefaults.sort ?? "manual"),
    showFilters: asBoolean(props.showFilters, productCollectionDefaults.showFilters),
    pagination: asBoolean(props.pagination, productCollectionDefaults.pagination ?? false),
    showPrices: asBoolean(props.showPrices, productCollectionDefaults.showPrices ?? true),
    showBadges: asBoolean(props.showBadges, productCollectionDefaults.showBadges ?? true),
    ctaLabel: asString(props.ctaLabel, productCollectionDefaults.ctaLabel ?? "Add to cart", 80),
    emptyStateLabel: asString(props.emptyStateLabel, productCollectionDefaults.emptyStateLabel ?? "", 300),
  };
}

function productExportCard(product: ProductMock, index: number, data: ProductCollectionData): string {
  const id = product.id || `sample-product-${index + 1}`;
  const badge = data.showBadges && product.badge
    ? `<span class="stackly-product-badge" data-stackly-product-badge>${escapeHtml(product.badge)}</span>`
    : "";
  const description = product.description
    ? `<p class="stackly-product-description" data-stackly-product-description>${escapeHtml(product.description)}</p>`
    : "";
  const price = data.showPrices
    ? `<p class="stackly-product-price" data-stackly-product-price><strong>${escapeHtml(product.price)}</strong>${product.compareAtPrice ? `<s>${escapeHtml(product.compareAtPrice)}</s>` : ""}</p>`
    : "";
  const actionLabel = product.ctaLabel || data.ctaLabel;

  return `<article class="stackly-product-card" data-stackly-product-card="sample" data-stackly-product-id="${escapeHtml(id)}">
    <div class="stackly-product-image-wrap">${badge}<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.alt || product.name)}" loading="lazy" /></div>
    <div class="stackly-product-copy"><h3 data-stackly-product-name>${escapeHtml(product.name)}</h3>${description}${price}
      <button type="button" data-stackly-product-action="placeholder" aria-disabled="true" title="Sample catalog action. Connect checkout in the published site.">${escapeHtml(actionLabel)}</button>
    </div>
  </article>`;
}

export const productCollectionSpec: BlockSpec<ProductCollectionData> = {
  type: "product-collection",
  label: "Product Collection",
  group: "content",
  icon: ShoppingBag,
  defaults: productCollectionDefaults,
  read: readProductCollection,
  Renderer: ProductCollectionComponent,
  Panel: ProductCollectionPanel,
  exportHtml: (data, styleAttr) => {
    const config = {
      schemaVersion: data.schemaVersion,
      category: data.category,
      selection: data.selection,
      productIds: data.productIds,
      limit: data.limit,
      sort: data.sort,
      showFilters: data.showFilters,
      pagination: data.pagination,
      variant: data.variant,
      columns: data.columns,
      showPrices: data.showPrices,
      showBadges: data.showBadges,
      ctaLabel: data.ctaLabel,
      emptyStateLabel: data.emptyStateLabel,
    };
    const configAttr = escapeHtml(JSON.stringify(config));
    const attr = styleAttr.replace('class="', 'class="stackly-product-collection ');
    const products = data.products.slice(0, data.variant === "single" ? 1 : data.limit);
    const heading = data.heading ? `<h2 class="stackly-product-heading">${escapeHtml(data.heading)}</h2>` : "";
    const subheading = data.subheading ? `<p class="stackly-product-subheading">${escapeHtml(data.subheading)}</p>` : "";
    const cards = products.length
      ? products.map((product, index) => productExportCard(product, index, data)).join("")
      : `<p class="stackly-product-empty" data-stackly-product-empty>${escapeHtml(data.emptyStateLabel)}</p>`;
    const filters = data.showFilters
      ? `<div class="stackly-product-filters" data-stackly-product-filters data-stackly-product-filter-category="${escapeHtml(data.category)}" aria-label="Sample product filters">
          <button type="button" data-stackly-product-filter="all" aria-pressed="true">All products</button>
          ${data.category ? `<button type="button" data-stackly-product-filter="category" data-stackly-product-filter-value="${escapeHtml(data.category)}" aria-pressed="false">${escapeHtml(data.category)}</button>` : ""}
        </div>`
      : "";
    const status = `Showing ${products.length} sample ${products.length === 1 ? "product" : "products"}. A published site may replace these with the connected catalog.`;

    return `<section${attr} data-stackly-product-collection="true" data-stackly-catalog-mode="sample" data-stackly-variant="${escapeHtml(data.variant)}" data-stackly-selection="${escapeHtml(data.selection)}" data-stackly-category="${escapeHtml(data.category)}" data-stackly-product-config="${configAttr}">
      <header class="stackly-product-header">${heading}${subheading}</header>
      ${filters}
      <p class="stackly-product-status" data-stackly-product-status aria-live="polite">${escapeHtml(status)}</p>
      <div class="stackly-product-grid stackly-product-grid--${escapeHtml(data.variant)}" data-stackly-product-grid style="--stackly-product-columns:${data.columns}">${cards}</div>
      ${data.pagination ? `<nav class="stackly-product-pagination" aria-label="Sample product pagination" data-stackly-product-pagination="placeholder"><span>1</span><span aria-hidden="true">&rsaquo;</span></nav>` : ""}
    </section>`;
  },
  ai: {
    description: "A configurable sample product catalog section. It supports grid, featured, carousel, collection, category, best-sellers, latest, and single-product variants. Product records are editable mock data; no live catalog is fetched in the builder.",
    exampleOutput: productCollectionDefaults,
  },
};

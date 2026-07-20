"use client";

import type { ReactNode } from "react";
import { ShoppingBag, Sparkles } from "lucide-react";
import { useBuilderStore } from "@/store/builderStore";
import { readProductCollection } from "@/components/blocks/product-collection/spec";
import type { BuilderComponent, ProductCollectionData, ProductMock } from "@/types/builder";
import { getBaseStyles } from "./componentStyles";

function numericPrice(value: string): number {
  const match = value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function sampleProducts(data: ProductCollectionData): ProductMock[] {
  let products = [...data.products];

  if (data.selection === "manual" && data.productIds.length > 0) {
    const chosen = data.productIds
      .map((id) => products.find((product) => product.id === id))
      .filter((product): product is ProductMock => Boolean(product));
    if (chosen.length) products = chosen;
  }

  if (data.sort === "price-asc") products.sort((a, b) => numericPrice(a.price) - numericPrice(b.price));
  if (data.sort === "price-desc") products.sort((a, b) => numericPrice(b.price) - numericPrice(a.price));
  if (data.sort === "newest") products.reverse();
  if (data.variant === "single") products = products.slice(0, 1);

  return products.slice(0, data.limit);
}

function variantLabel(variant: ProductCollectionData["variant"]): string {
  return variant.replace(/-/g, " ");
}

export default function ProductCollectionComponent({
  component,
}: {
  component: BuilderComponent;
  children?: ReactNode;
  isEditing?: boolean;
  onUpdate?: (content: string | null) => void;
  onPatch?: (patch: Partial<BuilderComponent>) => void;
}) {
  const data = readProductCollection(component);
  const viewport = useBuilderStore((state) => state.viewport);
  const products = sampleProducts(data);
  const base = getBaseStyles(component);
  const visibleColumns = viewport === "mobile"
    ? 1
    : viewport === "tablet"
      ? Math.min(2, data.columns)
      : data.variant === "single"
        ? 1
        : data.columns;
  const isCarousel = data.variant === "carousel";

  return (
    <section
      className="w-full overflow-hidden border border-[#dbe3ef] shadow-sm"
      style={base}
      data-stackly-product-collection="editor-sample"
      data-stackly-catalog-mode="sample"
      data-stackly-variant={data.variant}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {data.heading && <h2 className="text-2xl font-extrabold tracking-tight text-[#0B1D40] sm:text-3xl">{data.heading}</h2>}
          {data.subheading && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#566583]">{data.subheading}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {data.category && <span className="rounded-full bg-[#eef4fb] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#24416c]">{data.category}</span>}
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800"><Sparkles className="h-3 w-3" /> Sample catalog</span>
        </div>
      </div>

      {data.showFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-2" data-stackly-product-filters data-stackly-product-filter-category={data.category}>
          <button type="button" data-stackly-product-filter="all" aria-pressed="true" className="rounded-full bg-[#0B1D40] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white">All products</button>
          {data.category && <button type="button" data-stackly-product-filter="category" data-stackly-product-filter-value={data.category} aria-pressed="false" className="rounded-full border border-[#cbd9eb] bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#405574]">{data.category}</button>}
        </div>
      )}

      <p className="mb-3 text-[11px] font-medium text-[#66738d]" data-stackly-product-status aria-live="polite">
        Showing {products.length} sample {products.length === 1 ? "product" : "products"}. Connect a catalog after publishing to show live inventory.
      </p>

      {products.length ? (
        <div
          className={isCarousel ? "flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2" : "grid gap-4"}
          style={isCarousel ? undefined : { gridTemplateColumns: `repeat(${visibleColumns}, minmax(0, 1fr))` }}
          aria-label={`${variantLabel(data.variant)} product collection preview`}
          data-stackly-product-grid
        >
          {products.map((product, index) => {
            const isFeatured = data.variant === "featured" && index === 0 && visibleColumns > 1;
            const cardWidth = isCarousel ? { minWidth: "min(270px, 82vw)", width: "min(270px, 82vw)" } : undefined;
            return (
              <article
                key={product.id || `${product.name}-${index}`}
                className={`group relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#e3eaf3] bg-white shadow-[0_4px_16px_rgba(15,35,75,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(15,35,75,0.12)] ${isFeatured ? "md:col-span-2" : ""} ${isCarousel ? "snap-start" : ""}`}
                style={cardWidth}
                data-stackly-product-card="sample"
                data-stackly-product-id={product.id || `sample-product-${index + 1}`}
              >
                <div className={`relative overflow-hidden bg-[#eef4fb] ${isFeatured ? "h-60 sm:h-72" : "h-44"}`}>
                  {/* Native image keeps locally saved mock assets portable in the builder. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.image || "/showcase.webp"} alt={product.alt || product.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" onError={(event) => { event.currentTarget.src = "/showcase.webp"; }} />
                  {data.showBadges && product.badge && <span className="absolute left-3 top-3 rounded-full bg-[#0B1D40] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">{product.badge}</span>}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-[15px] font-extrabold text-[#0B1D40]">{product.name}</h3>
                  {product.description && <p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-[#66738d]">{product.description}</p>}
                  {data.showPrices && <div className="mt-3 flex items-baseline gap-2"><span className="text-base font-black text-[#0B1D40]">{product.price}</span>{product.compareAtPrice && <span className="text-xs font-semibold text-[#94a3b8] line-through">{product.compareAtPrice}</span>}</div>}
                  <button type="button" data-stackly-product-action="placeholder" title="Sample product action. Checkout is connected when the published site hydrates this collection." className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B1D40] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#152B52]"><ShoppingBag className="h-3.5 w-3.5" />{product.ctaLabel || data.ctaLabel}</button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#dbe3ef] bg-[#f8fafc] p-6 text-center">
          <ShoppingBag className="h-8 w-8 text-[#9aabc3]" />
          <p className="mt-3 text-sm font-bold text-[#405574]">{data.emptyStateLabel}</p>
        </div>
      )}

      {data.pagination && products.length > 0 && <div className="mt-5 flex justify-center gap-1.5" aria-label="Sample product pagination" data-stackly-product-pagination="placeholder"><span className="h-2 w-5 rounded-full bg-[#0B1D40]" /><span className="h-2 w-2 rounded-full bg-[#dbe3ef]" /><span className="h-2 w-2 rounded-full bg-[#dbe3ef]" /></div>}
    </section>
  );
}

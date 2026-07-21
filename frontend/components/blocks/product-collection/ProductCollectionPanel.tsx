"use client";

import { Plus, X } from "lucide-react";
import { ContentField, TextareaField } from "@/components/builder/PanelFields";
import type { PanelProps } from "@/lib/blockRegistry";
import type { ProductCollectionData, ProductMock } from "@/types/builder";

const VARIANTS: Array<{ value: ProductCollectionData["variant"]; label: string }> = [
  { value: "grid", label: "Grid" },
  { value: "featured", label: "Featured" },
  { value: "carousel", label: "Carousel" },
  { value: "collection", label: "Collection" },
  { value: "category", label: "Category" },
  { value: "best-sellers", label: "Best sellers" },
  { value: "latest", label: "Latest" },
  { value: "single", label: "Single" },
];

const SELECTIONS: Array<{ value: ProductCollectionData["selection"]; label: string }> = [
  { value: "manual", label: "Manual samples" },
  { value: "category", label: "Category" },
  { value: "best-sellers", label: "Best sellers" },
  { value: "latest", label: "Latest" },
];

const SORTS: Array<{ value: ProductCollectionData["sort"]; label: string }> = [
  { value: "manual", label: "Manual" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low" },
  { value: "price-desc", label: "Price: high" },
  { value: "best-selling", label: "Best selling" },
];

export function ProductCollectionPanel({ data, setProp }: PanelProps<ProductCollectionData>) {
  const setProducts = (products: ProductMock[]) => setProp("products", products);
  const setPublishedProductIds = (value: string) => {
    const productIds = [...new Set(
      value
        .split(/[\n,]/)
        .map((id) => id.trim().slice(0, 80))
        .filter(Boolean),
    )].slice(0, 24);
    setProp("productIds", productIds);
  };
  const updateProduct = (index: number, patch: Partial<ProductMock>) =>
    setProducts(data.products.map((product, productIndex) =>
      productIndex === index ? { ...product, ...patch } : product,
    ));
  const removeProduct = (index: number) => {
    if (data.products.length <= 1) return;
    setProducts(data.products.filter((_, productIndex) => productIndex !== index));
  };
  const addProduct = () => {
    const id = `sample-product-${data.products.length + 1}`;
    const product: ProductMock = {
      id,
      name: "New sample product",
      price: "$0",
      description: "Describe this sample product.",
      image: "/showcase.webp",
      alt: "New sample product",
      ctaLabel: data.ctaLabel || "Add to cart",
    };
    setProducts([...data.products, product]);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-5 text-amber-900">
        This block uses saved sample catalog data only. It does not load, change, or reserve real products while editing.
      </div>

      <ContentField field="heading" label="Heading" value={data.heading} onChange={(value) => setProp("heading", value)} placeholder="Shop the collection" />
      <TextareaField field="subheading" label="Subheading" minHeight="min-h-[70px]" value={data.subheading} onChange={(value) => setProp("subheading", value)} placeholder="A short collection introduction" />

      <div>
        <span className="mb-2 block text-[13px] font-bold text-[#0B1D40]">Display variant</span>
        <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-[#0B1D40] sm:grid-cols-3">
          {VARIANTS.map(({ value, label }) => (
            <button key={value} type="button" onClick={() => setProp("variant", value)} className={`border-b border-r border-[#0B1D40]/10 px-2 py-2 text-[10px] font-bold transition last:border-r-0 ${data.variant === value ? "bg-[#0B1D40] text-white" : "text-[#0B1D40] hover:bg-black/5"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-bold text-[#0B1D40]">Source rule</span>
          <select value={data.selection} onChange={(event) => setProp("selection", event.target.value as ProductCollectionData["selection"])} className="w-full rounded-lg border border-[#0B1D40] bg-white px-3 py-2 text-[12px] font-semibold text-[#0B1D40] outline-none focus:ring-2 focus:ring-blue-100">
            {SELECTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-bold text-[#0B1D40]">Sort rule</span>
          <select value={data.sort} onChange={(event) => setProp("sort", event.target.value as ProductCollectionData["sort"])} className="w-full rounded-lg border border-[#0B1D40] bg-white px-3 py-2 text-[12px] font-semibold text-[#0B1D40] outline-none focus:ring-2 focus:ring-blue-100">
            {SORTS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ContentField field="category" label="Category label" value={data.category} onChange={(value) => setProp("category", value)} placeholder="Featured" />
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-bold text-[#0B1D40]">Products to show</span>
          <select value={data.limit} onChange={(event) => setProp("limit", Number(event.target.value))} className="w-full rounded-lg border border-[#0B1D40] bg-white px-3 py-2.5 text-[12px] font-semibold text-[#0B1D40] outline-none focus:ring-2 focus:ring-blue-100">
            {[1, 2, 3, 4, 5, 6, 8, 12].map((count) => <option key={count} value={count}>{count}</option>)}
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-[#dbe3ef] bg-[#f8fafc] p-3">
        <ContentField field="publishedProductIds" label="Published product IDs" value={data.productIds.join(", ")} onChange={setPublishedProductIds} placeholder="Comma-separated product IDs" />
        <p className="mt-1.5 text-[10px] leading-4 text-[#66738d]">
          Used only by the published catalog runtime for Manual or Single selections. The editor always shows the sample cards below.
        </p>
      </div>

      <div>
        <span className="mb-2 block text-[13px] font-bold text-[#0B1D40]">Columns</span>
        <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-[#0B1D40]">
          {([2, 3, 4] as const).map((columns) => (
            <button key={columns} type="button" onClick={() => setProp("columns", columns)} className={`py-2 text-xs font-bold transition ${data.columns === columns ? "bg-[#0B1D40] text-white" : "text-[#0B1D40] hover:bg-black/5"}`}>
              {columns}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {([
          ["showPrices", "Prices"],
          ["showBadges", "Badges"],
          ["showFilters", "Filters"],
          ["pagination", "Pagination"],
        ] as const).map(([key, label]) => (
          <button key={key} type="button" onClick={() => setProp(key, !data[key])} className={`rounded-lg border px-2 py-2 text-[11px] font-bold transition ${data[key] ? "border-[#0B1D40] bg-[#0B1D40] text-white" : "border-[#dbe3ef] bg-white text-[#566583] hover:border-blue-300"}`}>
            {label}
          </button>
        ))}
      </div>

      <ContentField field="ctaLabel" label="Published add-to-cart label" value={data.ctaLabel} onChange={(value) => setProp("ctaLabel", value)} placeholder="Add to cart" />
      <ContentField field="emptyStateLabel" label="Published empty-state message" value={data.emptyStateLabel} onChange={(value) => setProp("emptyStateLabel", value)} placeholder="No products are available right now." />

      <div className="space-y-3 border-t border-[#dbe3ef] pt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="block text-[13px] font-bold text-[#0B1D40]">Sample products</span>
            <span className="text-[10px] leading-4 text-[#566583]">These are saved with this section and remain local mock data.</span>
          </div>
          <button type="button" onClick={addProduct} disabled={data.products.length >= 12} className="inline-flex items-center gap-1 rounded-lg bg-[#0B1D40] px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#152B52] disabled:cursor-not-allowed disabled:opacity-50">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>

        {data.products.map((product, index) => (
          <div key={product.id || `${product.name}-${index}`} className="space-y-3 rounded-xl border border-[#dbe3ef] bg-white/70 p-3">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1"><ContentField field={`product${index + 1}Name`} label={`Product ${index + 1} name`} value={product.name} onChange={(value) => updateProduct(index, { name: value, alt: product.alt || value })} placeholder="Product name" /></div>
              <button type="button" onClick={() => removeProduct(index)} disabled={data.products.length <= 1} aria-label={`Remove ${product.name || "product"}`} className="mt-7 rounded p-1 text-[#566583] transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ContentField field={`product${index + 1}Price`} label="Price" value={product.price} onChange={(value) => updateProduct(index, { price: value })} placeholder="$0" />
              <ContentField field={`product${index + 1}ComparePrice`} label="Compare at" value={product.compareAtPrice ?? ""} onChange={(value) => updateProduct(index, { compareAtPrice: value || undefined })} placeholder="Optional" />
            </div>
            <ContentField field={`product${index + 1}Badge`} label="Badge" value={product.badge ?? ""} onChange={(value) => updateProduct(index, { badge: value || undefined })} placeholder="New" />
            <ContentField field={`product${index + 1}Image`} label="Image URL" value={product.image} onChange={(value) => updateProduct(index, { image: value })} placeholder="/showcase.webp" />
            <TextareaField field={`product${index + 1}Description`} label="Description" minHeight="min-h-[56px]" value={product.description ?? ""} onChange={(value) => updateProduct(index, { description: value || undefined })} placeholder="Short sample description" />
          </div>
        ))}
      </div>
    </div>
  );
}

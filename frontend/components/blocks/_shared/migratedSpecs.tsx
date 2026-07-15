"use client";

import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  AlignLeft,
  BetweenHorizontalStart,
  Columns3,
  FileText,
  FormInput,
  GalleryHorizontal,
  Heading1,
  Image as ImageIcon,
  ListCollapse,
  MapPin,
  Minus,
  MousePointerClick,
  PanelTop,
  Quote,
  Rows3,
  Share2,
  Square,
  Star,
  Timer,
  Type,
} from "lucide-react";
import type { BlockSpec, PanelProps } from "@/lib/blockRegistry";
import type {
  AccordionProps,
  BuilderComponent,
  ComponentType,
  CountdownProps,
  FooterProps,
  FormProps,
  MapProps,
  PricingTableProps,
  SocialLinksProps,
  SpacerProps,
  TabItem,
  TabsProps,
  TestimonialProps,
  RowProps,
} from "@/types/builder";
import HeadingComponent from "@/components/draggable/HeadingComponent";
import TextComponent from "@/components/draggable/TextComponent";
import ButtonComponent from "@/components/draggable/ButtonComponent";
import ImageComponent from "@/components/draggable/ImageComponent";
import IconComponent, { ICON_NAMES } from "@/components/draggable/IconComponent";
import ColumnsComponent from "@/components/draggable/ColumnsComponent";
import InputComponent from "@/components/draggable/InputComponent";
import DividerComponent from "@/components/draggable/DividerComponent";
import GalleryComponent from "@/components/draggable/GalleryComponent";
import ContainerComponent from "@/components/draggable/ContainerComponent";
import MapComponent, { mapDefaults } from "@/components/draggable/MapComponent";
import AccordionComponent, { accordionDefaults } from "@/components/draggable/AccordionComponent";
import TabsComponent, { tabsDefaults } from "@/components/draggable/TabsComponent";
import SpacerComponent from "@/components/draggable/SpacerComponent";
import SocialLinksComponent, { socialLinksDefaults } from "@/components/draggable/SocialLinksComponent";
import CountdownComponent, { countdownDefaults } from "@/components/draggable/CountdownComponent";
import PricingTableComponent, { pricingTableDefaults } from "@/components/draggable/PricingTableComponent";
import TestimonialComponent, { testimonialDefaults } from "@/components/draggable/TestimonialComponent";
import FooterComponent, { footerDefaults } from "@/components/draggable/FooterComponent";
import FormComponent, { formDefaults } from "@/components/draggable/FormComponent";
import RowComponent, { rowDefaults, ROW_LAYOUTS } from "@/components/draggable/RowComponent";
import { ContentField, contentInputClass } from "@/components/builder/PanelFields";
import { DropZone } from "@/components/assets/DropZone";
import { ImagePicker } from "@/components/assets/ImagePicker";
import { useAssetStore } from "@/store/assetStore";
import { escapeHtml } from "@/lib/htmlUtils";
import { useState, useCallback } from "react";
import { RefreshCw, Trash2, Plus, GripVertical } from "lucide-react";

type ContentProps = { content: string };
type ImageBlockProps = { src: string; alt?: string; assetId?: string };
type IconBlockProps = { name: string };
type ColumnsProps = { columns: "1" | "2" | "3" | "4" };
type GalleryItem = { src: string; caption: string; assetId?: string };
type GalleryProps = { items: GalleryItem[] };

const asObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? value as Record<string, unknown> : {};

const asString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const asBoolean = (value: unknown, fallback = false) =>
  typeof value === "boolean" ? value : fallback;

const asNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

function readContent(component: BuilderComponent, fallback: string): ContentProps {
  return { content: component.content || asString(component.props?.content, fallback) || fallback };
}

function TextContentPanel({
  data,
  setContent,
  label = "Text",
  multiline = false,
}: PanelProps<ContentProps> & { label?: string; multiline?: boolean }) {
  const update = (value: string) => {
    setContent?.(value);
  };

  if (multiline) {
    return (
      <label className="block">
        <span className="mb-2 block text-[13px] font-bold text-[#0B1D40]">{label}</span>
        <textarea
          className={`${contentInputClass} min-h-[120px] resize-none`}
          onChange={(event) => update(event.target.value)}
          value={data.content}
        />
      </label>
    );
  }

  return <ContentField label={label} value={data.content} onChange={update} />;
}

const HeadingPanel = (props: PanelProps<ContentProps>) => <TextContentPanel {...props} label="Heading" />;
const TextPanel = (props: PanelProps<ContentProps>) => <TextContentPanel {...props} label="Paragraph" multiline />;
const ButtonPanel = (props: PanelProps<ContentProps>) => <TextContentPanel {...props} label="Button Label" />;
const InputPanel = (props: PanelProps<ContentProps>) => <TextContentPanel {...props} label="Placeholder" />;

function ImagePanel({ data, setContent, setProp, component }: PanelProps<ImageBlockProps>) {
  const uploadFiles = useAssetStore((s) => s.uploadFiles);
  const getDataUrl = useAssetStore((s) => s.getDataUrl);
  const [pickerOpen, setPickerOpen] = useState(false);

  const currentSrc = data.src || "";
  const hasImage = Boolean(currentSrc && currentSrc !== "/showcase.webp");

  const handleUpload = async (files: File[]) => {
    const assets = await uploadFiles(files);
    if (assets.length > 0) {
      const asset = assets[0];
      const dataUrl = await getDataUrl(asset.id);
      if (dataUrl) {
        setContent?.(dataUrl);
        setProp("assetId" as keyof ImageBlockProps, asset.id as ImageBlockProps[keyof ImageBlockProps]);
      }
    }
  };

  const handlePickerSelect = async (url: string, assetId?: string) => {
    let storedUrl = url;
    if (assetId) {
      const dataUrl = await getDataUrl(assetId);
      if (dataUrl) storedUrl = dataUrl;
    }
    setContent?.(storedUrl);
    setProp("assetId" as keyof ImageBlockProps, (assetId ?? null) as ImageBlockProps[keyof ImageBlockProps]);
    setPickerOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Image preview */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
        {hasImage ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentSrc}
              alt={data.alt || "Preview"}
              className="h-36 w-full object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </div>
        ) : (
          <div className="flex h-28 flex-col items-center justify-center gap-2 text-gray-300">
            <ImageIcon className="h-10 w-10" />
            <span className="text-[11px] font-medium">No image selected</span>
          </div>
        )}
      </div>

      {/* Upload drop zone */}
      <DropZone onFiles={handleUpload} compact multiple={false} />

      {/* Asset picker button */}
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#0B1D40]/20 bg-[#0B1D40] py-2.5 text-[12px] font-bold text-white transition hover:bg-[#152B52]"
      >
        <ImageIcon className="h-3.5 w-3.5" />
        {hasImage ? "Replace from Assets" : "Choose from Assets"}
      </button>

      {/* URL input */}
      <ContentField label="Image URL" value={data.src} onChange={(value) => setContent?.(value)} />

      {/* Alt text */}
      <ContentField label="Alt Text" value={data.alt ?? ""} onChange={(value) => setProp("alt", value)} />

      <ImagePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePickerSelect}
        currentUrl={currentSrc}
      />
    </div>
  );
}

function IconPanel({ data, setContent }: PanelProps<IconBlockProps>) {
  return (
    <div className="space-y-3">
      <span className="block text-[13px] font-bold text-[#0B1D40]">Pick Icon</span>
      <div className="grid max-h-[240px] grid-cols-7 gap-1 overflow-y-auto rounded-xl border border-[#0B1D40] p-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#0B1D40]/20">
        {ICON_NAMES.map((name) => {
          const Icon = (LucideIcons as unknown as Record<string, LucideIcon | undefined>)[name];
          if (!Icon) return null;
          const active = data.name === name;
          return (
            <button
              key={name}
              title={name}
              type="button"
              className={`flex items-center justify-center rounded p-2 transition-all duration-150 ${active ? "bg-[#0B1D40] text-white" : "text-[#0B1D40] hover:bg-[#0B1D40]/10"}`}
              onClick={() => setContent?.(name)}
            >
              <Icon size={16} color={active ? "white" : "#0B1D40"} />
            </button>
          );
        })}
      </div>
      <p className="text-[11px] font-medium text-[#566583]">
        Selected: <span className="font-bold text-[#0B1D40]">{data.name}</span>
      </p>
    </div>
  );
}

function ColumnsPanel({ data, setContent }: PanelProps<ColumnsProps>) {
  return (
    <div className="space-y-3">
      <span className="block text-[13px] font-bold text-[#0B1D40]">Columns</span>
      <div className="grid grid-cols-4 overflow-hidden rounded-xl border border-[#0B1D40]">
        {(["1", "2", "3", "4"] as const).map((count) => (
          <button
            key={count}
            type="button"
            className={`py-2.5 text-sm font-bold transition ${data.columns === count ? "bg-[#0B1D40] text-white" : "text-[#0B1D40] hover:bg-black/5"}`}
            onClick={() => setContent?.(count)}
          >
            {count}
          </button>
        ))}
      </div>
      <p className="rounded-lg bg-[#eef4fb] px-3 py-2 text-[11px] font-medium leading-5 text-[#566583]">
        Drop child blocks into this grid to create side-by-side layouts.
      </p>
    </div>
  );
}

function DividerPanel() {
  return (
    <p className="rounded-lg bg-[#eef4fb] px-3 py-2 text-[12px] font-medium leading-5 text-[#566583]">
      Divider appearance is controlled from the Style and Effects tabs.
    </p>
  );
}

const galleryImagePresets = [
  "/showcase.webp",
  "/landing-optimized/portfolio03.webp",
  "/landing-optimized/ecommerce.webp",
  "/landing-optimized/business09.webp",
  "/landing-optimized/construction02.webp",
  "/landing-optimized/foodd03.webp",
];

function serializeGalleryContent(items: GalleryItem[]) {
  return items
    .filter((item) => item.src.trim())
    .map((item) => `${item.src.trim()}|${item.caption.trim() || "Image"}`)
    .join("\n");
}

function GalleryPanel({ data, component, setContent, setProp }: PanelProps<GalleryProps>) {
  const getDataUrl = useAssetStore((s) => s.getDataUrl);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const items = data.items;

  const saveItems = useCallback(
    (next: GalleryItem[]) => {
      setContent?.(serializeGalleryContent(next));
      setProp("items", next);
    },
    [setContent, setProp],
  );

  const openPicker = (index: number | null = null) => {
    setReplaceIndex(index);
    setPickerOpen(true);
  };

  const handleSelectImage = async (url: string, assetId?: string) => {
    let src = url;
    if (assetId) {
      const dataUrl = await getDataUrl(assetId);
      if (dataUrl) src = dataUrl;
    }
    const next = [...items];
    if (replaceIndex === null) {
      next.push({ src, caption: "Image", assetId });
    } else {
      next[replaceIndex] = { ...next[replaceIndex], src, assetId };
    }
    saveItems(next);
    setPickerOpen(false);
    setReplaceIndex(null);
  };

  const handleSelectMultiple = async (selections: Array<{ url: string; assetId?: string }>) => {
    const newItems: GalleryItem[] = [];
    for (const sel of selections) {
      let src = sel.url;
      if (sel.assetId) {
        const dataUrl = await getDataUrl(sel.assetId);
        if (dataUrl) src = dataUrl;
      }
      newItems.push({ src, caption: "Image", assetId: sel.assetId });
    }
    saveItems([...items, ...newItems]);
    setPickerOpen(false);
    setReplaceIndex(null);
  };

  const updateCaption = (index: number, caption: string) => {
    const next = items.map((item, i) => (i === index ? { ...item, caption } : item));
    saveItems(next);
  };

  const removeItem = (index: number) => {
    saveItems(items.filter((_, i) => i !== index));
  };

  const addPreset = (src: string) => {
    saveItems([...items, { src, caption: src.split("/").pop()?.replace(/\.\w+$/, "") || "Image" }]);
  };

  const handleDragStart = (index: number) => setDragIdx(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === index) return;
    const next = [...items];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(index, 0, moved);
    saveItems(next);
    setDragIdx(index);
  };
  const handleDragEnd = () => setDragIdx(null);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => openPicker()}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B1D40] px-3 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#152B52]"
      >
        <ImageIcon className="h-3.5 w-3.5" />
        Add Images
      </button>

      {items.length === 0 ? (
        <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#0B1D40]/20 bg-white/60 text-center text-[#566583]">
          <ImageIcon className="h-8 w-8 text-[#0B1D40]/30" />
          <span className="text-[12px] font-medium">No gallery images selected</span>
          <button
            type="button"
            onClick={() => openPicker()}
            className="mt-1 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-blue-700 transition"
          >
            Add Images
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={`${item.src}-${index}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`overflow-hidden rounded-xl border bg-white/70 transition-shadow ${
                dragIdx === index
                  ? "border-blue-400 shadow-md"
                  : "border-[#0B1D40]/10"
              }`}
            >
              <div className="relative h-32 bg-[#eef4fb]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.src}
                  alt={item.caption || `Gallery image ${index + 1}`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div className="absolute left-2 top-2">
                  <div className="flex h-7 w-7 cursor-grab items-center justify-center rounded-md bg-white/95 text-[#566583] shadow-sm">
                    <GripVertical className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="absolute right-2 top-2 flex gap-1.5">
                  <button
                    type="button"
                    title="Replace image"
                    onClick={() => openPicker(index)}
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-white/95 text-[#0B1D40] shadow-sm transition hover:bg-blue-50"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Remove image"
                    onClick={() => removeItem(index)}
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-white/95 text-red-500 shadow-sm transition hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-2">
                <input
                  className={contentInputClass}
                  value={item.caption}
                  onChange={(event) => updateCaption(index, event.target.value)}
                  placeholder="Caption"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {galleryImagePresets.slice(1, 5).map((src) => (
          <button
            key={src}
            type="button"
            className="flex items-center justify-center gap-1.5 truncate rounded-lg border border-[#0B1D40]/20 bg-white/60 px-2 py-2 text-[10px] font-bold text-[#0B1D40] transition hover:bg-[#0B1D40]/5"
            onClick={() => addPreset(src)}
          >
            <Plus className="h-3 w-3 shrink-0" />
            {src.split("/").pop()?.replace(".webp", "")}
          </button>
        ))}
      </div>

      <ImagePicker
        open={pickerOpen}
        onClose={() => {
          setPickerOpen(false);
          setReplaceIndex(null);
        }}
        onSelect={handleSelectImage}
        mode={replaceIndex === null ? "multiple" : "single"}
        onSelectMultiple={handleSelectMultiple}
        currentUrl={replaceIndex === null ? undefined : items[replaceIndex]?.src}
      />
    </div>
  );
}

function JsonArrayField<T>({
  label,
  value,
  onChange,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
}) {
  const update = (raw: string) => {
    try {
      onChange(JSON.parse(raw) as T);
    } catch {
      // Keep the user typing; invalid JSON is ignored until it becomes valid.
    }
  };

  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-bold text-[#0B1D40]">{label}</span>
      <textarea
        className={`${contentInputClass} min-h-[180px] resize-none font-mono text-[11px]`}
        onChange={(event) => update(event.target.value)}
        spellCheck={false}
        value={JSON.stringify(value, null, 2)}
      />
    </label>
  );
}

function MapPanel({ data, setProp }: PanelProps<MapProps>) {
  return (
    <div className="space-y-3">
      <ContentField label="Address" value={data.address} onChange={(value) => setProp("address", value)} />
      <ContentField label="Height" value={data.height} onChange={(value) => setProp("height", value)} />
      <label className="block">
        <span className="mb-1 block text-[13px] font-bold text-[#0B1D40]">Zoom ({data.zoom})</span>
        <input
          className="w-full accent-[#0B1D40]"
          max="20"
          min="1"
          onChange={(event) => setProp("zoom", Number(event.target.value))}
          type="range"
          value={data.zoom}
        />
      </label>
    </div>
  );
}

function AccordionPanel({ data, setProp }: PanelProps<AccordionProps>) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-[12px] font-bold text-[#0B1D40]">
        <input checked={Boolean(data.allowMultiple)} onChange={(event) => setProp("allowMultiple", event.target.checked)} type="checkbox" />
        Allow multiple open items
      </label>
      <JsonArrayField label="Items" value={data.items} onChange={(value) => setProp("items", value)} />
    </div>
  );
}

function TabsPanel({ data, setProp }: PanelProps<TabsProps>) {
  return (
    <div className="space-y-3">
      <span className="block text-[13px] font-bold text-[#0B1D40]">Variant</span>
      <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-[#0B1D40]">
        {(["underline", "pills", "boxed"] as const).map((variant) => (
          <button
            key={variant}
            type="button"
            className={`py-2 text-xs font-bold capitalize transition ${data.variant === variant ? "bg-[#0B1D40] text-white" : "text-[#0B1D40] hover:bg-black/5"}`}
            onClick={() => setProp("variant", variant)}
          >
            {variant}
          </button>
        ))}
      </div>
      <JsonArrayField<TabItem[]> label="Tabs" value={data.items} onChange={(value) => setProp("items", value)} />
    </div>
  );
}

function SpacerPanel({ data, setContent, setProp }: PanelProps<SpacerProps>) {
  const numeric = parseInt(data.height, 10) || 60;
  const update = (value: string) => {
    setContent?.(value);
    setProp("height", value);
  };
  return (
    <div className="space-y-3">
      <span className="block text-[13px] font-bold text-[#0B1D40]">Height</span>
      <input
        className="w-full accent-[#0B1D40]"
        max="300"
        min="10"
        onChange={(event) => update(`${event.target.value}px`)}
        step="10"
        type="range"
        value={numeric}
      />
      <ContentField label="CSS Height" value={data.height} onChange={update} />
    </div>
  );
}

function SocialLinksPanel({ data, setProp }: PanelProps<SocialLinksProps>) {
  return (
    <div className="space-y-3">
      <span className="block text-[13px] font-bold text-[#0B1D40]">Size</span>
      <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-[#0B1D40]">
        {(["sm", "md", "lg"] as const).map((size) => (
          <button key={size} type="button" className={`py-2 text-xs font-bold uppercase ${data.size === size ? "bg-[#0B1D40] text-white" : "text-[#0B1D40] hover:bg-black/5"}`} onClick={() => setProp("size", size)}>
            {size}
          </button>
        ))}
      </div>
      <JsonArrayField label="Links" value={data.links} onChange={(value) => setProp("links", value)} />
    </div>
  );
}

function CountdownPanel({ data, setProp }: PanelProps<CountdownProps>) {
  return (
    <div className="space-y-3">
      <ContentField label="Label" value={data.label ?? ""} onChange={(value) => setProp("label", value)} />
      <label className="block">
        <span className="mb-1 block text-[13px] font-bold text-[#0B1D40]">Target Date</span>
        <input className={contentInputClass} onChange={(event) => setProp("targetDate", event.target.value)} type="datetime-local" value={data.targetDate} />
      </label>
      <ContentField label="Finished Text" value={data.finishedText ?? ""} onChange={(value) => setProp("finishedText", value)} />
    </div>
  );
}

function PricingTablePanel({ data, setProp }: PanelProps<PricingTableProps>) {
  return (
    <div className="space-y-3">
      <ContentField label="Heading" value={data.heading ?? ""} onChange={(value) => setProp("heading", value)} />
      <JsonArrayField label="Tiers" value={data.tiers} onChange={(value) => setProp("tiers", value)} />
    </div>
  );
}

function TestimonialPanel({ data, setProp }: PanelProps<TestimonialProps>) {
  return (
    <div className="space-y-3">
      <ContentField label="Heading" value={data.heading ?? ""} onChange={(value) => setProp("heading", value)} />
      <JsonArrayField label="Testimonials" value={data.items} onChange={(value) => setProp("items", value)} />
    </div>
  );
}

function FooterPanel({ data, setProp }: PanelProps<FooterProps>) {
  return (
    <div className="space-y-3">
      <ContentField label="Brand" value={data.brand} onChange={(value) => setProp("brand", value)} />
      <ContentField label="Tagline" value={data.tagline ?? ""} onChange={(value) => setProp("tagline", value)} />
      <ContentField label="Copyright" value={data.copyright ?? ""} onChange={(value) => setProp("copyright", value)} />
      <JsonArrayField label="Columns" value={data.columns} onChange={(value) => setProp("columns", value)} />
      <JsonArrayField label="Socials" value={data.socials ?? []} onChange={(value) => setProp("socials", value)} />
    </div>
  );
}

function FormPanel({ data, setProp }: PanelProps<FormProps>) {
  return (
    <div className="space-y-3">
      <ContentField label="Heading" value={data.heading ?? ""} onChange={(value) => setProp("heading", value)} />
      <ContentField label="Description" value={data.description ?? ""} onChange={(value) => setProp("description", value)} />
      <ContentField label="Submit Label" value={data.submitLabel} onChange={(value) => setProp("submitLabel", value)} />
      <ContentField label="Success Message" value={data.successMessage ?? ""} onChange={(value) => setProp("successMessage", value)} />
      <JsonArrayField label="Fields" value={data.fields} onChange={(value) => setProp("fields", value)} />
    </div>
  );
}

function readImage(component: BuilderComponent): ImageBlockProps {
  const props = asObject(component.props);
  return {
    src: component.content || asString(props.src, "/showcase.webp"),
    alt: asString(props.alt, "Builder image"),
    assetId: asString(props.assetId, ""),
  };
}

function readIcon(component: BuilderComponent): IconBlockProps {
  return { name: component.content || asString(component.props?.name, "Star") || "Star" };
}

function readColumns(component: BuilderComponent): ColumnsProps {
  const columns = component.content || asString(component.props?.columns, "3");
  return { columns: columns === "1" || columns === "2" || columns === "4" ? columns : "3" };
}

function readGallery(component: BuilderComponent): GalleryProps {
  // Prefer structured props.images if available
  const propsObj = asObject(component.props);
  if (Array.isArray(propsObj.items) && propsObj.items.length > 0) {
    const structured = (propsObj.items as Array<Record<string, unknown>>)
      .map((item) => ({
        src: asString(item.src),
        caption: asString(item.caption, "Image"),
        assetId: typeof item.assetId === "string" ? item.assetId : undefined,
      }))
      .filter((item) => item.src);
    if (structured.length > 0) return { items: structured };
  }
  // Legacy: parse pipe-delimited content string
  const items = component.content
    .split("\n")
    .map((line) => {
      const [src = "", ...captionParts] = line.split("|");
      return { src: src.trim(), caption: captionParts.join("|").trim() || "Image" };
    })
    .filter((item) => item.src);
  return { items };
}

function readMap(component: BuilderComponent): MapProps {
  const props = asObject(component.props);
  return {
    address: asString(props.address, mapDefaults.address),
    zoom: asNumber(props.zoom, mapDefaults.zoom),
    height: asString(props.height, mapDefaults.height),
  };
}

function readAccordion(component: BuilderComponent): AccordionProps {
  const props = asObject(component.props);
  return {
    items: Array.isArray(props.items) ? props.items as AccordionProps["items"] : accordionDefaults.items,
    allowMultiple: asBoolean(props.allowMultiple, accordionDefaults.allowMultiple),
  };
}

function readTabs(component: BuilderComponent): TabsProps {
  const props = asObject(component.props);
  const variant = props.variant === "pills" || props.variant === "boxed" ? props.variant : "underline";
  return {
    items: Array.isArray(props.items) ? props.items as TabsProps["items"] : tabsDefaults.items,
    variant,
  };
}

function readSpacer(component: BuilderComponent): SpacerProps {
  return { height: asString(component.props?.height, component.content || "60px") };
}

function readSocialLinks(component: BuilderComponent): SocialLinksProps {
  const props = asObject(component.props);
  const size = props.size === "sm" || props.size === "lg" ? props.size : "md";
  const style = props.style === "outline" || props.style === "flat" ? props.style : "filled";
  return {
    links: Array.isArray(props.links) ? props.links as SocialLinksProps["links"] : socialLinksDefaults.links,
    size,
    style,
  };
}

function readCountdown(component: BuilderComponent): CountdownProps {
  const props = asObject(component.props);
  return {
    targetDate: asString(props.targetDate, countdownDefaults.targetDate),
    label: asString(props.label, countdownDefaults.label),
    finishedText: asString(props.finishedText, countdownDefaults.finishedText),
  };
}

function readPricingTable(component: BuilderComponent): PricingTableProps {
  const props = asObject(component.props);
  return {
    heading: asString(props.heading, pricingTableDefaults.heading),
    tiers: Array.isArray(props.tiers) ? props.tiers as PricingTableProps["tiers"] : pricingTableDefaults.tiers,
  };
}

function readTestimonial(component: BuilderComponent): TestimonialProps {
  const props = asObject(component.props);
  const layout = props.layout === "carousel" || props.layout === "stack" ? props.layout : "cards";
  return {
    heading: asString(props.heading, testimonialDefaults.heading),
    items: Array.isArray(props.items) ? props.items as TestimonialProps["items"] : testimonialDefaults.items,
    layout,
  };
}

function readFooter(component: BuilderComponent): FooterProps {
  const props = asObject(component.props);
  return {
    brand: asString(props.brand, footerDefaults.brand),
    tagline: asString(props.tagline, footerDefaults.tagline),
    columns: Array.isArray(props.columns) ? props.columns as FooterProps["columns"] : footerDefaults.columns,
    copyright: asString(props.copyright, footerDefaults.copyright),
    socials: Array.isArray(props.socials) ? props.socials as FooterProps["socials"] : footerDefaults.socials,
  };
}

function readForm(component: BuilderComponent): FormProps {
  const props = asObject(component.props);
  return {
    heading: asString(props.heading, formDefaults.heading),
    description: asString(props.description, formDefaults.description),
    fields: Array.isArray(props.fields) ? props.fields as FormProps["fields"] : formDefaults.fields,
    submitLabel: asString(props.submitLabel, formDefaults.submitLabel),
    successMessage: asString(props.successMessage, formDefaults.successMessage),
  };
}

function renderIconSvg(name: string, size = 32, color = "#0B1D40") {
  const iconName = ICON_NAMES.includes(name as (typeof ICON_NAMES)[number]) ? name : "Star";
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${escapeHtml(color)}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><title>${escapeHtml(iconName)}</title></svg>`;
}

const contentSpec = (
  type: ComponentType,
  label: string,
  icon: BlockSpec<ContentProps>["icon"],
  Renderer: BlockSpec<ContentProps>["Renderer"],
  fallback: string,
  tag: "h1" | "p" | "button" | "input",
  Panel: BlockSpec<ContentProps>["Panel"],
): BlockSpec<ContentProps> => ({
  type,
  label,
  group: type === "input" ? "form" : "content",
  icon,
  defaults: { content: fallback },
  read: (component) => readContent(component, fallback),
  Renderer,
  Panel,
  exportHtml: (data, styleAttr) => {
    const content = escapeHtml(data.content);
    if (tag === "input") return `<input${styleAttr} placeholder="${content}" />`;
    if (tag === "button") return `<button${styleAttr}>${content}</button>`;
    return `<${tag}${styleAttr}>${content}</${tag}>`;
  },
  ai: { description: `${label} content block.`, exampleOutput: { content: fallback } },
});

export const headingSpec = contentSpec("heading", "Heading", Heading1, HeadingComponent, "Build a better page", "h1", HeadingPanel);
export const textSpec = contentSpec("text", "Text", Type, TextComponent, "Add supporting copy for this section.", "p", TextPanel);
export const buttonSpec = contentSpec("button", "Button", MousePointerClick, ButtonComponent, "Click Me", "button", ButtonPanel);
export const inputSpec = contentSpec("input", "Input", FormInput, InputComponent, "Enter your email", "input", InputPanel);

export const imageSpec: BlockSpec<ImageBlockProps> = {
  type: "image",
  label: "Image",
  group: "media",
  icon: ImageIcon,
  defaults: { src: "/showcase.webp", alt: "Builder image" },
  read: readImage,
  Renderer: ImageComponent,
  Panel: ImagePanel,
  exportHtml: (data, styleAttr) => `<img${styleAttr} src="${escapeHtml(data.src)}" alt="${escapeHtml(data.alt || "Builder image")}" />`,
  ai: { description: "An image block with source URL and alt text.", exampleOutput: { src: "/showcase.webp", alt: "Builder image" } },
};

export const iconSpec: BlockSpec<IconBlockProps> = {
  type: "icon",
  label: "Icon",
  group: "content",
  icon: Star,
  defaults: { name: "Star" },
  read: readIcon,
  Renderer: IconComponent,
  Panel: IconPanel,
  exportHtml: (data, styleAttr) => `<span${styleAttr}>${renderIconSvg(data.name)}</span>`,
  ai: { description: "A Lucide icon block.", exampleOutput: { name: "Star" } },
};

export const columnsSpec: BlockSpec<ColumnsProps> = {
  type: "columns",
  label: "Columns",
  group: "layout",
  icon: Columns3,
  defaults: { columns: "3" },
  read: readColumns,
  Renderer: ColumnsComponent,
  Panel: ColumnsPanel,
  accepts: "any",
  exportHtml: (data, styleAttr, children = "") => {
    const attr = styleAttr.replace('class="', 'class="stackly-columns ');
    return `<div${attr} data-columns="${escapeHtml(data.columns)}">${children}</div>`;
  },
  ai: { description: "A responsive column container.", exampleOutput: { columns: "3" } },
};

export const dividerSpec: BlockSpec<Record<string, never>> = {
  type: "divider",
  label: "Divider",
  group: "layout",
  icon: Minus,
  defaults: {},
  read: () => ({}),
  Renderer: DividerComponent,
  Panel: DividerPanel,
  exportHtml: (_data, styleAttr) => `<hr${styleAttr} />`,
  ai: { description: "A horizontal divider line.", exampleOutput: {} },
};

export const gallerySpec: BlockSpec<GalleryProps> = {
  type: "gallery",
  label: "Gallery",
  group: "media",
  icon: GalleryHorizontal,
  defaults: { items: [] },
  read: readGallery,
  Renderer: GalleryComponent,
  Panel: GalleryPanel,
  exportHtml: (data, styleAttr) => {
    const attr = styleAttr.replace('class="', 'class="stackly-gallery ');
    const gallery = data.items
      .map((item) => `<figure><img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.caption || "Website image")}" /><figcaption>${escapeHtml(item.caption)}</figcaption></figure>`)
      .join("");
    return `<section${attr}><div class="stackly-gallery-grid">${gallery}</div></section>`;
  },
  ai: { description: "A gallery of images with captions.", exampleOutput: { items: [{ src: "/showcase.webp", caption: "Website image" }] } },
};

export const containerSpec: BlockSpec<Record<string, never>> = {
  type: "container",
  label: "Container",
  group: "layout",
  icon: Square,
  defaults: {},
  read: () => ({}),
  Renderer: ContainerComponent,
  Panel: DividerPanel,
  accepts: "any",
  exportHtml: (_data, styleAttr, children = "") => {
    const attr = styleAttr.replace('class="', 'class="stackly-container ');
    return `<section${attr}>${children}</section>`;
  },
  ai: { description: "A generic container section for nested blocks.", exampleOutput: {} },
};

export const mapSpec: BlockSpec<MapProps> = {
  type: "map",
  label: "Map",
  group: "media",
  icon: MapPin,
  defaults: mapDefaults,
  read: readMap,
  Renderer: MapComponent,
  Panel: MapPanel,
  exportHtml: (data, styleAttr) => `<div${styleAttr}><iframe src="https://www.google.com/maps?q=${encodeURIComponent(data.address)}&z=${data.zoom}&output=embed" style="width:100%;height:${escapeHtml(data.height)};border:0" loading="lazy" allowfullscreen></iframe></div>`,
  ai: { description: "An embedded Google map for an address.", exampleOutput: mapDefaults },
};

export const accordionSpec: BlockSpec<AccordionProps> = {
  type: "accordion",
  label: "Accordion",
  group: "content",
  icon: ListCollapse,
  defaults: accordionDefaults,
  read: readAccordion,
  Renderer: AccordionComponent,
  Panel: AccordionPanel,
  exportHtml: (data, styleAttr) => `<div${styleAttr}>${data.items.map((item, index) => `<details${index === 0 ? " open" : ""}><summary style="padding:12px 16px;font-weight:700;cursor:pointer">${escapeHtml(item.title)}</summary><div style="padding:12px 16px;color:#566583">${escapeHtml(item.content)}</div></details>`).join("")}</div>`,
  ai: { description: "Expandable FAQ/content accordion.", exampleOutput: accordionDefaults },
};

export const tabsSpec: BlockSpec<TabsProps> = {
  type: "tabs",
  label: "Tabs",
  group: "content",
  icon: PanelTop,
  defaults: tabsDefaults,
  read: readTabs,
  Renderer: TabsComponent,
  Panel: TabsPanel,
  exportHtml: (data, styleAttr) => `<div${styleAttr}>${data.items.map((item) => `<div style="margin-bottom:12px"><h4 style="font-weight:700">${escapeHtml(item.label)}</h4><p style="color:#566583">${escapeHtml(item.content)}</p></div>`).join("")}</div>`,
  ai: { description: "Tabbed content panels.", exampleOutput: tabsDefaults },
};

export const spacerSpec: BlockSpec<SpacerProps> = {
  type: "spacer",
  label: "Spacer",
  group: "layout",
  icon: BetweenHorizontalStart,
  defaults: { height: "60px" },
  read: readSpacer,
  Renderer: SpacerComponent,
  Panel: SpacerPanel,
  exportHtml: (data, styleAttr) => `<div${styleAttr} style="height:${escapeHtml(data.height)}"></div>`,
  ai: { description: "Adjustable vertical space.", exampleOutput: { height: "60px" } },
};

export const socialLinksSpec: BlockSpec<SocialLinksProps> = {
  type: "social-links",
  label: "Social Links",
  group: "content",
  icon: Share2,
  defaults: socialLinksDefaults,
  read: readSocialLinks,
  Renderer: SocialLinksComponent,
  Panel: SocialLinksPanel,
  exportHtml: (data, styleAttr) => `<div${styleAttr}>${data.links.map((link) => `<a href="${escapeHtml(link.url)}" target="_blank" rel="noopener" style="display:inline-block;margin:0 6px;font-weight:700">${escapeHtml(link.platform)}</a>`).join("")}</div>`,
  ai: { description: "A row of social media links.", exampleOutput: socialLinksDefaults },
};

export const countdownSpec: BlockSpec<CountdownProps> = {
  type: "countdown",
  label: "Countdown",
  group: "content",
  icon: Timer,
  defaults: countdownDefaults,
  read: readCountdown,
  Renderer: CountdownComponent,
  Panel: CountdownPanel,
  exportHtml: (data, styleAttr) => `<div${styleAttr}><h3>${escapeHtml(data.label || "Coming Soon")}</h3><p data-target-date="${escapeHtml(data.targetDate)}">Countdown timer requires JavaScript.</p></div>`,
  ai: { description: "A launch/event countdown timer.", exampleOutput: countdownDefaults },
};

export const pricingTableSpec: BlockSpec<PricingTableProps> = {
  type: "pricing-table",
  label: "Pricing Table",
  group: "content",
  icon: Rows3,
  defaults: pricingTableDefaults,
  read: readPricingTable,
  Renderer: PricingTableComponent,
  Panel: PricingTablePanel,
  exportHtml: (data, styleAttr) => {
    const attr = styleAttr.replace('class="', 'class="stackly-pricing-table ');
    const heading = data.heading ? `<h2 style="text-align:center">${escapeHtml(data.heading)}</h2>` : "";
    const tiers = data.tiers.map((tier) => `<div class="pricing-tier"><h3>${escapeHtml(tier.name)}</h3><div class="pricing-price">${escapeHtml(tier.price)}<small>${escapeHtml(tier.period)}</small></div><ul class="pricing-features">${tier.features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join("")}</ul><button class="pricing-cta">${escapeHtml(tier.cta)}</button></div>`).join("");
    return `<section${attr}>${heading}<div class="pricing-grid">${tiers}</div></section>`;
  },
  ai: { description: "A multi-tier pricing table.", exampleOutput: pricingTableDefaults },
};

export const testimonialSpec: BlockSpec<TestimonialProps> = {
  type: "testimonial",
  label: "Testimonials",
  group: "content",
  icon: Quote,
  defaults: testimonialDefaults,
  read: readTestimonial,
  Renderer: TestimonialComponent,
  Panel: TestimonialPanel,
  exportHtml: (data, styleAttr) => {
    const attr = styleAttr.replace('class="', 'class="stackly-testimonial ');
    const heading = data.heading ? `<h2 style="text-align:center">${escapeHtml(data.heading)}</h2>` : "";
    const items = data.items.map((item) => `<article class="testimonial-card"><blockquote>"${escapeHtml(item.quote)}"</blockquote><p class="testimonial-name">${escapeHtml(item.name)}</p><p class="testimonial-role">${escapeHtml(item.role)}</p></article>`).join("");
    return `<section${attr}>${heading}<div class="testimonial-grid">${items}</div></section>`;
  },
  ai: { description: "Customer testimonial cards.", exampleOutput: testimonialDefaults },
};

export const footerSpec: BlockSpec<FooterProps> = {
  type: "footer",
  label: "Footer",
  group: "layout",
  icon: FileText,
  defaults: footerDefaults,
  read: readFooter,
  Renderer: FooterComponent,
  Panel: FooterPanel,
  exportHtml: (data, styleAttr) => {
    const attr = styleAttr.replace('class="', 'class="stackly-footer ');
    const brandHtml = `<div class="footer-brand"><strong>${escapeHtml(data.brand)}</strong><p>${escapeHtml(data.tagline || "")}</p></div>`;
    const colsHtml = data.columns.map((column) => `<div class="footer-col"><h4>${escapeHtml(column.title)}</h4>${column.links.map((link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join("")}</div>`).join("");
    return `<footer${attr}><div class="footer-grid">${brandHtml}${colsHtml}</div><hr class="footer-divider"/><p class="footer-copyright">${escapeHtml(data.copyright || "")}</p></footer>`;
  },
  ai: { description: "A footer with columns and social links.", exampleOutput: footerDefaults },
};

export const formSpec: BlockSpec<FormProps> = {
  type: "form",
  label: "Form",
  group: "form",
  icon: AlignLeft,
  defaults: formDefaults,
  read: readForm,
  Renderer: FormComponent,
  Panel: FormPanel,
  exportHtml: (data, styleAttr) => {
    const attr = styleAttr.replace('class="', 'class="stackly-form ');
    const heading = data.heading ? `<h2 style="text-align:center">${escapeHtml(data.heading)}</h2>` : "";
    const desc = data.description ? `<p style="text-align:center;margin-bottom:20px;color:#566583">${escapeHtml(data.description)}</p>` : "";
    const fieldHtml = data.fields.map((field) => field.type === "textarea" ? `<label style="display:block;margin-bottom:12px"><span>${escapeHtml(field.label)}</span><textarea placeholder="${escapeHtml(field.placeholder || "")}" rows="4" style="display:block;width:100%;padding:12px;border:1px solid #dbe3ef;border-radius:8px;margin-top:4px"></textarea></label>` : `<label style="display:block;margin-bottom:12px"><span>${escapeHtml(field.label)}</span><input type="${escapeHtml(field.type)}" placeholder="${escapeHtml(field.placeholder || "")}" style="display:block;width:100%;padding:12px;border:1px solid #dbe3ef;border-radius:8px;margin-top:4px"/></label>`).join("");
    return `<section${attr}>${heading}${desc}<form>${fieldHtml}<button type="submit" style="width:100%">${escapeHtml(data.submitLabel)}</button></form></section>`;
  },
  ai: { description: "A contact/signup form with configurable fields.", exampleOutput: formDefaults },
};

/* ─── Row block ──────────────────────────────────────────────────────── */

function readRow(component: BuilderComponent): RowProps {
  const props = asObject(component.props);
  const layout = asString(props.layout, "") || component.content || "50/50";
  return { layout: layout as RowProps["layout"] };
}

/** Visual layout presets for the Row panel */
const ROW_LAYOUT_LABELS: Record<string, string> = {
  "50/50":    "½  ½",
  "33/33/33": "⅓  ⅓  ⅓",
  "25/50/25": "¼  ½  ¼",
  "25/75":    "¼  ¾",
  "75/25":    "¾  ¼",
  "33/67":    "⅓  ⅔",
  "67/33":    "⅔  ⅓",
};

function RowPanel({ data, setContent, setProp }: PanelProps<RowProps>) {
  return (
    <div className="space-y-4">
      <span className="block text-[13px] font-bold text-[#0B1D40]">Column Layout</span>
      <div className="grid grid-cols-2 gap-2">
        {ROW_LAYOUTS.map((layout) => {
          const isActive = data.layout === layout;
          const cols = layout.split("/");
          return (
            <button
              key={layout}
              type="button"
              onClick={() => {
                setContent?.(layout);
                setProp("layout", layout as RowProps["layout"]);
              }}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-3 text-center transition-all ${
                isActive
                  ? "border-[#0B1D40] bg-[#0B1D40]/[0.06] shadow-sm"
                  : "border-[#dbe3ef] bg-white hover:border-blue-300 hover:bg-blue-50/30"
              }`}
            >
              {/* Visual column preview */}
              <div className="flex w-full gap-1" style={{ height: 24 }}>
                {cols.map((col, i) => (
                  <div
                    key={i}
                    className={`rounded-sm ${isActive ? "bg-[#0B1D40]" : "bg-[#dbe3ef]"}`}
                    style={{ flex: parseInt(col) || 1 }}
                  />
                ))}
              </div>
              <span className={`text-[10px] font-bold ${isActive ? "text-[#0B1D40]" : "text-[#566583]"}`}>
                {ROW_LAYOUT_LABELS[layout] || layout}
              </span>
            </button>
          );
        })}
      </div>
      <p className="rounded-lg bg-[#eef4fb] px-3 py-2 text-[11px] font-medium leading-5 text-[#566583]">
        Drop child blocks into this row to create side-by-side layouts.
      </p>
    </div>
  );
}

export const rowSpec: BlockSpec<RowProps> = {
  type: "row",
  label: "Row",
  group: "layout",
  icon: Columns3,
  defaults: rowDefaults,
  read: readRow,
  Renderer: RowComponent,
  Panel: RowPanel,
  accepts: "any",
  exportHtml: (data, styleAttr, children = "") => {
    const cols = data.layout.split("/");
    const gridCols = cols.map((c) => `${parseInt(c) || 1}fr`).join(" ");
    const attr = styleAttr.replace('class="', 'class="stackly-row ');
    return `<section${attr}><div class="stackly-row-grid" style="--grid-template-columns: ${gridCols}">${children}</div></section>`;
  },
  ai: { description: "A row container with configurable column layout.", exampleOutput: rowDefaults },
};

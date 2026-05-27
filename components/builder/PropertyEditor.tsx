"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { Eye, Layers2, Paintbrush, SlidersHorizontal, SquareMousePointer, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ICON_NAMES } from "@/components/draggable/IconComponent";
import { blockRegistry } from "@/lib/blockRegistry";
import type { BuilderComponent } from "@/types/builder";
import { ContentField, contentInputClass } from "@/components/builder/PanelFields";
import { StyleTab } from "./panel/StyleTab";
import LayersPanel from "./LayersPanel";
import { ImagePanel } from "@/components/blocks/image/ImagePanel";

type Tab = "content" | "style" | "advanced" | "layers";

const TABS: Array<{ id: Tab; label: string; Icon: LucideIcon }> = [
  { id: "content",  label: "Content",  Icon: SquareMousePointer },
  { id: "style",    label: "Style",    Icon: Paintbrush },
  { id: "advanced", label: "Advanced", Icon: SlidersHorizontal },
  { id: "layers",   label: "Layers",   Icon: Layers2 },
];

const imagePresets = [
  "/showcase.webp",
  "/landing-optimized/portfolio03.webp",
  "/landing-optimized/ecommerce.webp",
  "/landing-optimized/business09.webp",
  "/landing-optimized/construction02.webp",
  "/landing-optimized/foodd03.webp",
];

export default function PropertyEditor({
  component,
  onUpdate,
  className,
  onClose,
}: {
  component: BuilderComponent | null;
  onUpdate: (id: string, updates: Partial<BuilderComponent>) => void;
  className?: string;
  onClose?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("content");

  const renderContentEditor = () => {
    if (!component) return null;

    const spec = blockRegistry[component.type];
    if (spec) {
      const data = spec.read(component);
      const setProp = (key: string, value: unknown) =>
        onUpdate(component.id, { props: { [key]: value } });
      const Panel = spec.Panel;
      return <Panel data={data} setProp={setProp} />;
    }

    if (component.type === "gallery") {
      return (
        <div className="space-y-3">
          <textarea
            className={`${contentInputClass} min-h-[150px] resize-none font-medium leading-6`}
            onChange={(e) => onUpdate(component.id, { content: e.target.value })}
            value={component.content}
          />
          <p className="text-xs font-medium leading-5 text-[#566583]">One image per line: /path.webp|Caption</p>
          <div className="grid grid-cols-2 gap-2">
            {imagePresets.slice(1, 5).map((img) => (
              <button key={img} type="button"
                className="truncate rounded-lg border border-[#0B1D40] px-2 py-2 text-[10px] font-bold text-[#0B1D40] transition hover:bg-black/5"
                onClick={() => {
                  const line = `${img}|Image`;
                  onUpdate(component.id, { content: component.content ? `${component.content}\n${line}` : line });
                }}>
                + {img.split("/").pop()?.replace(".webp", "")}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (component.type === "image") {
      return <ImagePanel component={component} onUpdate={onUpdate} />;
    }

    if (component.type === "columns") {
      const cur = component.content || "3";
      return (
        <div className="space-y-3">
          <span className="block text-[13px] font-bold text-[#0B1D40]">Columns</span>
          <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-[#0B1D40]">
            {(["2", "3", "4"] as const).map((n) => (
              <button key={n} type="button"
                className={`py-2.5 text-sm font-bold transition ${cur === n ? "bg-[#0B1D40] text-white" : "text-[#0B1D40] hover:bg-black/5"}`}
                onClick={() => onUpdate(component.id, { content: n })}>
                {n}
              </button>
            ))}
          </div>
          <p className="rounded-lg bg-[#eef4fb] px-3 py-2 text-[11px] font-medium leading-5 text-[#566583]">
            Drag <strong className="text-[#0B1D40]">Feature Items</strong> in to create a side-by-side layout.
          </p>
        </div>
      );
    }

    if (component.type === "icon") {
      return (
        <div className="space-y-3">
          <span className="block text-[13px] font-bold text-[#0B1D40]">Pick Icon</span>
          <div className="grid max-h-[240px] grid-cols-7 gap-1 overflow-y-auto rounded-xl border border-[#0B1D40] p-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#0B1D40]/20">
            {ICON_NAMES.map((name) => {
              const Icon = (LucideIcons as unknown as Record<string, LucideIcon | undefined>)[name];
              if (!Icon) return null;
              const active = component.content === name;
              return (
                <button key={name} title={name} type="button"
                  className={`flex items-center justify-center rounded p-2 transition-all duration-150 ${active ? "bg-[#0B1D40] text-white" : "text-[#0B1D40] hover:bg-[#0B1D40]/10"}`}
                  onClick={() => onUpdate(component.id, { content: name })}>
                  <Icon size={16} color={active ? "white" : "#0B1D40"} />
                </button>
              );
            })}
          </div>
          <p className="text-[11px] font-medium text-[#566583]">
            Selected: <span className="font-bold text-[#0B1D40]">{component.content}</span>
          </p>
        </div>
      );
    }

    return (
      <label className="block">
        <span className="mb-2 block text-[13px] font-bold text-[#0B1D40]">
          {component.type === "input" ? "Placeholder Text" : "Text Content"}
        </span>
        <textarea
          className={`${contentInputClass} min-h-[92px] resize-none`}
          onChange={(e) => onUpdate(component.id, { content: e.target.value })}
          value={component.content}
        />
      </label>
    );
  };

  const renderAdvanced = () => (
    <div className="space-y-5 px-5 py-5">
      <div>
        <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-[#566583]">
          Responsive Visibility
        </span>
        <p className="mb-3 text-[11px] text-[#566583]">Hide this block on specific devices.</p>
        {(["Mobile", "Tablet", "Desktop"] as const).map((label) => (
          <div key={label} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-[#f7f9fc]">
            <span className="text-[13px] font-bold text-[#0B1D40]">Hide on {label}</span>
            <button type="button" className="rounded p-1 text-[#566583] hover:text-[#0B1D40]">
              <Eye className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <div>
        <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-[#566583]">
          Block ID
        </span>
        <input
          type="text"
          placeholder={component?.id.slice(0, 8)}
          className="w-full rounded-lg border border-[#dbe3ef] bg-transparent px-3 py-2 font-mono text-[12px] text-[#0B1D40] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
        <p className="mt-1.5 text-[11px] text-[#566583]">Use for anchor links: #block-id</p>
      </div>
    </div>
  );

  const asideClass =
    className ??
    "relative hidden h-full w-[300px] flex-shrink-0 flex-col overflow-hidden rounded-xl border border-[#f4d8cc] bg-[#fff7f4] shadow-[0_18px_45px_rgba(113,63,18,0.10)] xl:flex";

  return (
    <aside className={asideClass}>
      {/* ── Close handle (mobile sheet) ── */}
      {onClose && (
        <div className="relative flex items-center justify-center px-6 pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
          <button
            aria-label="Close"
            className="absolute right-4 top-3 rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Block name header ── */}
      {component && (
        <div className="flex items-center gap-2 border-b border-[#f0eae6] px-5 py-3">
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-[#0B1D40]/10">
            <span className="text-[10px] font-black text-[#0B1D40]">
              {component.type.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-[13px] font-bold text-[#0B1D40]">
            {component.type.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
          </span>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex border-b border-[#f2d8cf] bg-white/40 px-1 pt-1">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            title={label}
            onClick={() => setActiveTab(id)}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-t-md pb-2.5 pt-2 text-[10px] font-bold uppercase tracking-wider transition-colors duration-150 ${
              activeTab === id
                ? "border-b-2 border-[#0B1D40] text-[#0B1D40]"
                : "border-b-2 border-transparent text-[#566583] hover:text-[#0B1D40]"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:block">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab body ── */}
      <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (component?.id ?? "none")}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="h-full"
          >
            {activeTab === "layers" ? (
              <LayersPanel />
            ) : activeTab === "style" && component ? (
              <StyleTab component={component} onUpdate={onUpdate} />
            ) : activeTab === "advanced" ? (
              renderAdvanced()
            ) : (
              <div className="px-5 py-5">
                {!component ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0B1D40]/[0.08]">
                      <SlidersHorizontal className="h-6 w-6 text-[#0B1D40]" />
                    </div>
                    <p className="max-w-[180px] text-[13px] font-medium leading-5 text-[#566583]">
                      Click any block on the canvas to edit it
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">{renderContentEditor()}</div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </aside>
  );
}

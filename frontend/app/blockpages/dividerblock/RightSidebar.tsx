import React, { useState } from "react";
import { ChevronDown, X, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import DividerPreview from "./DividerPreview";
import type { DividerBlockData, DividerBlockProps } from "./types";
 
interface RightSidebarProps {
  selectedBlock: DividerBlockData | null;
  onUpdateBlock: (id: string, props: Partial<DividerBlockProps>) => void;
  onClose?: () => void;
}
 
const styleOptions = ["solid", "dashed", "dotted", "double"] as const;
const weightOptions = ["1", "2", "3", "4"];
const widthOptions = ["100%", "75%", "50%", "25%"];
const spacingOptions = ["10", "20", "30", "40"];
const marginOptions = ["10", "20", "30", "40"];
 
export default function RightSidebar({ selectedBlock, onUpdateBlock, onClose }: RightSidebarProps) {
  const props = selectedBlock?.props;
  const id = selectedBlock?.id || "";
  const [activeTab, setActiveTab] = useState<"button" | "styles">("styles");
  const [showSettings, setShowSettings] = useState(true);
 
  const update = (next: Partial<DividerBlockProps>) => {
    if (id) onUpdateBlock(id, next);
  };
 
  return (
    <aside className="relative flex h-full w-full xl:w-[210px] flex-shrink-0 flex-col overflow-hidden rounded-xl border border-[#f4d8cc] bg-[#fff7f4] shadow-[0_18px_45px_rgba(113,63,18,0.10)]">
      {onClose && (
        <button
          className="xl:hidden absolute top-4 right-4 p-1.5 bg-white hover:bg-gray-50 rounded-md text-gray-600 shadow-sm z-10 border border-gray-200"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </button>
      )}
 
      <div className="flex border-b border-[#f2d8cf] bg-white/45 px-4 pt-5">
        <button
          className={`flex-1 border-b-[2px] pb-4 text-base font-bold transition-colors ${activeTab === "button" ? "border-[#0B1D40] text-[#0B1D40]" : "border-gray-300 text-[#566583] hover:text-[#0B1D40]"}`}
          onClick={() => setActiveTab("button")}
        >
          Button
        </button>
        <button
          className={`flex-1 border-b-[2px] pb-4 text-base font-bold transition-colors ${activeTab === "styles" ? "border-[#0B1D40] text-[#0B1D40]" : "border-gray-300 text-[#566583] hover:text-[#0B1D40]"}`}
          onClick={() => setActiveTab("styles")}
        >
          Styles
        </button>
      </div>
 
      <div className="flex-1 overflow-y-auto px-4 pb-8 pt-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {activeTab === "styles" && props ? (
          <>
            <button
              className="w-full flex items-center justify-between text-[15px] font-bold text-[#0B1D40] hover:bg-black/5 p-1 rounded -ml-1 transition mb-2"
              onClick={() => setShowSettings(!showSettings)}
            >
              <span>Divider Settings</span>
              <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showSettings ? "" : "-rotate-90"}`} />
            </button>
 
            {showSettings && (
              <div className="space-y-5">
                <Field label="Style">
                  <select
                    value={props.lineStyle}
                    onChange={(e) => update({ lineStyle: e.target.value as DividerBlockProps["lineStyle"] })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-[13px] text-[#0B1D40] focus:outline-none focus:ring-2 focus:ring-[#0B1D40]"
                  >
                    {styleOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </option>
                    ))}
                  </select>
                </Field>
 
                <Field label="Weight">
                  <select
                    value={props.weight}
                    onChange={(e) => update({ weight: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-[13px] text-[#0B1D40] focus:outline-none focus:ring-2 focus:ring-[#0B1D40]"
                  >
                    {weightOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt} px
                      </option>
                    ))}
                  </select>
                </Field>
 
                <Field label="Color">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={props.color}
                      onChange={(e) => update({ color: e.target.value })}
                      className="h-9 w-10 cursor-pointer rounded border border-gray-300 bg-white p-1"
                    />
                    <input
                      type="text"
                      value={props.color}
                      onChange={(e) => update({ color: e.target.value })}
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-[13px] text-[#0B1D40] focus:outline-none focus:ring-2 focus:ring-[#0B1D40]"
                    />
                  </div>
                </Field>
 
                <Field label="Width">
                  <select
                    value={props.width}
                    onChange={(e) => update({ width: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-[13px] text-[#0B1D40] focus:outline-none focus:ring-2 focus:ring-[#0B1D40]"
                  >
                    {widthOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </Field>
 
                <Field label="Alignment">
                  <div className="flex gap-2">
                    {([
                      { key: "left", icon: AlignLeft },
                      { key: "center", icon: AlignCenter },
                      { key: "right", icon: AlignRight },
                    ] as const).map(({ key, icon: Icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => update({ alignment: key })}
                        className={`flex h-9 flex-1 items-center justify-center rounded-lg border transition ${props.alignment === key ? "border-[#0B1D40] bg-[#0B1D40] text-white" : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"}`}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </Field>
 
                <Field label="Spacing">
                  <select
                    value={props.spacing}
                    onChange={(e) => update({ spacing: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-[13px] text-[#0B1D40] focus:outline-none focus:ring-2 focus:ring-[#0B1D40]"
                  >
                    {spacingOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt} px
                      </option>
                    ))}
                  </select>
                </Field>
 
                <Field label="Margin">
                  <select
                    value={props.margin}
                    onChange={(e) => update({ margin: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-[13px] text-[#0B1D40] focus:outline-none focus:ring-2 focus:ring-[#0B1D40]"
                  >
                    {marginOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt} px
                      </option>
                    ))}
                  </select>
                </Field>
 
                {props.variant === "line-with-text" && (
                  <Field label="Center Text">
                    <input
                      type="text"
                      value={props.centerText}
                      onChange={(e) => update({ centerText: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-[13px] text-[#0B1D40] focus:outline-none focus:ring-2 focus:ring-[#0B1D40]"
                    />
                  </Field>
                )}
 
                <Field label="Preview">
                  <div className="rounded-lg border border-gray-200 bg-white px-4 py-5">
                    <DividerPreview props={props} />
                  </div>
                </Field>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500 py-6">Select a divider style to edit settings.</p>
        )}
      </div>
    </aside>
  );
}
 
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-[13px] font-bold text-[#0B1D40]">{label}</label>
      {children}
    </div>
  );
}
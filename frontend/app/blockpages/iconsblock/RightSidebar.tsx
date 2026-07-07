import React, { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import IconPreview from "./IconPreview";
import { ICON_OPTIONS, type IconBlockData, type IconBlockProps } from "./types";
 
interface RightSidebarProps {
  selectedBlock: IconBlockData | null;
  onUpdateBlock: (id: string, props: Partial<IconBlockProps>) => void;
  onClose?: () => void;
}
 
const sizeOptions = ["24", "32", "40", "48", "56", "64"];
 
export default function RightSidebar({ selectedBlock, onUpdateBlock, onClose }: RightSidebarProps) {
  const props = selectedBlock?.props;
  const id = selectedBlock?.id || "";
  const [showSettings, setShowSettings] = useState(true);
 
  const update = (next: Partial<IconBlockProps>) => {
    if (id) onUpdateBlock(id, next);
  };
 
  const selectedLabel =
    ICON_OPTIONS.find((opt) => opt.id === props?.iconType)?.label ?? "User";
 
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
 
      <div className="border-b border-[#f2d8cf] bg-white/45 px-4 pt-5 pb-4">
        <h3 className="text-base font-bold text-[#0B1D40]">Icons</h3>
      </div>
 
      <div className="flex-1 overflow-y-auto px-4 pb-8 pt-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {props ? (
          <>
            <button
              className="w-full flex items-center justify-between text-[15px] font-bold text-[#0B1D40] hover:bg-black/5 p-1 rounded -ml-1 transition mb-2"
              onClick={() => setShowSettings(!showSettings)}
            >
              <span>Icon Settings</span>
              <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showSettings ? "" : "-rotate-90"}`} />
            </button>
 
            {showSettings && (
              <div className="space-y-5">
                <Field label="Icons">
                  <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2">
                    <IconPreview props={{ ...props, size: "20", thickness: Math.min(props.thickness, 2) }} />
                    <span className="text-[13px] font-medium text-[#0B1D40]">{selectedLabel}</span>
                  </div>
                </Field>
 
                <Field label="Type">
                  <select
                    value={props.iconType}
                    onChange={(e) => update({ iconType: e.target.value as IconBlockProps["iconType"], customIconUrl: undefined })}
                    className="w-full rounded-lg border border-gray-300 bg-[#0B1D40] px-3 py-2 text-[13px] text-white focus:outline-none focus:ring-2 focus:ring-[#0B1D40]"
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id} className="bg-white text-[#0B1D40]">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>
 
                <div>
                  <p className="mb-3 text-[13px] font-bold text-[#0B1D40]">Style</p>
                  <div className="space-y-4">
                    <Field label="Color">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={props.color}
                          onChange={(e) => update({ color: e.target.value })}
                          className="h-9 w-10 cursor-pointer rounded border border-gray-300 bg-white p-1"
                        />
                        <select
                          value={props.color}
                          onChange={(e) => update({ color: e.target.value })}
                          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-[13px] text-[#0B1D40] focus:outline-none focus:ring-2 focus:ring-[#0B1D40]"
                        >
                          <option value="#EAB308">Yellow</option>
                          <option value="#0B1D40">Navy</option>
                          <option value="#3B82F6">Blue</option>
                          <option value="#EF4444">Red</option>
                          <option value="#22C55E">Green</option>
                          <option value="#333333">Dark Gray</option>
                        </select>
                      </div>
                    </Field>
 
                    <Field label="Size">
                      <select
                        value={props.size}
                        onChange={(e) => update({ size: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-[13px] text-[#0B1D40] focus:outline-none focus:ring-2 focus:ring-[#0B1D40]"
                      >
                        {sizeOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt} px
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </div>
 
                <Field label="Thickness">
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={4}
                      step={0.5}
                      value={props.thickness}
                      onChange={(e) => update({ thickness: parseFloat(e.target.value) })}
                      className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-[#0B1D40]"
                    />
                    <span className="w-8 text-right text-[12px] font-semibold text-[#0B1D40]">
                      {props.thickness}
                    </span>
                  </div>
                </Field>
 
                <Field label="Upload Icon">
                  <div className="relative flex min-h-[100px] items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-6 group overflow-hidden">
                    <IconPreview props={props} />
                    <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="text-xs font-bold text-white">Upload Icon</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              update({ customIconUrl: event.target?.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  {props.customIconUrl && (
                    <button
                      onClick={() => update({ customIconUrl: undefined })}
                      className="mt-2 text-[12px] text-red-500 hover:underline w-full text-center"
                    >
                      Remove Custom Icon
                    </button>
                  )}
                </Field>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500 py-6">Select an icon block to edit settings.</p>
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
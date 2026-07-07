"use client";
 
import { ChevronDown, ChevronLeft, X } from "lucide-react";
import { useState } from "react";
import type { SectionStyleConfig, TextBlockState, TextEditorTarget } from "./types";
 
type TextRightSidebarProps = {
  state: TextBlockState;
  onStateChange: (nextState: TextBlockState) => void;
  onClose?: () => void;
};
 
const targetLabels: Record<TextEditorTarget, string> = {
  main: "Section",
  text: "Text",
  header: "Header",
  footer: "Footer",
};
 
export default function TextRightSidebar({ state, onStateChange, onClose }: TextRightSidebarProps) {
  const [activeTab, setActiveTab] = useState<"properties" | "styles">("styles");
  const [showSection, setShowSection] = useState(true);
  const { section, textStyles, selectedTarget, activeSectionId = "home", sectionStyles = {} } = state;
 
  const setTarget = (selectedTarget: TextEditorTarget) => onStateChange({ ...state, selectedTarget });
  const updateSection = (props: Partial<typeof section>) => onStateChange({ ...state, section: { ...section, ...props } });
  const updateText = (props: Partial<typeof textStyles>) => onStateChange({ ...state, textStyles: { ...textStyles, ...props } });
 
  const updateActiveSectionStyle = (props: Partial<SectionStyleConfig>) => {
    const currentStyles = sectionStyles[activeSectionId] || {};
    onStateChange({
      ...state,
      sectionStyles: {
        ...sectionStyles,
        [activeSectionId]: { ...currentStyles, ...props }
      }
    });
  };
 
  return (
    <aside className="relative z-50 hidden h-full w-[210px] shrink-0 flex-col overflow-hidden rounded-xl border border-[#f4d8cc] bg-[#fff7f4] shadow-[0_18px_45px_rgba(113,63,18,0.10)] xl:flex">
      {onClose && (
        <button className="absolute right-4 top-4 z-10 rounded-md border border-gray-200 bg-white p-1.5 text-gray-600 shadow-sm xl:hidden" onClick={onClose}>
          <X className="h-4 w-4" />
        </button>
      )}
 
      <div className="flex border-b border-[#f2d8cf] bg-white/45 px-3 pt-4">
        <button className={`flex-1 border-b-[2px] pb-3 text-sm font-bold transition-colors ${activeTab === "properties" ? "border-[#0B1D40] text-[#0B1D40]" : "border-gray-300 text-[#566583] hover:text-[#0B1D40]"}`} onClick={() => setActiveTab("properties")}>
          Properties
        </button>
        <button className={`flex-1 border-b-[2px] pb-3 text-sm font-bold transition-colors ${activeTab === "styles" ? "border-[#0B1D40] text-[#0B1D40]" : "border-gray-300 text-[#566583] hover:text-[#0B1D40]"}`} onClick={() => setActiveTab("styles")}>
          Styles
        </button>
      </div>
 
      <div className="flex-1 space-y-4 overflow-y-auto px-3 pb-8 pt-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="grid grid-cols-2 gap-2">
          {(["main", "text", "header", "footer"] as TextEditorTarget[]).map((target) => (
            <button key={target} onClick={() => setTarget(target)} className={`rounded-lg border px-1 py-1.5 text-[11px] font-bold ${selectedTarget === target ? "border-[#0B1D40] bg-[#0B1D40] text-white" : "border-[#0B1D40]/20 bg-white text-[#0B1D40]"}`}>
              {targetLabels[target]}
            </button>
          ))}
        </div>
 
        <button className="flex w-full items-center justify-between rounded p-1 text-[13px] font-bold text-[#0B1D40] hover:bg-black/5" onClick={() => setShowSection((current) => !current)}>
          <span>{activeTab === "properties" ? "Section Settings" : `${targetLabels[selectedTarget]} Style Settings`}</span>
          <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${showSection ? "" : "-rotate-90"}`} />
        </button>
 
        {showSection && activeTab === "properties" && (
          <div className="space-y-5">
            <div>
              <h4 className="mb-2 text-[14px] font-bold text-[#0B1D40]">Editable Text</h4>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#0B1D40]/20 bg-white px-3 py-2 text-sm font-semibold text-[#0B1D40]">
                <input
                  type="checkbox"
                  checked={state.isTextEditable}
                  onChange={(event) => onStateChange({ ...state, isTextEditable: event.target.checked })}
                />
                Enable text editing
              </label>
            </div>
 
            <div>
              <h4 className="mb-2 text-[14px] font-bold text-[#0B1D40]">Alignment</h4>
              <select value={section.alignment} onChange={(event) => updateSection({ alignment: event.target.value as typeof section.alignment })} className="w-full rounded-xl border border-[#0B1D40] bg-transparent px-3 py-2.5 text-[14px] font-bold text-[#0B1D40] outline-none">
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
 
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#0B1D40]/20 bg-white px-3 py-2 text-sm font-semibold text-[#0B1D40]">
              <input type="checkbox" checked={section.shadow} onChange={(event) => updateSection({ shadow: event.target.checked })} />
              Enable card shadows
            </label>
          </div>
        )}
 
        {showSection && activeTab === "styles" && (
          <div className="space-y-5">
            {selectedTarget === "main" && (() => {
              const activeStyle = sectionStyles[activeSectionId] || {};
              return (
                <div className="space-y-4">
                  <div>
                    <h5 className="mb-2 text-[13px] font-bold text-[#0B1D40]">Select Section</h5>
                    <select
                      value={activeSectionId}
                      onChange={(e) => {
                        const targetId = e.target.value;
                        onStateChange({ ...state, activeSectionId: targetId });
                        if (typeof window !== "undefined") {
                          window.dispatchEvent(new CustomEvent('scrollToSectionEvent', { detail: targetId }));
                        }
                      }}
                      className="w-full rounded-xl border border-[#0B1D40] bg-transparent px-3 py-2.5 text-[14px] font-bold text-[#0B1D40] outline-none mb-4"
                    >
                      <option value="home">Home</option>
                      <option value="about">About Me</option>
                      <option value="projects">Projects</option>
                      <option value="video">Video Block</option>
                      <option value="contact">Contact</option>
                      <option value="footer">Footer</option>
                    </select>
 
                    <h5 className="mb-2 text-[13px] font-bold text-[#0B1D40]">Background</h5>
                    <ColorInput
                      label="Background Color"
                      value={activeStyle.backgroundColor || "#ffffff"}
                      onChange={(backgroundColor) => updateActiveSectionStyle({ backgroundColor })}
                    />
                    <div className="mt-3">
                      <p className="mb-1 text-xs text-[#06224C]/70">Gradient Background</p>
                      <input
                        value={activeStyle.gradientBackground || ""}
                        onChange={(e) => updateActiveSectionStyle({ gradientBackground: e.target.value })}
                        placeholder="e.g. linear-gradient(to right, red, blue)"
                        type="text"
                        className="w-full rounded bg-[#F4F6FA] p-2 text-[#06224C] border border-[#06224C]/20 text-xs"
                      />
                    </div>
                    {/* <div className="mt-3">
                      <p className="mb-1 text-xs text-[#06224C]/70">Background Image URL</p>
                      <input
                        value={activeStyle.backgroundImage || ""}
                        onChange={(e) => updateActiveSectionStyle({ backgroundImage: e.target.value })}
                        placeholder="https://..."
                        type="text"
                        className="w-full rounded bg-[#F4F6FA] p-2 text-[#06224C] border border-[#06224C]/20 text-xs"
                      />
                    </div> */}
                  </div>
                </div>
              );
            })()}
 
            {selectedTarget === "text" && (
              <>
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                  Turn on editable text, click copy on the canvas, then adjust the selected text here.
                </div>
                <ColorInput label="Text Color" value={textStyles.color || "#000000"} onChange={(color) => updateText({ color })} />
                <div>
                  <p className="mb-1 text-xs text-[#06224C]/70">Font Size (px)</p>
                  <input value={textStyles.fontSize} onChange={(event) => updateText({ fontSize: event.target.value })} placeholder="e.g. 16" type="number" className="w-full rounded bg-[#F4F6FA] p-2 text-[#06224C] border border-[#06224C]/20" />
                </div>
                <div>
                  <p className="mb-1 text-xs text-[#06224C]/70">Font Family</p>
                  <select value={textStyles.fontFamily} onChange={(event) => updateText({ fontFamily: event.target.value })} className="w-full rounded bg-[#F4F6FA] p-2 text-sm text-[#06224C] border border-[#06224C]/20">
                    <option value="">Default</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="'Times New Roman', serif">Times New Roman</option>
                    <option value="'Courier New', monospace">Courier New</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="Verdana, sans-serif">Verdana</option>
                  </select>
                </div>
              </>
            )}
 
            {selectedTarget === "header" && (
              <>
                <ColorInput label="Header Background" value={section.headerBg} onChange={(headerBg) => updateSection({ headerBg })} />
                <ColorInput label="Header Text Color" value={section.headerText} onChange={(headerText) => updateSection({ headerText })} />
                <div>
                  <p className="mb-1 text-xs text-[#06224C]/70">Header Font Size (px)</p>
                  <input value={section.headerFontSize || ""} onChange={(event) => updateSection({ headerFontSize: event.target.value })} placeholder="e.g. 16" type="number" className="w-full rounded bg-[#F4F6FA] p-2 text-[#06224C] border border-[#06224C]/20" />
                </div>
                <div>
                  <p className="mb-1 text-xs text-[#06224C]/70">Header Font Family</p>
                  <select value={section.headerFontFamily || ""} onChange={(event) => updateSection({ headerFontFamily: event.target.value })} className="w-full rounded bg-[#F4F6FA] p-2 text-sm text-[#06224C] border border-[#06224C]/20">
                    <option value="">Default</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="'Times New Roman', serif">Times New Roman</option>
                    <option value="'Courier New', monospace">Courier New</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="Verdana, sans-serif">Verdana</option>
                  </select>
                </div>
                <div>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#0B1D40]/20 bg-white px-3 py-2 text-sm font-semibold text-[#0B1D40]">
                    <input type="checkbox" checked={section.headerFontWeight === "bold"} onChange={(event) => updateSection({ headerFontWeight: event.target.checked ? "bold" : "normal" })} />
                    Bold Header Text
                  </label>
                </div>
              </>
            )}
 
            {selectedTarget === "footer" && (
              <>
                <ColorInput label="Footer Text Color" value={section.footerText} onChange={(footerText) => updateSection({ footerText })} />
              </>
            )}
 
            {selectedTarget !== "main" && (
              <button className="flex items-center gap-2 text-xs font-bold text-[#06224C]/60 hover:text-[#06224C]" onClick={() => setTarget("main")}>
                <ChevronLeft className="h-3 w-3" />
                Back to section
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <p className="mb-1 text-xs text-[#06224C]/70">{label}</p>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-10 cursor-pointer border-0 bg-transparent p-0" />
        <span className="font-mono text-xs text-[#06224C]/70">{value}</span>
      </div>
    </div>
  );
}
 
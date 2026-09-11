"use client";
 
import { ChevronDown, ChevronLeft, X, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { SectionStyleConfig, TextBlockState, TextEditorTarget, TextTemplateType } from "./types";
import {
  dispatchBlockpagesScrollToSection,
  getBlockpagesDefaultSectionId,
  getBlockpagesFooterScrollId,
  getBlockpagesHeaderScrollId,
  getBlockpagesTemplateSections,
} from "@/lib/blockpagesTemplateSections";
import {
  BLOCKPAGES_HIDDEN_ELEMENTS_CHANGED_EVENT,
  loadHiddenElements,
  markHiddenElement,
  unmarkHiddenElement,
} from "@/lib/blockpagesEditorPersistence";
 
type TextRightSidebarProps = {
  state: TextBlockState;
  /** Committed state change — pushes an undo/redo snapshot. */
  onStateChange: (nextState: TextBlockState) => void;
  /** Live preview state change — updates canvas without pushing history. */
  onLiveStateChange?: (nextState: TextBlockState) => void;
  onClose?: () => void;
  template?: TextTemplateType;
};
 
const targetLabels: Record<TextEditorTarget, string> = {
  main: "Section",
  text: "Text",
  header: "Header",
  footer: "Footer",
};
 
export default function TextRightSidebar({ state, onStateChange, onLiveStateChange, onClose, template = "portfolio" }: TextRightSidebarProps) {
  const [activeTab, setActiveTab] = useState<"properties" | "styles">("styles");
  const [showSection, setShowSection] = useState(true);
  const [showUserAccount, setShowUserAccount] = useState(true);
  const { section, textStyles, selectedTarget, sectionStyles = {} } = state;
  const templateSections = getBlockpagesTemplateSections(template);
  const activeSectionId = state.activeSectionId ?? getBlockpagesDefaultSectionId(template);

  // Live update helper — shows change in real-time without history entry
  const liveUpdate = onLiveStateChange ?? onStateChange;

  useEffect(() => {
    if (selectedTarget === "main") {
      setActiveTab("styles");
      setShowSection(true);
    }
  }, [selectedTarget]);

  useEffect(() => {
    if (template !== "ecommerce") return;

    const syncUserAccountVisibility = () => {
      setShowUserAccount(!loadHiddenElements("ecommerce").includes("buyscreen-user-account"));
    };

    syncUserAccountVisibility();
    window.addEventListener(BLOCKPAGES_HIDDEN_ELEMENTS_CHANGED_EVENT, syncUserAccountVisibility);
    return () => window.removeEventListener(BLOCKPAGES_HIDDEN_ELEMENTS_CHANGED_EVENT, syncUserAccountVisibility);
  }, [template]);
 
  const setTarget = (nextTarget: TextEditorTarget) => {
    onStateChange({ ...state, selectedTarget: nextTarget });
    if (nextTarget === "header") {
      dispatchBlockpagesScrollToSection(getBlockpagesHeaderScrollId(template));
    } else if (nextTarget === "footer") {
      dispatchBlockpagesScrollToSection(getBlockpagesFooterScrollId(template));
    } else if (nextTarget === "main") {
      dispatchBlockpagesScrollToSection(activeSectionId);
    }
  };
  const updateSection = (props: Partial<typeof section>) => onStateChange({ ...state, section: { ...section, ...props } });
  const updateSectionLive = (props: Partial<typeof section>) => liveUpdate({ ...state, section: { ...section, ...props } });
  const updateText = (props: Partial<typeof textStyles>) => onStateChange({ ...state, textStyles: { ...textStyles, ...props } });
  const updateTextLive = (props: Partial<typeof textStyles>) => liveUpdate({ ...state, textStyles: { ...textStyles, ...props } });
 
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

  const updateActiveSectionStyleLive = (props: Partial<SectionStyleConfig>) => {
    const currentStyles = sectionStyles[activeSectionId] || {};
    liveUpdate({
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
        <button className={`flex-1 cursor-pointer border-b-[2px] pb-3 text-sm font-bold transition-colors ${activeTab === "properties" ? "border-[#0B1D40] text-[#0B1D40]" : "border-gray-300 text-[#566583] hover:text-[#0B1D40]"}`} onClick={() => setActiveTab("properties")}>
          Properties
        </button>
        <button className={`flex-1 cursor-pointer border-b-[2px] pb-3 text-sm font-bold transition-colors ${activeTab === "styles" ? "border-[#0B1D40] text-[#0B1D40]" : "border-gray-300 text-[#566583] hover:text-[#0B1D40]"}`} onClick={() => setActiveTab("styles")}>
          Styles
        </button>
      </div>
 
      <div className="flex-1 space-y-4 overflow-y-auto px-3 pb-8 pt-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="grid grid-cols-2 gap-2">
          {(["main", "text", "header", "footer"] as TextEditorTarget[]).map((target) => (
            <button
              key={target}
              type="button"
              onClick={() => setTarget(target)}
              className={`cursor-pointer rounded-lg border px-1 py-1.5 text-[11px] font-bold transition-all duration-150 hover:shadow-sm active:scale-[0.98] ${
                selectedTarget === target
                  ? "border-[#0B1D40] bg-[#0B1D40] text-white shadow-sm"
                  : "border-[#0B1D40]/20 bg-white text-[#0B1D40] hover:bg-[#f1f5f9] hover:border-[#0B1D40]/40"
              }`}
            >
              {targetLabels[target]}
            </button>
          ))}
        </div>
 
        <button className="flex w-full cursor-pointer items-center justify-between rounded p-1 text-[13px] font-bold text-[#0B1D40] hover:bg-black/5" onClick={() => setShowSection((current) => !current)}>
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
              <select value={section.alignment} onChange={(event) => updateSection({ alignment: event.target.value as typeof section.alignment })} className="w-full cursor-pointer rounded-xl border border-[#0B1D40] bg-transparent px-3 py-2.5 text-[14px] font-bold text-[#0B1D40] outline-none transition-colors hover:border-[#152B52]">
                <option value="left" className="cursor-pointer">Left</option>
                <option value="center" className="cursor-pointer">Center</option>
                <option value="right" className="cursor-pointer">Right</option>
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
                    <SectionSelectDropdown
                      value={activeSectionId}
                      options={templateSections}
                      onChange={(targetId) => {
                        onStateChange({ ...state, activeSectionId: targetId });
                        dispatchBlockpagesScrollToSection(targetId);
                      }}
                    />
 
                    <h5 className="mb-2 text-[13px] font-bold text-[#0B1D40]">Background</h5>
                    <ColorInput
                      label="Background Color"
                      value={activeStyle.backgroundColor || "#ffffff"}
                      onLiveChange={(backgroundColor) => updateActiveSectionStyleLive({ backgroundColor })}
                      onCommit={(backgroundColor) => updateActiveSectionStyle({ backgroundColor })}
                    />
                    <div className="mt-3">
                      <p className="mb-1 text-xs text-[#06224C]/70">Gradient Background</p>
                      <DebouncedTextInput
                        value={activeStyle.gradientBackground || ""}
                        onLiveChange={(gradientBackground) => updateActiveSectionStyleLive({ gradientBackground })}
                        onCommit={(gradientBackground) => updateActiveSectionStyle({ gradientBackground })}
                        placeholder="e.g. linear-gradient(to right, red, blue)"
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
                <ColorInput
                  label="Text Color"
                  value={textStyles.color || "#000000"}
                  onLiveChange={(color) => updateTextLive({ color })}
                  onCommit={(color) => updateText({ color })}
                />
                <div>
                  <p className="mb-1 text-xs text-[#06224C]/70">Font Size (px)</p>
                  <DebouncedTextInput
                    value={textStyles.fontSize}
                    onLiveChange={(fontSize) => updateTextLive({ fontSize })}
                    onCommit={(fontSize) => updateText({ fontSize })}
                    placeholder="e.g. 16"
                    type="number"
                    className="w-full rounded bg-[#F4F6FA] p-2 text-[#06224C] border border-[#06224C]/20"
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs text-[#06224C]/70">Font Family</p>
                  <select value={textStyles.fontFamily} onChange={(event) => updateText({ fontFamily: event.target.value })} className="w-full cursor-pointer rounded bg-[#F4F6FA] p-2 text-sm text-[#06224C] border border-[#06224C]/20">
                    <option value="" className="cursor-pointer">Default</option>
                    <option value="Arial, sans-serif" className="cursor-pointer">Arial</option>
                    <option value="'Times New Roman', serif" className="cursor-pointer">Times New Roman</option>
                    <option value="'Courier New', monospace" className="cursor-pointer">Courier New</option>
                    <option value="Georgia, serif" className="cursor-pointer">Georgia</option>
                    <option value="Verdana, sans-serif" className="cursor-pointer">Verdana</option>
                  </select>
                </div>
              </>
            )}

            {selectedTarget === "header" && (
              <>
                <ColorInput
                  label="Header Background"
                  value={section.headerBg}
                  onLiveChange={(headerBg) => updateSectionLive({ headerBg })}
                  onCommit={(headerBg) => updateSection({ headerBg })}
                />
                <ColorInput
                  label="Header Text Color"
                  value={section.headerText}
                  onLiveChange={(headerText) => updateSectionLive({ headerText })}
                  onCommit={(headerText) => updateSection({ headerText })}
                />
                <div>
                  <p className="mb-1 text-xs text-[#06224C]/70">Header Font Size (px)</p>
                  <DebouncedTextInput
                    value={section.headerFontSize || ""}
                    onLiveChange={(headerFontSize) => updateSectionLive({ headerFontSize })}
                    onCommit={(headerFontSize) => updateSection({ headerFontSize })}
                    placeholder="e.g. 16"
                    type="number"
                    className="w-full rounded bg-[#F4F6FA] p-2 text-[#06224C] border border-[#06224C]/20"
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs text-[#06224C]/70">Header Font Family</p>
                  <select value={section.headerFontFamily || ""} onChange={(event) => updateSection({ headerFontFamily: event.target.value })} className="w-full cursor-pointer rounded bg-[#F4F6FA] p-2 text-sm text-[#06224C] border border-[#06224C]/20">
                    <option value="" className="cursor-pointer">Default</option>
                    <option value="Arial, sans-serif" className="cursor-pointer">Arial</option>
                    <option value="'Times New Roman', serif" className="cursor-pointer">Times New Roman</option>
                    <option value="'Courier New', monospace" className="cursor-pointer">Courier New</option>
                    <option value="Georgia, serif" className="cursor-pointer">Georgia</option>
                    <option value="Verdana, sans-serif" className="cursor-pointer">Verdana</option>
                  </select>
                </div>
                <div>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#0B1D40]/20 bg-white px-3 py-2 text-sm font-semibold text-[#0B1D40]">
                    <input type="checkbox" checked={section.headerFontWeight === "bold"} onChange={(event) => updateSection({ headerFontWeight: event.target.checked ? "bold" : "normal" })} />
                    Bold Header Text
                  </label>
                </div>
                {template === "ecommerce" ? (
                  <div>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#0B1D40]/20 bg-white px-3 py-2 text-sm font-semibold text-[#0B1D40]">
                      <input
                        type="checkbox"
                        checked={showUserAccount}
                        onChange={(event) => {
                          const nextShowUserAccount = event.target.checked;
                          setShowUserAccount(nextShowUserAccount);
                          if (nextShowUserAccount) {
                            unmarkHiddenElement("ecommerce", "buyscreen-user-account");
                          } else {
                            markHiddenElement("ecommerce", "buyscreen-user-account");
                          }
                        }}
                      />
                      Show user account
                    </label>
                  </div>
                ) : null}
              </>
            )}
 
            {selectedTarget === "footer" && (
              <>
                <ColorInput
                  label="Footer Background"
                  value={section.footerBg}
                  onLiveChange={(footerBg) => updateSectionLive({ footerBg })}
                  onCommit={(footerBg) => updateSection({ footerBg })}
                />
                <ColorInput
                  label="Footer Text Color"
                  value={section.footerText}
                  onLiveChange={(footerText) => updateSectionLive({ footerText })}
                  onCommit={(footerText) => updateSection({ footerText })}
                />
              </>
            )}
 
            {selectedTarget !== "main" && (
              <button className="flex cursor-pointer items-center gap-2 text-xs font-bold text-[#06224C]/60 hover:text-[#06224C]" onClick={() => setTarget("main")}>
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

/**
 * Color picker with live/commit separation.
 * - Native color picker: `onInput` → live preview, `onChange` → commit (fires on picker close).
 * - Hex text input: every keystroke → live preview, `onBlur` → commit.
 */
function ColorInput({
  label,
  value,
  onLiveChange,
  onCommit,
}: {
  label: string;
  value: string;
  onLiveChange: (value: string) => void;
  onCommit: (value: string) => void;
}) {
  const safeColor = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#000000";
  const colorInputRef = useRef<HTMLInputElement>(null);
  const beforePickRef = useRef(value);

  const onLiveChangeRef = useRef(onLiveChange);
  const onCommitRef = useRef(onCommit);
  onLiveChangeRef.current = onLiveChange;
  onCommitRef.current = onCommit;

  useEffect(() => {
    const el = colorInputRef.current;
    if (!el) return;

    const handleInput = (e: Event) => {
      onLiveChangeRef.current((e.target as HTMLInputElement).value);
    };
    const handleChange = (e: Event) => {
      onCommitRef.current((e.target as HTMLInputElement).value);
    };

    el.addEventListener("input", handleInput);
    el.addEventListener("change", handleChange);
    return () => {
      el.removeEventListener("input", handleInput);
      el.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    if (colorInputRef.current && colorInputRef.current.value !== safeColor) {
      colorInputRef.current.value = safeColor;
    }
  }, [safeColor]);

  return (
    <div>
      <p className="mb-1 text-xs text-[#06224C]/70">{label}</p>
      <div className="flex items-center gap-2">
        <input
          ref={colorInputRef}
          type="color"
          defaultValue={safeColor}
          onFocus={() => { beforePickRef.current = value; }}
          className="h-10 w-10 cursor-pointer border-0 bg-transparent p-0"
        />
        <input
          type="text"
          value={value || ""}
          onChange={(event) => onLiveChange(event.target.value)}
          onBlur={(event) => {
            if (event.target.value !== beforePickRef.current) {
              onCommit(event.target.value);
            }
          }}
          onFocus={() => { beforePickRef.current = value; }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          placeholder="#ffffff"
          aria-label={label}
          className="w-24 rounded border border-[#06224C]/20 bg-[#F4F6FA] px-2 py-1 font-mono text-xs text-[#06224C] outline-none"
        />
      </div>
    </div>
  );
}

/**
 * Text input with live/commit separation.
 * - Every keystroke → live preview (no history entry).
 * - onBlur / Enter → commit (one history entry).
 */
function DebouncedTextInput({
  value,
  onLiveChange,
  onCommit,
  placeholder,
  type = "text",
  className,
}: {
  value: string;
  onLiveChange: (value: string) => void;
  onCommit: (value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  const beforeRef = useRef(value);

  return (
    <input
      value={value}
      onChange={(event) => onLiveChange(event.target.value)}
      onFocus={() => { beforeRef.current = value; }}
      onBlur={(event) => {
        if (event.target.value !== beforeRef.current) {
          onCommit(event.target.value);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
      }}
      placeholder={placeholder}
      type={type}
      className={className}
    />
  );
}

function SectionSelectDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative w-full mb-4">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-[#0B1D40] bg-white px-3 py-2.5 text-[14px] font-bold text-[#0B1D40] shadow-sm transition-all duration-150 hover:border-[#152B52] hover:bg-[#fafcff] focus:outline-none focus:ring-2 focus:ring-[#0B1D40]/20"
      >
        <span className="truncate">{selectedOption?.label ?? "Select Section"}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[#0B1D40] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-[100] w-full max-h-56 overflow-y-auto rounded-xl border border-[#0B1D40]/20 bg-white p-1.5 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-150 custom-scrollbar">
          {options.map((option) => {
            const isSelected = option.id === value;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] font-semibold transition-colors duration-150 ${
                  isSelected
                    ? "bg-[#0B1D40] text-white"
                    : "text-[#0B1D40] hover:bg-[#f1f5f9] active:bg-[#e2e8f0]"
                }`}
              >
                <span>{option.label}</span>
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-white" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
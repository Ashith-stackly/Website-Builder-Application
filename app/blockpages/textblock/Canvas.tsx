"use client";

import { useEffect, useRef } from "react";
import { ChevronDown, Eye, Redo2, Save, Send, Undo2 } from "lucide-react";
import { assetPath } from "@/lib/paths";
import PortfolioPreview from "./PortfolioPreview";
import StorefrontPreview from "./StorefrontPreview";
import type { TextBlockState, TextEditorTarget, TextStyles, TextTemplateType } from "./types";

const TEXTBLOCK_PREVIEW_STORAGE_KEY = "stackly-textblock-preview-html";

type TextCanvasProps = {
  state: TextBlockState;
  onStateChange: (nextState: TextBlockState) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  template?: TextTemplateType;
};

const rgbToHex = (rgb: string) => {
  if (!rgb) return "#000000";
  if (rgb.startsWith("#")) return rgb;
  const result = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/.exec(rgb);
  if (!result) return "#000000";
  return `#${[result[1], result[2], result[3]]
    .map((value) => parseInt(value, 10).toString(16).padStart(2, "0"))
    .join("")}`;
};

export default function TextCanvas({ state, onStateChange, canUndo, canRedo, onUndo, onRedo, template = "ecommerce" }: TextCanvasProps) {
  const isPreviewMode = false;
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const activeEditableRef = useRef<HTMLElement | null>(null);
  const { section, isTextEditable } = state;

  const selectTarget = (target: TextEditorTarget) => {
    onStateChange({ ...state, selectedTarget: target });
  };

  useEffect(() => {
    const activeText = canvasRef.current?.querySelector(".editable-text-active") as HTMLElement | null;
    if (!activeText || state.selectedTarget !== "text") return;

    activeText.style.color = state.textStyles.color || "";
    activeText.style.fontSize = state.textStyles.fontSize ? `${state.textStyles.fontSize}px` : "";
    activeText.style.fontFamily = state.textStyles.fontFamily || "";
  }, [state.selectedTarget, state.textStyles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const textTags = ["H1", "H2", "H3", "H4", "H5", "H6", "P", "SPAN", "LI", "LABEL", "A", "BUTTON"];

    const handleTextClick = (event: Event) => {
      if (!isTextEditable || isPreviewMode) return;
      event.stopPropagation();

      const target = event.target as HTMLElement;
      activeEditableRef.current = target;
      canvas.querySelectorAll(".editable-text-active").forEach((element) => element.classList.remove("editable-text-active"));
      target.classList.add("editable-text-active");

      const computedStyle = window.getComputedStyle(target);
      const nextTextStyles: TextStyles = {
        color: rgbToHex(target.style.color || computedStyle.color),
        fontSize: target.style.fontSize.replace("px", "") || computedStyle.fontSize.replace("px", ""),
        fontFamily: target.style.fontFamily || computedStyle.fontFamily,
      };

      onStateChange({ ...state, selectedTarget: "text", textStyles: nextTextStyles });
    };

    const makeEditable = (node: Element) => {
      if (node.closest("[data-builder-chrome='true']")) return;

      if (textTags.includes(node.tagName)) {
        if (isTextEditable && !isPreviewMode) {
          node.setAttribute("contenteditable", "true");
          (node as HTMLElement).addEventListener("click", handleTextClick);
        } else {
          node.removeAttribute("contenteditable");
          (node as HTMLElement).removeEventListener("click", handleTextClick);
          node.classList.remove("editable-text-active");
        }
      }

      Array.from(node.children).forEach(makeEditable);
    };

    Array.from(canvas.children).forEach(makeEditable);

    return () => {
      const removeListeners = (node: Element) => {
        if (textTags.includes(node.tagName)) {
          (node as HTMLElement).removeEventListener("click", handleTextClick);
        }
        Array.from(node.children).forEach(removeListeners);
      };
      Array.from(canvas.children).forEach(removeListeners);
    };
  }, [isPreviewMode, isTextEditable, onStateChange, state]);

  const runNativeTextCommand = (command: "undo" | "redo") => {
    const activeEditable = activeEditableRef.current;
    if (!isTextEditable || !activeEditable || !canvasRef.current?.contains(activeEditable)) {
      return false;
    }

    activeEditable.focus();
    return document.execCommand(command);
  };

  const handleUndo = () => {
    if (!runNativeTextCommand("undo")) {
      onUndo?.();
    }
  };

  const handleRedo = () => {
    if (!runNativeTextCommand("redo")) {
      onRedo?.();
    }
  };

  const openPreviewPage = () => {
    const previewClone = canvasRef.current?.cloneNode(true) as HTMLDivElement | undefined;
    previewClone?.querySelectorAll("[contenteditable]").forEach((element) => element.removeAttribute("contenteditable"));
    previewClone?.querySelectorAll(".editable-text-active").forEach((element) => element.classList.remove("editable-text-active"));
    previewClone?.querySelectorAll("[data-builder-chrome='true']").forEach((element) => element.remove());
    previewClone?.querySelector("[data-textblock-canvas]")?.removeAttribute("class");

    window.localStorage.setItem(TEXTBLOCK_PREVIEW_STORAGE_KEY, previewClone?.innerHTML ?? "");
    window.open(assetPath("/blockpages/preview/"), "_blank", "noopener,noreferrer");
  };

  return (
    <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#dbe3ef] bg-[#f7f9fc] shadow-sm">
      <div
        data-builder-chrome="true"
        className="flex h-[64px] flex-shrink-0 items-center justify-between gap-4 overflow-x-auto border-b border-[#dbe3ef] bg-white px-3 shadow-[0_1px_0_rgba(15,23,42,0.03)] md:px-5"
      >
        <button className="flex items-center gap-2 whitespace-nowrap rounded px-2 py-1.5 text-[14px] font-bold text-[#0B1D40] hover:bg-gray-100 md:text-[15px]">
          My Website
          <ChevronDown className="h-4 w-4 text-gray-600" />
        </button>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex flex-shrink-0 overflow-hidden rounded-md border border-gray-300 bg-white shadow-sm">
            <button className={`border-r border-gray-300 px-3 py-2 ${canUndo || isTextEditable ? "text-gray-600 hover:bg-gray-50" : "cursor-not-allowed text-gray-300"}`} onClick={handleUndo} disabled={!canUndo && !isTextEditable} title="Undo">
              <Undo2 className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
            <button className={`px-3 py-2 ${canRedo || isTextEditable ? "text-gray-600 hover:bg-gray-50" : "cursor-not-allowed text-gray-300"}`} onClick={handleRedo} disabled={!canRedo && !isTextEditable} title="Redo">
              <Redo2 className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
          </div>
          <button className="flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-2 text-[13px] font-bold text-[#0B1D40] shadow-sm hover:bg-gray-50" title="Save Draft">
            <Save className="h-4 w-4 text-gray-600 lg:hidden" />
            <span className="hidden lg:inline">Save Draft</span>
          </button>
          <button
            className="flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-2 text-[13px] font-bold text-[#0B1D40] shadow-sm hover:bg-gray-50"
            onClick={openPreviewPage}
            title="Preview"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden lg:inline">Preview</span>
          </button>
          <button className="flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#0B1D40] px-3 py-2 text-[13px] font-bold text-white shadow-[0_2px_4px_rgba(11,29,64,0.3)] hover:bg-[#152B52]" title="Publish">
            <span className="hidden lg:inline">Publish</span>
            <Send className="h-[14px] w-[14px]" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1280px] overflow-hidden rounded-xl border border-[#dbe3ef] bg-white shadow-[0_18px_45px_rgba(15,35,75,0.08)]">
          <div data-builder-chrome="true" className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e6edf5] px-5 py-4 sm:px-6">
            <h2 className="text-[18px] font-bold text-[#0B1D40]">
              {template === "portfolio" ? "Portfolio Text Blocks" : "E-Commerce Text Blocks"}
            </h2>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              {(["main", "text", "header", "footer"] as TextEditorTarget[]).map((target) => (
                <button
                  key={target}
                  onClick={() => selectTarget(target)}
                  className={`rounded-md border px-3 py-1.5 capitalize ${state.selectedTarget === target ? "border-[#0B1D40] bg-[#0B1D40] text-white" : "border-[#dbe3ef] text-[#0B1D40] hover:bg-[#f7f9fc]"}`}
                >
                  {target === "main" ? "Section" : target}
                </button>
              ))}
            </div>
          </div>

          <div
            ref={canvasRef}
            className={`relative min-h-[640px] ${section.shadow ? "shadow-inner" : ""}`}
            style={{ backgroundColor: section.backgroundColor, textAlign: section.alignment }}
          >
            {isTextEditable && !isPreviewMode ? (
              <style>{`
                [data-textblock-canvas] [contenteditable="true"]:hover {
                  outline: 1px dashed rgba(99, 229, 255, 0.7);
                  outline-offset: 2px;
                  cursor: text;
                }
                [data-textblock-canvas] .editable-text-active {
                  outline: 2px dashed #63e5ff !important;
                  outline-offset: 4px;
                }
              `}</style>
            ) : null}
            <style>{`
              [data-textblock-canvas] .buyscreen-header,
              [data-textblock-canvas] .buyscreen-categories,
              [data-textblock-canvas] .portfolio-shell > .sticky {
                background-color: ${section.headerBg} !important;
                color: ${section.headerText} !important;
              }
              [data-textblock-canvas] .buyscreen-header *,
              [data-textblock-canvas] .buyscreen-categories *,
              [data-textblock-canvas] .portfolio-shell > .sticky * {
                border-color: ${section.headerText}66;
              }
              [data-textblock-canvas] footer,
              [data-textblock-canvas] .stackly-footer {
                background-color: ${section.footerBg} !important;
                color: ${section.footerText} !important;
              }
              [data-textblock-canvas] footer *,
              [data-textblock-canvas] .stackly-footer * {
                color: inherit;
                border-color: ${section.footerText}33;
              }
            `}</style>
            <div
              data-textblock-canvas
              className={template === "ecommerce" ? "h-[calc(100vh-160px)] min-h-[560px] overflow-y-auto" : undefined}
            >
              <div ref={contentRef}>
                {template === "portfolio" ? <PortfolioPreview /> : <StorefrontPreview />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

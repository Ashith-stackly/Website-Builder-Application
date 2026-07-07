"use client";
 
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Eye, Redo2, Save, Send, Undo2 } from "lucide-react";
import { FaLaptop, FaMobileAlt, FaTabletAlt } from "react-icons/fa";
import { routePath } from "@/lib/paths";
import { getBlockpagesTemplateLabel } from "@/lib/blockpagesTemplates";
import { buildBlockpagesSectionStylesCss } from "@/lib/blockpagesTemplateSections";
import PortfolioPreview from "./PortfolioPreview";
import StorefrontPreview from "./StorefrontPreview";
import TemplatePreviewRouter from "./TemplatePreviewRouter";
import BlockpagesCanvasEnhancer from "./BlockpagesCanvasEnhancer";
import type { BlockData } from "../buttonblock/types";
import type { VideoBlockData } from "../videoblock/types";
import type { DividerBlockProps } from "../dividerblock/types";
import type { IconBlockProps } from "../iconsblock/types";
import type { TextBlockState, TextEditorTarget, TextStyles, TextTemplateType } from "./types";
import { injectPortfolioProjectsSliderNavAttributes } from "@/lib/portfolioProjectsSlider";
 
const TEXTBLOCK_PREVIEW_STORAGE_KEY = "stackly-textblock-preview-html";
 
type PreviewDevice = "desktop" | "tablet" | "mobile";
 
type TextCanvasProps = {
  state: TextBlockState;
  onStateChange: (nextState: TextBlockState) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  template?: TextTemplateType;
  isImageEditingMode?: boolean;
  customImages?: Record<string, string>;
  onEditImage?: (imageId: string) => void;
  editingImageId?: string | null;
  isButtonEditingMode?: boolean;
  customButtons?: Record<string, BlockData["props"]>;
  onEditButton?: (buttonId: string) => void;
  editingButtonId?: string | null;
  videoBlocks?: VideoBlockData[];
  isVideoEditingMode?: boolean;
  onEditVideo?: (videoId: string) => void;
  appliedDividers?: { id: string, props: DividerBlockProps, position?: { x: number, y: number }, scale?: number }[];
  onRemoveDivider?: (id: string) => void;
  onUpdateDividerPosition?: (id: string, position: { x: number, y: number }) => void;
  onUpdateDividerScale?: (id: string, scale: number) => void;
  appliedIcons?: { id: string, props: IconBlockProps, position?: { x: number, y: number }, scale?: number }[];
  onRemoveIcon?: (id: string) => void;
  onUpdateIconPosition?: (id: string, position: { x: number, y: number }) => void;
  onUpdateIconScale?: (id: string, scale: number) => void;
  isIconEditingMode?: boolean;
  customIcons?: Record<string, IconBlockProps>;
  onEditIcon?: (iconId: string) => void;
  editingIconId?: string | null;
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
 
export default function TextCanvas({ state, onStateChange, canUndo, canRedo, onUndo, onRedo, template = "ecommerce", isImageEditingMode = false, customImages = {}, onEditImage, editingImageId, isButtonEditingMode = false, customButtons = {},
  onEditButton,
  editingButtonId,
  videoBlocks = [],
  isVideoEditingMode = false,
  onEditVideo,
  isIconEditingMode = false,
  customIcons = {},
  onEditIcon,
  editingIconId,
  appliedDividers = [],
  onRemoveDivider,
  onUpdateDividerPosition,
  onUpdateDividerScale,
  appliedIcons = [],
  onRemoveIcon,
  onUpdateIconPosition,
  onUpdateIconScale,
}: TextCanvasProps) {
  const isPreviewMode = false;
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");
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
 
    if (state.textStyles.color) activeText.style.setProperty("color", state.textStyles.color, "important");
    else activeText.style.removeProperty("color");
 
    if (state.textStyles.fontSize) activeText.style.setProperty("font-size", `${state.textStyles.fontSize}px`, "important");
    else activeText.style.removeProperty("font-size");
 
    if (state.textStyles.fontFamily) activeText.style.setProperty("font-family", state.textStyles.fontFamily, "important");
    else activeText.style.removeProperty("font-family");
 
    if (state.textStyles.lineHeight) activeText.style.setProperty("line-height", state.textStyles.lineHeight, "important");
    else activeText.style.removeProperty("line-height");
 
    if (state.textStyles.letterSpacing) activeText.style.setProperty("letter-spacing", state.textStyles.letterSpacing, "important");
    else activeText.style.removeProperty("letter-spacing");
 
    if (state.textStyles.fontWeight) activeText.style.setProperty("font-weight", state.textStyles.fontWeight, "important");
    else activeText.style.removeProperty("font-weight");
 
    if (state.textStyles.textAlign) activeText.style.setProperty("text-align", state.textStyles.textAlign, "important");
    else activeText.style.removeProperty("text-align");
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
 
      const isHeader = node.closest(
        ".buyscreen-header, .buyscreen-categories, .portfolio-shell > .sticky, .portfolio-mobile-menu, .restaurant-shell header, .construction-shell header, .blog-page header, .dm-shell > .sticky, .dm-shell header"
      ) !== null;
      const isFooter = node.closest("footer, .stackly-footer, .restaurant-shell footer, .construction-shell footer, .blog-page footer, .dm-shell footer") !== null;
      const isMain = !isHeader && !isFooter;
 
      let shouldBeEditable = false;
      if (isTextEditable && !isPreviewMode) {
        if (state.selectedTarget === "header" && isHeader) shouldBeEditable = true;
        else if (state.selectedTarget === "footer" && isFooter) shouldBeEditable = true;
        else if (state.selectedTarget === "main" && isMain) shouldBeEditable = true;
        else if (state.selectedTarget === "text") shouldBeEditable = true;
      }
 
      if (textTags.includes(node.tagName)) {
        if (shouldBeEditable) {
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
    previewClone?.querySelectorAll("[data-draggable-chrome='true']").forEach((element) => {
      element.removeAttribute("title");
      element.classList.remove("cursor-move", "active:cursor-grabbing", "hover:outline", "hover:outline-2", "hover:outline-blue-400", "hover:outline-dashed", "group");
    });
    previewClone?.querySelector("[data-textblock-canvas]")?.removeAttribute("class");
    if (previewClone) injectPortfolioProjectsSliderNavAttributes(previewClone);
 
    window.localStorage.setItem(TEXTBLOCK_PREVIEW_STORAGE_KEY, previewClone?.innerHTML ?? "");
    window.open(routePath("/blockpages/preview"), "_blank", "noopener,noreferrer");
  };
 
  return (
    <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#dbe3ef] bg-[#f7f9fc] shadow-sm">
      <div
        data-builder-chrome="true"
        className="flex h-[64px] flex-shrink-0 items-center justify-between gap-4 overflow-x-auto border-b border-[#dbe3ef] bg-white px-3 shadow-[0_1px_0_rgba(15,23,42,0.03)] md:px-5"
      >
        <a href={`/blockpages?template=${template}`} className="flex items-center gap-2 whitespace-nowrap rounded px-2 py-1.5 text-[14px] font-bold text-[#0B1D40] hover:bg-gray-100 md:text-[15px]">
          My Website
          <ChevronDown className="h-4 w-4 text-gray-600" />
        </a>
 
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex flex-shrink-0 overflow-hidden rounded-md border border-gray-300 bg-white shadow-sm">
            <button className={`border-r border-gray-300 px-3 py-2 ${canUndo || isTextEditable ? "text-gray-600 hover:bg-gray-50" : "cursor-not-allowed text-gray-300"}`} onClick={handleUndo} disabled={!canUndo && !isTextEditable} title="Undo">
              <Undo2 className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
            <button className={`px-3 py-2 ${canRedo || isTextEditable ? "text-gray-600 hover:bg-gray-50" : "cursor-not-allowed text-gray-300"}`} onClick={handleRedo} disabled={!canRedo && !isTextEditable} title="Redo">
              <Redo2 className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => alert("Working on it - In progress!")}
            className="group flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-2 text-[13px] font-bold text-[#0B1D40] shadow-sm transition-all duration-200 hover:border-[#0B1D40]/35 hover:bg-[#f7f9fc] hover:shadow-md"
            title="Save Draft"
          >
            <Save className="h-4 w-4 text-gray-600 xl:hidden group-hover:hidden" />
            <span className="hidden xl:inline group-hover:inline">Save Draft</span>
          </button>
          <button
            type="button"
            className="group flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-2 text-[13px] font-bold text-[#0B1D40] shadow-sm transition-all duration-200 hover:border-[#0B1D40]/35 hover:bg-[#f7f9fc] hover:shadow-md"
            onClick={openPreviewPage}
            title="Preview"
          >
            <Eye className="h-4 w-4 xl:hidden group-hover:hidden" />
            <span className="hidden xl:inline group-hover:inline">Preview</span>
          </button>
          <button
            type="button"
            onClick={() => alert("Working on it - In progress!")}
            className="group flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#0B1D40] px-3 py-2 text-[13px] font-bold text-white shadow-[0_2px_4px_rgba(11,29,64,0.3)] transition-all duration-200 hover:bg-[#152B52] hover:shadow-[0_4px_10px_rgba(11,29,64,0.35)]"
            title="Publish"
          >
            <span className="hidden xl:inline group-hover:inline">Publish</span>
            <Send className="h-[14px] w-[14px] xl:hidden group-hover:hidden" />
          </button>
        </div>
      </div>
 
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        <div className="mx-auto flex min-h-0 w-full max-w-none flex-1 flex-col overflow-hidden rounded-none sm:rounded-xl border-0 sm:border border-[#dbe3ef] bg-white shadow-[0_18px_45px_rgba(15,35,75,0.08)]">
          <div data-builder-chrome="true" className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e6edf5] px-4 py-3 sm:px-6 sm:py-4">
            <h2 className="text-[18px] font-bold text-[#0B1D40]">
              {getBlockpagesTemplateLabel(template)} Text Blocks
            </h2>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              {(["main", "text", "header", "footer"] as TextEditorTarget[]).map((target) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => selectTarget(target)}
                  className={`cursor-pointer rounded-md border px-3 py-1.5 capitalize transition-all duration-200 ${
                    state.selectedTarget === target
                      ? "border-[#0B1D40] bg-[#0B1D40] text-white shadow-sm hover:bg-[#152B52] hover:border-[#152B52] hover:shadow-md"
                      : "border-[#dbe3ef] text-[#0B1D40] hover:border-[#0B1D40]/35 hover:bg-[#f7f9fc] hover:shadow-sm"
                  }`}
                >
                  {target === "main" ? "Section" : target}
                </button>
              ))}
            </div>
          </div>
 
          <div
            ref={canvasRef}
            className="relative flex min-h-0 flex-1 flex-col"
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
              ${buildBlockpagesSectionStylesCss(state.sectionStyles)}
 
              [data-textblock-canvas] .buyscreen-header,
              [data-textblock-canvas] .buyscreen-categories,
              [data-textblock-canvas] .portfolio-shell > .sticky,
              [data-textblock-canvas] .portfolio-mobile-menu > div,
              [data-textblock-canvas] .restaurant-shell header,
              [data-textblock-canvas] .construction-shell header,
              [data-textblock-canvas] .blog-page header,
              [data-textblock-canvas] .dm-shell > .sticky {
                ${section.headerBg ? `background-color: ${section.headerBg} !important;` : ''}
                ${section.headerText ? `color: ${section.headerText} !important;` : ''}
              }
              [data-textblock-canvas] .buyscreen-header *,
              [data-textblock-canvas] .buyscreen-categories *,
              [data-textblock-canvas] .portfolio-shell > .sticky *,
              [data-textblock-canvas] .portfolio-mobile-menu *,
              [data-textblock-canvas] .restaurant-shell header *,
              [data-textblock-canvas] .construction-shell header *,
              [data-textblock-canvas] .blog-page header *,
              [data-textblock-canvas] .dm-shell > .sticky * {
                ${section.headerText ? `color: inherit !important; border-color: ${section.headerText}66 !important;` : ''}
                ${section.headerFontSize ? `font-size: ${section.headerFontSize}px !important;` : ''}
                ${section.headerFontFamily ? `font-family: ${section.headerFontFamily} !important;` : ''}
                ${section.headerFontWeight ? `font-weight: ${section.headerFontWeight} !important;` : ''}
                ${section.headerLineHeight ? `line-height: ${section.headerLineHeight} !important;` : ''}
                ${section.headerLetterSpacing ? `letter-spacing: ${section.headerLetterSpacing} !important;` : ''}
              }
              [data-textblock-canvas] .portfolio-shell > .sticky span.bg-white {
                ${section.headerText ? `background-color: ${section.headerText} !important;` : ''}
              }
              [data-textblock-canvas] footer,
              [data-textblock-canvas] .stackly-footer,
              [data-textblock-canvas] .restaurant-shell footer,
              [data-textblock-canvas] .construction-shell footer,
              [data-textblock-canvas] .blog-page footer,
              [data-textblock-canvas] .dm-shell footer {
                ${section.footerText ? `color: ${section.footerText} !important;` : ''}
              }
              [data-textblock-canvas] footer *,
              [data-textblock-canvas] .stackly-footer *,
              [data-textblock-canvas] .restaurant-shell footer *,
              [data-textblock-canvas] .construction-shell footer *,
              [data-textblock-canvas] .blog-page footer *,
              [data-textblock-canvas] .dm-shell footer * {
                ${section.footerText ? `color: inherit !important; border-color: ${section.footerText}33 !important;` : ''}
              }
 
              ${section.shadow ? `
                [data-textblock-canvas] .portfolio-stat-card,
                [data-textblock-canvas] .portfolio-mini-card,
                [data-textblock-canvas] .portfolio-process-card,
                [data-textblock-canvas] .portfolio-service-card,
                [data-textblock-canvas] .portfolio-reveal.bg-white.p-6,
                [data-textblock-canvas] .buyscreen-product-card,
                [data-textblock-canvas] .buyscreen-category-card {
                  box-shadow: 0 15px 35px -5px color-mix(in srgb, currentColor 15%, transparent), 0 5px 15px -5px color-mix(in srgb, currentColor 10%, transparent) !important;
                }
                [data-textblock-canvas] .portfolio-stat-card:hover,
                [data-textblock-canvas] .portfolio-mini-card:hover,
                [data-textblock-canvas] .portfolio-process-card:hover,
                [data-textblock-canvas] .portfolio-service-card:hover,
                [data-textblock-canvas] .portfolio-reveal.bg-white.p-6:hover,
                [data-textblock-canvas] .buyscreen-product-card:hover,
                [data-textblock-canvas] .buyscreen-category-card:hover {
                  box-shadow: 0 25px 50px -12px color-mix(in srgb, currentColor 25%, transparent) !important;
                }
              ` : `
                [data-textblock-canvas] .portfolio-stat-card,
                [data-textblock-canvas] .portfolio-mini-card,
                [data-textblock-canvas] .portfolio-process-card,
                [data-textblock-canvas] .portfolio-service-card,
                [data-textblock-canvas] .portfolio-reveal.bg-white.p-6,
                [data-textblock-canvas] .buyscreen-product-card,
                [data-textblock-canvas] .buyscreen-category-card {
                  box-shadow: none !important;
                }
              `}
            `}</style>
            <div className="relative flex min-h-0 flex-1 flex-col">
              <div
                className="mx-auto w-full min-w-0 flex-1 transition-all duration-500 ease-in-out max-w-full"
              >
                <div
                  data-textblock-canvas
                  data-blockpages-scroll-root
                  className="@container min-h-[560px] h-[calc(100vh-220px)] w-full min-w-0 max-w-full flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar [overflow-wrap:break-word] [word-wrap:break-word]"
                >
                  <style>{`
                    [data-textblock-canvas] .portfolio-shell,
                    [data-textblock-canvas] .buyscreen-page,
                    [data-textblock-canvas] .restaurant-shell,
                    [data-textblock-canvas] .construction-shell,
                    [data-textblock-canvas] .blog-page,
                    [data-textblock-canvas] .dm-shell {
                      max-width: 100%;
                      min-width: 0;
                      overflow-x: hidden;
                      overflow-y: visible;
                      box-sizing: border-box;
                    }
                    [data-textblock-canvas] h1,
                    [data-textblock-canvas] h2,
                    [data-textblock-canvas] h3,
                    [data-textblock-canvas] h4,
                    [data-textblock-canvas] h5,
                    [data-textblock-canvas] h6,
                    [data-textblock-canvas] p,
                    [data-textblock-canvas] span,
                    [data-textblock-canvas] a,
                    [data-textblock-canvas] li,
                    [data-textblock-canvas] label {
                      overflow-wrap: break-word;
                      word-wrap: break-word;
                      min-width: 0;
                      max-width: 100%;
                    }
                    @container (max-width: 768px) {
                      [data-textblock-canvas] h1 {
                        font-size: clamp(1.5rem, 5cqi, 2.25rem) !important;
                        line-height: 1.2 !important;
                        white-space: normal !important;
                      }
                      [data-textblock-canvas] h2 {
                        font-size: clamp(1.25rem, 4cqi, 2rem) !important;
                        line-height: 1.2 !important;
                        white-space: normal !important;
                      }
                      [data-textblock-canvas] h3,
                      [data-textblock-canvas] h4 {
                        font-size: clamp(1rem, 3cqi, 1.25rem) !important;
                        line-height: 1.3 !important;
                        white-space: normal !important;
                      }
                      [data-textblock-canvas] p {
                        font-size: clamp(0.8125rem, 2.5cqi, 1rem) !important;
                        line-height: 1.5 !important;
                        white-space: normal !important;
                      }
                      [data-textblock-canvas] .flex,
                      [data-textblock-canvas] .grid {
                        min-width: 0;
                      }
                    }
                  `}</style>
                  <div ref={contentRef} className="min-w-0 max-w-full">
                    {template === "portfolio" ? (
                      <PortfolioPreview
                        isImageEditingMode={isImageEditingMode}
                        customImages={customImages}
                        onEditImage={onEditImage}
                        editingImageId={editingImageId}
                        isButtonEditingMode={isButtonEditingMode}
                        customButtons={customButtons}
                        onEditButton={onEditButton}
                        videoBlocks={videoBlocks}
                        isVideoEditingMode={isVideoEditingMode}
                        onEditVideo={onEditVideo}
                        sectionStyles={state.sectionStyles}
                        onPreview={openPreviewPage}
                        appliedDividers={appliedDividers}
                        onRemoveDivider={onRemoveDivider}
                        onUpdateDividerPosition={onUpdateDividerPosition}
                        onUpdateDividerScale={onUpdateDividerScale}
                        appliedIcons={appliedIcons}
                        onRemoveIcon={onRemoveIcon}
                        onUpdateIconPosition={onUpdateIconPosition}
                        onUpdateIconScale={onUpdateIconScale}
                        isIconEditingMode={isIconEditingMode}
                        customIcons={customIcons}
                        onEditIcon={onEditIcon}
                        editingIconId={editingIconId}
                      />
                    ) : (
                      <BlockpagesCanvasEnhancer
                        isImageEditingMode={isImageEditingMode}
                        customImages={customImages}
                        onEditImage={onEditImage}
                        editingImageId={editingImageId}
                        isButtonEditingMode={isButtonEditingMode}
                        customButtons={customButtons}
                        onEditButton={onEditButton}
                        editingButtonId={editingButtonId}
                        isVideoEditingMode={isVideoEditingMode}
                        onEditVideo={onEditVideo}
                        videoBlocks={videoBlocks}
                        isIconEditingMode={isIconEditingMode}
                        onEditIcon={onEditIcon}
                        editingIconId={editingIconId}
                        customIcons={customIcons}
                        appliedDividers={appliedDividers}
                        onRemoveDivider={onRemoveDivider}
                        onUpdateDividerPosition={onUpdateDividerPosition}
                        onUpdateDividerScale={onUpdateDividerScale}
                        appliedIcons={appliedIcons}
                        onRemoveIcon={onRemoveIcon}
                        onUpdateIconPosition={onUpdateIconPosition}
                        onUpdateIconScale={onUpdateIconScale}
                      >
                        {template === "ecommerce" ? (
                          <StorefrontPreview />
                        ) : (
                          <TemplatePreviewRouter template={template} onPreview={openPreviewPage} />
                        )}
                      </BlockpagesCanvasEnhancer>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
 
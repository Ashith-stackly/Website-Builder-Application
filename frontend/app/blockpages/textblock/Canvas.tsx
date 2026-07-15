"use client";
 
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, Eye, Redo2, Save, Send, Undo2, Check, AlertTriangle, Loader2 } from "lucide-react";
import { FaLaptop, FaMobileAlt, FaTabletAlt } from "react-icons/fa";
import { routePath } from "@/lib/paths";
import { getBlockpagesTemplateLabel } from "@/lib/blockpagesTemplates";
import { BlockpagesEditorProvider } from "@/lib/blockpagesEditorContext";
import { isBlockpagesInteractiveControl } from "@/lib/blockpagesEditorInteraction";
import { buildBlockpagesSectionStylesCss } from "@/lib/blockpagesTemplateSections";
import {
  buildBlockpagesDropdownStylesCss,
  nodeIsInBlockpagesHeaderChrome,
  nodeIsInBlockpagesHeaderDropdown,
} from "@/lib/blockpagesDropdownStyles";
import { buildBlockpagesCardShadowCss } from "@/lib/blockpagesCardShadow";
import { buildBlockpagesTemplateChromeCss } from "@/lib/blockpagesTemplateChrome";
import PortfolioPreview from "./PortfolioPreview";
import StorefrontPreview from "./StorefrontPreview";
import TemplatePreviewRouter from "./TemplatePreviewRouter";
import BlockpagesCanvasEnhancer from "./BlockpagesCanvasEnhancer";
import type { BlockData } from "../buttonblock/types";
import type { VideoBlockData } from "../videoblock/types";
import type { DividerBlockProps } from "../dividerblock/types";
import type { IconBlockProps } from "../iconsblock/types";
import type { TextBlockState, TextEditorTarget, TextStyles, TextTemplateType } from "./types";
import type { DraftSaveStatus } from "../BlockPagesClient";
import { injectPortfolioProjectsSliderNavAttributes } from "@/lib/portfolioProjectsSlider";
import { buildPreviewHtmlFromCanvas, finalizeBlockpagesEditorMotion } from "@/lib/blockpagesPreviewSanitize";
import {
  TEXTBLOCK_PREVIEW_STORAGE_KEY,
  applyCanvasContent,
  applyHiddenElementsToCanvas,
  captureCanvasContent,
  buildHiddenElementsCss,
  BLOCKPAGES_HIDDEN_ELEMENTS_CHANGED_EVENT,
  dispatchCanvasRestoredEvent,
  getCanvasContentRoot,
  inferHiddenElementsFromCanvasHtml,
  isPersistedCanvasHtmlValid,
  loadHiddenElements,
  loadPersistedCanvasHtml,
  persistCanvasHtml,
  persistTextBlockState,
  syncHiddenElementsFromCanvas,
  templateUsesHtmlCanvasPersistence,
  clearPersistedCanvasHtml,
} from "@/lib/blockpagesEditorPersistence";

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
  appliedDividers?: { id: string, props: DividerBlockProps, position?: { top?: number; left?: number; x?: number; y?: number }, scale?: number }[];
  onRemoveDivider?: (id: string) => void;
  onUpdateDividerPosition?: (id: string, position: { top: number; left: number }) => void;
  onUpdateDividerScale?: (id: string, scale: number) => void;
  appliedIcons?: { id: string, props: IconBlockProps, position?: { top?: number; left?: number; x?: number; y?: number }, scale?: number }[];
  onRemoveIcon?: (id: string) => void;
  onUpdateIconPosition?: (id: string, position: { top: number; left: number }) => void;
  onUpdateIconScale?: (id: string, scale: number) => void;
  isIconEditingMode?: boolean;
  customIcons?: Record<string, IconBlockProps>;
  onEditIcon?: (iconId: string) => void;
  editingIconId?: string | null;
  onSaveDraft?: () => void;
  onPreview?: () => void;
  saveStatus?: DraftSaveStatus;
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

function isLightTextColor(color: string) {
  const hex = rgbToHex(color).replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.72;
}

function resolveEditableColor(element: HTMLElement, color: string) {
  const dropdown = element.closest('[data-blockpages-dropdown-panel="true"]');
  if (dropdown?.getAttribute("data-blockpages-dropdown-theme") === "dark") {
    return isLightTextColor(color) ? "#ffffff" : color;
  }
  if (dropdown && isLightTextColor(color)) {
    return dropdown.classList.contains("blog-blockpages-dropdown-panel") ? "#001f3f" : "#1f2937";
  }
  return color;
}
 
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
  onSaveDraft,
  onPreview,
  saveStatus = "idle",
}: TextCanvasProps) {
  const isPreviewMode = false;
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const activeEditableRef = useRef<HTMLElement | null>(null);
  const isRestoringCanvasRef = useRef(false);
  const pendingCanvasHtmlRef = useRef<string | null>(null);
  const [hiddenElementsRevision, setHiddenElementsRevision] = useState(0);
  const [hiddenElementIds, setHiddenElementIds] = useState<string[]>([]);
  const [hiddenElementsCss, setHiddenElementsCss] = useState("");
  const { section, isTextEditable } = state;

  const refreshHiddenElementsState = useCallback(() => {
    const hidden = loadHiddenElements(template);
    setHiddenElementIds(hidden);
    setHiddenElementsCss(buildHiddenElementsCss(template, hidden));
  }, [template]);
 
  const selectTarget = (target: TextEditorTarget) => {
    onStateChange({ ...state, selectedTarget: target });
  };

  useLayoutEffect(() => {
    if (!templateUsesHtmlCanvasPersistence(template)) return;

    const savedHtml = pendingCanvasHtmlRef.current ?? loadPersistedCanvasHtml(template);
    if (savedHtml) {
      inferHiddenElementsFromCanvasHtml(template, savedHtml);
    }
    refreshHiddenElementsState();
  }, [template, refreshHiddenElementsState]);

  useLayoutEffect(() => {
    refreshHiddenElementsState();
  }, [hiddenElementsRevision, refreshHiddenElementsState]);

  useEffect(() => {
    pendingCanvasHtmlRef.current = templateUsesHtmlCanvasPersistence(template)
      ? loadPersistedCanvasHtml(template)
      : null;

    if (!templateUsesHtmlCanvasPersistence(template)) {
      clearPersistedCanvasHtml(template);
    }
  }, [template]);

  useLayoutEffect(() => {
    if (!templateUsesHtmlCanvasPersistence(template)) return;
    if (!canvasRef.current || isRestoringCanvasRef.current) return;

    const savedHtml = pendingCanvasHtmlRef.current ?? loadPersistedCanvasHtml(template);
    if (!savedHtml || !isPersistedCanvasHtmlValid(template, savedHtml)) return;

    const currentHtml = captureCanvasContent(canvasRef.current);
    if (currentHtml === savedHtml) {
      pendingCanvasHtmlRef.current = null;
      return;
    }

    isRestoringCanvasRef.current = true;
    applyCanvasContent(canvasRef.current, savedHtml);
    inferHiddenElementsFromCanvasHtml(template, savedHtml);
    applyHiddenElementsToCanvas(canvasRef.current, template);
    const canvasRoot = getCanvasContentRoot(canvasRef.current);
    if (canvasRoot) finalizeBlockpagesEditorMotion(canvasRoot);
    pendingCanvasHtmlRef.current = null;
    isRestoringCanvasRef.current = false;
    syncHiddenElementsFromCanvas(canvasRef.current, template);
    refreshHiddenElementsState();
    dispatchCanvasRestoredEvent();
  }, [
    template,
    state.section,
    state.sectionStyles,
    state.isTextEditable,
    state.selectedTarget,
    refreshHiddenElementsState,
  ]);

  useLayoutEffect(() => {
    if (!canvasRef.current) return;
    applyHiddenElementsToCanvas(canvasRef.current, template);
    if (syncHiddenElementsFromCanvas(canvasRef.current, template)) {
      refreshHiddenElementsState();
      setHiddenElementsRevision((value) => value + 1);
    }
  }, [template, state.section, state.sectionStyles, state.isTextEditable, state.selectedTarget, refreshHiddenElementsState]);

  useEffect(() => {
    const handleHiddenElementsChanged = () => {
      if (!canvasRef.current) return;
      applyHiddenElementsToCanvas(canvasRef.current, template);
      refreshHiddenElementsState();
      setHiddenElementsRevision((value) => value + 1);
    };

    window.addEventListener(BLOCKPAGES_HIDDEN_ELEMENTS_CHANGED_EVENT, handleHiddenElementsChanged);
    return () => window.removeEventListener(BLOCKPAGES_HIDDEN_ELEMENTS_CHANGED_EVENT, handleHiddenElementsChanged);
  }, [template, refreshHiddenElementsState]);

  useEffect(() => {
    if (!templateUsesHtmlCanvasPersistence(template)) return;

    const root = getCanvasContentRoot(canvasRef.current);
    if (!root) return;

    let timer: number | null = null;
    const scheduleSave = () => {
      if (isRestoringCanvasRef.current || !canvasRef.current) return;
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!canvasRef.current) return;
        if (syncHiddenElementsFromCanvas(canvasRef.current, template)) {
          refreshHiddenElementsState();
          setHiddenElementsRevision((value) => value + 1);
        }
        const html = captureCanvasContent(canvasRef.current);
        if (isPersistedCanvasHtmlValid(template, html)) {
          persistCanvasHtml(template, html);
          pendingCanvasHtmlRef.current = html;
        }
      }, 250);
    };

    root.addEventListener("input", scheduleSave, true);
    const observer = new MutationObserver((mutations) => {
      scheduleSave();
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.removedNodes)) {
          if (!(node instanceof Element)) continue;
          if (
            node.matches("[data-blockpages-element-id]") ||
            node.querySelector("[data-blockpages-element-id]")
          ) {
            if (syncHiddenElementsFromCanvas(canvasRef.current, template)) {
              refreshHiddenElementsState();
              setHiddenElementsRevision((value) => value + 1);
            }
            break;
          }
        }
      }
    });
    observer.observe(root, {
      subtree: true,
      characterData: true,
      childList: true,
      attributes: true,
      attributeFilter: ["src", "style", "class"],
    });

    return () => {
      root.removeEventListener("input", scheduleSave, true);
      observer.disconnect();
      if (timer) window.clearTimeout(timer);
    };
  }, [template, refreshHiddenElementsState]);

  useEffect(() => {
    const syncFromStorage = () => {
      if (!templateUsesHtmlCanvasPersistence(template)) return;

      const savedHtml = loadPersistedCanvasHtml(template);
      if (!savedHtml || !canvasRef.current || !isPersistedCanvasHtmlValid(template, savedHtml)) return;

      const currentHtml = captureCanvasContent(canvasRef.current);
      if (currentHtml === savedHtml) return;

      isRestoringCanvasRef.current = true;
      applyCanvasContent(canvasRef.current, savedHtml);
      inferHiddenElementsFromCanvasHtml(template, savedHtml);
      applyHiddenElementsToCanvas(canvasRef.current, template);
      const canvasRoot = getCanvasContentRoot(canvasRef.current);
      if (canvasRoot) finalizeBlockpagesEditorMotion(canvasRoot);
      isRestoringCanvasRef.current = false;
      refreshHiddenElementsState();
      setHiddenElementsRevision((value) => value + 1);
      dispatchCanvasRestoredEvent();
    };

    window.addEventListener("focus", syncFromStorage);
    window.addEventListener("storage", syncFromStorage);
    return () => {
      window.removeEventListener("focus", syncFromStorage);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, [template, refreshHiddenElementsState]);
 
  useEffect(() => {
    const activeText = canvasRef.current?.querySelector(".editable-text-active") as HTMLElement | null;
    if (!activeText || state.selectedTarget !== "text") return;
 
    if (state.textStyles.color) {
      activeText.style.setProperty(
        "color",
        resolveEditableColor(activeText, state.textStyles.color),
        "important"
      );
    } else activeText.style.removeProperty("color");
 
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

    const contentRoot = getCanvasContentRoot(canvas);
    if (!contentRoot) return;

    const textTags = ["H1", "H2", "H3", "H4", "H5", "H6", "P", "SPAN", "LI", "LABEL", "A", "BUTTON"];

    const handleEditableMouseDown = (event: Event) => {
      if (!isTextEditable || isPreviewMode) return;

      const target = event.target as HTMLElement;
      if (isBlockpagesInteractiveControl(target)) return;

      const editableNode = target.closest('[contenteditable="true"]') as HTMLElement | null;
      if (!editableNode || editableNode.tagName !== "BUTTON") return;

      event.preventDefault();
      event.stopPropagation();
      editableNode.focus();
    };

    const handleTextClick = (event: Event) => {
      if (!isTextEditable || isPreviewMode) return;

      const target = event.target as HTMLElement;
      if (isBlockpagesInteractiveControl(target)) return;

      const editableNode =
        (target.closest(
          '[data-blockpages-dropdown-panel="true"] button, button.buyscreen-all-categories-item, button.buyscreen-user-menu-item, [contenteditable="true"]'
        ) as HTMLElement | null) ?? target;

      if (!editableNode.isContentEditable && !editableNode.closest('[contenteditable="true"]')) return;

      const resolvedNode = editableNode.closest('[contenteditable="true"]') as HTMLElement ?? editableNode;
      if (!resolvedNode.isContentEditable) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      activeEditableRef.current = resolvedNode;
      contentRoot.querySelectorAll(".editable-text-active").forEach((element) => element.classList.remove("editable-text-active"));
      resolvedNode.classList.add("editable-text-active");
      resolvedNode.focus();

      const computedStyle = window.getComputedStyle(resolvedNode);
      const nextTextStyles: TextStyles = {
        color: rgbToHex(resolvedNode.style.color || computedStyle.color),
        fontSize: resolvedNode.style.fontSize.replace("px", "") || computedStyle.fontSize.replace("px", ""),
        fontFamily: resolvedNode.style.fontFamily || computedStyle.fontFamily,
      };

      onStateChange({ ...state, selectedTarget: "text", textStyles: nextTextStyles });
    };
 
    const makeEditable = (node: Element) => {
      if (node.closest("[data-builder-chrome='true']")) return;
      if (isBlockpagesInteractiveControl(node)) return;

      const isInDropdown = node.closest('[data-blockpages-dropdown-panel="true"]') !== null;
      const isHeader = !isInDropdown && nodeIsInBlockpagesHeaderChrome(node);
      const isDropdownHeader = isInDropdown && nodeIsInBlockpagesHeaderDropdown(node);
      const isFooter = node.closest("footer, .stackly-footer, .restaurant-shell footer, .construction-shell footer, .blog-page footer, .dm-shell footer") !== null;
      const isMain = !isHeader && !isDropdownHeader && !isFooter;
 
      let shouldBeEditable = false;
      if (isTextEditable && !isPreviewMode) {
        if (state.selectedTarget === "header" && (isHeader || isDropdownHeader)) shouldBeEditable = true;
        else if (state.selectedTarget === "footer" && isFooter) shouldBeEditable = true;
        else if (state.selectedTarget === "main" && isMain) shouldBeEditable = true;
        else if (state.selectedTarget === "text") shouldBeEditable = true;
      }

      if (textTags.includes(node.tagName)) {
        if (shouldBeEditable) {
          const htmlNode = node as HTMLElement;
          node.setAttribute("contenteditable", "true");
          htmlNode.addEventListener("click", handleTextClick, true);
          if (node.tagName === "BUTTON") {
            htmlNode.addEventListener("mousedown", handleEditableMouseDown, true);
          }
        } else {
          const htmlNode = node as HTMLElement;
          node.removeAttribute("contenteditable");
          htmlNode.removeEventListener("click", handleTextClick, true);
          htmlNode.removeEventListener("mousedown", handleEditableMouseDown, true);
          node.classList.remove("editable-text-active");
        }
      }
 
      Array.from(node.children).forEach(makeEditable);
    };
 
    makeEditable(contentRoot);

    let resyncTimer: number | null = null;
    const contentObserver = new MutationObserver(() => {
      if (resyncTimer) window.clearTimeout(resyncTimer);
      resyncTimer = window.setTimeout(() => makeEditable(contentRoot), 120);
    });
    contentObserver.observe(contentRoot, { childList: true, subtree: true });

    return () => {
      contentObserver.disconnect();
      if (resyncTimer) window.clearTimeout(resyncTimer);
      const removeListeners = (node: Element) => {
        if (textTags.includes(node.tagName)) {
          const htmlNode = node as HTMLElement;
          htmlNode.removeEventListener("click", handleTextClick, true);
          htmlNode.removeEventListener("mousedown", handleEditableMouseDown, true);
        }
        Array.from(node.children).forEach(removeListeners);
      };
      removeListeners(contentRoot);
    };
  }, [isPreviewMode, isTextEditable, onStateChange, state, template]);
 
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
    if (!canvasRef.current) return;

    syncHiddenElementsFromCanvas(canvasRef.current, template);
    if (templateUsesHtmlCanvasPersistence(template)) {
      const canvasHtml = captureCanvasContent(canvasRef.current);
      persistCanvasHtml(template, canvasHtml);
    }
    persistTextBlockState(template, state);

    const canvasRoot = getCanvasContentRoot(canvasRef.current);
    if (!(canvasRoot instanceof HTMLElement)) return;

    const previewHtml = buildPreviewHtmlFromCanvas(canvasRoot);

    window.localStorage.setItem(TEXTBLOCK_PREVIEW_STORAGE_KEY, previewHtml);
    window.open(routePath("/blockpages/preview"), "_blank", "noopener,noreferrer");
  };
  const previewHandler = onPreview ?? openPreviewPage;
 
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
            onClick={() => onSaveDraft?.()}
            disabled={saveStatus === "saving"}
            className={`group flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-2 text-[13px] font-bold text-[#0B1D40] shadow-sm transition-all duration-200 hover:border-[#0B1D40]/35 hover:bg-[#f7f9fc] hover:shadow-md ${saveStatus === "saving" ? "opacity-70 cursor-not-allowed" : ""}`}
            title="Save Draft"
          >
            {saveStatus === "saving" ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
            ) : saveStatus === "saved" ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : saveStatus === "error" ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : (
              <Save className="h-4 w-4 text-gray-600 xl:hidden group-hover:hidden" />
            )}
            <span className="hidden xl:inline group-hover:inline">
              {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : saveStatus === "error" ? "Save Failed" : "Save Draft"}
            </span>
          </button>
          <button
            type="button"
            className="group flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-2 text-[13px] font-bold text-[#0B1D40] shadow-sm transition-all duration-200 hover:border-[#0B1D40]/35 hover:bg-[#f7f9fc] hover:shadow-md"
            onClick={previewHandler}
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

              ${buildBlockpagesTemplateChromeCss(section)}

              ${buildBlockpagesDropdownStylesCss()}

              ${buildBlockpagesCardShadowCss(section.shadow)}

              ${hiddenElementsCss}
            `}</style>
            <div className="relative flex min-h-0 flex-1 flex-col">
              <div
                className={`mx-auto w-full min-w-0 flex-1 transition-all duration-500 ease-in-out ${
                  previewDevice === "mobile"
                    ? "max-w-[375px] rounded-[2rem] border-8 border-slate-800 bg-white shadow-xl"
                    : previewDevice === "tablet"
                      ? "max-w-[768px] rounded-[2rem] border-8 border-slate-800 bg-white shadow-xl"
                      : "max-w-full"
                }`}
              >
                <div
                  data-textblock-canvas
                  data-blockpages-scroll-root
                  data-blockpages-device={previewDevice}
                  data-blockpages-text-editing={isTextEditable ? "true" : undefined}
                  className="@container min-h-[560px] h-[calc(100vh-220px)] w-full min-w-0 max-w-full flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar [overflow-wrap:break-word] [word-wrap:break-word]"
                >
                  <style>{`
                    [data-textblock-canvas] .portfolio-shell,
                    [data-textblock-canvas] .buyscreen-page,
                    [data-textblock-canvas] .restaurant-shell,
                    [data-textblock-canvas] .construction-shell,
                    [data-textblock-canvas] .restaurant-shell,
                    [data-textblock-canvas] .blog-page,
                    [data-textblock-canvas] .blog-blockpages-root,
                    [data-textblock-canvas] .dm-shell {
                      max-width: 100%;
                      min-width: 0;
                      overflow-x: hidden;
                      overflow-y: visible;
                      box-sizing: border-box;
                    }
                    [data-textblock-canvas] .blog-blockpages-root,
                    [data-textblock-canvas] .blog-blockpages-root > div,
                    [data-textblock-canvas] .restaurant-shell,
                    [data-textblock-canvas] .restaurant-shell > div,
                    [data-textblock-canvas] .dm-shell,
                    [data-textblock-canvas] .dm-shell > div {
                      min-height: auto !important;
                      max-height: none !important;
                      overflow-y: visible !important;
                    }
                    [data-textblock-canvas] .buyscreen-header,
                    [data-textblock-canvas] .buyscreen-categories,
                    [data-textblock-canvas] .buyscreen-all-categories-wrap,
                    [data-textblock-canvas] .buyscreen-categories-list,
                    [data-textblock-canvas] .blog-page header,
                    [data-textblock-canvas] .blog-page header nav .relative,
                    [data-textblock-canvas] .restaurant-shell header,
                    [data-textblock-canvas] .restaurant-shell header > div {
                      overflow: visible !important;
                    }
                    [data-textblock-canvas] .restaurant-shell header nav {
                      -webkit-overflow-scrolling: touch;
                    }
                    [data-textblock-canvas][data-blockpages-device="mobile"] nav.buyscreen-categories > div.flex,
                    [data-textblock-canvas][data-blockpages-device="tablet"] nav.buyscreen-categories > div.flex {
                      display: flex !important;
                    }
                    [data-textblock-canvas][data-blockpages-device="mobile"] nav.buyscreen-categories .buyscreen-categories-list:not(.buyscreen-categories-list--open),
                    [data-textblock-canvas][data-blockpages-device="tablet"] nav.buyscreen-categories .buyscreen-categories-list:not(.buyscreen-categories-list--open) {
                      display: none !important;
                    }
                    [data-textblock-canvas][data-blockpages-device="mobile"] nav.buyscreen-categories .buyscreen-categories-list.buyscreen-categories-list--open,
                    [data-textblock-canvas][data-blockpages-device="tablet"] nav.buyscreen-categories .buyscreen-categories-list.buyscreen-categories-list--open {
                      display: flex !important;
                      flex-direction: column;
                      align-items: stretch;
                      gap: 0.25rem;
                      margin-top: 0.5rem;
                      width: 100%;
                    }
                    [data-textblock-canvas][data-blockpages-device="desktop"] nav.buyscreen-categories > div.flex.lg\\:hidden {
                      display: none !important;
                    }
                    [data-textblock-canvas][data-blockpages-device="desktop"] nav.buyscreen-categories .buyscreen-categories-list {
                      display: flex !important;
                      flex-direction: row;
                      flex-wrap: wrap;
                      align-items: center;
                      gap: 0.5rem;
                      margin-top: 0;
                      width: auto;
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
                    <BlockpagesEditorProvider template={template} deviceMode={previewDevice} onPreview={previewHandler}>
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
                        onPreview={previewHandler}
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
                        onSaveDraft={onSaveDraft}
                      />
                    ) : (
                      <BlockpagesCanvasEnhancer
                        template={template}
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
                          <StorefrontPreview hiddenElementIds={hiddenElementIds} />
                        ) : (
                          <TemplatePreviewRouter template={template} />
                        )}
                      </BlockpagesCanvasEnhancer>
                    )}
                    </BlockpagesEditorProvider>
                  </div>
                </div>
              </div>
              <div
                data-builder-chrome="true"
                className="pointer-events-none absolute bottom-4 left-1/2 z-[130] -translate-x-1/2"
              >
                <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("desktop")}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition sm:h-9 sm:w-9 ${previewDevice === "desktop" ? "border-[#06224C] bg-gray-50 text-[#06224C] ring-2 ring-[#06224C]" : "border-gray-100 text-[#06224C]/70 hover:bg-gray-50"}`}
                    title="Desktop View"
                  >
                    <FaLaptop size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("tablet")}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition sm:h-9 sm:w-9 ${previewDevice === "tablet" ? "border-[#06224C] bg-gray-50 text-[#06224C] ring-2 ring-[#06224C]" : "border-gray-100 text-[#06224C]/70 hover:bg-gray-50"}`}
                    title="Tablet View"
                  >
                    <FaTabletAlt size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition sm:h-9 sm:w-9 ${previewDevice === "mobile" ? "border-[#06224C] bg-gray-50 text-[#06224C] ring-2 ring-[#06224C]" : "border-gray-100 text-[#06224C]/70 hover:bg-gray-50"}`}
                    title="Mobile View"
                  >
                    <FaMobileAlt size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
 

"use client";
 
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { flushSync } from "react-dom";
import {
  createBlockPagesDraft,
  saveBlockPagesDraft,
  loadBlockPagesDraft,
  isProjectConnectionError,
  type BlockPagesDraftPayload,
} from "@/lib/blockPagesDraftApi";
import { routePath } from "@/lib/paths";
import { Loader2 } from "lucide-react";
import ButtonCanvas from "./buttonblock/Canvas";
import ButtonRightSidebar from "./buttonblock/RightSidebar";
import type { BlockData } from "./buttonblock/types";
import { BuilderProvider } from "./imageblock/BuilderContext";
import LeftSidebar, { type BlockPageType } from "./imageblock/LeftSidebar";
import ImageMainCanvas from "./imageblock/MainCanvas";
import ImageRightSidebar from "./imageblock/RightSidebar";
import TextCanvas from "./textblock/Canvas";
import TextRightSidebar from "./textblock/RightSidebar";
import type { TextBlockState, TextTemplateType } from "./textblock/types";
import {
  isBlockpagesVideoApplied,
  loadBlockpagesVideoProps,
  saveBlockpagesVideoProps,
} from "@/lib/blockpagesVideoStorage";
import {
  getBlockpagesTemplateLabel,
  isTextEditorTemplate,
  parseBlockpagesTemplate,
} from "@/lib/blockpagesTemplates";
import {
  dispatchBlockpagesScrollToSection,
  getBlockpagesDefaultSectionId,
  getBlockpagesFooterScrollId,
  getBlockpagesHeaderScrollId,
  getBlockpagesVideoScrollId,
  getBlockpagesAboutScrollId,
  getBlockpagesIconScrollId,
} from "@/lib/blockpagesTemplateSections";
import {
  getBlockpagesCanvasElement,
  scanCanvasForIconTargets,
  scanCanvasForVideoTargets,
  scrollToFirstIconTarget,
  templateHasBuiltInIconSlots,
  templateHasBuiltInVideoSlots,
} from "@/lib/blockpagesEditTargets";
import {
  getOverlayDefaultTop,
  getVisibleCanvasAnchorY,
  resolveDividerSectionPlacementAtY,
  scrubOrphanDividerDomFromLiveCanvas,
} from "@/lib/blockpagesOverlayLayers";
import {
  loadPersistedTextBlockState,
  persistTextBlockState,
  readBlockpagesStorageItem,
  writeBlockpagesStorageItem,
  getBlockpagesPreviewSnapshotKey,
  loadAppliedDividersForTemplate,
  loadAppliedIconsForTemplate,
  persistAppliedDividersForTemplate,
  persistAppliedIconsForTemplate,
  captureCanvasContent,
  isPersistedCanvasHtmlValid,
  persistCanvasHtml,
  templateUsesHtmlCanvasPersistence,
  TEXTBLOCK_PREVIEW_STORAGE_KEY,
  BLOCKPAGES_REQUEST_PREVIEW_EVENT,
} from "@/lib/blockpagesEditorPersistence";
import { buildPreviewHtmlFromCanvas, flushBlockpagesPreviewSnapshot, persistPreviewSnapshot } from "@/lib/blockpagesPreviewSanitize";
import VideoCanvas from "./videoblock/Canvas";
import VideoRightSidebar from "./videoblock/RightSidebar";
import type { VideoBlockData } from "./videoblock/types";
import DividerCanvas from "./dividerblock/Canvas";
import DividerRightSidebar from "./dividerblock/RightSidebar";
import type { DividerBlockData } from "./dividerblock/types";
import { defaultDividerProps } from "./dividerblock/types";
import type { DividerBlockProps } from "./dividerblock/types";
import IconsCanvas from "./iconsblock/Canvas";
import IconsRightSidebar from "./iconsblock/RightSidebar";
import type { IconBlockData } from "./iconsblock/types";
import { defaultIconProps } from "./iconsblock/types";
import type { IconBlockProps } from "./iconsblock/types";
 
const initialVideoBlock: VideoBlockData = {
  id: "video-default",
  type: "video",
  props: {
    sourceType: "upload",
    uploadUrl: "https://cdn.pixabay.com/video/2015/09/04/529-137258380_tiny.mp4",
    uploadFileName: "Nature -travel.mp4",
    uploadFileSize: "24.5 MB",
    autoplay: false,
    loop: false,
    muted: false,
    showControls: true
  },
};
 
const initialDividerBlock: DividerBlockData = {
  id: "divider-default",
  type: "divider",
  props: { ...defaultDividerProps },
};
 
const initialIconBlock: IconBlockData = {
  id: "icons-default",
  type: "icons",
  props: { ...defaultIconProps },
};
 
const initialButtonBlock: BlockData = {
  id: "button-default",
  type: "button",
  props: {
    width: "600 px",
    borderRadius: "18 px",
  },
};
 
type ButtonProps = BlockData["props"];
 
const initialTextBlockState: TextBlockState = {
  selectedTarget: "main",
  isTextEditable: false,
  textStyles: {
    color: "",
    fontSize: "",
    fontFamily: "",
  },
  section: {
    alignment: "left",
    backgroundColor: "#f8fafc",
    headerBg: "#06224C",
    headerText: "#ffffff",
    headerFontSize: "",
    headerFontFamily: "",
    headerFontWeight: "",
    footerBg: "#06224C",
    footerText: "#ffffff",
    shadow: false,
  },
};
 
export type DraftSaveStatus = "idle" | "saving" | "saved" | "error";

export default function BlockPagesClient() {
  const searchParams = useSearchParams();
  const requestedTemplate = searchParams.get("template");
  const initialTemplate: TextTemplateType = parseBlockpagesTemplate(requestedTemplate);
  const shouldOpenTextEditor = isTextEditorTemplate(initialTemplate);
  const [activeBlockPage, setActiveBlockPage] = useState<BlockPageType>(shouldOpenTextEditor ? "text" : "image");
  const [textTemplate, setTextTemplate] = useState<TextTemplateType>(initialTemplate);

  // ── Draft persistence state ──────────────────────────────────────────
  const [draftProjectId, setDraftProjectId] = useState<string | null>(
    searchParams.get("projectId") ?? null,
  );
  const [saveStatus, setSaveStatus] = useState<DraftSaveStatus>("idle");
  const [isDraftLoading, setIsDraftLoading] = useState(!!searchParams.get("projectId"));
  const isSavingRef = useRef(false);
  const saveStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const parsed = parseBlockpagesTemplate(searchParams.get("template"));
    setTextTemplate(parsed);
    if (isTextEditorTemplate(parsed)) {
      setActiveBlockPage("text");
    }

    const persisted = loadPersistedTextBlockState(parsed);
    if (persisted) {
      setTextBlockState({
        ...persisted,
        activeSectionId: persisted.activeSectionId ?? getBlockpagesDefaultSectionId(parsed),
      });
    } else {
      setTextBlockState((current) => ({
        ...current,
        activeSectionId: getBlockpagesDefaultSectionId(parsed),
      }));
    }

    if (!searchParams.get("projectId")) {
      const loadedDividers = loadAppliedDividersForTemplate(parsed);
      setAppliedDividers(loadedDividers);
      persistAppliedDividersForTemplate(parsed, loadedDividers);
      setAppliedIcons(loadAppliedIconsForTemplate(parsed));
    }
  }, [searchParams]);

  const [buttonBlocks, setButtonBlocks] = useState<BlockData[]>([initialButtonBlock]);
  const [selectedButtonBlockId, setSelectedButtonBlockId] = useState<string | null>(initialButtonBlock.id);
  const [pastButtonStates, setPastButtonStates] = useState<BlockData[][]>([]);
  const [futureButtonStates, setFutureButtonStates] = useState<BlockData[][]>([]);
  const [textBlockState, setTextBlockState] = useState<TextBlockState>(initialTextBlockState);
  const [pastTextStates, setPastTextStates] = useState<TextBlockState[]>([]);
  const [futureTextStates, setFutureTextStates] = useState<TextBlockState[]>([]);
 
  const [videoBlocks, setVideoBlocks] = useState<VideoBlockData[]>([initialVideoBlock]);
  const [selectedVideoBlockId, setSelectedVideoBlockId] = useState<string | null>(initialVideoBlock.id);
  const [pastVideoStates, setPastVideoStates] = useState<VideoBlockData[][]>([]);
  const [futureVideoStates, setFutureVideoStates] = useState<VideoBlockData[][]>([]);
  const [isVideoEditingMode, setIsVideoEditingMode] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
 
  const [dividerBlocks, setDividerBlocks] = useState<DividerBlockData[]>([initialDividerBlock]);
  const [selectedDividerBlockId, setSelectedDividerBlockId] = useState<string | null>(initialDividerBlock.id);
  const [pastDividerStates, setPastDividerStates] = useState<DividerBlockData[][]>([]);
  const [futureDividerStates, setFutureDividerStates] = useState<DividerBlockData[][]>([]);
 
  const [iconBlocks, setIconBlocks] = useState<IconBlockData[]>([initialIconBlock]);
  const [selectedIconBlockId, setSelectedIconBlockId] = useState<string | null>(initialIconBlock.id);
  const [pastIconStates, setPastIconStates] = useState<IconBlockData[][]>([]);
  const [futureIconStates, setFutureIconStates] = useState<IconBlockData[][]>([]);
 
  const [isImageEditingMode, setIsImageEditingMode] = useState(false);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [customImages, setCustomImages] = useState<Record<string, string>>({});
 
  const [isButtonEditingMode, setIsButtonEditingMode] = useState(false);
  const [editingButtonId, setEditingButtonId] = useState<string | null>(null);
  const [customButtons, setCustomButtons] = useState<Record<string, ButtonProps>>({});
 
  const [isIconEditingMode, setIsIconEditingMode] = useState(false);
  const [editingIconId, setEditingIconId] = useState<string | null>(null);
  const [customIcons, setCustomIcons] = useState<Record<string, IconBlockProps>>({});
 
  const [appliedDividers, setAppliedDividers] = useState<{ id: string; props: DividerBlockProps; position?: { top?: number; left?: number; x?: number; y?: number; sectionId?: string; anchorPath?: number[]; insertMode?: "after" | "before" }; scale?: number }[]>([]);
  const [appliedIcons, setAppliedIcons] = useState<{ id: string; props: IconBlockProps; position?: { top?: number; left?: number; x?: number; y?: number }; scale?: number }[]>([]);
  const [pendingDividerScrollId, setPendingDividerScrollId] = useState<string | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const clearPendingDividerScroll = useCallback(() => {
    setPendingDividerScrollId(null);
  }, []);

  const syncAppliedDividerPersistence = useCallback(
    (dividers: { id: string; props: DividerBlockProps; position?: { top?: number; left?: number; x?: number; y?: number; sectionId?: string; anchorPath?: number[]; insertMode?: "after" | "before" }; scale?: number }[]) => {
      persistAppliedDividersForTemplate(textTemplate, dividers);

      if (typeof window === "undefined") return;

      window.requestAnimationFrame(() => {
        const canvas = getBlockpagesCanvasElement();
        if (!(canvas instanceof HTMLElement)) return;

        scrubOrphanDividerDomFromLiveCanvas(
          canvas,
          dividers.map((divider) => divider.id)
        );

        if (templateUsesHtmlCanvasPersistence(textTemplate)) {
          const html = captureCanvasContent(canvas);
          if (isPersistedCanvasHtmlValid(textTemplate, html)) {
            persistCanvasHtml(textTemplate, html);
          }
        }

        const liveCanvas = canvas.querySelector<HTMLElement>("[data-textblock-canvas]");
        if (liveCanvas) {
          persistPreviewSnapshot(textTemplate, liveCanvas, dividers);
        }
      });
    },
    [textTemplate]
  );

  useEffect(() => {
    const canvas = getBlockpagesCanvasElement();
    if (!(canvas instanceof HTMLElement)) return;
    scrubOrphanDividerDomFromLiveCanvas(
      canvas,
      appliedDividers.map((divider) => divider.id)
    );
  }, [appliedDividers]);

  // ── Load saved draft on mount ──────────────────────────────────────────
  useEffect(() => {
    const projectId = searchParams.get("projectId");
    if (!projectId) {
      setIsDraftLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        const { draft } = await loadBlockPagesDraft(projectId, controller.signal);
        if (cancelled || !draft) {
          setIsDraftLoading(false);
          return;
        }

        // Hydrate all editor state from the saved draft
        if (draft.template) setTextTemplate(draft.template);
        if (draft.textBlockState) setTextBlockState(draft.textBlockState);
        if (draft.buttonBlocks?.length) {
          setButtonBlocks(draft.buttonBlocks);
          setSelectedButtonBlockId(draft.buttonBlocks[0]?.id ?? null);
        }
        if (draft.videoBlocks?.length) {
          setVideoBlocks(draft.videoBlocks);
          setSelectedVideoBlockId(draft.videoBlocks[0]?.id ?? null);
        }
        if (draft.dividerBlocks?.length) {
          setDividerBlocks(draft.dividerBlocks);
          setSelectedDividerBlockId(draft.dividerBlocks[0]?.id ?? null);
        }
        if (draft.iconBlocks?.length) {
          setIconBlocks(draft.iconBlocks);
          setSelectedIconBlockId(draft.iconBlocks[0]?.id ?? null);
        }
        if (draft.customImages) setCustomImages(draft.customImages);
        if (draft.customButtons) setCustomButtons(draft.customButtons as Record<string, ButtonProps>);
        if (draft.customIcons) setCustomIcons(draft.customIcons);
        if (draft.appliedDividers) setAppliedDividers(draft.appliedDividers);
        if (draft.appliedIcons) setAppliedIcons(draft.appliedIcons);

        setDraftProjectId(projectId);

        // Clear undo/redo history when loading a saved draft
        setPastButtonStates([]);
        setFutureButtonStates([]);
        setPastTextStates([]);
        setFutureTextStates([]);
        setPastVideoStates([]);
        setFutureVideoStates([]);
        setPastDividerStates([]);
        setFutureDividerStates([]);
        setPastIconStates([]);
        setFutureIconStates([]);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load block pages draft:", err);
        }
      } finally {
        if (!cancelled) setIsDraftLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildPreviewHtml = useCallback((ensureTextCanvas = false) => {
    let canvas = getBlockpagesCanvasElement();
    if (!canvas && ensureTextCanvas) {
      flushSync(() => setActiveBlockPage("text"));
      canvas = getBlockpagesCanvasElement();
    }

    if (!(canvas instanceof HTMLElement)) return "";

    const captureDevice =
      (canvas.getAttribute("data-blockpages-device") as "desktop" | "tablet" | "mobile" | null) ?? "desktop";

    return buildPreviewHtmlFromCanvas(canvas, { captureDevice, appliedDividers });
  }, [appliedDividers]);

  // ── Save Draft handler ─────────────────────────────────────────────────
  const handleSaveDraft = useCallback(async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setSaveStatus("saving");

    // Clear any lingering status timer
    if (saveStatusTimerRef.current) {
      clearTimeout(saveStatusTimerRef.current);
      saveStatusTimerRef.current = null;
    }

    const payload: BlockPagesDraftPayload = {
      template: textTemplate,
      textBlockState,
      buttonBlocks,
      videoBlocks,
      dividerBlocks,
      iconBlocks,
      customImages,
      customButtons,
      customIcons,
      appliedDividers,
      appliedIcons,
    };

    try {
      let currentProjectId = draftProjectId;

      // First save: create a new project
      if (!currentProjectId) {
        const created = await createBlockPagesDraft(textTemplate);
        currentProjectId = created._id;
        setDraftProjectId(currentProjectId);

        // Update URL with projectId without full page reload
        const url = new URL(window.location.href);
        url.searchParams.set("projectId", currentProjectId);
        window.history.replaceState({}, "", url.toString());
      }

      // Save structured draft data, plus rendered HTML if the website canvas is mounted.
      const htmlContent = buildPreviewHtml(false);
      await saveBlockPagesDraft(currentProjectId, payload, undefined, htmlContent || undefined);

      setSaveStatus("saved");
      saveStatusTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (err) {
      console.error("Save draft failed:", err);
      setSaveStatus("error");
      saveStatusTimerRef.current = setTimeout(() => setSaveStatus("idle"), 4000);
    } finally {
      isSavingRef.current = false;
    }
  }, [
    draftProjectId, textTemplate, textBlockState, buttonBlocks, videoBlocks,
    dividerBlocks, iconBlocks, customImages, customButtons, customIcons,
    appliedDividers, appliedIcons, buildPreviewHtml,
  ]);

  const handlePreview = useCallback(() => {
    const openPreview = (previewHtml: string) => {
      if (!previewHtml.trim()) return false;
      writeBlockpagesStorageItem(TEXTBLOCK_PREVIEW_STORAGE_KEY, previewHtml);
      writeBlockpagesStorageItem(getBlockpagesPreviewSnapshotKey(textTemplate), previewHtml);
      window.open(routePath("/blockpages/preview"), "_blank", "noopener,noreferrer");
      return true;
    };

    if (getBlockpagesCanvasElement() instanceof HTMLElement) {
      window.dispatchEvent(new CustomEvent(BLOCKPAGES_REQUEST_PREVIEW_EVENT));
      return;
    }

    flushSync(() => setActiveBlockPage("text"));

    const attemptCapture = (attempt = 0) => {
      if (getBlockpagesCanvasElement() instanceof HTMLElement) {
        window.dispatchEvent(new CustomEvent(BLOCKPAGES_REQUEST_PREVIEW_EVENT));
        return;
      }

      if (attempt < 40) {
        window.requestAnimationFrame(() => attemptCapture(attempt + 1));
        return;
      }

      const fallbackHtml = readBlockpagesStorageItem(getBlockpagesPreviewSnapshotKey(textTemplate));
      if (fallbackHtml?.trim()) openPreview(fallbackHtml);
    };

    attemptCapture();
  }, [textTemplate]);

  const verifyCanvasHasVideoTargets = (template: TextTemplateType) => {
    if (templateHasBuiltInVideoSlots(template)) return true;
    const canvas = getBlockpagesCanvasElement();
    if (!canvas) return false;
    return scanCanvasForVideoTargets(canvas);
  };

  const verifyCanvasHasIconTargets = (template: TextTemplateType) => {
    if (templateHasBuiltInIconSlots(template)) return true;
    const canvas = getBlockpagesCanvasElement();
    if (!canvas) return false;
    return scanCanvasForIconTargets(canvas) > 0;
  };

  const showNoVideoAlert = () => {
    window.alert("There is no video on this page to edit.");
  };

  const showNoIconAlert = () => {
    window.alert("There are no icons to edit on this page.");
  };

  const activateInlineIconEditing = () => {
    if (!verifyCanvasHasIconTargets(textTemplate)) {
      showNoIconAlert();
      return;
    }

    setActiveBlockPage("text");
    setIsIconEditingMode(true);
    setIsImageEditingMode(false);
    setIsButtonEditingMode(false);
    setIsVideoEditingMode(false);
    pushTextState({ ...textBlockState, isTextEditable: false });

    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        if (!scrollToFirstIconTarget()) {
          dispatchBlockpagesScrollToSection(getBlockpagesIconScrollId(textTemplate));
        }
      }, 450);
    }
  };
 
  useEffect(() => {
    try {
      const storedImages = readBlockpagesStorageItem("stackly-custom-images");
      if (storedImages) {
        const parsed = JSON.parse(storedImages);
        const validImages: Record<string, string> = {};
        let hasChanges = false;
        for (const key in parsed) {
          if (typeof parsed[key] === "string" && parsed[key].startsWith("blob:")) {
            hasChanges = true;
          } else {
            validImages[key] = parsed[key];
          }
        }
        window.setTimeout(() => setCustomImages(validImages), 0);
        if (hasChanges) {
          writeBlockpagesStorageItem("stackly-custom-images", JSON.stringify(validImages));
        }
      }
    } catch (e) {
      console.error("Failed to load custom images", e);
    }
 
    try {
      const storedButtons = readBlockpagesStorageItem("stackly-custom-buttons");
      if (storedButtons) {
        window.setTimeout(() => {
          setCustomButtons(JSON.parse(storedButtons) as Record<string, ButtonProps>);
        }, 0);
      }
    } catch (e) {
      console.error("Failed to load custom buttons", e);
    }
 
    try {
      if (searchParams.get("projectId")) return;

      const storedIcons = readBlockpagesStorageItem("stackly-custom-icons");
      if (storedIcons) {
        window.setTimeout(() => {
          const parsed = JSON.parse(storedIcons);
          if (Array.isArray(parsed)) setAppliedIcons(parsed);
          else if (parsed) setAppliedIcons([{ id: 'legacy', props: parsed }]);
        }, 0);
      }
    } catch (e) {
      console.error("Failed to load custom icons", e);
    }
 
    try {
      const storedStaticIcons = readBlockpagesStorageItem("stackly-custom-static-icons");
      if (storedStaticIcons) {
        window.setTimeout(() => {
          setCustomIcons(JSON.parse(storedStaticIcons) as Record<string, IconBlockProps>);
        }, 0);
      }
    } catch (e) {
      console.error("Failed to load custom static icons", e);
    }
  }, []);

  useEffect(() => {
    if (isBlockpagesVideoApplied(textTemplate)) {
      const storedProps = loadBlockpagesVideoProps(textTemplate);
      if (storedProps) {
        setVideoBlocks([{ id: "video-default", type: "video", props: storedProps }]);
        setSelectedVideoBlockId("video-default");
        return;
      }
    }
    setVideoBlocks([initialVideoBlock]);
    setSelectedVideoBlockId(initialVideoBlock.id);
  }, [textTemplate]);
 
  useEffect(() => {
    const scrollRoot = document.querySelector<HTMLElement>("[data-textblock-canvas]");
    if (!scrollRoot || activeBlockPage === "text") return;
    scrollRoot.scrollTop = 0;
    scrollRoot.scrollLeft = 0;
  }, [activeBlockPage]);

  useEffect(() => {
    if (activeBlockPage === "video" && !templateHasBuiltInVideoSlots(textTemplate)) {
      setActiveBlockPage("text");
    }
  }, [activeBlockPage, textTemplate]);
 
  const pushButtonState = (nextBlocks: BlockData[]) => {
    setPastButtonStates((current) => [...current, buttonBlocks]);
    setFutureButtonStates([]);
    setButtonBlocks(nextBlocks);
  };
 
  const undoButton = () => {
    setPastButtonStates((currentPast) => {
      if (currentPast.length === 0) {
        return currentPast;
      }
 
      const previous = currentPast[currentPast.length - 1];
      setFutureButtonStates((currentFuture) => [buttonBlocks, ...currentFuture]);
      setButtonBlocks(previous);
      setSelectedButtonBlockId(previous[0]?.id ?? null);
      return currentPast.slice(0, -1);
    });
  };
 
  const redoButton = () => {
    setFutureButtonStates((currentFuture) => {
      if (currentFuture.length === 0) {
        return currentFuture;
      }
 
      const [next, ...remaining] = currentFuture;
      setPastButtonStates((currentPast) => [...currentPast, buttonBlocks]);
      setButtonBlocks(next);
      setSelectedButtonBlockId(next[0]?.id ?? null);
      return remaining;
    });
  };
 
  const updateButtonBlock = (id: string, props: Record<string, unknown>) => {
    if (!id) {
      return;
    }
 
    pushButtonState(
      buttonBlocks.map((block) =>
        block.id === id
          ? {
            ...block,
            props: {
              ...block.props,
              ...props,
            },
          }
          : block,
      ),
    );
  };
 
  const removeButtonBlock = (id: string) => {
    const nextBlocks = buttonBlocks.filter((block) => block.id !== id);
    pushButtonState(nextBlocks);
    setSelectedButtonBlockId(nextBlocks[0]?.id ?? null);
  };
 
  const selectedButtonBlock =
    buttonBlocks.find((block) => block.id === selectedButtonBlockId) ?? buttonBlocks[0] ?? null;
 
  const pushVideoState = (nextBlocks: VideoBlockData[]) => {
    setPastVideoStates((current) => [...current, videoBlocks]);
    setFutureVideoStates([]);
    setVideoBlocks(nextBlocks);
  };
 
  const undoVideo = () => {
    setPastVideoStates((currentPast) => {
      if (currentPast.length === 0) return currentPast;
      const previous = currentPast[currentPast.length - 1];
      setFutureVideoStates((currentFuture) => [videoBlocks, ...currentFuture]);
      setVideoBlocks(previous);
      setSelectedVideoBlockId(previous[0]?.id ?? null);
      return currentPast.slice(0, -1);
    });
  };
 
  const redoVideo = () => {
    setFutureVideoStates((currentFuture) => {
      if (currentFuture.length === 0) return currentFuture;
      const [next, ...remaining] = currentFuture;
      setPastVideoStates((currentPast) => [...currentPast, videoBlocks]);
      setVideoBlocks(next);
      setSelectedVideoBlockId(next[0]?.id ?? null);
      return remaining;
    });
  };
 
  const updateVideoBlock = (id: string, props: Partial<VideoBlockData['props']>) => {
    if (!id) return;
    pushVideoState(
      videoBlocks.map((block) =>
        block.id === id ? { ...block, props: { ...block.props, ...props } } : block
      )
    );
  };
 
  const removeVideoBlock = (id: string) => {
    const nextBlocks = videoBlocks.filter((block) => block.id !== id);
    pushVideoState(nextBlocks);
    setSelectedVideoBlockId(nextBlocks[0]?.id ?? null);
  };
 
  const selectedVideoBlock =
    videoBlocks.find((block) => block.id === selectedVideoBlockId) ?? videoBlocks[0] ?? null;
 
  const pushDividerState = (nextBlocks: DividerBlockData[]) => {
    setPastDividerStates((current) => [...current, dividerBlocks]);
    setFutureDividerStates([]);
    setDividerBlocks(nextBlocks);
  };
 
  const undoDivider = () => {
    setPastDividerStates((currentPast) => {
      if (currentPast.length === 0) return currentPast;
      const previous = currentPast[currentPast.length - 1];
      setFutureDividerStates((currentFuture) => [dividerBlocks, ...currentFuture]);
      setDividerBlocks(previous);
      setSelectedDividerBlockId(previous[0]?.id ?? null);
      return currentPast.slice(0, -1);
    });
  };
 
  const redoDivider = () => {
    setFutureDividerStates((currentFuture) => {
      if (currentFuture.length === 0) return currentFuture;
      const [next, ...remaining] = currentFuture;
      setPastDividerStates((currentPast) => [...currentPast, dividerBlocks]);
      setDividerBlocks(next);
      setSelectedDividerBlockId(next[0]?.id ?? null);
      return remaining;
    });
  };
 
  const updateDividerBlock = (id: string, props: Partial<DividerBlockData["props"]>) => {
    if (!id) return;
    pushDividerState(
      dividerBlocks.map((block) =>
        block.id === id ? { ...block, props: { ...block.props, ...props } } : block
      )
    );
  };
 
  const removeDividerBlock = (id: string) => {
    const nextBlocks = dividerBlocks.filter((block) => block.id !== id);
    pushDividerState(nextBlocks.length > 0 ? nextBlocks : [initialDividerBlock]);
    setSelectedDividerBlockId((nextBlocks.length > 0 ? nextBlocks : [initialDividerBlock])[0]?.id ?? null);
  };
 
  const selectedDividerBlock =
    dividerBlocks.find((block) => block.id === selectedDividerBlockId) ?? dividerBlocks[0] ?? null;
 
  const pushIconState = (nextBlocks: IconBlockData[]) => {
    setPastIconStates((current) => [...current, iconBlocks]);
    setFutureIconStates([]);
    setIconBlocks(nextBlocks);
  };
 
  const undoIcon = () => {
    setPastIconStates((currentPast) => {
      if (currentPast.length === 0) return currentPast;
      const previous = currentPast[currentPast.length - 1];
      setFutureIconStates((currentFuture) => [iconBlocks, ...currentFuture]);
      setIconBlocks(previous);
      setSelectedIconBlockId(previous[0]?.id ?? null);
      return currentPast.slice(0, -1);
    });
  };
 
  const redoIcon = () => {
    setFutureIconStates((currentFuture) => {
      if (currentFuture.length === 0) return currentFuture;
      const [next, ...remaining] = currentFuture;
      setPastIconStates((currentPast) => [...currentPast, iconBlocks]);
      setIconBlocks(next);
      setSelectedIconBlockId(next[0]?.id ?? null);
      return remaining;
    });
  };
 
  const updateIconBlock = (id: string, props: Partial<IconBlockData["props"]>) => {
    if (!id) return;
    pushIconState(
      iconBlocks.map((block) =>
        block.id === id ? { ...block, props: { ...block.props, ...props } } : block
      )
    );
  };
 
  const removeIconBlock = (id: string) => {
    const nextBlocks = iconBlocks.filter((block) => block.id !== id);
    pushIconState(nextBlocks.length > 0 ? nextBlocks : [initialIconBlock]);
    setSelectedIconBlockId((nextBlocks.length > 0 ? nextBlocks : [initialIconBlock])[0]?.id ?? null);
  };
 
  const selectedIconBlock =
    iconBlocks.find((block) => block.id === selectedIconBlockId) ?? iconBlocks[0] ?? null;
 
  const pushTextState = (nextState: TextBlockState) => {
    setPastTextStates((current) => [...current, textBlockState]);
    setFutureTextStates([]);
    setTextBlockState(nextState);
    persistTextBlockState(textTemplate, nextState);
  };
 
  const undoText = () => {
    setPastTextStates((currentPast) => {
      if (currentPast.length === 0) {
        return currentPast;
      }
 
      const previous = currentPast[currentPast.length - 1];
      setFutureTextStates((currentFuture) => [textBlockState, ...currentFuture]);
      setTextBlockState(previous);
      return currentPast.slice(0, -1);
    });
  };
 
  const redoText = () => {
    setFutureTextStates((currentFuture) => {
      if (currentFuture.length === 0) {
        return currentFuture;
      }
 
      const [next, ...remaining] = currentFuture;
      setPastTextStates((currentPast) => [...currentPast, textBlockState]);
      setTextBlockState(next);
      return remaining;
    });
  };
 
  if (isDraftLoading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center bg-[#f0f2f5] text-[#0B1D40]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#0B1D40]" />
          <h2 className="text-xl font-bold tracking-tight">Loading Saved Draft...</h2>
          <p className="text-sm text-slate-500">Retrieving template & styles from database</p>
        </div>
      </div>
    );
  }

  return (
    <BuilderProvider>
      <section className="flex min-h-[calc(100vh-64px)] flex-1 gap-4 overflow-hidden bg-[#e9eef6] p-4">
        <div className="contents xl:block xl:overflow-hidden xl:rounded-xl xl:shadow-[0_18px_45px_rgba(11,29,64,0.12)]">
          <LeftSidebar
            activeBlockPage={activeBlockPage}
            textTemplate={textTemplate}
            isImageEditingMode={isImageEditingMode}
            editingImageId={editingImageId}
            isButtonEditingMode={isButtonEditingMode}
            editingButtonId={editingButtonId}
            isVideoEditingMode={isVideoEditingMode}
            isIconEditingMode={isIconEditingMode}
            onUpdateVideoStyle={(props) => {
              if (!templateHasBuiltInVideoSlots(textTemplate)) {
                showNoVideoAlert();
                return;
              }
              if (selectedVideoBlockId) {
                updateVideoBlock(selectedVideoBlockId, props);
              } else if (videoBlocks.length > 0) {
                updateVideoBlock(videoBlocks[0].id, props);
              }
            }}
            activeTextTarget={textBlockState.isTextEditable ? textBlockState.selectedTarget : null}
            onSelectTextTarget={(target) => {
              if (activeBlockPage !== "text") {
                setActiveBlockPage("text");
                setIsImageEditingMode(false);
                setIsButtonEditingMode(false);
                pushTextState({
                  ...textBlockState,
                  isTextEditable: true,
                  selectedTarget: target,
                });
              } else {
                const isSameTargetAndActive = textBlockState.isTextEditable && textBlockState.selectedTarget === target;
                setIsImageEditingMode(false);
                setIsButtonEditingMode(false);
                pushTextState({
                  ...textBlockState,
                  isTextEditable: !isSameTargetAndActive,
                  selectedTarget: !isSameTargetAndActive ? target : textBlockState.selectedTarget,
                });
              }
              if (typeof window !== "undefined") {
                if (target === "footer") {
                  setTimeout(() => {
                    dispatchBlockpagesScrollToSection(getBlockpagesFooterScrollId(textTemplate));
                  }, 50);
                } else if (target === "header") {
                  setTimeout(() => {
                    dispatchBlockpagesScrollToSection(getBlockpagesHeaderScrollId(textTemplate));
                  }, 50);
                }
              }
            }}
            onUpdateTextStyles={(styles) => pushTextState({ ...textBlockState, textStyles: { ...textBlockState.textStyles, ...styles } })}
            onUpdateTextSection={(props) => pushTextState({ ...textBlockState, section: { ...textBlockState.section, ...props } })}
            textBlockState={textBlockState}
            onUpdateTextBlockState={pushTextState}
            onUpdateButtonStyle={(newProps) => {
              if (selectedButtonBlock) {
                updateButtonBlock(selectedButtonBlock.id, newProps);
              }
            }}
            onImageSelected={(url) => {
              if (editingImageId) {
                setCustomImages((prev) => {
                  const next = { ...prev, [editingImageId]: url };
                  writeBlockpagesStorageItem("stackly-custom-images", JSON.stringify(next));
                  return next;
                });
              }
              setEditingImageId(null);
              setIsImageEditingMode(false);
            }}
            onCloseMobileImageSelect={() => setEditingImageId(null)}
            onSelectBlockPage={(page) => {
              const keepsTextCanvasMounted =
                activeBlockPage === "text" &&
                (page === "text" || page === "image" || page === "button" || page === "video");

              if (activeBlockPage === "text" && !keepsTextCanvasMounted) {
                flushBlockpagesPreviewSnapshot(textTemplate, appliedDividers);
              }

              if (page === "image" && activeBlockPage === "text") {
                setIsImageEditingMode((prev) => !prev);
                setIsButtonEditingMode(false);
                pushTextState({ ...textBlockState, isTextEditable: false });
                return;
              }
              if (page === "button" && activeBlockPage === "text") {
                setIsButtonEditingMode((prev) => !prev);
                setIsImageEditingMode(false);
                setIsVideoEditingMode(false);
                pushTextState({ ...textBlockState, isTextEditable: false });
                return;
              }
              if (page === "video" && activeBlockPage === "text") {
                if (!templateHasBuiltInVideoSlots(textTemplate)) {
                  showNoVideoAlert();
                  return;
                }
                const turningOn = !isVideoEditingMode;
                setIsVideoEditingMode(turningOn);
                setIsImageEditingMode(false);
                setIsButtonEditingMode(false);
                pushTextState({ ...textBlockState, isTextEditable: false });
                if (turningOn && typeof window !== "undefined") {
                  window.setTimeout(() => {
                    dispatchBlockpagesScrollToSection(getBlockpagesVideoScrollId(textTemplate));
                  }, 450);
                }
                return;
              }

              if (page === "video") {
                if (!templateHasBuiltInVideoSlots(textTemplate)) {
                  showNoVideoAlert();
                  return;
                }
              }
 
              if (page === "divider") {
                setIsImageEditingMode(false);
                setIsButtonEditingMode(false);
                setIsVideoEditingMode(false);
                pushTextState({ ...textBlockState, isTextEditable: false });
                setActiveBlockPage("divider");
                return;
              }
 
              if (page === "icons") {
                if (activeBlockPage === "text" && isIconEditingMode) {
                  setIsIconEditingMode(false);
                  setIsImageEditingMode(false);
                  setIsButtonEditingMode(false);
                  setIsVideoEditingMode(false);
                  pushTextState({ ...textBlockState, isTextEditable: false });
                  return;
                }

                activateInlineIconEditing();
                return;
              }
 
              const wasOnText = activeBlockPage === "text";
              setActiveBlockPage(page);
 
              if (page === "text") {
                setIsImageEditingMode(false);
                setIsButtonEditingMode(false);
                setIsVideoEditingMode(false);
                setIsIconEditingMode(false);
 
                const nextIsEditable = wasOnText ? !textBlockState.isTextEditable : true;
                pushTextState({
                  ...textBlockState,
                  isTextEditable: nextIsEditable,
                  selectedTarget: nextIsEditable ? "text" : textBlockState.selectedTarget,
                });
              }
            }}
          />
        </div>
 
        {activeBlockPage === "button" ? (
          <div className="flex min-w-0 flex-1 gap-4 relative">
            <div className="flex-1 min-w-0">
              <ButtonCanvas
                blocks={buttonBlocks}
                selectedBlockId={selectedButtonBlockId}
                onSelectBlock={setSelectedButtonBlockId}
                onRemoveBlock={removeButtonBlock}
                canUndo={pastButtonStates.length > 0}
                canRedo={futureButtonStates.length > 0}
                onUndo={undoButton}
                onRedo={redoButton}
                editingButtonId={editingButtonId}
                onButtonSelected={(props) => {
                  if (editingButtonId) {
                    setCustomButtons((prev) => {
                      const next = { ...prev, [editingButtonId]: props };
                  writeBlockpagesStorageItem("stackly-custom-buttons", JSON.stringify(next));
                      return next;
                    });
                  }
                  setActiveBlockPage("text");
                  setEditingButtonId(null);
                  setIsButtonEditingMode(false);
                }}
                onOpenMobileSidebar={() => setShowMobileSidebar(true)}
                onSaveDraft={handleSaveDraft}
                onPreview={handlePreview}
                saveStatus={saveStatus}
              />
            </div>
 
            {/* Mobile/Tablet Backdrop */}
            {showMobileSidebar && (
              <div
                className="fixed inset-0 bg-black/50 z-[90] xl:hidden"
                onClick={() => setShowMobileSidebar(false)}
              />
            )}
 
            {/* Sidebar Container: Bottom sheet on mobile, relative flow on desktop */}
            <div className={`
              fixed bottom-0 left-0 w-full h-[60vh] z-[100] transition-transform duration-300
              ${showMobileSidebar ? "translate-y-0" : "translate-y-full"}
              xl:translate-y-0 xl:static xl:h-auto xl:w-[210px] xl:shrink-0 xl:block
              bg-white xl:bg-transparent rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] xl:shadow-none xl:rounded-none overflow-hidden
            `}>
              <ButtonRightSidebar
                selectedBlock={selectedButtonBlock}
                onUpdateBlock={updateButtonBlock}
                onClose={() => setShowMobileSidebar(false)}
              />
            </div>
          </div>
        ) : activeBlockPage === "text" ? (
          <div className="flex min-h-0 min-w-0 flex-1 gap-4 overflow-hidden">
            <TextCanvas
              state={textBlockState}
              onStateChange={pushTextState}
              onSaveDraft={handleSaveDraft}
              saveStatus={saveStatus}
              canUndo={pastTextStates.length > 0}
              canRedo={futureTextStates.length > 0}
              onUndo={undoText}
              onRedo={redoText}
              template={textTemplate}
              isImageEditingMode={isImageEditingMode}
              editingImageId={editingImageId}
              customImages={customImages}
              onEditImage={(imageId) => {
                setEditingImageId(imageId);
                if (typeof window !== "undefined" && window.innerWidth >= 1024) {
                  setActiveBlockPage("image");
                }
              }}
              isButtonEditingMode={isButtonEditingMode}
              customButtons={customButtons}
              editingButtonId={editingButtonId}
              onEditButton={(buttonId) => {
                setEditingButtonId(buttonId);
                setActiveBlockPage("button");
              }}
              videoBlocks={videoBlocks}
              isVideoEditingMode={isVideoEditingMode}
              onEditVideo={(videoId) => {
                if (!templateHasBuiltInVideoSlots(textTemplate)) {
                  showNoVideoAlert();
                  return;
                }
                flushBlockpagesPreviewSnapshot(textTemplate, appliedDividers);
                setEditingVideoId(videoId);
                setActiveBlockPage("video");
              }}
              isIconEditingMode={isIconEditingMode}
              editingIconId={editingIconId}
              customIcons={customIcons}
              onEditIcon={(iconId) => {
                flushBlockpagesPreviewSnapshot(textTemplate, appliedDividers);
                setEditingIconId(iconId);
                if (typeof window !== "undefined" && window.innerWidth >= 1024) {
                  setActiveBlockPage("icons");
                }
              }}
              appliedDividers={appliedDividers}
              onRemoveDivider={(id) => {
                setAppliedDividers((prev) => {
                  const next = prev.filter((d) => d.id !== id);
                  syncAppliedDividerPersistence(next);
                  return next;
                });
              }}
              appliedIcons={appliedIcons}
              onRemoveIcon={(id) => {
                setAppliedIcons((prev) => {
                  const next = prev.filter((i) => i.id !== id);
                  persistAppliedIconsForTemplate(textTemplate, next);
                  return next;
                });
              }}
              onUpdateDividerPosition={(id, position) => {
                setAppliedDividers((prev) => {
                  const next = prev.map((d) => (d.id === id ? { ...d, position } : d));
                  persistAppliedDividersForTemplate(textTemplate, next);
                  return next;
                });
              }}
              onUpdateDividerScale={(id, scale) => {
                setAppliedDividers((prev) => {
                  const next = prev.map((d) => (d.id === id ? { ...d, scale } : d));
                  persistAppliedDividersForTemplate(textTemplate, next);
                  return next;
                });
              }}
              onUpdateIconPosition={(id, position) => {
                setAppliedIcons((prev) => {
                  const next = prev.map((i) => (i.id === id ? { ...i, position } : i));
                  persistAppliedIconsForTemplate(textTemplate, next);
                  return next;
                });
              }}
              onUpdateIconScale={(id, scale) => {
                setAppliedIcons((prev) => {
                  const next = prev.map((i) => (i.id === id ? { ...i, scale } : i));
                  persistAppliedIconsForTemplate(textTemplate, next);
                  return next;
                });
              }}
              pendingDividerScrollId={pendingDividerScrollId}
              onPendingDividerScrollComplete={clearPendingDividerScroll}
            />
            <div className="hidden w-[210px] shrink-0 xl:block">
              <TextRightSidebar state={textBlockState} onStateChange={pushTextState} template={textTemplate} />
            </div>
          </div>
        ) : activeBlockPage === "image" ? (
          <div className="flex min-w-0 flex-1 gap-4">
            <ImageMainCanvas
              editingImageId={editingImageId}
              onImageSelected={(url) => {
                if (editingImageId) {
                  setCustomImages((prev) => {
                    const next = { ...prev, [editingImageId]: url };
                    writeBlockpagesStorageItem("stackly-custom-images", JSON.stringify(next));
                    return next;
                  });
                }
                setActiveBlockPage("text");
                setEditingImageId(null);
                setIsImageEditingMode(false);
              }}
              onSaveDraft={handleSaveDraft}
              onPreview={handlePreview}
              saveStatus={saveStatus}
            />
            <div className="hidden w-[210px] shrink-0 xl:block">
              <ImageRightSidebar />
            </div>
          </div>
        ) : activeBlockPage === "video" ? (
          <div className="flex min-w-0 flex-1 gap-4 relative">
            <div className="flex-1 min-w-0">
              <VideoCanvas
                template={textTemplate}
                blocks={videoBlocks}
                selectedBlockId={selectedVideoBlockId}
                onSelectBlock={setSelectedVideoBlockId}
                onRemoveBlock={removeVideoBlock}
                canUndo={pastVideoStates.length > 0}
                canRedo={futureVideoStates.length > 0}
                onUndo={undoVideo}
                onRedo={redoVideo}
                onOpenMobileSidebar={() => setShowMobileSidebar(true)}
                onApplyVideo={(blockId) => {
                  setActiveBlockPage("text");
                  setIsVideoEditingMode(false);
                  setEditingVideoId(null);

                  const appliedBlock = videoBlocks.find((b) => b.id === blockId);
                  if (appliedBlock) {
                    saveBlockpagesVideoProps(textTemplate, appliedBlock.props);
                    const otherBlocks = videoBlocks.filter((b) => b.id !== blockId);
                    pushVideoState([appliedBlock, ...otherBlocks]);
                    setSelectedVideoBlockId(blockId);
                  }
                }}
                onDuplicateBlock={(id) => {
                  const blockToDuplicate = videoBlocks.find(b => b.id === id);
                  if (blockToDuplicate) {
                    const newBlock = { ...blockToDuplicate, id: `video-${Date.now()}` };
                    pushVideoState([...videoBlocks, newBlock]);
                    setSelectedVideoBlockId(newBlock.id);
                  }
                }}
                onUpdateBlock={updateVideoBlock}
                onCloseBlock={() => {
                  // Simply close the editor and go back to text/preview page
                  setActiveBlockPage("text");
                  setIsVideoEditingMode(false);
                  setEditingVideoId(null);
                }}
                onSaveDraft={handleSaveDraft}
                onPreview={handlePreview}
                saveStatus={saveStatus}
              />
            </div>
            {showMobileSidebar && (
              <div
                className="fixed inset-0 bg-black/50 z-[90] xl:hidden"
                onClick={() => setShowMobileSidebar(false)}
              />
            )}
            <div className={`
              fixed bottom-0 left-0 w-full h-[60vh] z-[100] transition-transform duration-300
              ${showMobileSidebar ? "translate-y-0" : "translate-y-full"}
              xl:translate-y-0 xl:static xl:h-auto xl:w-[210px] xl:shrink-0 xl:block
              bg-white xl:bg-transparent rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] xl:shadow-none xl:rounded-none overflow-hidden
            `}>
              <VideoRightSidebar
                selectedBlock={selectedVideoBlock}
                onUpdateBlock={updateVideoBlock}
                onClose={() => setShowMobileSidebar(false)}
              />
            </div>
          </div>
        ) : activeBlockPage === "divider" ? (
          <div className="flex min-w-0 flex-1 gap-4 relative">
            <div className="flex-1 min-w-0">
              <DividerCanvas
                blocks={dividerBlocks}
                selectedBlockId={selectedDividerBlockId}
                onSelectBlock={setSelectedDividerBlockId}
                onRemoveBlock={removeDividerBlock}
                onUpdateBlock={updateDividerBlock}
                canUndo={pastDividerStates.length > 0}
                canRedo={futureDividerStates.length > 0}
                onUndo={undoDivider}
                onRedo={redoDivider}
                onOpenMobileSidebar={() => setShowMobileSidebar(true)}
                onApplyDivider={() => {
                  const block = selectedDividerBlock ?? dividerBlocks[0];
                  if (block) {
                    const newDividerId = Date.now().toString();
                    const canvas = getBlockpagesCanvasElement();
                    const fallbackTop = getOverlayDefaultTop("divider", appliedDividers.length);
                    const anchorY =
                      canvas instanceof HTMLElement
                        ? getVisibleCanvasAnchorY(canvas)
                        : fallbackTop;
                    const placement =
                      canvas instanceof HTMLElement
                        ? resolveDividerSectionPlacementAtY(canvas, anchorY)
                        : null;

                    setAppliedDividers((prev) => {
                      const newDivider = {
                        id: newDividerId,
                        props: block.props,
                        position: {
                          top: anchorY,
                          left: 16,
                          ...(placement?.sectionId
                            ? {
                                sectionId: placement.sectionId,
                                anchorPath: placement.anchorPath,
                                insertMode: placement.insertMode,
                              }
                            : {}),
                        },
                        scale: 1,
                      };
                      const next = [...prev, newDivider];
                      persistAppliedDividersForTemplate(textTemplate, next);
                      return next;
                    });
                    setPendingDividerScrollId(newDividerId);
                  }
                  setActiveBlockPage("text");
                }}
                onSaveDraft={handleSaveDraft}
                onPreview={handlePreview}
                saveStatus={saveStatus}
              />
            </div>
            {showMobileSidebar && (
              <div
                className="fixed inset-0 bg-black/50 z-[90] xl:hidden"
                onClick={() => setShowMobileSidebar(false)}
              />
            )}
            <div className={`
              fixed bottom-0 left-0 w-full h-[60vh] z-[100] transition-transform duration-300
              ${showMobileSidebar ? "translate-y-0" : "translate-y-full"}
              xl:translate-y-0 xl:static xl:h-auto xl:w-[210px] xl:shrink-0 xl:block
              bg-white xl:bg-transparent rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] xl:shadow-none xl:rounded-none overflow-hidden
            `}>
              <DividerRightSidebar
                selectedBlock={selectedDividerBlock}
                onUpdateBlock={updateDividerBlock}
                onClose={() => setShowMobileSidebar(false)}
              />
            </div>
          </div>
        ) : activeBlockPage === "icons" ? (
          <div className="flex min-w-0 flex-1 gap-4 relative">
            <div className="flex-1 min-w-0">
              <IconsCanvas
                blocks={iconBlocks}
                selectedBlockId={selectedIconBlockId}
                onSelectBlock={setSelectedIconBlockId}
                onRemoveBlock={removeIconBlock}
                canUndo={pastIconStates.length > 0}
                canRedo={futureIconStates.length > 0}
                onUndo={undoIcon}
                onRedo={redoIcon}
                onOpenMobileSidebar={() => setShowMobileSidebar(true)}
                onApplyIcon={() => {
                  const block = selectedIconBlock ?? iconBlocks[0];
                  if (block) {
                    if (editingIconId) {
                      setCustomIcons((prev) => {
                        const next = { ...prev, [editingIconId]: block.props };
                        writeBlockpagesStorageItem("stackly-custom-static-icons", JSON.stringify(next));
                        return next;
                      });
                    } else {
                      setAppliedIcons((prev) => {
                        const newIcon = {
                          id: Date.now().toString(),
                          props: block.props,
                          position: {
                            top: getOverlayDefaultTop("icon", prev.length),
                            left: 16,
                          },
                          scale: 1,
                        };
                        const next = [...prev, newIcon];
                        persistAppliedIconsForTemplate(textTemplate, next);
                        return next;
                      });
                    }
                  }
                  setActiveBlockPage("text");
                  setEditingIconId(null);
                  setIsIconEditingMode(false);
                }}
                onDuplicateBlock={(id) => {
                  const blockToDuplicate = iconBlocks.find(b => b.id === id);
                  if (blockToDuplicate) {
                    const newBlock = { ...blockToDuplicate, id: `icons-${Date.now()}` };
                    pushIconState([...iconBlocks, newBlock]);
                    setSelectedIconBlockId(newBlock.id);
                  }
                }}
                onUpdateBlock={updateIconBlock}
                onSaveDraft={handleSaveDraft}
                onPreview={handlePreview}
                saveStatus={saveStatus}
              />
            </div>
            {showMobileSidebar && (
              <div
                className="fixed inset-0 bg-black/50 z-[90] xl:hidden"
                onClick={() => setShowMobileSidebar(false)}
              />
            )}
            <div className={`
              fixed bottom-0 left-0 w-full h-[60vh] z-[100] transition-transform duration-300
              ${showMobileSidebar ? "translate-y-0" : "translate-y-full"}
              xl:translate-y-0 xl:static xl:h-auto xl:w-[210px] xl:shrink-0 xl:block
              bg-white xl:bg-transparent rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] xl:shadow-none xl:rounded-none overflow-hidden
            `}>
              <IconsRightSidebar
                selectedBlock={selectedIconBlock}
                onUpdateBlock={updateIconBlock}
                onClose={() => setShowMobileSidebar(false)}
              />
            </div>
          </div>
        ) : null}
      </section>
    </BuilderProvider>
  );
}
 
 

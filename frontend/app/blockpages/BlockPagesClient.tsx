"use client";
 
import "@/lib/reactDomPatch";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { flushSync } from "react-dom";
import {
  createBlockPagesDraft,
  saveBlockPagesDraft,
  loadBlockPagesDraft,
  type BlockPagesDraftPayload,
} from "@/lib/blockPagesDraftApi";
import { routePath } from "@/lib/paths";
import Link from "next/link";
import {
  Loader2,
  Lock,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";
import { useTemplateAccess, STORAGE_SYNC_EVENT } from "@/lib/templateAccessApi";
import {
  createRazorpayOrder,
  openRazorpayCheckout,
  verifyRazorpayPayment,
} from "@/lib/razorpayClient";
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
  DEFAULT_PORTFOLIO_VIDEO_PROPS,
} from "@/lib/blockpagesVideoStorage";
import {
  isTextEditorTemplate,
  parseBlockpagesTemplate,
  getBlockpagesTemplateLabel,
} from "@/lib/blockpagesTemplates";
import {
  dispatchBlockpagesScrollToSection,
  getBlockpagesDefaultSectionId,
  getBlockpagesFooterScrollId,
  getBlockpagesHeaderScrollId,
  getBlockpagesVideoScrollId,
  getBlockpagesIconScrollId,
  scrollCanvasToModifiedElement,
} from "@/lib/blockpagesTemplateSections";
import {
  getBlockpagesCanvasElement,
  scanCanvasForIconTargets,
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
  loadCustomImagesForTemplate,
  persistCustomImagesForTemplate,
  loadCustomButtonsForTemplate,
  persistCustomButtonsForTemplate,
  loadCustomStaticIconsForTemplate,
  persistCustomStaticIconsForTemplate,
  BLOCKPAGES_CANVAS_RESTORED_EVENT,
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

const TEMPLATE_PRICES: Record<string, number> = {
  portfolio: 250,
  ecommerce: 290,
  blog: 200,
  construction: 250,
  restaurant: 250,
  "digital-marketing": 250,
  business: 290,
};

const TEMPLATE_PREVIEW_URLS: Record<string, string> = {
  portfolio: "/portfolio",
  ecommerce: "/e-commerce",
  blog: "/blog",
  construction: "/construction",
  restaurant: "/restaurant",
  "digital-marketing": "/digital-marketing",
  business: "/coming-soon",
};
 
const initialVideoBlock: VideoBlockData = {
  id: "video_block",
  type: "video",
  props: { ...DEFAULT_PORTFOLIO_VIDEO_PROPS },
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

type AppliedDividerItem = {
  id: string;
  props: DividerBlockProps;
  position?: {
    top?: number;
    left?: number;
    x?: number;
    y?: number;
    sectionId?: string;
    anchorPath?: number[];
    insertMode?: "after" | "before";
  };
  scale?: number;
};

/** Unified snapshot capturing all editable state for undo/redo. */
type EditorSnapshot = {
  textBlockState: TextBlockState;
  customImages: Record<string, string>;
  customButtons: Record<string, ButtonProps>;
  customIcons: Record<string, IconBlockProps>;
  appliedDividers?: AppliedDividerItem[];
};
 
const initialTextBlockState: TextBlockState = {
  selectedTarget: "main",
  isTextEditable: true,
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

  // ── Template Access Control ──────────────────────────────────────────
  const { access, isLoading: isAccessLoading, canEditTemplate, refresh: refreshAccess } = useTemplateAccess();
  const isAuthorized = canEditTemplate(textTemplate);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  const handleBuyCurrentTemplate = async () => {
    if (!access.authenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent(`/blockpages?template=${textTemplate}`)}`;
      return;
    }

    const price = TEMPLATE_PRICES[textTemplate] || 250;
    const templateLabel = getBlockpagesTemplateLabel(textTemplate);
    setIsPurchasing(true);
    setPurchaseError(null);

    try {
      const order = await createRazorpayOrder({
        amount: price,
        planName: templateLabel,
        itemType: "template",
        templateId: textTemplate,
        templateName: `${templateLabel} Template`,
      });

      openRazorpayCheckout({
        order,
        planLabel: `Purchase of ${templateLabel} Template`,
        customerName: "Stackly User",
        customerEmail: "user@example.com",
        customerPhone: "9876543210",
        onDismiss: () => setIsPurchasing(false),
        onSuccess: async (response) => {
          setIsPurchasing(true);
          try {
            const verified = await verifyRazorpayPayment({
              ...response,
              itemType: "template",
              templateId: textTemplate,
              templateName: `${templateLabel} Template`,
            });
            if (!verified) throw new Error("Payment verification failed");

            await refreshAccess();
            window.dispatchEvent(new Event(STORAGE_SYNC_EVENT));
            setPurchaseSuccess(`Template ${templateLabel} unlocked successfully!`);
          } catch (err) {
            setPurchaseError(err instanceof Error ? err.message : "Payment verification failed");
          } finally {
            setIsPurchasing(false);
          }
        },
      });
    } catch (err) {
      setPurchaseError(err instanceof Error ? err.message : "Could not initialize checkout");
      setIsPurchasing(false);
    }
  };

  // Monotonically-increasing version counter.  Every template switch and every
  // Save Draft bumps this.  Async save responses whose captured version doesn't
  // match the current value are discarded — this prevents a slow save from an
  // OLD template from overwriting the draftProjectId after the user has already
  // switched to a new template.
  const saveVersionRef = useRef(0);

  useEffect(() => {
    // If a projectId is present, the MongoDB draft loading effect manages state hydration.
    // Do NOT overwrite from localStorage.
    if (searchParams.get("projectId")) return;

    const parsed = parseBlockpagesTemplate(searchParams.get("template"));
    setTextTemplate(parsed);
    if (isTextEditorTemplate(parsed)) {
      setActiveBlockPage("text");
    }

    const persisted = loadPersistedTextBlockState(parsed);
    if (persisted) {
      setTextBlockState({
        ...persisted,
        isTextEditable: true,
        activeSectionId: persisted.activeSectionId ?? getBlockpagesDefaultSectionId(parsed),
      });
    } else {
      setTextBlockState((current) => ({
        ...current,
        isTextEditable: true,
        activeSectionId: getBlockpagesDefaultSectionId(parsed),
      }));
    }

    const loadedDividers = loadAppliedDividersForTemplate(parsed);
    setAppliedDividers(loadedDividers);
    persistAppliedDividersForTemplate(parsed, loadedDividers);
    setAppliedIcons(loadAppliedIconsForTemplate(parsed));
  }, [searchParams]);

  const [buttonBlocks, setButtonBlocks] = useState<BlockData[]>([initialButtonBlock]);
  const [selectedButtonBlockId, setSelectedButtonBlockId] = useState<string | null>(initialButtonBlock.id);
  const [pastButtonStates, setPastButtonStates] = useState<BlockData[][]>([]);
  const [futureButtonStates, setFutureButtonStates] = useState<BlockData[][]>([]);
  const [textBlockState, setTextBlockState] = useState<TextBlockState>(initialTextBlockState);
  const [pastEditorSnapshots, setPastEditorSnapshots] = useState<EditorSnapshot[]>([]);
  const [futureEditorSnapshots, setFutureEditorSnapshots] = useState<EditorSnapshot[]>([]);
  const pastEditorSnapshotsRef = useRef<EditorSnapshot[]>([]);
  const futureEditorSnapshotsRef = useRef<EditorSnapshot[]>([]);
  const isRestoringSnapshotRef = useRef(false);
  const lastCommittedSnapshotRef = useRef<EditorSnapshot | null>(null);
 
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

  const textBlockStateRef = useRef(textBlockState);
  textBlockStateRef.current = textBlockState;
  const customImagesRef = useRef(customImages);
  customImagesRef.current = customImages;
  const customButtonsRef = useRef(customButtons);
  customButtonsRef.current = customButtons;
  const customIconsRef = useRef(customIcons);
  customIconsRef.current = customIcons;
  const appliedDividersRef = useRef(appliedDividers);
  appliedDividersRef.current = appliedDividers;
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

    setDraftProjectId(projectId);

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        const { project, draft } = await loadBlockPagesDraft(projectId, controller.signal);
        if (cancelled) return;

        setDraftProjectId(projectId);

        if (!draft) {
          // Freshly created project from dashboard (no prior builderData.blockPagesData)
          const requestedTemplateParam = searchParams.get("template");
          const resolvedTemplate = parseBlockpagesTemplate(
            requestedTemplateParam || project?.category || null
          );
          setTextTemplate(resolvedTemplate);
          if (isTextEditorTemplate(resolvedTemplate)) {
            setActiveBlockPage("text");
          }

          const persisted = loadPersistedTextBlockState(resolvedTemplate);
          setTextBlockState(
            persisted
              ? {
                  ...persisted,
                  isTextEditable: true,
                  activeSectionId: persisted.activeSectionId ?? getBlockpagesDefaultSectionId(resolvedTemplate),
                }
              : {
                  ...initialTextBlockState,
                  isTextEditable: true,
                  activeSectionId: getBlockpagesDefaultSectionId(resolvedTemplate),
                }
          );
          setIsDraftLoading(false);
          return;
        }

        // Standard project draft hydration from MongoDB
        const activeTpl = draft.template || parseBlockpagesTemplate(project?.category || null);
        if (activeTpl) {
          setTextTemplate(activeTpl);
          if (isTextEditorTemplate(activeTpl)) {
            setActiveBlockPage("text");
          }
        }
        if (draft.textBlockState) {
          setTextBlockState({
            ...initialTextBlockState,
            ...draft.textBlockState,
            section: {
              ...initialTextBlockState.section,
              ...(draft.textBlockState.section ?? {}),
            },
            textStyles: {
              ...initialTextBlockState.textStyles,
              ...(draft.textBlockState.textStyles ?? {}),
            },
            customTexts: {
              ...(draft.textBlockState.customTexts ?? {}),
            },
            isTextEditable: true,
          });
        }
        if (draft.appliedDividers) setAppliedDividers(draft.appliedDividers);
        if (draft.appliedIcons) setAppliedIcons(draft.appliedIcons);

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
        console.log("[DRAFT HYDRATE] Loaded draft from MongoDB:", {
          hasDraft: Boolean(draft),
          draftTemplate: draft.template,
          customButtonsCount: Object.keys(draft.customButtons || {}).length,
          customButtons: draft.customButtons,
        });
        if (draft.customImages) setCustomImages(draft.customImages);
        if (draft.customButtons) {
          setCustomButtons(draft.customButtons as Record<string, ButtonProps>);
          persistCustomButtonsForTemplate(activeTpl || textTemplate, draft.customButtons as Record<string, ButtonProps>);
        }
        if (draft.customIcons) {
          setCustomIcons(draft.customIcons);
          persistCustomStaticIconsForTemplate(activeTpl || textTemplate, draft.customIcons);
        }

        // Clear undo/redo history when loading a saved draft
        setPastButtonStates([]);
        setFutureButtonStates([]);
        setPastEditorSnapshots([]);
        setFutureEditorSnapshots([]);
        pastEditorSnapshotsRef.current = [];
        futureEditorSnapshotsRef.current = [];
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
  //
  // KEY DESIGN: We capture an IMMUTABLE SNAPSHOT of the entire editor context
  // at call time.  The snapshot is what gets sent to the API.  This means that
  // even if the user switches templates while a save is in-flight, the save
  // still writes the correct template + data pair.
  //
  // We also bump `saveVersionRef` and capture its value.  When the async save
  // completes, we compare the captured version with the current version; if
  // they differ the user has switched templates and we must NOT update
  // `draftProjectId` from the stale response.
  const handleSaveDraft = useCallback(async () => {
    if (!isAuthorized) {
      console.warn("Save draft blocked: user is not authorized to edit template", textTemplate);
      return;
    }
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setSaveStatus("saving");

    // Clear any lingering status timer
    if (saveStatusTimerRef.current) {
      clearTimeout(saveStatusTimerRef.current);
      saveStatusTimerRef.current = null;
    }

    // ── 1. Capture immutable snapshot ────────────────────────────────
    const snapshotVersion = ++saveVersionRef.current;
    const snapshotTemplate = textTemplate;
    const snapshotProjectId = draftProjectId;
    const payload: BlockPagesDraftPayload = {
      template: snapshotTemplate,
      textBlockState: {
        ...textBlockState,
        isTextEditable: true,
      },
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
      let currentProjectId = snapshotProjectId;

      // First save: create a new project for this template
      if (!currentProjectId) {
        const created = await createBlockPagesDraft(snapshotTemplate);
        currentProjectId = created._id;

        // Only update draftProjectId if the user hasn't switched templates
        // since this save was initiated.
        if (saveVersionRef.current === snapshotVersion) {
          setDraftProjectId(currentProjectId);

          // Update URL with projectId and template without full page reload
          const url = new URL(window.location.href);
          url.searchParams.set("projectId", currentProjectId);
          url.searchParams.set("template", snapshotTemplate);
          window.history.replaceState({}, "", url.toString());
        }
      }

      // Save structured draft data, plus rendered HTML if the website canvas is mounted.
      writeBlockpagesStorageItem("stackly-last-active-template", snapshotTemplate);
      const htmlContent = buildPreviewHtml(false) || readBlockpagesStorageItem(getBlockpagesPreviewSnapshotKey(snapshotTemplate)) || undefined;
      await saveBlockPagesDraft(currentProjectId, payload, undefined, htmlContent || undefined);

      // Only update UI status if still on the same save generation
      if (saveVersionRef.current === snapshotVersion) {
        setSaveStatus("saved");
        saveStatusTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2500);
      }
    } catch (err) {
      console.error("Save draft failed:", err);
      if (saveVersionRef.current === snapshotVersion) {
        setSaveStatus("error");
        saveStatusTimerRef.current = setTimeout(() => setSaveStatus("idle"), 4000);
      }
    } finally {
      isSavingRef.current = false;
    }
  }, [
    draftProjectId, textTemplate, textBlockState, buttonBlocks, videoBlocks,
    dividerBlocks, iconBlocks, customImages, customButtons, customIcons,
    appliedDividers, appliedIcons, buildPreviewHtml, isAuthorized,
  ]);

  const handleSwitchTemplate = useCallback(async (newTemplate: TextTemplateType) => {
    // ── 1. Persist current template's custom data to localStorage ────
    persistCustomImagesForTemplate(textTemplate, customImages);
    persistCustomButtonsForTemplate(textTemplate, customButtons);
    persistCustomStaticIconsForTemplate(textTemplate, customIcons);

    // ── 2. If the current template has a saved project, save it first ─
    //    Await completion so the old project's data is safely persisted
    //    before we switch away.
    if (draftProjectId && !isSavingRef.current) {
      try {
        isSavingRef.current = true;
        const currentPayload: BlockPagesDraftPayload = {
          template: textTemplate,
          textBlockState: { ...textBlockState, isTextEditable: true },
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
        const htmlContent = buildPreviewHtml(false) || readBlockpagesStorageItem(getBlockpagesPreviewSnapshotKey(textTemplate)) || undefined;
        await saveBlockPagesDraft(draftProjectId, currentPayload, undefined, htmlContent || undefined);
      } catch (err) {
        console.warn("Saving current template before switch failed:", err);
      } finally {
        isSavingRef.current = false;
      }
    }

    // ── 3. Bump save version — any in-flight saves from the OLD template
    //    will see a version mismatch and skip draftProjectId updates ──
    ++saveVersionRef.current;

    // ── 4. Clear project context — the new template is a NEW project ─
    setDraftProjectId(null);

    // ── 5. Switch template and reset editor state ────────────────────
    setTextTemplate(newTemplate);
    setActiveBlockPage("text");

    const persisted = loadPersistedTextBlockState(newTemplate);
    const nextTextBlockState: TextBlockState = persisted
      ? {
          ...persisted,
          isTextEditable: true,
          activeSectionId: persisted.activeSectionId ?? getBlockpagesDefaultSectionId(newTemplate),
        }
      : {
          selectedTarget: "main",
          isTextEditable: true,
          textStyles: { color: "", fontSize: "", fontFamily: "" },
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
          activeSectionId: getBlockpagesDefaultSectionId(newTemplate),
        };

    setTextBlockState(nextTextBlockState);
    const loadedDividers = loadAppliedDividersForTemplate(newTemplate);
    setAppliedDividers(loadedDividers);
    const loadedIcons = loadAppliedIconsForTemplate(newTemplate);
    setAppliedIcons(loadedIcons);

    // ── 6. Load the NEW template's custom data (isolated) ────────────
    const newCustomImages = loadCustomImagesForTemplate(newTemplate);
    const newCustomButtons = loadCustomButtonsForTemplate(newTemplate) as Record<string, ButtonProps>;
    const newCustomIcons = loadCustomStaticIconsForTemplate(newTemplate) as Record<string, IconBlockProps>;
    setCustomImages(newCustomImages);
    setCustomButtons(newCustomButtons);
    setCustomIcons(newCustomIcons);

    // ── 7. Reset undo/redo history for the new template ──────────────
    setPastButtonStates([]);
    setFutureButtonStates([]);
    setPastEditorSnapshots([]);
    setFutureEditorSnapshots([]);
    pastEditorSnapshotsRef.current = [];
    futureEditorSnapshotsRef.current = [];
    lastCommittedSnapshotRef.current = null;
    setPastVideoStates([]);
    setFutureVideoStates([]);
    setPastDividerStates([]);
    setFutureDividerStates([]);
    setPastIconStates([]);
    setFutureIconStates([]);

    // ── 8. Update URL — no projectId (new template = new project) ────
    const url = new URL(window.location.href);
    url.searchParams.set("template", newTemplate);
    url.searchParams.delete("projectId");
    window.history.replaceState({}, "", url.toString());

    // ── 9. Reset save status ─────────────────────────────────────────
    setSaveStatus("idle");
    if (saveStatusTimerRef.current) {
      clearTimeout(saveStatusTimerRef.current);
      saveStatusTimerRef.current = null;
    }
  }, [
    draftProjectId, textTemplate, textBlockState, buttonBlocks, videoBlocks,
    dividerBlocks, iconBlocks, customImages, customButtons, customIcons,
    appliedDividers, appliedIcons, buildPreviewHtml,
  ]);

  const handlePreview = useCallback(() => {
    const openPreview = (previewHtml: string) => {
      if (!previewHtml.trim()) return false;
      writeBlockpagesStorageItem("stackly-last-active-template", textTemplate);
      writeBlockpagesStorageItem(TEXTBLOCK_PREVIEW_STORAGE_KEY, previewHtml);
      writeBlockpagesStorageItem(getBlockpagesPreviewSnapshotKey(textTemplate), previewHtml);
      const previewPath = `/blockpages/preview?template=${encodeURIComponent(textTemplate)}${draftProjectId ? `&projectId=${draftProjectId}` : ""}`;
      window.open(routePath(previewPath), "_blank", "noopener,noreferrer");
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
  }, [textTemplate, draftProjectId]);

  const handleCloseButtonEditor = useCallback(() => {
    const lastId = editingButtonId;
    setActiveBlockPage("text");
    setEditingButtonId(null);
    setIsButtonEditingMode(false);
    setShowMobileSidebar(false);
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent(BLOCKPAGES_CANVAS_RESTORED_EVENT));
        if (lastId) {
          window.setTimeout(() => scrollCanvasToModifiedElement(lastId), 120);
        }
      }, 80);
    }
  }, [editingButtonId]);

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
    setEditingIconId(null);
    setEditingImageId(null);
    setEditingButtonId(null);
    setEditingVideoId(null);
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
    if (searchParams.get("projectId")) return;

    // ── Load custom images from TEMPLATE-SCOPED localStorage key ────
    try {
      const loadedImages = loadCustomImagesForTemplate(textTemplate);
      if (Object.keys(loadedImages).length > 0) {
        window.setTimeout(() => setCustomImages(loadedImages), 0);
      } else {
        window.setTimeout(() => setCustomImages({}), 0);
      }
    } catch (e) {
      console.error("Failed to load custom images", e);
    }
 
    // ── Load custom buttons from TEMPLATE-SCOPED localStorage key ───
    try {
      const loadedButtons = loadCustomButtonsForTemplate(textTemplate) as Record<string, ButtonProps>;
      window.setTimeout(() => setCustomButtons(loadedButtons), 0);
    } catch (e) {
      console.error("Failed to load custom buttons", e);
    }
 
    try {
      const loadedAppliedIcons = loadAppliedIconsForTemplate(textTemplate);
      window.setTimeout(() => setAppliedIcons(loadedAppliedIcons), 0);
    } catch (e) {
      console.error("Failed to load custom icons", e);
    }
 
    // ── Load custom static icons from TEMPLATE-SCOPED localStorage key ──
    try {
      const loadedStaticIcons = loadCustomStaticIconsForTemplate(textTemplate) as Record<string, IconBlockProps>;
      window.setTimeout(() => setCustomIcons(loadedStaticIcons), 0);
    } catch (e) {
      console.error("Failed to load custom static icons", e);
    }
  }, [searchParams, textTemplate]);

  useEffect(() => {
    if (isBlockpagesVideoApplied(textTemplate)) {
      const storedProps = loadBlockpagesVideoProps(textTemplate);
      if (storedProps) {
        setVideoBlocks([{ id: "video_block", type: "video", props: storedProps }]);
        setSelectedVideoBlockId("video_block");
        return;
      }
    }
    setVideoBlocks([initialVideoBlock]);
    setSelectedVideoBlockId(initialVideoBlock.id);
  }, [textTemplate]);

  useEffect(() => {
    if (textTemplate !== "portfolio") return;
    const primary = videoBlocks[0];
    if (!primary) return;
    saveBlockpagesVideoProps("portfolio", primary.props);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("stackly-portfolio-video-updated"));
    }
  }, [textTemplate, videoBlocks]);
 
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
 
  // ── Unified editor snapshot for undo/redo ──────────────────────────
  // Captures ALL editable state so undo/redo works across text, images,
  // buttons, and icons in a single chronological timeline.

  const captureEditorSnapshot = (): EditorSnapshot => {
    try {
      return {
        textBlockState: JSON.parse(JSON.stringify(textBlockStateRef.current)),
        customImages: { ...customImagesRef.current },
        customButtons: JSON.parse(JSON.stringify(customButtonsRef.current)),
        customIcons: JSON.parse(JSON.stringify(customIconsRef.current)),
        appliedDividers: JSON.parse(JSON.stringify(appliedDividersRef.current)),
      };
    } catch {
      return {
        textBlockState: { ...textBlockStateRef.current },
        customImages: { ...customImagesRef.current },
        customButtons: { ...customButtonsRef.current },
        customIcons: { ...customIconsRef.current },
        appliedDividers: [...appliedDividersRef.current],
      };
    }
  };

  const restoreEditorSnapshot = (snapshot: EditorSnapshot) => {
    lastCommittedSnapshotRef.current = null;
    isRestoringSnapshotRef.current = true;
    let nextTextState = snapshot.textBlockState;
    let nextButtons = snapshot.customButtons;
    let nextIcons = snapshot.customIcons;
    let nextDividers = snapshot.appliedDividers ?? [];
    try {
      nextTextState = JSON.parse(JSON.stringify(snapshot.textBlockState));
      nextButtons = JSON.parse(JSON.stringify(snapshot.customButtons));
      nextIcons = JSON.parse(JSON.stringify(snapshot.customIcons));
      nextDividers = JSON.parse(JSON.stringify(snapshot.appliedDividers ?? []));
    } catch {}

    setTextBlockState(nextTextState);
    persistTextBlockState(textTemplate, nextTextState);
    setCustomImages({ ...snapshot.customImages });
    persistCustomImagesForTemplate(textTemplate, snapshot.customImages);
    setCustomButtons(nextButtons);
    persistCustomButtonsForTemplate(textTemplate, nextButtons);
    setCustomIcons(nextIcons);
    persistCustomStaticIconsForTemplate(textTemplate, nextIcons);
    setAppliedDividers(nextDividers);
    syncAppliedDividerPersistence(nextDividers);

    window.setTimeout(() => {
      isRestoringSnapshotRef.current = false;
    }, 200);
  };

  const pushEditorSnapshot = (
    nextTextState: TextBlockState,
    overrides?: {
      customImages?: Record<string, string>;
      customButtons?: Record<string, ButtonProps>;
      customIcons?: Record<string, IconBlockProps>;
      appliedDividers?: AppliedDividerItem[];
    }
  ) => {
    if (isRestoringSnapshotRef.current) {
      lastCommittedSnapshotRef.current = null;
      setTextBlockState(nextTextState);
      persistTextBlockState(textTemplate, nextTextState);
      if (overrides?.customImages !== undefined) {
        setCustomImages(overrides.customImages);
        persistCustomImagesForTemplate(textTemplate, overrides.customImages);
      }
      if (overrides?.customButtons !== undefined) {
        setCustomButtons(overrides.customButtons);
        persistCustomButtonsForTemplate(textTemplate, overrides.customButtons);
      }
      if (overrides?.customIcons !== undefined) {
        setCustomIcons(overrides.customIcons);
        persistCustomStaticIconsForTemplate(textTemplate, overrides.customIcons);
      }
      if (overrides?.appliedDividers !== undefined) {
        setAppliedDividers(overrides.appliedDividers);
        syncAppliedDividerPersistence(overrides.appliedDividers);
      }
      return;
    }

    // If there was a live preview in progress, the base snapshot to restore upon Undo
    // is the snapshot before live preview began. Otherwise capture current state.
    const snapshot = lastCommittedSnapshotRef.current ?? captureEditorSnapshot();
    lastCommittedSnapshotRef.current = null;

    pastEditorSnapshotsRef.current = [...pastEditorSnapshotsRef.current, snapshot];
    futureEditorSnapshotsRef.current = [];
    setPastEditorSnapshots(pastEditorSnapshotsRef.current);
    setFutureEditorSnapshots([]);

    setTextBlockState(nextTextState);
    persistTextBlockState(textTemplate, nextTextState);
    if (overrides?.customImages !== undefined) {
      setCustomImages(overrides.customImages);
      persistCustomImagesForTemplate(textTemplate, overrides.customImages);
    }
    if (overrides?.customButtons !== undefined) {
      setCustomButtons(overrides.customButtons);
      persistCustomButtonsForTemplate(textTemplate, overrides.customButtons);
    }
    if (overrides?.customIcons !== undefined) {
      setCustomIcons(overrides.customIcons);
      persistCustomStaticIconsForTemplate(textTemplate, overrides.customIcons);
    }
    if (overrides?.appliedDividers !== undefined) {
      setAppliedDividers(overrides.appliedDividers);
      syncAppliedDividerPersistence(overrides.appliedDividers);
    }
  };

  /** Backward-compatible alias: pushes text-only change into unified history. */
  const pushTextState = (nextState: TextBlockState) => {
    const prev = lastCommittedSnapshotRef.current?.textBlockState ?? textBlockState;
    const isOnlyNavChange =
      JSON.stringify(nextState.customTexts || {}) === JSON.stringify(prev.customTexts || {}) &&
      JSON.stringify(nextState.section || {}) === JSON.stringify(prev.section || {}) &&
      JSON.stringify(nextState.sectionStyles || {}) === JSON.stringify(prev.sectionStyles || {}) &&
      JSON.stringify(nextState.textStyles || {}) === JSON.stringify(prev.textStyles || {});

    if (isOnlyNavChange) {
      lastCommittedSnapshotRef.current = null;
      setTextBlockState(nextState);
      persistTextBlockState(textTemplate, nextState);
      return;
    }

    pushEditorSnapshot(nextState);
  };

  /**
   * Live-preview state update: applies the change to state + persistence
   * but does NOT push an undo/redo history snapshot.
   * Remembers the pre-live snapshot so the subsequent commit captures
   * the true pre-live state as the Undo target.
   */
  const setTextBlockStateLive = (nextState: TextBlockState) => {
    if (!lastCommittedSnapshotRef.current) {
      lastCommittedSnapshotRef.current = captureEditorSnapshot();
    }
    setTextBlockState(nextState);
    persistTextBlockState(textTemplate, nextState);
  };
 
  const undoEditor = () => {
    if (pastEditorSnapshotsRef.current.length === 0) {
      return;
    }

    lastCommittedSnapshotRef.current = null;
    const previous = pastEditorSnapshotsRef.current[pastEditorSnapshotsRef.current.length - 1];
    const currentSnapshot = captureEditorSnapshot();

    pastEditorSnapshotsRef.current = pastEditorSnapshotsRef.current.slice(0, -1);
    futureEditorSnapshotsRef.current = [currentSnapshot, ...futureEditorSnapshotsRef.current];

    setPastEditorSnapshots(pastEditorSnapshotsRef.current);
    setFutureEditorSnapshots(futureEditorSnapshotsRef.current);

    restoreEditorSnapshot(previous);
  };
 
  const redoEditor = () => {
    if (futureEditorSnapshotsRef.current.length === 0) {
      return;
    }

    lastCommittedSnapshotRef.current = null;
    const next = futureEditorSnapshotsRef.current[0];
    const currentSnapshot = captureEditorSnapshot();

    futureEditorSnapshotsRef.current = futureEditorSnapshotsRef.current.slice(1);
    pastEditorSnapshotsRef.current = [...pastEditorSnapshotsRef.current, currentSnapshot];

    setPastEditorSnapshots(pastEditorSnapshotsRef.current);
    setFutureEditorSnapshots(futureEditorSnapshotsRef.current);

    restoreEditorSnapshot(next);
  };

  // ── Keyboard shortcuts for Undo/Redo ────────────────────────────────
  const undoEditorRef = useRef(undoEditor);
  undoEditorRef.current = undoEditor;
  const redoEditorRef = useRef(redoEditor);
  redoEditorRef.current = redoEditor;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.ctrlKey || e.metaKey;
      if (!isMeta) return;

      // Don't intercept if user is typing in an input/textarea/contenteditable
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditable = (e.target as HTMLElement)?.isContentEditable;
      if (tag === "INPUT" || tag === "TEXTAREA" || isEditable) return;

      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (activeBlockPage === "text") {
          undoEditorRef.current();
        }
      } else if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault();
        if (activeBlockPage === "text") {
          redoEditorRef.current();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeBlockPage]);
 
  if (isAccessLoading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center bg-[#f0f2f5] text-[#0B1D40]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#0B1D40]" />
          <h2 className="text-xl font-bold tracking-tight">Verifying Template Access...</h2>
          <p className="text-sm text-slate-500">Checking your subscription permissions</p>
        </div>
      </div>
    );
  }

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

  if (!isAuthorized) {
    const templateLabel = getBlockpagesTemplateLabel(textTemplate);
    const templatePrice = TEMPLATE_PRICES[textTemplate] || 250;
    const previewUrl = TEMPLATE_PREVIEW_URLS[textTemplate] || "/portfolio";

    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center bg-[#f0f2f5] px-4 py-12 text-[#0B1D40]">
        <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-xl shadow-slate-200/50 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/80 shadow-inner">
            <Lock className="h-10 w-10" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider mb-3">
            <span>Template Access Required</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#06224C] mb-3">
            {templateLabel} Template
          </h1>

          <p className="text-base text-slate-600 max-w-lg mx-auto leading-relaxed mb-6">
            This premium template is locked on your current plan
            {access.authenticated && access.plan ? (
              <span className="font-bold text-[#06224C]"> ({access.plan.toUpperCase()})</span>
            ) : (
              <span className="font-bold text-[#06224C]"> (Guest / Not Signed In)</span>
            )}.
            Purchase this template individually or upgrade your plan to unlock editing for all templates.
          </p>

          {purchaseError && (
            <div className="mb-6 flex items-center justify-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm font-semibold text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{purchaseError}</span>
            </div>
          )}

          {purchaseSuccess && (
            <div className="mb-6 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{purchaseSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left my-8">
            <div className="rounded-2xl border-2 border-[#06224C] bg-slate-50/50 p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#06224C] text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                Instant Access
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Option 1</span>
                <h3 className="text-lg font-black text-[#06224C] mt-1">Buy This Template</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Get lifetime editing and publishing rights for the {templateLabel} template.
                </p>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-[#06224C]">₹{templatePrice}</span>
                  <span className="text-xs text-slate-400 font-semibold">one-time</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleBuyCurrentTemplate}
                disabled={isPurchasing}
                className="mt-6 w-full cursor-pointer flex items-center justify-center gap-2 rounded-xl bg-[#06224C] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-900 active:scale-95 disabled:opacity-60"
              >
                {isPurchasing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    <span>Buy Template — ₹{templatePrice}</span>
                  </>
                )}
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-blue-50/40 to-indigo-50/40 p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Option 2</span>
                <h3 className="text-lg font-black text-[#06224C] mt-1">Upgrade Plan</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Unlock full access to ALL 7 templates (Portfolio, E-Commerce, Blog, Construction, Restaurant, Digital Marketing, Business).
                </p>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-blue-600">Business Plan</span>
                </div>
              </div>

              <Link
                href="/planning"
                className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-110 active:scale-95"
              >
                <Sparkles className="h-4 w-4" />
                <span>Upgrade to Business</span>
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-500">
            <Link
              href="/landing#templates"
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#06224C] transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to All Templates</span>
            </Link>

            <Link
              href={previewUrl}
              className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 transition"
            >
              <span>Preview live demo of {templateLabel}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
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
              if (activeBlockPage === "icons") {
                return;
              }
              if (activeBlockPage !== "text") {
                setActiveBlockPage("text");
                setIsImageEditingMode(false);
                setIsButtonEditingMode(false);
                setIsVideoEditingMode(false);
                setIsIconEditingMode(false);
                setEditingIconId(null);
                setEditingImageId(null);
                setEditingButtonId(null);
                setEditingVideoId(null);
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
            onLiveTextBlockState={setTextBlockStateLive}
            onUpdateButtonStyle={(newProps) => {
              if (selectedButtonBlock) {
                updateButtonBlock(selectedButtonBlock.id, newProps);
              }
            }}
            onImageSelected={(url) => {
              const lastId = editingImageId;
              if (editingImageId) {
                const nextImages = { ...customImages, [editingImageId]: url };
                pushEditorSnapshot(textBlockState, { customImages: nextImages });
              }
              setEditingImageId(null);
              setIsImageEditingMode(false);
              setActiveBlockPage("text");
              if (lastId) {
                window.setTimeout(() => scrollCanvasToModifiedElement(lastId), 120);
              }
            }}
            onCloseMobileImageSelect={() => setEditingImageId(null)}
            onSelectBlockPage={(page) => {
              if (activeBlockPage === "icons") {
                return;
              }

              const keepsTextCanvasMounted =
                activeBlockPage === "text" &&
                (page === "text" || page === "image" || page === "button" || page === "video");

              if (activeBlockPage === "text" && !keepsTextCanvasMounted) {
                flushBlockpagesPreviewSnapshot(textTemplate, appliedDividers);
              }

              if (page === "image" && activeBlockPage === "text") {
                setIsImageEditingMode((prev) => !prev);
                setIsButtonEditingMode(false);
                setIsVideoEditingMode(false);
                setIsIconEditingMode(false);
                setEditingImageId(null);
                setEditingButtonId(null);
                setEditingIconId(null);
                setEditingVideoId(null);
                pushTextState({ ...textBlockState, isTextEditable: false });
                return;
              }
              if (page === "button" && activeBlockPage === "text") {
                setIsButtonEditingMode((prev) => !prev);
                setIsImageEditingMode(false);
                setIsVideoEditingMode(false);
                setIsIconEditingMode(false);
                setEditingButtonId(null);
                setEditingImageId(null);
                setEditingIconId(null);
                setEditingVideoId(null);
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
                setEditingVideoId(null);
                setEditingImageId(null);
                setEditingButtonId(null);
                setEditingIconId(null);
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
                setIsIconEditingMode(false);
                setEditingImageId(null);
                setEditingButtonId(null);
                setEditingVideoId(null);
                setEditingIconId(null);
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
                  setEditingIconId(null);
                  setEditingImageId(null);
                  setEditingButtonId(null);
                  setEditingVideoId(null);
                  pushTextState({ ...textBlockState, isTextEditable: false });
                  return;
                }

                activateInlineIconEditing();
                return;
              }
 
              const wasOnText = activeBlockPage === "text";
              setActiveBlockPage(page);
 
              // Always clear stale editing state when switching pages.
              // Without this, navigating from e.g. icons → image would
              // leave editingIconId set, causing only 1 icon overlay on
              // the next icon-editing activation.
              setIsImageEditingMode(false);
              setIsButtonEditingMode(false);
              setIsVideoEditingMode(false);
              setIsIconEditingMode(false);
              setEditingImageId(null);
              setEditingButtonId(null);
              setEditingVideoId(null);
              setEditingIconId(null);
 
              if (page === "text") {
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
                  const lastId = editingButtonId;
                  console.log("[ON_BUTTON_SELECTED_DEBUG]", { props, editingButtonId });
                  if (editingButtonId) {
                    const existingProps = customButtons[editingButtonId] || {};
                    const resolvedLabel =
                      typeof props.label === "string" && props.label.trim()
                        ? props.label.trim()
                        : typeof existingProps.label === "string" && existingProps.label.trim()
                          ? existingProps.label.trim()
                          : undefined;
                    const nextButtons = {
                      ...customButtons,
                      [editingButtonId]: {
                        ...existingProps,
                        ...props,
                        label: resolvedLabel,
                      },
                    };
                    pushEditorSnapshot(textBlockState, { customButtons: nextButtons });
                  }
                  setActiveBlockPage("text");
                  setEditingButtonId(null);
                  setIsButtonEditingMode(false);
                  if (lastId) {
                    window.setTimeout(() => scrollCanvasToModifiedElement(lastId), 120);
                  }
                }}
                onOpenMobileSidebar={() => setShowMobileSidebar(true)}
                onClose={handleCloseButtonEditor}
                onSaveDraft={handleSaveDraft}
                onPreview={handlePreview}
                saveStatus={saveStatus}
              />
            </div>
 
            {/* Mobile/Tablet Backdrop */}
            {showMobileSidebar && (
              <div
                className="fixed inset-0 bg-black/50 z-90 xl:hidden"
                onClick={() => setShowMobileSidebar(false)}
              />
            )}
 
            {/* Sidebar Container: Bottom sheet on mobile, relative flow on desktop */}
            <div className={`
              fixed bottom-0 left-0 w-full h-[60vh] z-100 transition-transform duration-300
              ${showMobileSidebar ? "translate-y-0" : "translate-y-full"}
              xl:translate-y-0 xl:static xl:h-auto xl:w-52.5 xl:shrink-0 xl:block
              bg-white xl:bg-transparent rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] xl:shadow-none xl:rounded-none overflow-hidden
            `}>
              <ButtonRightSidebar
                selectedBlock={selectedButtonBlock}
                onUpdateBlock={updateButtonBlock}
                onClose={handleCloseButtonEditor}
              />
            </div>
          </div>
        ) : activeBlockPage === "text" ? (
          <div className="flex min-h-0 min-w-0 flex-1 gap-4 overflow-hidden">
            <TextCanvas
              state={textBlockState}
              onStateChange={pushTextState}
              onSyncTextStyles={(styles) => setTextBlockState((prev) => ({ ...prev, textStyles: styles }))}
              onSaveDraft={handleSaveDraft}
              saveStatus={saveStatus}
              canUndo={pastEditorSnapshots.length > 0}
              canRedo={futureEditorSnapshots.length > 0}
              onUndo={undoEditor}
              onRedo={redoEditor}
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
                const currentProps = customButtons[buttonId];
                if (currentProps) {
                  const targetId = selectedButtonBlockId ?? buttonBlocks[0]?.id;
                  if (targetId) {
                    updateButtonBlock(targetId, currentProps);
                  }
                }
                setActiveBlockPage("button");
              }}
              videoBlocks={videoBlocks}
              isVideoEditingMode={isVideoEditingMode}
              editingVideoId={editingVideoId}
              onEditVideo={(videoId) => {
                if (!templateHasBuiltInVideoSlots(textTemplate)) {
                  showNoVideoAlert();
                  return;
                }
                flushBlockpagesPreviewSnapshot(textTemplate, appliedDividers);
                if (videoBlocks[0]) {
                  setSelectedVideoBlockId(videoBlocks[0].id);
                }
                setEditingVideoId(videoId);
                setActiveBlockPage("video");
              }}
              isIconEditingMode={isIconEditingMode}
              editingIconId={editingIconId}
              customIcons={customIcons}
              onEditIcon={(iconId) => {
                flushBlockpagesPreviewSnapshot(textTemplate, appliedDividers);
                setEditingIconId(iconId);
                setIsIconEditingMode(true);
                setIsImageEditingMode(false);
                setIsButtonEditingMode(false);
                setIsVideoEditingMode(false);
                if (customIcons[iconId]) {
                  const targetBlockId = selectedIconBlockId ?? iconBlocks[0]?.id;
                  if (targetBlockId) {
                    updateIconBlock(targetBlockId, customIcons[iconId]);
                  }
                }
                if (typeof window !== "undefined" && window.innerWidth >= 1024) {
                  setActiveBlockPage("icons");
                }
              }}
              appliedDividers={appliedDividers}
              onRemoveDivider={(id) => {
                const next = appliedDividers.filter((d) => d.id !== id);
                pushEditorSnapshot(textBlockState, { appliedDividers: next });
              }}
              appliedIcons={appliedIcons}
              onRemoveIcon={(id) => {
                setAppliedIcons((prev) => {
                  const next = prev.filter((i) => i.id !== id);
                  persistAppliedIconsForTemplate(textTemplate, next);
                  return next;
                });
              }}
              onUpdateDividerPosition={(id, position, options) => {
                const next = appliedDividers.map((d) => (d.id === id ? { ...d, position } : d));
                if (options?.pushHistory) {
                  pushEditorSnapshot(textBlockState, { appliedDividers: next });
                } else {
                  setAppliedDividers(next);
                  syncAppliedDividerPersistence(next);
                }
              }}
              onUpdateDividerScale={(id, scale) => {
                const next = appliedDividers.map((d) => (d.id === id ? { ...d, scale } : d));
                pushEditorSnapshot(textBlockState, { appliedDividers: next });
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
              onSelectTemplate={handleSwitchTemplate}
            />
            <div className="hidden w-52.5 shrink-0 xl:block">
              <TextRightSidebar state={textBlockState} onStateChange={pushTextState} onLiveStateChange={setTextBlockStateLive} template={textTemplate} />
            </div>
          </div>
        ) : activeBlockPage === "image" ? (
          <div className="flex min-w-0 flex-1 gap-4">
            <ImageMainCanvas
              editingImageId={editingImageId}
              currentImageUrl={editingImageId ? (customImages[editingImageId] || "") : ""}
              onImageSelected={(url) => {
                const lastId = editingImageId;
                if (editingImageId) {
                  const nextImages = { ...customImages, [editingImageId]: url };
                  pushEditorSnapshot(textBlockState, { customImages: nextImages });
                }
                setActiveBlockPage("text");
                setEditingImageId(null);
                setIsImageEditingMode(false);
                if (typeof window !== "undefined") {
                  window.setTimeout(() => {
                    window.dispatchEvent(new CustomEvent(BLOCKPAGES_CANVAS_RESTORED_EVENT));
                    if (lastId) {
                      window.setTimeout(() => scrollCanvasToModifiedElement(lastId), 120);
                    }
                  }, 80);
                }
              }}
              onBackToCanvas={() => {
                setActiveBlockPage("text");
                setEditingImageId(null);
                setIsImageEditingMode(false);
                if (typeof window !== "undefined") {
                  window.setTimeout(() => {
                    window.dispatchEvent(new CustomEvent(BLOCKPAGES_CANVAS_RESTORED_EVENT));
                  }, 80);
                }
              }}
              onSaveDraft={handleSaveDraft}
              onPreview={handlePreview}
              saveStatus={saveStatus}
            />
            <div className="hidden w-52.5 shrink-0 xl:block">
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
                  // Close the editor and go back to text/preview page
                  setActiveBlockPage("text");
                  setIsVideoEditingMode(false);
                  setEditingVideoId(null);
                  if (typeof window !== "undefined") {
                    window.setTimeout(() => {
                      window.dispatchEvent(new CustomEvent(BLOCKPAGES_CANVAS_RESTORED_EVENT));
                    }, 80);
                  }
                }}
                onSaveDraft={handleSaveDraft}
                onPreview={handlePreview}
                saveStatus={saveStatus}
              />
            </div>
            {showMobileSidebar && (
              <div
                className="fixed inset-0 bg-black/50 z-90 xl:hidden"
                onClick={() => setShowMobileSidebar(false)}
              />
            )}
            <div className={`
              fixed bottom-0 left-0 w-full h-[60vh] z-100 transition-transform duration-300
              ${showMobileSidebar ? "translate-y-0" : "translate-y-full"}
              xl:translate-y-0 xl:static xl:h-auto xl:w-52.5 xl:shrink-0 xl:block
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
                onClose={() => {
                  setActiveBlockPage("text");
                  if (typeof window !== "undefined") {
                    window.setTimeout(() => {
                      window.dispatchEvent(new CustomEvent(BLOCKPAGES_CANVAS_RESTORED_EVENT));
                    }, 80);
                  }
                }}
                onApplyDivider={(appliedProps) => {
                  const block = selectedDividerBlock ?? dividerBlocks[0];
                  const propsToUse = appliedProps ?? block?.props ?? defaultDividerProps;
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

                  const newDivider: AppliedDividerItem = {
                    id: newDividerId,
                    props: { ...propsToUse },
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
                  const next = [...appliedDividers, newDivider];
                  pushEditorSnapshot(textBlockState, { appliedDividers: next });
                  setPendingDividerScrollId(newDividerId);
                  setActiveBlockPage("text");
                }}
                onSaveDraft={handleSaveDraft}
                onPreview={handlePreview}
                saveStatus={saveStatus}
              />
            </div>
            {showMobileSidebar && (
              <div
                className="fixed inset-0 bg-black/50 z-90 xl:hidden"
                onClick={() => setShowMobileSidebar(false)}
              />
            )}
            <div className={`
              fixed bottom-0 left-0 w-full h-[60vh] z-100 transition-transform duration-300
              ${showMobileSidebar ? "translate-y-0" : "translate-y-full"}
              xl:translate-y-0 xl:static xl:h-auto xl:w-52.5 xl:shrink-0 xl:block
              bg-white xl:bg-transparent rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] xl:shadow-none xl:rounded-none overflow-hidden
            `}>
              <DividerRightSidebar
                selectedBlock={selectedDividerBlock}
                onUpdateBlock={updateDividerBlock}
                onClose={() => {
                  setShowMobileSidebar(false);
                  setActiveBlockPage("text");
                  if (typeof window !== "undefined") {
                    window.setTimeout(() => {
                      window.dispatchEvent(new CustomEvent(BLOCKPAGES_CANVAS_RESTORED_EVENT));
                    }, 80);
                  }
                }}
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
                onBackToCanvas={() => {
                  setActiveBlockPage("text");
                  setEditingIconId(null);
                  setIsIconEditingMode(true);
                  setIsImageEditingMode(false);
                  setIsButtonEditingMode(false);
                  setIsVideoEditingMode(false);
                  if (typeof window !== "undefined") {
                    window.setTimeout(() => {
                      window.dispatchEvent(new CustomEvent(BLOCKPAGES_CANVAS_RESTORED_EVENT));
                    }, 80);
                  }
                }}
                onApplyIcon={() => {
                  const block = selectedIconBlock ?? iconBlocks[0];
                  const lastId = editingIconId;
                  if (block) {
                    if (editingIconId) {
                      const isIconDeletion =
                        (!block.props.iconType || (block.props.iconType as string) === "none") &&
                        !block.props.customIconUrl;
                      const nextIcons = { ...customIcons };
                      if (isIconDeletion) {
                        delete nextIcons[editingIconId];
                      } else {
                        nextIcons[editingIconId] = block.props;
                      }
                      pushEditorSnapshot(textBlockState, { customIcons: nextIcons });
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
                  setIsIconEditingMode(true);
                  // Delay the canvas-restored event so React can flush batched
                  // state updates and re-render the template DOM before the
                  // handler stamps icon IDs and recalculates overlay targets.
                  if (typeof window !== "undefined") {
                    window.setTimeout(() => {
                      window.dispatchEvent(new CustomEvent(BLOCKPAGES_CANVAS_RESTORED_EVENT));
                      if (lastId) {
                        window.setTimeout(() => scrollCanvasToModifiedElement(lastId), 120);
                      }
                    }, 80);
                  }
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
                className="fixed inset-0 bg-black/50 z-90 xl:hidden"
                onClick={() => setShowMobileSidebar(false)}
              />
            )}
            <div className={`
              fixed bottom-0 left-0 w-full h-[60vh] z-100 transition-transform duration-300
              ${showMobileSidebar ? "translate-y-0" : "translate-y-full"}
              xl:translate-y-0 xl:static xl:h-auto xl:w-52.5 xl:shrink-0 xl:block
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
 
 

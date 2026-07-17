import type { DividerBlockProps } from "@/app/blockpages/dividerblock/types";
import type { BlockpagesTemplateId } from "@/lib/blockpagesTemplates";
import { getBlockpagesTemplateSections } from "@/lib/blockpagesTemplateSections";

export type BlockpagesOverlayKind = "divider" | "icon";

export type BlockpagesOverlayPosition = {
  top?: number;
  left?: number;
  x?: number;
  y?: number;
  anchorPath?: number[];
  insertMode?: "after" | "before";
  sectionId?: string;
};

export type BlockpagesDividerAnchor = {
  path: number[];
  mode: "after" | "before";
};

export type BlockpagesAppliedOverlay = {
  id: string;
  position?: BlockpagesOverlayPosition;
  scale?: number;
  props?: DividerBlockProps;
};

export type BlockpagesPreviewCaptureDevice = "desktop" | "tablet" | "mobile";

function escapeDomId(id: string) {
  return typeof CSS !== "undefined" && "escape" in CSS ? CSS.escape(id) : id.replace(/"/g, '\\"');
}

function getTemplateIdFromCanvas(liveCanvas: HTMLElement): BlockpagesTemplateId | null {
  const value = liveCanvas.getAttribute("data-blockpages-template");
  return value ? (value as BlockpagesTemplateId) : null;
}

function findTemplateSectionElement(templateRoot: HTMLElement, sectionId: string) {
  const escaped = escapeDomId(sectionId);
  return (
    templateRoot.querySelector<HTMLElement>(`#${escaped}`) ??
    templateRoot.querySelector<HTMLElement>(`[data-blockpages-section-id="${escaped}"]`) ??
    templateRoot.querySelector<HTMLElement>(`[id="${escaped}"]`)
  );
}

function getSectionInsertionTarget(
  sectionElement: HTMLElement,
  templateRoot: HTMLElement,
  sectionIds: string[],
  ownSectionId: string
) {
  const ownMarker = findTemplateSectionElement(templateRoot, ownSectionId);
  if (ownMarker && ownMarker === sectionElement) {
    return sectionElement;
  }

  let candidate = sectionElement;

  while (candidate.parentElement && candidate.parentElement !== templateRoot) {
    const parent = candidate.parentElement;
    const parentContainsOtherSection = sectionIds.some((sectionId) => {
      if (sectionId === ownSectionId) return false;
      const other = findTemplateSectionElement(templateRoot, sectionId);
      if (!other || other === sectionElement) return false;
      return parent.contains(other) && !candidate.contains(other);
    });

    if (parentContainsOtherSection) break;
    candidate = parent;
  }

  return candidate;
}

function getSectionMarkerDepth(templateRoot: HTMLElement, marker: HTMLElement) {
  let depth = 0;
  let node: HTMLElement | null = marker;

  while (node && node !== templateRoot) {
    depth += 1;
    node = node.parentElement;
  }

  return depth;
}

function sortBoundariesByDocumentOrder(
  boundaries: TemplateSectionBoundary[],
  container: HTMLElement
) {
  return [...boundaries].sort(
    (a, b) =>
      getContentRelativeMetrics(a.marker, container).top -
      getContentRelativeMetrics(b.marker, container).top
  );
}

function measureSectionExtent(
  entry: TemplateSectionBoundary,
  sortedBoundaries: TemplateSectionBoundary[],
  templateRoot: HTMLElement,
  container: HTMLElement
) {
  const markerMetrics = getContentRelativeMetrics(entry.marker, container);
  const top = markerMetrics.top;

  const escaped = escapeDomId(entry.sectionId);
  const endMarker = templateRoot.querySelector<HTMLElement>(
    `[data-blockpages-section-end="${escaped}"]`
  );
  if (endMarker) {
    const endTop = getContentRelativeMetrics(endMarker, container).top;
    const bottom = Math.max(top, endTop - 1);
    return { top, bottom, centerY: (top + bottom) / 2 };
  }

  const index = sortedBoundaries.findIndex((boundary) => boundary.sectionId === entry.sectionId);
  if (index >= 0 && index < sortedBoundaries.length - 1) {
    const nextTop = getContentRelativeMetrics(sortedBoundaries[index + 1].marker, container).top;
    const bottom = Math.max(top, nextTop - 1);
    return { top, bottom, centerY: (top + bottom) / 2 };
  }

  return {
    top,
    bottom: markerMetrics.bottom,
    centerY: (top + markerMetrics.bottom) / 2,
  };
}

function getPreviewDividerInsertionPoint(
  templateRoot: HTMLElement,
  sectionId: string,
  sortedSectionIds: string[]
) {
  const escaped = escapeDomId(sectionId);
  const endMarker = templateRoot.querySelector<HTMLElement>(
    `[data-blockpages-section-end="${escaped}"]`
  );
  if (endMarker) {
    return { element: endMarker, mode: "before" as const };
  }

  const index = sortedSectionIds.indexOf(sectionId);
  if (index >= 0 && index < sortedSectionIds.length - 1) {
    const nextMarker = findTemplateSectionElement(templateRoot, sortedSectionIds[index + 1]);
    if (nextMarker) {
      return { element: nextMarker, mode: "before" as const };
    }
  }

  const marker = findTemplateSectionElement(templateRoot, sectionId);
  if (!marker) return null;

  return { element: marker, mode: "after" as const };
}

type TemplateSectionBoundary = {
  sectionId: string;
  marker: HTMLElement;
  boundary: HTMLElement;
};

function collectTemplateSectionBoundaries(templateRoot: HTMLElement, sectionIds: string[]) {
  const boundaries: TemplateSectionBoundary[] = [];

  for (const sectionId of sectionIds) {
    const marker = findTemplateSectionElement(templateRoot, sectionId);
    if (!marker || marker.closest('[data-blockpages-overlay="true"]')) continue;

    boundaries.push({
      sectionId,
      marker,
      boundary: marker,
    });
  }

  return boundaries;
}

function collectTemplateSectionElements(templateRoot: HTMLElement, sectionIds: string[]) {
  return collectTemplateSectionBoundaries(templateRoot, sectionIds).map((entry) => entry.boundary);
}

function findSectionBoundaryForAnchorY(
  boundaries: TemplateSectionBoundary[],
  container: HTMLElement,
  anchorY: number,
  templateRoot: HTMLElement
) {
  if (!boundaries.length) return null;

  const sortedBoundaries = sortBoundariesByDocumentOrder(boundaries, container);
  const measured = sortedBoundaries.map((entry) => ({
    entry,
    metrics: measureSectionExtent(entry, sortedBoundaries, templateRoot, container),
    depth: getSectionMarkerDepth(templateRoot, entry.marker),
  }));

  const containing = measured.filter(
    ({ metrics }) => anchorY >= metrics.top - 16 && anchorY <= metrics.bottom + 16
  );

  if (containing.length) {
    containing.sort((a, b) => {
      if (b.depth !== a.depth) return b.depth - a.depth;
      const aHeight = a.metrics.bottom - a.metrics.top;
      const bHeight = b.metrics.bottom - b.metrics.top;
      return aHeight - bHeight;
    });
    return containing[0]?.entry ?? null;
  }

  let lastStarted: TemplateSectionBoundary | null = null;

  for (const { entry, metrics } of measured) {
    if (metrics.top <= anchorY + 16) {
      lastStarted = entry;
      continue;
    }
    break;
  }

  return lastStarted ?? measured[0]?.entry ?? null;
}

function resolveSectionForAnchorY(
  templateRoot: HTMLElement,
  container: HTMLElement,
  sectionIds: string[],
  anchorY: number
) {
  const boundaries = sectionIds.length
    ? collectTemplateSectionBoundaries(templateRoot, sectionIds)
    : [];
  const match = boundaries.length
    ? findSectionBoundaryForAnchorY(boundaries, container, anchorY, templateRoot)
    : null;

  if (!match) return null;

  const path = getElementChildPath(templateRoot, match.marker);
  if (!path) return null;

  return {
    sectionId: match.sectionId,
    insertionTarget: match.marker,
    path,
  };
}

export function resolveDividerSectionIdAtY(
  liveCanvas: HTMLElement,
  anchorY: number
): string | undefined {
  const liveContainer = liveCanvas.querySelector<HTMLElement>('[data-blockpages-overlay-container="true"]');
  const liveTemplateRoot = liveContainer?.querySelector<HTMLElement>("[data-blockpages-template-root]");
  if (!liveContainer || !liveTemplateRoot) return undefined;

  const templateId = getTemplateIdFromCanvas(liveCanvas);
  const sectionIds = templateId ? getBlockpagesTemplateSections(templateId).map((section) => section.id) : [];
  return resolveSectionForAnchorY(liveTemplateRoot, liveContainer, sectionIds, anchorY)?.sectionId;
}

export function isDividerSectionAnchor(
  templateRoot: HTMLElement,
  path: number[] | undefined,
  sectionIds: string[]
) {
  if (!path?.length) return false;
  const element = getElementByChildPath(templateRoot, path) as HTMLElement | null;
  return Boolean(element?.id && sectionIds.includes(element.id));
}

export function getOverlayDefaultTop(kind: BlockpagesOverlayKind, index: number) {
  return kind === "divider" ? 280 + index * 72 : 180 + index * 56;
}

export function normalizeOverlayPosition(
  position: BlockpagesOverlayPosition | undefined,
  index: number,
  kind: BlockpagesOverlayKind
) {
  const defaultTop = getOverlayDefaultTop(kind, index);
  const defaultLeft = 16;

  if (typeof position?.top === "number" && typeof position?.left === "number") {
    return { top: position.top, left: position.left };
  }

  const legacyBaseTop = kind === "divider" ? 400 + index * 60 : 200 + index * 50;

  return {
    top: legacyBaseTop + (position?.y ?? 0),
    left: defaultLeft + (position?.x ?? 0),
  };
}

export function shouldPreservePreviewTransform(element: Element) {
  if (element instanceof HTMLElement && element.dataset.blockpagesOverlay === "true") {
    return true;
  }

  return Boolean(
    element.closest(
      '[data-blockpages-overlay="true"], [data-blockpages-overlay-scale="true"], [data-blockpages-preview-divider="true"]'
    )
  );
}

function getOverlayContainer(element: HTMLElement) {
  return element.closest("[data-blockpages-overlay-container]") as HTMLElement | null;
}

function readOverlayLayoutPosition(overlay: HTMLElement, container: HTMLElement) {
  const styleTop = parseFloat(overlay.style.top || "");
  const styleLeft = parseFloat(overlay.style.left || "");

  if (Number.isFinite(styleTop) && Number.isFinite(styleLeft)) {
    return { top: styleTop, left: styleLeft };
  }

  let top = 0;
  let left = 0;
  let node: HTMLElement | null = overlay;

  while (node && node !== container) {
    top += node.offsetTop;
    left += node.offsetLeft;
    const nextParent = node.offsetParent as HTMLElement | null;
    if (!nextParent || !container.contains(nextParent)) break;
    node = nextParent;
  }

  return { top, left };
}

function resolveDividerWidth(container: HTMLElement, left: number, measuredWidth?: number) {
  const containerWidth = container.clientWidth || measuredWidth || 0;
  if (containerWidth > 0) {
    return Math.max(containerWidth - left - 16, 120);
  }

  return Math.max(measuredWidth ?? 120, 120);
}

function applyOverlayPreviewStyles(
  overlay: HTMLElement,
  container: HTMLElement,
  kind: BlockpagesOverlayKind,
  measuredWidth?: number
) {
  const { top, left } = readOverlayLayoutPosition(overlay, container);
  const width =
    kind === "divider"
      ? resolveDividerWidth(container, left, measuredWidth)
      : Math.max(measuredWidth ?? overlay.offsetWidth, 1);

  overlay.style.position = "absolute";
  overlay.style.top = `${top}px`;
  overlay.style.left = `${left}px`;
  overlay.style.width = `${width}px`;
  overlay.style.right = "auto";
  overlay.style.margin = "0";
  overlay.style.transform = "none";
  overlay.style.pointerEvents = "none";
  overlay.style.zIndex = "40";

  overlay.querySelectorAll<HTMLElement>('[data-draggable-chrome="true"]').forEach((draggable) => {
    draggable.style.transform = "none";
  });

  overlay.querySelectorAll<HTMLElement>('[data-blockpages-overlay-scale="true"]').forEach((scaleEl) => {
    const transform = scaleEl.style.transform || window.getComputedStyle(scaleEl).transform;
    const match = transform.match(/scale\(([\d.]+)\)/);
    const scale = match ? Number.parseFloat(match[1]) || 1 : 1;
    scaleEl.style.transform = scale !== 1 ? `scale(${scale})` : "none";
    scaleEl.style.transformOrigin = "center";
  });

  return { top, left, width };
}

export function commitOverlayTransformsToPosition(root: ParentNode) {
  if (typeof window === "undefined") return;

  root.querySelectorAll<HTMLElement>('[data-blockpages-overlay="true"]').forEach((overlay) => {
    const container = getOverlayContainer(overlay);
    if (!container) return;

    const kind = (overlay.dataset.blockpagesOverlayKind as BlockpagesOverlayKind | undefined) ?? "icon";
    applyOverlayPreviewStyles(overlay, container, kind, overlay.getBoundingClientRect().width);
  });
}

function getElementChildPath(root: Element, target: Element): number[] | null {
  const path: number[] = [];
  let node: Element | null = target;

  while (node && node !== root) {
    const parent: HTMLElement | null = node.parentElement;
    if (!parent) return null;
    path.unshift(Array.from(parent.children).indexOf(node));
    node = parent;
  }

  return node === root ? path : null;
}

function getElementByChildPath(root: Element, path: number[]): Element | null {
  let node: Element | null = root;

  for (const index of path) {
    if (!node || index < 0 || index >= node.children.length) return null;
    node = node.children[index] as Element;
  }

  return node;
}

function collectFlowAnchorCandidates(templateRoot: HTMLElement) {
  const selector =
    "h1,h2,h3,h4,h5,h6,h1 > div,h2 > div,h3 > div,p,button,a,li,section,article,header,footer,nav,ul,ol,figure,blockquote,hr,form,table";

  const candidates = Array.from(templateRoot.querySelectorAll<HTMLElement>(selector)).filter((element) => {
    if (element.closest('[data-blockpages-overlay="true"]')) return false;
    if (element.closest('[data-builder-chrome="true"]')) return false;

    const rect = element.getBoundingClientRect();
    return rect.width > 0 || rect.height > 0;
  });

  return candidates.filter(
    (element) => !candidates.some((other) => other !== element && element.contains(other))
  );
}

function getContentRelativeMetrics(element: HTMLElement, container: HTMLElement) {
  const containerRect = container.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  const top = rect.top - containerRect.top;
  const height = Math.max(rect.height, element.offsetHeight, 1);

  return {
    top,
    bottom: top + height,
    centerY: top + height / 2,
  };
}

function getDividerAnchorTop(overlay: HTMLElement, container: HTMLElement) {
  return readOverlayLayoutPosition(overlay, container).top;
}

export function getDividerAnchorY(overlay: HTMLElement, container: HTMLElement) {
  const line =
    overlay.querySelector<HTMLElement>('[data-blockpages-divider-line="true"]') ??
    overlay.querySelector<HTMLElement>('[data-blockpages-overlay-scale="true"]') ??
    overlay;

  return getContentRelativeMetrics(line, container).centerY;
}

function findFlowInsertionTarget(
  templateRoot: HTMLElement,
  container: HTMLElement,
  dividerCenterY: number
) {
  const candidates = collectFlowAnchorCandidates(templateRoot);

  let afterAnchor: HTMLElement | null = null;
  let afterBottom = -Infinity;

  for (const element of candidates) {
    const { bottom } = getContentRelativeMetrics(element, container);
    if (bottom <= dividerCenterY + 4 && bottom > afterBottom) {
      afterBottom = bottom;
      afterAnchor = element;
    }
  }

  if (afterAnchor) {
    return { mode: "after" as const, anchor: afterAnchor };
  }

  let beforeAnchor: HTMLElement | null = null;
  let beforeTop = Infinity;

  for (const element of candidates) {
    const { top } = getContentRelativeMetrics(element, container);
    if (top >= dividerCenterY - 4 && top < beforeTop) {
      beforeTop = top;
      beforeAnchor = element;
    }
  }

  if (beforeAnchor) {
    return { mode: "before" as const, anchor: beforeAnchor };
  }

  return { mode: "append" as const, anchor: templateRoot };
}

export function computeDividerPositionFromAnchor(
  templateRoot: HTMLElement,
  container: HTMLElement,
  anchor: BlockpagesDividerAnchor,
  left = 16
) {
  const anchorElement = getElementByChildPath(templateRoot, anchor.path) as HTMLElement | null;
  if (!anchorElement) return null;

  const metrics = getContentRelativeMetrics(anchorElement, container);
  const top = anchor.mode === "before" ? Math.max(0, metrics.top - 12) : metrics.bottom + 4;

  return {
    top: Math.max(0, top),
    left: Math.max(0, left),
  };
}

export function resolveDividerSectionPlacementAtY(
  liveCanvas: HTMLElement,
  anchorY: number,
  left = 16
): BlockpagesOverlayPosition | null {
  const liveContainer = liveCanvas.querySelector<HTMLElement>('[data-blockpages-overlay-container="true"]');
  const liveTemplateRoot = liveContainer?.querySelector<HTMLElement>("[data-blockpages-template-root]");
  if (!liveContainer || !liveTemplateRoot) return null;

  const templateId = getTemplateIdFromCanvas(liveCanvas);
  const sectionIds = templateId ? getBlockpagesTemplateSections(templateId).map((section) => section.id) : [];
  const resolved = resolveSectionForAnchorY(liveTemplateRoot, liveContainer, sectionIds, anchorY);
  if (!resolved?.path) return null;

  return {
    top: Math.max(0, anchorY),
    left: Math.max(0, left),
    anchorPath: resolved.path,
    insertMode: "after",
    sectionId: resolved.sectionId,
  };
}

export function getVisibleCanvasAnchorY(liveCanvas: HTMLElement) {
  const container = liveCanvas.querySelector<HTMLElement>('[data-blockpages-overlay-container="true"]');
  if (!container) return getOverlayDefaultTop("divider", 0);

  const containerRect = container.getBoundingClientRect();
  const canvasRect = liveCanvas.getBoundingClientRect();
  const visibleTop = Math.max(containerRect.top, canvasRect.top);
  const visibleBottom = Math.min(containerRect.bottom, canvasRect.bottom);
  const visibleCenter = (visibleTop + visibleBottom) / 2;

  return Math.max(0, visibleCenter - containerRect.top);
}

export function scrollCanvasToDividerPosition(liveCanvas: HTMLElement, dividerTop: number) {
  const nextScrollTop = Math.max(0, dividerTop - liveCanvas.clientHeight / 3);
  liveCanvas.scrollTo({ top: nextScrollTop, behavior: "smooth" });
}

export function resolveDividerFlowAnchor(liveCanvas: HTMLElement, liveOverlay: HTMLElement) {
  const liveContainer = liveOverlay.closest<HTMLElement>('[data-blockpages-overlay-container="true"]');
  const liveTemplateRoot = liveContainer?.querySelector<HTMLElement>("[data-blockpages-template-root]");
  if (!liveContainer || !liveTemplateRoot) return null;

  const dividerTop = getDividerAnchorTop(liveOverlay, liveContainer);
  const centerY = getDividerAnchorY(liveOverlay, liveContainer);
  const { left } = readOverlayLayoutPosition(liveOverlay, liveContainer);
  const templateId = getTemplateIdFromCanvas(liveCanvas);
  const sectionIds = templateId ? getBlockpagesTemplateSections(templateId).map((section) => section.id) : [];

  const resolved = resolveSectionForAnchorY(
    liveTemplateRoot,
    liveContainer,
    sectionIds,
    centerY
  );

  if (resolved?.path) {
    const computed = computeDividerPositionFromAnchor(
      liveTemplateRoot,
      liveContainer,
      { path: resolved.path, mode: "after" },
      left
    );

    return {
      path: resolved.path,
      mode: "after" as const,
      sectionId: resolved.sectionId,
      top: dividerTop,
      left: computed?.left ?? left,
      centerY,
    };
  }

  if (sectionIds.length) {
    const storedSectionId = liveOverlay.dataset.blockpagesDividerSectionId;
    if (storedSectionId) {
      const marker = findTemplateSectionElement(liveTemplateRoot, storedSectionId);
      const path = marker ? getElementChildPath(liveTemplateRoot, marker) : null;
      if (path) {
        return {
          path,
          mode: "after" as const,
          sectionId: storedSectionId,
          top: dividerTop,
          left,
          centerY,
        };
      }
    }
    return null;
  }

  const target = findFlowInsertionTarget(liveTemplateRoot, liveContainer, centerY);
  const path = getElementChildPath(liveTemplateRoot, target.anchor);
  if (!path) return null;

  return {
    path,
    mode: target.mode === "append" ? ("after" as const) : target.mode,
    sectionId: target.anchor.id || undefined,
    top: readOverlayLayoutPosition(liveOverlay, liveContainer).top,
    left,
    centerY,
  };
}

function parseDividerPx(value: string | undefined, fallback: number) {
  const parsed = parseInt(String(value ?? "").replace(/\D/g, ""), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function appendDividerLineContent(parent: HTMLElement, props: DividerBlockProps) {
  const weight = parseDividerPx(props.weight, 1);
  const spacing = parseDividerPx(props.spacing, 20);
  const margin = parseDividerPx(props.margin, 20);
  const width = props.width || "100%";
  const color = props.color || "#333333";
  const lineStyle = props.lineStyle || "solid";

  const container = document.createElement("div");
  container.style.width = width;
  container.style.marginTop = `${margin}px`;
  container.style.marginBottom = `${margin}px`;
  container.style.boxSizing = "border-box";

  if (props.variant === "line-with-spacing") {
    container.style.paddingTop = `${spacing}px`;
    container.style.paddingBottom = `${spacing}px`;
  }

  const line = document.createElement("div");
  line.setAttribute("data-blockpages-divider-line", "true");
  line.style.width = width;
  line.style.borderTop =
    props.variant === "double-line"
      ? `${weight}px double ${color}`
      : `${weight}px ${lineStyle} ${color}`;
  line.style.display = "block";
  line.style.minHeight = "1px";
  line.style.boxSizing = "border-box";

  container.appendChild(line);
  parent.appendChild(container);
}

function createFlowDividerElement(
  overlayId: string,
  left: number,
  source?: HTMLElement | null,
  props?: DividerBlockProps
) {
  const wrapper = document.createElement("div");
  wrapper.setAttribute("data-blockpages-preview-divider", "true");
  wrapper.dataset.blockpagesOverlayId = overlayId;

  const insetLeft = Math.max(left, 0);
  wrapper.style.display = "block";
  wrapper.style.position = "relative";
  wrapper.style.width = "100%";
  wrapper.style.maxWidth = "100%";
  wrapper.style.marginTop = "12px";
  wrapper.style.marginBottom = "12px";
  wrapper.style.marginLeft = `${insetLeft}px`;
  wrapper.style.marginRight = "16px";
  wrapper.style.boxSizing = "border-box";
  wrapper.style.pointerEvents = "none";
  wrapper.style.clear = "both";
  wrapper.style.zIndex = "1";

  const scaleEl = source?.querySelector<HTMLElement>('[data-blockpages-overlay-scale="true"]');
  if (scaleEl) {
    const content = scaleEl.cloneNode(true) as HTMLElement;
    content.style.padding = "0";
    content.style.margin = "0";
    content.style.outline = "none";
    content.classList.remove(
      "p-2",
      "group-hover/inner:outline",
      "group-hover/inner:outline-2",
      "group-hover/inner:outline-dashed",
      "group-hover/inner:outline-blue-400",
      "group-focus-within/inner:outline",
      "group-focus-within/inner:outline-2",
      "group-focus-within/inner:outline-blue-400"
    );
    wrapper.appendChild(content);
  } else if (props) {
    appendDividerLineContent(wrapper, props);
  }

  return wrapper;
}

function insertPreviewDividerAfterSection(
  cloneTemplateRoot: HTMLElement,
  sectionId: string,
  flowDivider: HTMLElement,
  sortedSectionIds: string[]
) {
  const insertionPoint = getPreviewDividerInsertionPoint(
    cloneTemplateRoot,
    sectionId,
    sortedSectionIds
  );
  if (!insertionPoint) return false;

  if (insertionPoint.mode === "before") {
    insertionPoint.element.insertAdjacentElement("beforebegin", flowDivider);
  } else {
    insertionPoint.element.insertAdjacentElement("afterend", flowDivider);
  }

  return true;
}

function resolvePreviewDividerSectionId(
  liveCanvas: HTMLElement,
  liveContainer: HTMLElement,
  liveTemplateRoot: HTMLElement,
  sectionIds: string[],
  liveOverlay: HTMLElement | null,
  storedMeta: BlockpagesOverlayPosition | undefined,
  datasetSectionId: string | undefined,
  anchorY?: number
) {
  if (storedMeta?.sectionId && sectionIds.includes(storedMeta.sectionId)) {
    return storedMeta.sectionId;
  }

  if (datasetSectionId && sectionIds.includes(datasetSectionId)) {
    return datasetSectionId;
  }

  if (liveOverlay) {
    const liveResolved = resolveDividerFlowAnchor(liveCanvas, liveOverlay);
    if (liveResolved?.sectionId) {
      return liveResolved.sectionId;
    }

    const overlayAnchorY = getDividerAnchorY(liveOverlay, liveContainer);
    const resolvedFromOverlay = resolveSectionForAnchorY(
      liveTemplateRoot,
      liveContainer,
      sectionIds,
      overlayAnchorY
    );
    if (resolvedFromOverlay?.sectionId) {
      return resolvedFromOverlay.sectionId;
    }
  }

  if (typeof anchorY === "number") {
    const resolvedFromStoredPosition = resolveSectionForAnchorY(
      liveTemplateRoot,
      liveContainer,
      sectionIds,
      anchorY
    );
    if (resolvedFromStoredPosition?.sectionId) {
      return resolvedFromStoredPosition.sectionId;
    }
  }

  return undefined;
}

function flattenDividerOverlaysIntoDocumentFlow(
  liveCanvas: HTMLElement,
  clone: HTMLElement,
  appliedDividers: BlockpagesAppliedOverlay[] = []
) {
  const liveContainer = liveCanvas.querySelector<HTMLElement>('[data-blockpages-overlay-container="true"]');
  const cloneContainer = clone.querySelector<HTMLElement>('[data-blockpages-overlay-container="true"]');
  const liveTemplateRoot = liveContainer?.querySelector<HTMLElement>("[data-blockpages-template-root]");
  const cloneTemplateRoot = cloneContainer?.querySelector<HTMLElement>("[data-blockpages-template-root]");

  if (!cloneContainer || !cloneTemplateRoot) return;

  const templateId = getTemplateIdFromCanvas(liveCanvas);
  const sectionIds = templateId ? getBlockpagesTemplateSections(templateId).map((section) => section.id) : [];
  const liveBoundaries =
    liveTemplateRoot && sectionIds.length
      ? collectTemplateSectionBoundaries(liveTemplateRoot, sectionIds)
      : [];
  const sortedSectionIds =
    liveContainer && liveBoundaries.length
      ? sortBoundariesByDocumentOrder(liveBoundaries, liveContainer).map((boundary) => boundary.sectionId)
      : sectionIds;
  const dividerMetaById = new Map(appliedDividers.map((divider) => [divider.id, divider]));

  const overlayIds = new Set<string>();
  appliedDividers.forEach((divider) => overlayIds.add(divider.id));
  liveCanvas
    .querySelectorAll<HTMLElement>('[data-blockpages-overlay-kind="divider"]')
    .forEach((overlay) => {
      const id = overlay.dataset.blockpagesOverlayId;
      if (id) overlayIds.add(id);
    });

  const jobs = Array.from(overlayIds)
    .map((overlayId) => {
      const dividerRecord = dividerMetaById.get(overlayId);
      const liveOverlay = liveCanvas.querySelector<HTMLElement>(
        `[data-blockpages-overlay-id="${overlayId}"]`
      );
      const cloneOverlay = cloneContainer.querySelector<HTMLElement>(
        `[data-blockpages-overlay-id="${overlayId}"]`
      );
      const storedMeta = dividerRecord?.position;
      const datasetSectionId = liveOverlay?.dataset.blockpagesDividerSectionId;

      const centerY =
        liveOverlay && liveContainer
          ? getDividerAnchorY(liveOverlay, liveContainer)
          : storedMeta?.top ?? 0;

      let sectionId =
        sectionIds.length && liveContainer && liveTemplateRoot
          ? resolvePreviewDividerSectionId(
              liveCanvas,
              liveContainer,
              liveTemplateRoot,
              sectionIds,
              liveOverlay,
              storedMeta,
              datasetSectionId,
              centerY
            )
          : storedMeta?.sectionId ?? datasetSectionId;

      if (
        !sectionId &&
        sectionIds.length &&
        liveContainer &&
        liveTemplateRoot &&
        typeof centerY === "number"
      ) {
        sectionId = resolveSectionForAnchorY(
          liveTemplateRoot,
          liveContainer,
          sectionIds,
          centerY
        )?.sectionId;
      }

      if (!sectionId) return null;

      const left =
        liveOverlay && liveContainer
          ? readOverlayLayoutPosition(liveOverlay, liveContainer).left
          : storedMeta?.left ?? 16;

      return {
        overlayId,
        liveOverlay,
        cloneOverlay,
        props: dividerRecord?.props,
        left,
        sectionId,
        centerY,
      };
    })
    .filter((job): job is NonNullable<typeof job> => Boolean(job))
    .sort((a, b) => b.centerY - a.centerY);

  for (const job of jobs) {
    const sourceOverlay = job.liveOverlay ?? job.cloneOverlay;
    const flowDivider = createFlowDividerElement(
      job.overlayId,
      job.left,
      sourceOverlay,
      job.props
    );

    if (
      !flowDivider.querySelector('[data-blockpages-divider-line="true"]') &&
      !flowDivider.textContent?.trim()
    ) {
      flowDivider.remove();
      job.cloneOverlay?.remove();
      continue;
    }

    let inserted = insertPreviewDividerAfterSection(
      cloneTemplateRoot,
      job.sectionId,
      flowDivider,
      sortedSectionIds
    );

    if (!inserted) {
      const marker = findTemplateSectionElement(cloneTemplateRoot, job.sectionId);
      if (marker) {
        marker.insertAdjacentElement("afterend", flowDivider);
        inserted = true;
      }
    }

    if (!inserted) {
      flowDivider.remove();
    }

    job.cloneOverlay?.remove();
  }
}

function bakeLiveOverlayPositions(
  liveCanvas: HTMLElement,
  clone: HTMLElement,
  kind: BlockpagesOverlayKind
) {
  const liveOverlays = liveCanvas.querySelectorAll<HTMLElement>(`[data-blockpages-overlay-kind="${kind}"]`);
  const cloneOverlays = clone.querySelectorAll<HTMLElement>(`[data-blockpages-overlay-kind="${kind}"]`);

  liveOverlays.forEach((liveOverlay, index) => {
    const cloneOverlay = cloneOverlays[index];
    const liveContainer = getOverlayContainer(liveOverlay);
    if (!cloneOverlay || !liveContainer) return;

    const { top, left } = readOverlayLayoutPosition(liveOverlay, liveContainer);
    const measuredWidth = liveOverlay.getBoundingClientRect().width;
    const width =
      kind === "divider"
        ? resolveDividerWidth(liveContainer, left, measuredWidth)
        : Math.max(measuredWidth, 1);

    cloneOverlay.style.position = "absolute";
    cloneOverlay.style.top = `${top}px`;
    cloneOverlay.style.left = `${left}px`;
    cloneOverlay.style.width = `${width}px`;
    cloneOverlay.style.right = "auto";
    cloneOverlay.style.margin = "0";
    cloneOverlay.style.transform = "none";
    cloneOverlay.style.pointerEvents = "none";
    cloneOverlay.style.zIndex = "40";

    cloneOverlay.querySelectorAll<HTMLElement>('[data-draggable-chrome="true"]').forEach((draggable) => {
      draggable.style.transform = "none";
    });

    cloneOverlay.querySelectorAll<HTMLElement>('[data-blockpages-overlay-scale="true"]').forEach((scaleEl) => {
      const transform = scaleEl.style.transform || "";
      const match = transform.match(/scale\(([\d.]+)\)/);
      const scale = match ? Number.parseFloat(match[1]) || 1 : 1;
      scaleEl.style.transform = scale !== 1 ? `scale(${scale})` : "none";
      scaleEl.style.transformOrigin = "center";
    });
  });
}

export function buildBlockpagesPreviewOverlayStyles(device: BlockpagesPreviewCaptureDevice) {
  const widthRule =
    device === "mobile"
      ? "width: 375px !important; max-width: 375px !important;"
      : device === "tablet"
        ? "width: 768px !important; max-width: 768px !important;"
        : "width: 100% !important; max-width: 100% !important;";

  return `
    [data-blockpages-preview-root] {
      ${widthRule}
      margin-left: auto !important;
      margin-right: auto !important;
      box-sizing: border-box !important;
    }
    [data-blockpages-preview-root] [data-blockpages-overlay-container="true"] {
      position: relative !important;
      overflow: visible !important;
    }
    [data-blockpages-preview-root] [data-blockpages-preview-divider="true"] {
      position: relative !important;
      top: auto !important;
      left: auto !important;
      right: auto !important;
      transform: none !important;
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      min-height: 12px !important;
      pointer-events: none !important;
      clear: both !important;
      visibility: visible !important;
      opacity: 1 !important;
      box-sizing: border-box !important;
      overflow: visible !important;
    }
    [data-blockpages-preview-root] [data-blockpages-preview-divider="true"] [data-blockpages-divider-line="true"] {
      display: block !important;
      width: 100% !important;
      min-height: 1px !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    [data-blockpages-preview-root] [data-blockpages-overlay-kind="divider"] {
      display: none !important;
    }
    [data-blockpages-preview-root] .portfolio-hero-copy,
    [data-blockpages-preview-root] .portfolio-mini-card,
    [data-blockpages-preview-root] .portfolio-stat-card,
    [data-blockpages-preview-root] .portfolio-service-card,
    [data-blockpages-preview-root] .portfolio-project-card,
    [data-blockpages-preview-root] .portfolio-floating-badge,
    [data-blockpages-preview-root] .portfolio-reveal {
      animation: none !important;
      transition: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
    [data-blockpages-preview-root] .portfolio-reveal {
      transform: translateY(0) !important;
    }
  `;
}

export function prepareBlockpagesPreviewHtml(
  liveCanvas: HTMLElement,
  captureDevice: BlockpagesPreviewCaptureDevice = "desktop",
  appliedDividers: BlockpagesAppliedOverlay[] = []
) {
  appliedDividers.forEach((divider) => {
    const overlay = liveCanvas.querySelector<HTMLElement>(
      `[data-blockpages-overlay-id="${divider.id}"]`
    );
    if (!overlay || !divider.position) return;
    if (divider.position.anchorPath?.length) {
      overlay.dataset.blockpagesDividerAnchorPath = JSON.stringify(divider.position.anchorPath);
    }
    overlay.dataset.blockpagesDividerInsertMode = divider.position.insertMode ?? "after";
    if (divider.position.sectionId) {
      overlay.dataset.blockpagesDividerSectionId = divider.position.sectionId;
    }
  });

  const clone = liveCanvas.cloneNode(true) as HTMLElement;
  clone.setAttribute("data-blockpages-capture-device", captureDevice);
  clone.classList.add("blockpages-preview-static");

  clone.querySelectorAll(".portfolio-reveal").forEach((element) => {
    element.classList.add("is-visible");
  });

  flattenDividerOverlaysIntoDocumentFlow(liveCanvas, clone, appliedDividers);
  bakeLiveOverlayPositions(liveCanvas, clone, "icon");

  return clone;
}

export function bakeDraggableOverlayPositions(root: ParentNode) {
  commitOverlayTransformsToPosition(root);
}

/** Remove divider DOM that is no longer tracked in editor state (stale prod/localStorage artifacts). */
export function scrubOrphanDividerDomFromLiveCanvas(
  canvas: ParentNode | null,
  activeDividerIds: string[] = []
) {
  if (typeof document === "undefined" || !canvas) return;

  const activeIds = new Set(activeDividerIds);
  const liveCanvas = canvas instanceof HTMLElement ? canvas : canvas.parentElement;
  if (!liveCanvas) return;

  liveCanvas
    .querySelectorAll<HTMLElement>('[data-blockpages-overlay-kind="divider"]')
    .forEach((overlay) => {
      const overlayId = overlay.getAttribute("data-blockpages-overlay-id");
      if (!overlayId || !activeIds.has(overlayId)) {
        overlay.remove();
      }
    });

  liveCanvas
    .querySelectorAll('[data-blockpages-preview-divider="true"]')
    .forEach((node) => node.remove());
}

export function readBlockpagesPreviewCaptureDevice(html: string): BlockpagesPreviewCaptureDevice | null {
  const match = html.match(/data-blockpages-capture-device="(desktop|tablet|mobile)"/);
  return match ? (match[1] as BlockpagesPreviewCaptureDevice) : null;
}


export type BlockpagesOverlayKind = "divider" | "icon";

export type BlockpagesOverlayPosition = {
  top?: number;
  left?: number;
  x?: number;
  y?: number;
};

export type BlockpagesAppliedOverlay = {
  id: string;
  position?: BlockpagesOverlayPosition;
  scale?: number;
};

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

function escapeSelector(value: string) {
  return typeof CSS !== "undefined" && "escape" in CSS ? CSS.escape(value) : value.replace(/"/g, '\\"');
}

export function findInsertAnchorForOverlay(overlay: HTMLElement, templateRoot: Element) {
  const overlayRect = overlay.getBoundingClientRect();
  const anchorY = overlayRect.bottom;

  const candidates = Array.from(
    templateRoot.querySelectorAll<HTMLElement>("[id]")
  ).filter((candidate) => {
    if (!candidate.id || overlay.contains(candidate)) return false;
    const rect = candidate.getBoundingClientRect();
    return rect.width > 0 || rect.height > 0;
  });

  let chosenId: string | null = null;
  let chosenTop = Infinity;

  for (const candidate of candidates) {
    const rect = candidate.getBoundingClientRect();
    if (rect.top + 8 < anchorY) continue;
    if (rect.top < chosenTop) {
      chosenTop = rect.top;
      chosenId = candidate.id;
    }
  }

  if (!chosenId) {
    let closestDistance = Infinity;
    for (const candidate of candidates) {
      const rect = candidate.getBoundingClientRect();
      const distance = Math.abs(rect.top - anchorY);
      if (rect.top >= overlayRect.top - 24 && distance < closestDistance) {
        closestDistance = distance;
        chosenId = candidate.id;
      }
    }
  }

  return chosenId;
}

type DividerInsertPlan = {
  anchorId: string;
  contentHtml: string;
};

function planDividerInsertions(liveCanvas: HTMLElement): DividerInsertPlan[] {
  const templateRoot = liveCanvas.querySelector("[data-blockpages-template-root]");
  if (!templateRoot) return [];

  const plans: DividerInsertPlan[] = [];

  liveCanvas.querySelectorAll<HTMLElement>('[data-blockpages-overlay-kind="divider"]').forEach((overlay) => {
    const anchorId = findInsertAnchorForOverlay(overlay, templateRoot);
    const scaleEl = overlay.querySelector("[data-blockpages-overlay-scale]");
    const contentHtml = scaleEl?.outerHTML ?? "";
    if (!anchorId || !contentHtml.trim()) return;
    plans.push({ anchorId, contentHtml });
  });

  return plans;
}

function applyDividerInsertions(clone: HTMLElement, plans: DividerInsertPlan[]) {
  for (const plan of plans) {
    const anchor = clone.querySelector(`#${escapeSelector(plan.anchorId)}`);
    if (!anchor?.parentNode) continue;

    const wrapper = document.createElement("div");
    wrapper.className =
      "blockpages-preview-divider w-full px-4 sm:px-6 md:px-12 lg:px-20 py-2 box-border";
    wrapper.setAttribute("data-blockpages-preview-divider", "true");
    wrapper.innerHTML = plan.contentHtml;

    const scaleEl = wrapper.querySelector("[data-blockpages-overlay-scale]");
    if (scaleEl instanceof HTMLElement) {
      scaleEl.style.position = "relative";
      scaleEl.style.top = "auto";
      scaleEl.style.left = "auto";
      scaleEl.style.right = "auto";
      scaleEl.style.width = "100%";
      scaleEl.style.maxWidth = "100%";
      scaleEl.style.margin = "0";
    }

    anchor.parentNode.insertBefore(wrapper, anchor);
  }
}

function bakeLiveIconOverlayPositions(liveCanvas: HTMLElement, clone: HTMLElement) {
  const liveIcons = liveCanvas.querySelectorAll<HTMLElement>('[data-blockpages-overlay-kind="icon"]');
  const cloneIcons = clone.querySelectorAll<HTMLElement>('[data-blockpages-overlay-kind="icon"]');

  liveIcons.forEach((liveIcon, index) => {
    const cloneIcon = cloneIcons[index];
    const container = liveIcon.closest("[data-blockpages-overlay-container]") as HTMLElement | null;
    if (!cloneIcon || !container) return;

    const containerRect = container.getBoundingClientRect();
    const iconRect = liveIcon.getBoundingClientRect();

    cloneIcon.style.position = "absolute";
    cloneIcon.style.top = `${iconRect.top - containerRect.top + container.scrollTop}px`;
    cloneIcon.style.left = `${iconRect.left - containerRect.left + container.scrollLeft}px`;
    cloneIcon.style.right = "16px";
    cloneIcon.style.transform = "none";
    cloneIcon.style.margin = "0";
  });
}

export function prepareBlockpagesPreviewHtml(liveCanvas: HTMLElement) {
  const dividerPlans = planDividerInsertions(liveCanvas);
  const clone = liveCanvas.cloneNode(true) as HTMLElement;

  clone.querySelectorAll('[data-blockpages-overlay-kind="divider"]').forEach((overlay) => overlay.remove());
  applyDividerInsertions(clone, dividerPlans);
  bakeLiveIconOverlayPositions(liveCanvas, clone);

  return clone;
}

export function bakeDraggableOverlayPositions(root: ParentNode) {
  if (typeof window === "undefined") return;

  root.querySelectorAll<HTMLElement>('[data-blockpages-overlay="true"]').forEach((element) => {
    const computed = window.getComputedStyle(element);
    const baseTop = parseFloat(element.style.top || computed.top || "0") || 0;
    const baseLeft = parseFloat(element.style.left || computed.left || "0") || 0;

    let offsetX = 0;
    let offsetY = 0;
    const transform = computed.transform;
    if (transform && transform !== "none") {
      const matrix = new DOMMatrix(transform);
      offsetX = matrix.m41;
      offsetY = matrix.m42;
    }

    element.style.position = "absolute";
    element.style.top = `${baseTop + offsetY}px`;
    element.style.left = `${baseLeft + offsetX}px`;
    element.style.transform = "none";
    element.style.margin = "0";
    element.removeAttribute("data-draggable-chrome");
    element.classList.remove("cursor-move", "active:cursor-grabbing");
  });
}

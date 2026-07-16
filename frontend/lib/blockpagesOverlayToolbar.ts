import type { RefObject } from "react";
import { useEffect } from "react";

type OverlayToolbarHandlers = {
  appliedDividers: Array<{ id: string; scale?: number }>;
  appliedIcons: Array<{ id: string; scale?: number }>;
  onRemoveDivider?: (id: string) => void;
  onRemoveIcon?: (id: string) => void;
  onUpdateDividerScale?: (id: string, scale: number) => void;
  onUpdateIconScale?: (id: string, scale: number) => void;
};

function handleOverlayToolbarInteraction(event: Event, handlers: OverlayToolbarHandlers) {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const removeButton = target.closest("[data-blockpages-overlay-remove='true']");
  if (removeButton instanceof HTMLElement) {
    event.preventDefault();
    event.stopPropagation();

    const overlayId = removeButton.getAttribute("data-overlay-id");
    const overlayKind = removeButton
      .closest("[data-blockpages-overlay-kind]")
      ?.getAttribute("data-blockpages-overlay-kind");

    if (!overlayId) return;

    if (overlayKind === "icon") {
      handlers.onRemoveIcon?.(overlayId);
    } else {
      handlers.onRemoveDivider?.(overlayId);
    }
    return;
  }

  const scaleButton = target.closest("[data-blockpages-overlay-scale-action]");
  if (!(scaleButton instanceof HTMLElement)) return;

  event.preventDefault();
  event.stopPropagation();

  const overlayId = scaleButton.getAttribute("data-overlay-id");
  const action = scaleButton.getAttribute("data-blockpages-overlay-scale-action");
  if (!overlayId || !action) return;

  const overlayKind = scaleButton
    .closest("[data-blockpages-overlay-kind]")
    ?.getAttribute("data-blockpages-overlay-kind");

  const overlayList = overlayKind === "icon" ? handlers.appliedIcons : handlers.appliedDividers;
  const overlayEntry = overlayList.find((entry) => entry.id === overlayId);
  const currentScale = overlayEntry?.scale ?? 1;
  const nextScale = action === "decrease" ? Math.max(0.2, currentScale - 0.1) : currentScale + 0.1;

  if (overlayKind === "icon") {
    handlers.onUpdateIconScale?.(overlayId, nextScale);
  } else {
    handlers.onUpdateDividerScale?.(overlayId, nextScale);
  }
}

export function useBlockpagesOverlayToolbar(
  containerRef: RefObject<HTMLElement | null>,
  handlers: OverlayToolbarHandlers
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const listener = (event: Event) => handleOverlayToolbarInteraction(event, handlers);
    container.addEventListener("click", listener, true);
    return () => container.removeEventListener("click", listener, true);
  }, [
    containerRef,
    handlers.appliedDividers,
    handlers.appliedIcons,
    handlers.onRemoveDivider,
    handlers.onRemoveIcon,
    handlers.onUpdateDividerScale,
    handlers.onUpdateIconScale,
  ]);
}

import type { BlockpagesPreviewDevice } from "@/lib/blockpagesEditorContext";

type BlockpagesInteractiveControlOptions = {
  allowTextEditing?: boolean;
};

export function isBlockpagesInteractiveControl(
  node: Element | null,
  options?: BlockpagesInteractiveControlOptions
) {
  if (!(node instanceof HTMLElement)) return false;
  if (node.closest('[data-blockpages-interactive="true"]')) return true;
  if (node.closest("input, textarea, select, .buyscreen-search")) return true;
  if (node.closest(".portfolio-mobile-menu, .portfolio-mobile-menu-btn, .portfolio-mobile-menu")) return true;

  if (options?.allowTextEditing) {
    if (node.closest("nav.buyscreen-categories .buyscreen-category-item, nav.buyscreen-categories .buyscreen-categories-list > button")) {
      return true;
    }

    const ariaLabel = (node.getAttribute("aria-label") ?? "").toLowerCase();
    if (ariaLabel.includes("menu") && !node.isContentEditable && !node.closest('[contenteditable="true"]')) {
      return true;
    }

    const button = node.closest("button") as HTMLElement | null;
    if (button?.querySelector("svg") && (button.textContent ?? "").trim().length <= 2) {
      return true;
    }

    return false;
  }

  const ariaLabel = (node.getAttribute("aria-label") ?? "").toLowerCase();
  if (ariaLabel.includes("menu")) return true;
  if (node.hasAttribute("aria-expanded")) return true;

  const button = node.closest("button") as HTMLElement | null;
  if (!button) return false;

  if (button.querySelector("svg") && (button.textContent ?? "").trim().length <= 2) {
    return true;
  }

  return false;
}

export function resolveBlockpagesDeviceMode(
  isBlockpages: boolean,
  editorDevice: BlockpagesPreviewDevice | undefined,
  localDevice: BlockpagesPreviewDevice
): BlockpagesPreviewDevice {
  if (isBlockpages && editorDevice) return editorDevice;
  return localDevice;
}

export function shouldUseCompactTemplateHeader(deviceMode: BlockpagesPreviewDevice) {
  return deviceMode !== "desktop";
}

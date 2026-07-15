import type { BlockpagesPreviewDevice } from "@/lib/blockpagesEditorContext";

export function isBlockpagesInteractiveControl(node: Element | null) {
  if (!(node instanceof HTMLElement)) return false;
  if (node.closest('[data-blockpages-interactive="true"]')) return true;
  if (node.closest(".portfolio-mobile-menu, .portfolio-mobile-menu-btn, .portfolio-mobile-menu ")) return true;

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

import { injectPortfolioProjectsSliderNavAttributes } from "@/lib/portfolioProjectsSlider";
import { finalizeStatCounterElement } from "@/lib/blockpagesStatCounter";

function revealHiddenMotionElements(root: ParentNode) {
  root.querySelectorAll<HTMLElement>("*").forEach((element) => {
    if (element.style.opacity === "0") {
      element.style.opacity = "1";
    }

    const transform = element.style.transform;
    if (transform && transform !== "none" && /translate|matrix|scale/.test(transform)) {
      element.style.transform = "none";
    }
  });
}

function finalizeStatCounters(root: ParentNode) {
  root.querySelectorAll<HTMLElement>(".stat-animate-count").forEach(finalizeStatCounterElement);
}

function normalizePreviewScrollRoot(root: ParentNode) {
  const scrollRoot = root.querySelector<HTMLElement>("[data-textblock-canvas]");
  if (!scrollRoot) return;

  scrollRoot.classList.remove(
    "custom-scrollbar",
    "overflow-y-auto",
    "overflow-x-hidden",
    "h-[calc(100vh-220px)]",
    "min-h-[560px]"
  );
  scrollRoot.style.removeProperty("height");
  scrollRoot.style.removeProperty("max-height");
  scrollRoot.style.removeProperty("min-height");
}

export function sanitizeBlockpagesPreviewClone(root: HTMLElement) {
  root.querySelectorAll("[contenteditable]").forEach((element) => element.removeAttribute("contenteditable"));
  root.querySelectorAll(".editable-text-active").forEach((element) => element.classList.remove("editable-text-active"));
  root.querySelectorAll("[data-builder-chrome='true']").forEach((element) => element.remove());
  root.querySelectorAll("[data-draggable-chrome='true']").forEach((element) => {
    element.removeAttribute("title");
    element.classList.remove(
      "cursor-move",
      "active:cursor-grabbing",
      "hover:outline",
      "hover:outline-2",
      "hover:outline-blue-400",
      "hover:outline-dashed",
      "group"
    );
  });

  revealHiddenMotionElements(root);
  finalizeStatCounters(root);
  normalizePreviewScrollRoot(root);
  injectPortfolioProjectsSliderNavAttributes(root);

  return root;
}

export function sanitizeBlockpagesPreviewHtml(html: string) {
  if (typeof document === "undefined" || !html.trim()) return html;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  sanitizeBlockpagesPreviewClone(wrapper);
  return wrapper.innerHTML;
}

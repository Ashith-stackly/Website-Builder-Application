export const PORTFOLIO_PROJECTS_SLIDER_ID = "projects-slider";
 
type SliderWindow = Window & {
  __stacklyScrollPortfolioProjectsSlider?: (targetId: string, direction: number) => void;
};
 
export function getPortfolioProjectsSlider(targetId = PORTFOLIO_PROJECTS_SLIDER_ID): HTMLElement | null {
  return (
    document.getElementById(targetId) ||
    document.querySelector<HTMLElement>('[data-portfolio-projects-slider="true"]')
  );
}
 
export function scrollPortfolioProjectsSlider(slider: HTMLElement, direction: -1 | 1) {
  const firstChild = slider.firstElementChild as HTMLElement | null;
  const cardWidth = firstChild?.getBoundingClientRect().width || 280;
  const gap = window.innerWidth >= 640 ? 24 : 16;
  const delta = direction * (cardWidth + gap);
  const maxScrollLeft = slider.scrollWidth - slider.clientWidth;
 
  let nextLeft;
  // If we're very close to the end, wrap to start
  if (direction === 1 && slider.scrollLeft >= maxScrollLeft - (cardWidth / 2)) {
    nextLeft = 0;
  // If we're very close to the start, wrap to end
  } else if (direction === -1 && slider.scrollLeft <= (cardWidth / 2)) {
    nextLeft = maxScrollLeft;
  } else {
    nextLeft = Math.max(0, Math.min(slider.scrollLeft + delta, maxScrollLeft));
  }
 
  if (typeof slider.scrollTo === "function") {
    slider.scrollTo({ left: nextLeft, behavior: "smooth" });
    return;
  }
 
  slider.scrollLeft = nextLeft;
}
 
export function ensurePortfolioProjectsSliderGlobals() {
  if (typeof window === "undefined") return;
 
  const win = window as SliderWindow;
  if (win.__stacklyScrollPortfolioProjectsSlider) return;
 
  win.__stacklyScrollPortfolioProjectsSlider = (targetId, direction) => {
    const slider = getPortfolioProjectsSlider(targetId);
    if (!slider) return;
    scrollPortfolioProjectsSlider(slider, direction >= 0 ? 1 : -1);
  };
}
 
function resolveSliderNavButton(button: Element): { targetId: string; direction: -1 | 1 } | null {
  const nav = button.getAttribute("data-slider-nav");
  const label = button.getAttribute("aria-label");
 
  if (nav === "prev" || label === "Slide Left") {
    return {
      targetId: button.getAttribute("data-slider-target") || PORTFOLIO_PROJECTS_SLIDER_ID,
      direction: -1,
    };
  }
 
  if (nav === "next" || label === "Slide Right") {
    return {
      targetId: button.getAttribute("data-slider-target") || PORTFOLIO_PROJECTS_SLIDER_ID,
      direction: 1,
    };
  }
 
  return null;
}
 
export function handlePortfolioProjectsSliderNavClick(event: Event) {
  const target = event.target;
  if (!(target instanceof Element)) return;
 
  const button = target.closest("button[data-slider-nav], button[aria-label='Slide Left'], button[aria-label='Slide Right']");
  if (!button) return;
 
  const resolved = resolveSliderNavButton(button);
  if (!resolved) return;
 
  const slider = getPortfolioProjectsSlider(resolved.targetId);
  if (!slider) return;
 
  event.preventDefault();
  event.stopPropagation();
  scrollPortfolioProjectsSlider(slider, resolved.direction);
}
 
export function bindPortfolioProjectsSliderNavDelegation(): () => void {
  ensurePortfolioProjectsSliderGlobals();
  document.addEventListener("click", handlePortfolioProjectsSliderNavClick, true);
  return () => document.removeEventListener("click", handlePortfolioProjectsSliderNavClick, true);
}
 
function attachNativeSliderNavHandler(button: HTMLButtonElement, targetId: string, direction: -1 | 1) {
  button.setAttribute("type", "button");
  button.setAttribute(
    "onclick",
    `event.preventDefault();event.stopPropagation();window.__stacklyScrollPortfolioProjectsSlider&&window.__stacklyScrollPortfolioProjectsSlider('${targetId}',${direction});return false;`
  );
}
 
export function injectPortfolioProjectsSliderNavAttributes(root: ParentNode) {
  ensurePortfolioProjectsSliderGlobals();
 
  root.querySelectorAll<HTMLButtonElement>("[data-slider-nav]").forEach((button) => {
    const targetId = button.dataset.sliderTarget || PORTFOLIO_PROJECTS_SLIDER_ID;
    const nav = button.dataset.sliderNav;
    if (nav === "prev") attachNativeSliderNavHandler(button, targetId, -1);
    else if (nav === "next") attachNativeSliderNavHandler(button, targetId, 1);
  });
 
  root.querySelectorAll<HTMLButtonElement>('button[aria-label="Slide Left"]').forEach((button) => {
    if (button.getAttribute("onclick")) return;
    attachNativeSliderNavHandler(button, PORTFOLIO_PROJECTS_SLIDER_ID, -1);
  });
 
  root.querySelectorAll<HTMLButtonElement>('button[aria-label="Slide Right"]').forEach((button) => {
    if (button.getAttribute("onclick")) return;
    attachNativeSliderNavHandler(button, PORTFOLIO_PROJECTS_SLIDER_ID, 1);
  });
}
 
if (typeof window !== "undefined") {
  ensurePortfolioProjectsSliderGlobals();
}
 
 
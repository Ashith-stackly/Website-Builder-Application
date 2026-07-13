const DEFAULT_BASE_FONT_PX = 14;
const MIN_FONT_PX = 7;
const FONT_STEP_PX = 0.5;
const WIDTH_PADDING_PX = 4;

function getVisualZoomScale(): number {
  if (typeof window === "undefined") return 1;
  return window.visualViewport?.scale ?? 1;
}

function measureTextWidthPx(
  text: string,
  fontSizePx: number,
  input: HTMLInputElement
): number {
  const style = getComputedStyle(input);
  const span = document.createElement("span");
  span.setAttribute("aria-hidden", "true");
  span.style.position = "absolute";
  span.style.left = "-9999px";
  span.style.top = "0";
  span.style.visibility = "hidden";
  span.style.whiteSpace = "nowrap";
  span.style.fontFamily = style.fontFamily;
  span.style.fontWeight = style.fontWeight;
  span.style.fontSize = `${fontSizePx}px`;
  span.style.letterSpacing = style.letterSpacing;
  span.textContent = text;
  document.body.appendChild(span);
  const width = span.getBoundingClientRect().width;
  document.body.removeChild(span);
  return width;
}

function readNaturalBaseFontPx(input: HTMLInputElement): number {
  const previous = input.style.fontSize;
  input.style.removeProperty("font-size");
  const computed = parseFloat(getComputedStyle(input).fontSize);
  if (previous) input.style.fontSize = previous;
  return Number.isFinite(computed) && computed > 0
    ? computed
    : DEFAULT_BASE_FONT_PX;
}

/** Shrink input font only when placeholder text would overflow (incl. pinch / text zoom). */
export function fitInputPlaceholderToWidth(input: HTMLInputElement | null): void {
  if (!input || typeof window === "undefined") return;

  const text = input.getAttribute("placeholder") ?? "";
  if (!text) return;

  const available = input.clientWidth - WIDTH_PADDING_PX;
  if (available <= 0) return;

  const scale = getVisualZoomScale();
  const baseSize = readNaturalBaseFontPx(input);

  let chosen = baseSize;
  for (let size = baseSize; size >= MIN_FONT_PX; size -= FONT_STEP_PX) {
    const textWidth = measureTextWidthPx(text, size, input);
    if (textWidth * scale <= available) {
      chosen = size;
      break;
    }
  }

  input.style.setProperty("font-size", `${chosen}px`);
}

export function clearInputPlaceholderFit(input: HTMLInputElement | null): void {
  input?.style.removeProperty("font-size");
}

function scheduleFit(input: HTMLInputElement, run: () => void): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(run);
  });
}

/** Re-fit on resize / zoom; only active when `enabled` is true (mobile auth). */
export function observeAuthPlaceholderFit(
  input: HTMLInputElement | null,
  enabled: boolean
): () => void {
  if (!input || !enabled) {
    clearInputPlaceholderFit(input);
    return () => undefined;
  }

  const run = () => {
    if (document.activeElement === input) return;
    fitInputPlaceholderToWidth(input);
  };

  const runSoon = () => scheduleFit(input, run);

  runSoon();
  if (document.fonts?.ready) {
    void document.fonts.ready.then(() => runSoon());
  }
  const delayed = window.setTimeout(runSoon, 150);
  const delayed2 = window.setTimeout(runSoon, 400);

  const ro = new ResizeObserver(() => runSoon());
  ro.observe(input);
  const row = input.closest(".login-contact-row, .signup-phone-row");
  if (row) ro.observe(row);
  const country = input
    .closest(".signup-phone-row")
    ?.querySelector(".signup-country-select");
  if (country) ro.observe(country);

  const onViewportChange = () => runSoon();
  window.addEventListener("resize", onViewportChange);
  const vv = window.visualViewport;
  vv?.addEventListener("resize", onViewportChange);
  vv?.addEventListener("scroll", onViewportChange);

  return () => {
    window.clearTimeout(delayed);
    window.clearTimeout(delayed2);
    ro.disconnect();
    window.removeEventListener("resize", onViewportChange);
    vv?.removeEventListener("resize", onViewportChange);
    vv?.removeEventListener("scroll", onViewportChange);
    clearInputPlaceholderFit(input);
  };
}

export function isMobileAuthViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 1023px)").matches;
}

export type StatCounterFormat = {
  decimals?: number;
  prefix?: string;
  suffix?: string;
};

export function formatStatCounterValue(value: number, { decimals = 0, prefix = "", suffix = "" }: StatCounterFormat = {}) {
  const numeric = decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
  return `${prefix}${numeric}${suffix}`;
}

export function readStatCounterDataset(element: HTMLElement) {
  return {
    target: parseFloat(element.dataset.target || "0"),
    suffix: element.dataset.suffix || "",
    prefix: element.dataset.prefix || "",
    decimals: parseInt(element.dataset.decimals || "0", 10),
  };
}

export function finalizeStatCounterElement(element: HTMLElement) {
  const { target, suffix, prefix, decimals } = readStatCounterDataset(element);
  element.textContent = formatStatCounterValue(target, { decimals, prefix, suffix });
}

export function syncStatCounterDatasetFromText(element: HTMLElement) {
  const text = element.textContent || "";
  const match = text.match(/^(\+?-?)(\d+(?:\.\d+)?)(.*)$/);
  if (!match) return;

  element.dataset.prefix = match[1];
  element.dataset.target = match[2];
  element.dataset.suffix = match[3];
}

export function animateStatCounterElement(element: HTMLElement, frameIds: number[] = []) {
  if (document.activeElement === element) return frameIds;

  const { target, suffix, prefix, decimals } = readStatCounterDataset(element);
  const duration = 2000;
  const start = performance.now();

  const step = (now: number) => {
    if (document.activeElement === element) return;
    const progress = Math.min((now - start) / duration, 1);
    element.textContent = formatStatCounterValue(progress * target, { decimals, prefix, suffix });
    if (progress < 1) {
      frameIds.push(requestAnimationFrame(step));
    } else {
      element.textContent = formatStatCounterValue(target, { decimals, prefix, suffix });
    }
  };

  frameIds.push(requestAnimationFrame(step));
  return frameIds;
}

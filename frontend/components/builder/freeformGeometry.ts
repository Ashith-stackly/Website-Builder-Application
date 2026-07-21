import type { BuilderComponent } from "@/types/builder";
import {
  FREEFORM_MIN_HEIGHT,
  FREEFORM_MIN_WIDTH,
  getFreeformDefaultHeight,
  getFreeformDefaultWidth,
} from "@/lib/freeformLayout";

export const FREEFORM_GRID_SIZE = 8;
export { FREEFORM_MIN_WIDTH, FREEFORM_MIN_HEIGHT } from "@/lib/freeformLayout";

export interface FreeformFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FreeformGuide {
  axis: "x" | "y";
  position: number;
  /** Optional measurement displayed beside a guide. */
  distance?: number;
}

export interface FreeformCanvasBounds {
  width: number;
  height: number;
}

export function snapToGrid(value: number, gridSize = FREEFORM_GRID_SIZE) {
  return Math.round(value / gridSize) * gridSize;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/**
 * Creates a stable visual frame for legacy Flow components without writing a
 * position to the project. A component becomes persisted freeform content
 * only after the user moves or resizes it.
 */
export function getFreeformFrame(
  component: BuilderComponent,
  index: number,
  canvasWidth: number,
  measuredHeight?: number,
): FreeformFrame {
  const width = clamp(
    component.freeformSize?.width ?? getFreeformDefaultWidth(canvasWidth),
    FREEFORM_MIN_WIDTH,
    Math.max(FREEFORM_MIN_WIDTH, canvasWidth - 32),
  );
  const height = Math.max(
    FREEFORM_MIN_HEIGHT,
    component.freeformSize?.height ?? measuredHeight ?? getFreeformDefaultHeight(component.type),
  );
  const fallbackX = 40 + (index % 5) * 24;
  const fallbackY = 40 + index * 36;

  return {
    x: clamp(component.position?.x ?? fallbackX, 0, Math.max(0, canvasWidth - width)),
    y: Math.max(0, component.position?.y ?? fallbackY),
    width,
    height,
  };
}

export function clampFrameToBounds(
  frame: FreeformFrame,
  bounds: FreeformCanvasBounds,
): FreeformFrame {
  const width = clamp(frame.width, FREEFORM_MIN_WIDTH, Math.max(FREEFORM_MIN_WIDTH, bounds.width));
  const height = Math.max(FREEFORM_MIN_HEIGHT, frame.height);
  return {
    x: clamp(frame.x, 0, Math.max(0, bounds.width - width)),
    // The page height grows to fit its items, so vertical movement should not
    // be artificially capped by the current viewport height.
    y: Math.max(0, frame.y),
    width,
    height,
  };
}

function edgeTargets(frame: FreeformFrame, axis: "x" | "y") {
  const start = axis === "x" ? frame.x : frame.y;
  const size = axis === "x" ? frame.width : frame.height;
  return [start, start + size / 2, start + size];
}

/**
 * Finds the nearest edge/centre alignment and returns a snapped frame plus
 * visual guides. Canvas boundaries are included as targets so a block can be
 * aligned precisely to the page or page centre without another block nearby.
 */
export function alignFreeformFrame(
  frame: FreeformFrame,
  siblings: FreeformFrame[],
  bounds: FreeformCanvasBounds,
  threshold = 6,
): { frame: FreeformFrame; guides: FreeformGuide[] } {
  const next = { ...frame };
  const guides: FreeformGuide[] = [];

  for (const axis of ["x", "y"] as const) {
    const pageSize = axis === "x" ? bounds.width : bounds.height;
    const targets = [0, pageSize / 2, pageSize];
    for (const sibling of siblings) targets.push(...edgeTargets(sibling, axis));

    let best: { delta: number; target: number } | null = null;
    for (const edge of edgeTargets(next, axis)) {
      for (const target of targets) {
        const delta = target - edge;
        if (Math.abs(delta) > threshold) continue;
        if (!best || Math.abs(delta) < Math.abs(best.delta)) {
          best = { delta, target };
        }
      }
    }

    if (!best) continue;
    if (axis === "x") next.x += best.delta;
    else next.y += best.delta;
    guides.push({ axis, position: best.target });
  }

  // Small measurement overlays make spacing decisions visible while dragging.
  const nearestLeft = siblings
    .filter((sibling) => sibling.x + sibling.width <= next.x)
    .sort((a, b) => b.x + b.width - (a.x + a.width))[0];
  if (nearestLeft) {
    const distance = Math.round(next.x - (nearestLeft.x + nearestLeft.width));
    if (distance > 0 && distance <= 240) {
      guides.push({ axis: "x", position: nearestLeft.x + nearestLeft.width + distance / 2, distance });
    }
  }

  const nearestAbove = siblings
    .filter((sibling) => sibling.y + sibling.height <= next.y)
    .sort((a, b) => b.y + b.height - (a.y + a.height))[0];
  if (nearestAbove) {
    const distance = Math.round(next.y - (nearestAbove.y + nearestAbove.height));
    if (distance > 0 && distance <= 240) {
      guides.push({ axis: "y", position: nearestAbove.y + nearestAbove.height + distance / 2, distance });
    }
  }

  return { frame: clampFrameToBounds(next, bounds), guides };
}

export function framesIntersect(a: FreeformFrame, b: FreeformFrame) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

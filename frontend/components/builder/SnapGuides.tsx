"use client";

import { memo } from "react";

export interface GuideLine {
  orientation: "horizontal" | "vertical";
  /** Position in px relative to the canvas container. */
  position: number;
}

/**
 * Calculate snap guide lines between a dragged element and its siblings.
 * Returns lines for center and edge alignment within a threshold.
 */
export function calculateGuides(
  dragRect: DOMRect,
  siblingRects: DOMRect[],
  threshold: number = 4,
): { guides: GuideLine[]; snapX: number | null; snapY: number | null } {
  const guides: GuideLine[] = [];
  let snapX: number | null = null;
  let snapY: number | null = null;

  const dragCenterX = dragRect.left + dragRect.width / 2;
  const dragCenterY = dragRect.top + dragRect.height / 2;

  for (const sib of siblingRects) {
    const sibCenterX = sib.left + sib.width / 2;
    const sibCenterY = sib.top + sib.height / 2;

    // Vertical guides (snap X positions)
    // Left edge to left edge
    if (Math.abs(dragRect.left - sib.left) <= threshold) {
      guides.push({ orientation: "vertical", position: sib.left });
      snapX = sib.left;
    }
    // Right edge to right edge
    if (Math.abs(dragRect.right - sib.right) <= threshold) {
      guides.push({ orientation: "vertical", position: sib.right });
      snapX = sib.right - dragRect.width;
    }
    // Center to center (vertical)
    if (Math.abs(dragCenterX - sibCenterX) <= threshold) {
      guides.push({ orientation: "vertical", position: sibCenterX });
      snapX = sibCenterX - dragRect.width / 2;
    }
    // Left edge to right edge
    if (Math.abs(dragRect.left - sib.right) <= threshold) {
      guides.push({ orientation: "vertical", position: sib.right });
      snapX = sib.right;
    }
    // Right edge to left edge
    if (Math.abs(dragRect.right - sib.left) <= threshold) {
      guides.push({ orientation: "vertical", position: sib.left });
      snapX = sib.left - dragRect.width;
    }

    // Horizontal guides (snap Y positions)
    // Top edge to top edge
    if (Math.abs(dragRect.top - sib.top) <= threshold) {
      guides.push({ orientation: "horizontal", position: sib.top });
      snapY = sib.top;
    }
    // Bottom edge to bottom edge
    if (Math.abs(dragRect.bottom - sib.bottom) <= threshold) {
      guides.push({ orientation: "horizontal", position: sib.bottom });
      snapY = sib.bottom - dragRect.height;
    }
    // Center to center (horizontal)
    if (Math.abs(dragCenterY - sibCenterY) <= threshold) {
      guides.push({ orientation: "horizontal", position: sibCenterY });
      snapY = sibCenterY - dragRect.height / 2;
    }
    // Top edge to bottom edge
    if (Math.abs(dragRect.top - sib.bottom) <= threshold) {
      guides.push({ orientation: "horizontal", position: sib.bottom });
      snapY = sib.bottom;
    }
    // Bottom edge to top edge
    if (Math.abs(dragRect.bottom - sib.top) <= threshold) {
      guides.push({ orientation: "horizontal", position: sib.top });
      snapY = sib.top - dragRect.height;
    }
  }

  // Deduplicate guides by orientation + position
  const unique = guides.filter(
    (g, i, arr) => arr.findIndex((a) => a.orientation === g.orientation && Math.abs(a.position - g.position) < 1) === i,
  );

  return { guides: unique, snapX, snapY };
}

/**
 * Renders snap guide lines on the canvas.
 * The parent container must have `position: relative` so guide lines overlay correctly.
 */
function SnapGuides({
  guides,
  containerRect,
}: {
  guides: GuideLine[];
  containerRect: DOMRect | null;
}) {
  if (!containerRect || guides.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {guides.map((g, i) => {
        if (g.orientation === "vertical") {
          const x = g.position - containerRect.left;
          return (
            <div
              key={`v-${i}`}
              className="absolute top-0 h-full w-px"
              style={{
                left: x,
                background: "linear-gradient(to bottom, transparent 0%, #3b82f6 20%, #3b82f6 80%, transparent 100%)",
                boxShadow: "0 0 6px rgba(59, 130, 246, 0.5)",
              }}
            />
          );
        }
        // horizontal
        const y = g.position - containerRect.top;
        return (
          <div
            key={`h-${i}`}
            className="absolute left-0 h-px w-full"
            style={{
              top: y,
              background: "linear-gradient(to right, transparent 0%, #3b82f6 20%, #3b82f6 80%, transparent 100%)",
              boxShadow: "0 0 6px rgba(59, 130, 246, 0.5)",
            }}
          />
        );
      })}
    </div>
  );
}

export default memo(SnapGuides);

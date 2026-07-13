"use client";

import type { BuilderComponent } from "@/types/builder";
import { toReactStyle } from "./componentStyles";

/** Maps layout strings to CSS grid-template-columns values. */
const LAYOUT_GRID: Record<string, string> = {
  "50/50":    "1fr 1fr",
  "33/33/33": "1fr 1fr 1fr",
  "25/50/25": "1fr 2fr 1fr",
  "25/75":    "1fr 3fr",
  "75/25":    "3fr 1fr",
  "33/67":    "1fr 2fr",
  "67/33":    "2fr 1fr",
};

export const ROW_LAYOUTS = Object.keys(LAYOUT_GRID) as Array<keyof typeof LAYOUT_GRID>;

export const rowDefaults = {
  layout: "50/50" as const,
};

export default function RowComponent({
  component,
  children,
}: {
  component: BuilderComponent;
  children?: React.ReactNode;
  isEditing?: boolean;
  onUpdate?: (content: string | null) => void;
}) {
  const layout = (component.props?.layout as string) || component.content || "50/50";
  const gridCols = LAYOUT_GRID[layout] ?? LAYOUT_GRID["50/50"];
  const hasChildren = component.children.length > 0;
  const colCount = layout.split("/").length;

  return (
    <section
      className="w-full"
      style={toReactStyle(component.styles)}
    >
      {hasChildren ? (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: gridCols }}
        >
          {children}
        </div>
      ) : (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: gridCols }}
        >
          {Array.from({ length: colCount }).map((_, i) => (
            <div
              key={i}
              className="flex min-h-[120px] items-center justify-center rounded-xl border-2 border-dashed border-[#dbe3ef] bg-gradient-to-br from-white/60 to-[#f7f9fc] text-center transition-colors hover:border-blue-300 hover:from-blue-50/30 hover:to-indigo-50/20"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef4fb] text-[#566583]">
                  <span className="text-[11px] font-black">{i + 1}</span>
                </div>
                <span className="text-[11px] font-bold text-[#566583]">
                  Drop blocks here
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

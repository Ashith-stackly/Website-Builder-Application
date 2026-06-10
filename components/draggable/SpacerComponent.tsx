"use client";

import type { BuilderComponent } from "@/types/builder";
import { getBaseStyles } from "./componentStyles";

export default function SpacerComponent({
  component,
}: {
  component: BuilderComponent;
  children?: React.ReactNode;
  isEditing?: boolean;
  onUpdate?: (content: string | null) => void;
  onPatch?: (patch: Partial<BuilderComponent>) => void;
}) {
  const height = String(component.props?.height || component.content || "60px");
  const base = getBaseStyles(component);

  return (
    <div
      style={{
        ...base,
        height,
        minHeight: "20px",
        position: "relative",
      }}
      className="group flex w-full items-center justify-center"
    >
      {/* Dashed line indicator for editing */}
      <div className="absolute inset-x-4 top-1/2 border-t-2 border-dashed border-[#dbe3ef] opacity-40 group-hover:opacity-80 transition" />
      <span className="relative z-10 rounded-full bg-[#f7f9fc] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] opacity-0 group-hover:opacity-100 transition">
        Spacer · {height}
      </span>
    </div>
  );
}


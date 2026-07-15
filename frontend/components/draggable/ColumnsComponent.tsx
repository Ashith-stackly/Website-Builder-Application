import { LayoutGrid } from "lucide-react";
import type { BuilderComponent } from "@/types/builder";
import { toReactStyle } from "./componentStyles";

const COL_CLASS: Record<string, string> = {
  "1": "grid-cols-1",
  "2": "grid-cols-1 sm:grid-cols-2",
  "3": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  "4": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

import { useBuilderStore } from "@/store/builderStore";

export default function ColumnsComponent({
  component,
  children,
}: {
  component: BuilderComponent;
  children?: React.ReactNode;
  isEditing?: boolean;
  onUpdate?: (content: string | null) => void;
}) {
  const viewport = useBuilderStore((s) => s.viewport);
  const colCount = component.content || "3";
  const hasChildren = component.children.length > 0;
  const count = parseInt(colCount) || 3;

  // Viewport-aware layout calculation
  const currentCols = viewport === "mobile"
    ? 1
    : (viewport === "tablet" && count > 2 ? 2 : count);

  const colStyle = {
    gridTemplateColumns: `repeat(${currentCols}, minmax(0, 1fr))`,
  };

  return (
    <div
      className={`w-full ${hasChildren ? "grid gap-4" : ""}`}
      style={{ ...toReactStyle(component.styles), ...colStyle }}
    >
      {hasChildren ? (
        children
      ) : (
        <div className="grid gap-3" style={colStyle}>
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="group/col flex min-h-[120px] items-center justify-center rounded-xl border-2 border-dashed border-[#dbe3ef] bg-gradient-to-br from-white/60 to-[#f7f9fc] text-center transition-all hover:border-blue-300 hover:from-blue-50/30 hover:to-indigo-50/20 hover:shadow-sm"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef4fb] text-[#566583] transition-colors group-hover/col:bg-blue-100 group-hover/col:text-blue-600">
                  <LayoutGrid className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[#566583]">Column {i + 1}</p>
                  <p className="text-[10px] text-[#8898aa]">Drop blocks here</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


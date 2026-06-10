import type { BuilderComponent } from "@/types/builder";
import { toReactStyle } from "./componentStyles";

const COL_CLASS: Record<string, string> = {
  "1": "grid-cols-1",
  "2": "grid-cols-1 sm:grid-cols-2",
  "3": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  "4": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export default function ColumnsComponent({
  component,
  children,
}: {
  component: BuilderComponent;
  children?: React.ReactNode;
  isEditing?: boolean;
  onUpdate?: (content: string | null) => void;
}) {
  const colCount = component.content || "3";
  const colClass = COL_CLASS[colCount] ?? "grid-cols-1 sm:grid-cols-3";
  const hasChildren = component.children.length > 0;

  return (
    <div
      className={`w-full ${hasChildren ? `grid gap-4 ${colClass}` : ""}`}
      style={toReactStyle(component.styles)}
    >
      {hasChildren ? (
        children
      ) : (
        <div className="flex min-h-[110px] w-full items-center justify-center rounded-xl border-2 border-dashed border-[#dbe3ef] text-center text-sm font-medium text-[#566583]">
          <span>
            Drop <strong className="text-[#0B1D40]">Feature Items</strong> here
            <br />
            <span className="text-xs font-normal text-[#8898aa]">
              ({colCount} column{colCount !== "1" ? "s" : ""})
            </span>
          </span>
        </div>
      )}
    </div>
  );
}


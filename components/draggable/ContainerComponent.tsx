import type { BuilderComponent } from "@/types/builder";
import { toReactStyle } from "./componentStyles";

export default function ContainerComponent({
  component,
  children,
}: {
  component: BuilderComponent;
  children?: React.ReactNode;
  isEditing?: boolean;
  onUpdate?: (content: string | null) => void;
}) {
  const hasChildren = component.children.length > 0;

  return (
    <section
      className="w-full min-h-[120px] rounded-xl border border-dashed border-[#dbe3ef]"
      style={toReactStyle(component.styles)}
    >
      {hasChildren ? (
        <div className="flex flex-col gap-3">{children}</div>
      ) : (
        <div className="flex min-h-[80px] items-center justify-center text-sm font-semibold text-[#566583]">
          Drop blocks here
        </div>
      )}
    </section>
  );
}


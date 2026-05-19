import type { BuilderComponent } from "@/types/builder";
import { toReactStyle } from "./componentStyles";

export default function ContainerComponent({ component }: { component: BuilderComponent }) {
  return (
    <section className="min-h-[120px] border border-dashed border-[#dbe3ef]" style={toReactStyle(component.styles)}>
      {component.children.length > 0 ? (
        component.children.map((child) => (
          <div key={child.id}>{child.content}</div>
        ))
      ) : (
        <div className="flex min-h-[72px] items-center justify-center text-sm font-semibold text-[#566583]">
          Container
        </div>
      )}
    </section>
  );
}

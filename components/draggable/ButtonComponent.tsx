import type { BuilderComponent } from "@/types/builder";
import { toReactStyle } from "./componentStyles";

export default function ButtonComponent({ component }: { component: BuilderComponent }) {
  return (
    <button
      className="inline-flex items-center justify-center font-bold shadow-sm transition-all duration-300 hover:-translate-y-[1px] hover:shadow-md active:scale-[0.98]"
      style={toReactStyle(component.styles)}
      type="button"
    >
      {component.content}
    </button>
  );
}

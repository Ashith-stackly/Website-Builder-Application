import type { BuilderComponent } from "@/types/builder";
import { toReactStyle } from "./componentStyles";

export default function TextComponent({ component }: { component: BuilderComponent }) {
  return (
    <p className="leading-7" style={toReactStyle(component.styles)}>
      {component.content}
    </p>
  );
}

import type { BuilderComponent } from "@/types/builder";
import { toReactStyle } from "./componentStyles";

export default function HeadingComponent({ component }: { component: BuilderComponent }) {
  return (
    <h1 className="font-bold leading-tight tracking-normal" style={toReactStyle(component.styles)}>
      {component.content}
    </h1>
  );
}

import type { BuilderComponent } from "@/types/builder";
import { toReactStyle } from "./componentStyles";

export default function DividerComponent({ component }: { component: BuilderComponent }) {
  return <hr className="border-0" style={toReactStyle(component.styles)} />;
}


import type { BuilderComponent } from "@/types/builder";
import { toReactStyle } from "./componentStyles";

export default function InputComponent({ component }: { component: BuilderComponent }) {
  return (
    <input
      className="border border-[#dbe3ef] font-medium outline-none transition focus:ring-2 focus:ring-blue-100"
      placeholder={component.content}
      readOnly
      style={toReactStyle(component.styles)}
    />
  );
}


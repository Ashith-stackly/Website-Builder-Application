import Image from "next/image";
import type { BuilderComponent } from "@/types/builder";
import { toReactStyle } from "./componentStyles";

export default function ImageComponent({ component }: { component: BuilderComponent }) {
  return (
    <Image
      alt="Builder preview"
      className="block max-w-full object-cover"
      height={360}
      src={component.content || "/showcase.webp"}
      style={toReactStyle(component.styles)}
      unoptimized
      width={960}
    />
  );
}

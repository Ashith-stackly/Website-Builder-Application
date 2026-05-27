"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { BuilderComponent } from "@/types/builder";
import { toReactStyle } from "./componentStyles";
import { useAssetStore } from "@/store/assetStore";

export default function ImageComponent({ component }: { component: BuilderComponent }) {
  const getUrl   = useAssetStore((s) => s.getUrl);
  const assetId  = component.props?.assetId as string | undefined;
  const fallback = component.content || "/showcase.webp";

  const [src, setSrc] = useState<string>(fallback);

  useEffect(() => {
    if (!assetId) { setSrc(fallback); return; }
    getUrl(assetId).then((url) => setSrc(url ?? fallback));
  }, [assetId, fallback, getUrl]);

  return (
    <Image
      alt={(component.props?.alt as string | undefined) ?? "Builder image"}
      className="block max-w-full object-cover"
      height={360}
      src={src}
      style={toReactStyle(component.styles)}
      unoptimized
      width={960}
    />
  );
}

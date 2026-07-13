"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImageIcon, RefreshCw } from "lucide-react";
import type { BuilderComponent } from "@/types/builder";
import { toReactStyle } from "./componentStyles";
import { useAssetStore } from "@/store/assetStore";

export default function ImageComponent({ component }: { component: BuilderComponent }) {
  const getUrl   = useAssetStore((s) => s.getUrl);
  const assetId  = component.props?.assetId as string | undefined;
  const fallback = component.content || "/showcase.webp";
  const hasExplicitImage = Boolean(component.content && component.content !== "/showcase.webp") || Boolean(assetId);

  const [src, setSrc] = useState<string>(fallback);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
    if (!assetId) { setSrc(fallback); return; }
    getUrl(assetId).then((url) => setSrc(url ?? fallback));
  }, [assetId, fallback, getUrl]);

  const reactStyle = toReactStyle(component.styles);

  /* Show empty placeholder when no image is selected */
  if (!hasExplicitImage || imgError) {
    return (
      <div
        className="group/img relative flex w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-[#dbe3ef] bg-gradient-to-br from-[#f7f9fc] to-[#eef4fb] transition-colors hover:border-blue-300 hover:from-blue-50/40 hover:to-indigo-50/30"
        style={{ ...reactStyle, minHeight: reactStyle.height || "180px", display: "flex" }}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 text-[#0B1D40]/40 shadow-sm transition-transform group-hover/img:scale-110 group-hover/img:text-blue-500">
            <ImageIcon className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#0B1D40]/60 group-hover/img:text-[#0B1D40]/80">Click to select an image</p>
            <p className="mt-1 text-[11px] text-[#566583]/70">Use the settings panel to upload or choose</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group/img relative overflow-hidden" style={{ width: reactStyle.width, borderRadius: reactStyle.borderRadius }}>
      <Image
        alt={(component.props?.alt as string | undefined) ?? "Builder image"}
        className="block max-w-full object-cover transition-[filter] duration-200 group-hover/img:brightness-[0.85]"
        height={360}
        src={src}
        style={reactStyle}
        unoptimized
        width={960}
        onError={() => setImgError(true)}
      />
      {/* Hover overlay */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover/img:opacity-100">
        <div className="flex items-center gap-2 rounded-lg bg-black/60 px-4 py-2.5 backdrop-blur-sm">
          <RefreshCw className="h-4 w-4 text-white" />
          <span className="text-[12px] font-bold text-white">Change Image</span>
        </div>
      </div>
    </div>
  );
}


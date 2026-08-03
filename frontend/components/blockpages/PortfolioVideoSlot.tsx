"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import BlockpagesInlineVideo from "@/app/blockpages/videoblock/BlockpagesInlineVideo";
import type { VideoBlockProps } from "@/app/blockpages/videoblock/types";
import { assetPath } from "@/lib/paths";
import {
  getDefaultPortfolioVideoProps,
  hasPlayableVideoProps,
  loadBlockpagesVideoProps,
  normalizePortfolioVideoProps,
} from "@/lib/blockpagesVideoStorage";

type PortfolioVideoSlotProps = {
  className?: string;
  /** When true, hydrate from saved block-pages video props (public /portfolio). */
  useStoredProps?: boolean;
  blockProps?: VideoBlockProps | null;
  posterFallback?: string;
};

export default function PortfolioVideoSlot({
  className = "",
  useStoredProps = false,
  blockProps: blockPropsProp,
  posterFallback,
}: PortfolioVideoSlotProps) {
  const [storedProps, setStoredProps] = useState<VideoBlockProps | null>(null);

  useEffect(() => {
    if (!useStoredProps || blockPropsProp) return;

    const refresh = () => {
      setStoredProps(loadBlockpagesVideoProps("portfolio"));
    };
    refresh();

    const onStorage = (event: StorageEvent) => {
      if (
        event.key === "portfolioVideoData" ||
        event.key === "stackly-blockpages-video-props-portfolio"
      ) {
        refresh();
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("stackly-portfolio-video-updated", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("stackly-portfolio-video-updated", refresh);
    };
  }, [useStoredProps, blockPropsProp]);

  const blockProps = normalizePortfolioVideoProps(
    blockPropsProp ?? storedProps ?? getDefaultPortfolioVideoProps()
  );
  const poster =
    posterFallback ??
    blockProps.posterImage ??
    assetPath("/video_block_bg.png");

  return (
    <div
      className={`relative w-full max-w-[640px] aspect-video rounded-[2rem] overflow-hidden shadow-2xl bg-[#06224C] ${className}`.trim()}
      data-crop-wrapper-id="video_block_bg"
      data-blockpages-video-slot="true"
      data-blockpages-video-id="video_block"
    >
      {hasPlayableVideoProps(blockProps) ? (
        <BlockpagesInlineVideo blockProps={blockProps} posterFallback={poster} />
      ) : (
        <Image
          src={poster}
          alt="Video preview"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 640px"
          unoptimized
          data-image-id="video_block_bg"
        />
      )}
    </div>
  );
}

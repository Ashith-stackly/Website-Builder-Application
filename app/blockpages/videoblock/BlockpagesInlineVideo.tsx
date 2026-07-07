"use client";

import { useEffect, useRef } from "react";
import { assetPath } from "@/lib/paths";
import type { VideoBlockProps } from "./types";

type BlockpagesInlineVideoProps = {
  blockProps: VideoBlockProps;
  posterFallback?: string;
};

function UploadedVideoPlayer({ blockProps, posterFallback }: BlockpagesInlineVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (blockProps.startTime !== undefined && videoRef.current.currentTime < blockProps.startTime) {
        videoRef.current.currentTime = blockProps.startTime;
      } else if (blockProps.endTime !== undefined && videoRef.current.currentTime > blockProps.endTime) {
        videoRef.current.currentTime = blockProps.startTime || 0;
      }
    }
  }, [blockProps.startTime, blockProps.endTime]);

  return (
    <video
      ref={videoRef}
      src={blockProps.uploadUrl}
      poster={blockProps.posterImage || posterFallback || assetPath("/video_block_bg.png")}
      autoPlay={blockProps.autoplay}
      loop={blockProps.loop}
      muted={blockProps.muted}
      controls={blockProps.showControls}
      disablePictureInPicture
      disableRemotePlayback
      controlsList="nodownload noremoteplayback noplaybackrate"
      className="h-full w-full object-cover"
      data-blockpages-video-id="video_block"
      onTimeUpdate={(event) => {
        const video = event.currentTarget;
        const endTime = blockProps.endTime;
        const startTime = blockProps.startTime;
        const hasValidEndTime = endTime !== undefined && (startTime === undefined || endTime > startTime);

        if (hasValidEndTime && video.currentTime >= endTime) {
          if (blockProps.loop) {
            video.currentTime = startTime || 0;
            video.play().catch(() => {});
          } else {
            video.pause();
            video.currentTime = endTime;
          }
        } else if (startTime !== undefined && video.currentTime < startTime) {
          video.currentTime = startTime;
        }
      }}
      onLoadedMetadata={(event) => {
        const video = event.currentTarget;
        if (blockProps.startTime !== undefined && video.currentTime < blockProps.startTime) {
          video.currentTime = blockProps.startTime;
        }
      }}
    />
  );
}

export default function BlockpagesInlineVideo({ blockProps, posterFallback }: BlockpagesInlineVideoProps) {
  if (blockProps.sourceType === "embed" && blockProps.embedCode?.trim()) {
    const trimmed = blockProps.embedCode.trim();
    if (trimmed.startsWith("http")) {
      let embedUrl = trimmed;
      try {
        if (embedUrl.includes("youtube.com/watch")) {
          const videoId = new URL(embedUrl).searchParams.get("v");
          if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (embedUrl.includes("youtu.be/")) {
          const videoId = embedUrl.split("youtu.be/")[1].split("?")[0];
          if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (embedUrl.includes("vimeo.com/")) {
          const videoId = embedUrl.split("vimeo.com/")[1].split("?")[0];
          if (videoId) embedUrl = `https://player.vimeo.com/video/${videoId}`;
        }

        const urlObj = new URL(embedUrl);
        if (embedUrl.includes("youtube.com/embed")) {
          if (blockProps.startTime !== undefined) {
            urlObj.searchParams.set("start", Math.floor(blockProps.startTime).toString());
          }
          if (blockProps.endTime !== undefined) {
            urlObj.searchParams.set("end", Math.floor(blockProps.endTime).toString());
          }
        } else if (blockProps.startTime !== undefined) {
          urlObj.hash = `#t=${Math.floor(blockProps.startTime)}s`;
        }
        embedUrl = urlObj.toString();
      } catch {
        // Keep original URL when parsing fails.
      }

      return (
        <iframe
          src={embedUrl}
          title="Embedded video"
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          data-blockpages-video-id="video_block"
        />
      );
    }

    return (
      <div
        className="h-full w-full [&>iframe]:h-full [&>iframe]:w-full"
        data-blockpages-video-id="video_block"
        dangerouslySetInnerHTML={{ __html: blockProps.embedCode }}
      />
    );
  }

  if (blockProps.sourceType === "upload" && blockProps.uploadUrl) {
    return <UploadedVideoPlayer blockProps={blockProps} posterFallback={posterFallback} />;
  }

  return null;
}

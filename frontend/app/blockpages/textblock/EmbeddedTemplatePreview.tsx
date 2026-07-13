"use client";

import { routePath } from "@/lib/paths";
import {
  BLOCKPAGES_PREVIEW_ROUTES,
  getBlockpagesTemplateLabel,
  type BlockpagesTemplateId,
} from "@/lib/blockpagesTemplates";

type EmbeddedTemplatePreviewProps = {
  template: BlockpagesTemplateId;
};

export default function EmbeddedTemplatePreview({ template }: EmbeddedTemplatePreviewProps) {
  const previewPath = BLOCKPAGES_PREVIEW_ROUTES[template];

  if (!previewPath) {
    return (
      <div className="flex min-h-[640px] items-center justify-center rounded-xl border border-[#dbe3ef] bg-white p-8 text-center">
        <p className="text-sm font-semibold text-[#0B1D40]">
          Preview for {getBlockpagesTemplateLabel(template)} is not available yet.
        </p>
      </div>
    );
  }

  return (
    <div
      className="@container w-full min-h-[640px] max-w-full min-w-0 overflow-x-hidden rounded-none sm:rounded-xl border-0 sm:border-2 border-gray-300 flex flex-col relative bg-white box-border"
      data-textblock-canvas
    >
      <iframe
        src={routePath(previewPath)}
        title={`${getBlockpagesTemplateLabel(template)} editor preview`}
        className="block w-full min-w-0 max-w-full flex-1 border-0 bg-white"
        style={{ minHeight: "720px", height: "calc(100dvh - 180px)" }}
      />
    </div>
  );
}

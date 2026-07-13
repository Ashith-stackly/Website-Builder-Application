"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { downloadHtml } from "@/lib/exportHtml";
import { useAssetStore } from "@/store/assetStore";
import { useDesignStore } from "@/store/designStore";
import { blobToDataUrl } from "@/lib/assetUtils";
import type { BuilderComponent } from "@/types/builder";

async function srcToDataUrl(src: string): Promise<string> {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) return src;

  try {
    const response = await fetch(src);
    if (!response.ok) return src;
    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) return src;
    return blobToDataUrl(blob);
  } catch {
    return src;
  }
}

async function embedGalleryContent(content: string): Promise<string> {
  const lines = content.split("\n");
  const embedded = await Promise.all(
    lines.map(async (line) => {
      const [rawSrc = "", ...rest] = line.split("|");
      const src = rawSrc.trim();
      if (!src) return line;
      const dataUrl = await srcToDataUrl(src);
      return [dataUrl, ...rest].join("|");
    }),
  );

  return embedded.join("\n");
}

async function embedPropImages(
  props: BuilderComponent["props"],
  getDataUrl: (id: string) => Promise<string | null>,
): Promise<BuilderComponent["props"]> {
  if (!props) return props;

  const media = props?.media;
  let nextProps = props;

  if (
    media &&
    typeof media === "object" &&
    !Array.isArray(media) &&
    "src" in media &&
    typeof media.src === "string"
  ) {
    nextProps = {
      ...nextProps,
      media: {
        ...media,
        src: await srcToDataUrl(media.src),
      },
    };
  }

  if (typeof nextProps.logoUrl === "string" && nextProps.logoUrl) {
    const logoAssetId = typeof nextProps.logoAssetId === "string" ? nextProps.logoAssetId : "";
    const logoDataUrl = logoAssetId ? await getDataUrl(logoAssetId) : null;

    nextProps = {
      ...nextProps,
      logoUrl: logoDataUrl || await srcToDataUrl(nextProps.logoUrl),
    };
  }

  return nextProps;
}

async function embedImageAssets(
  components: BuilderComponent[],
  getDataUrl: (id: string) => Promise<string | null>,
): Promise<BuilderComponent[]> {
  return Promise.all(
    components.map(async (component) => {
      const assetId = component.props?.assetId;
      const dataUrl = typeof assetId === "string" ? await getDataUrl(assetId) : null;
      const content =
        component.type === "gallery"
          ? await embedGalleryContent(component.content)
          : component.type === "image"
            ? dataUrl || await srcToDataUrl(component.content)
            : component.content;

      return {
        ...component,
        content: dataUrl || content,
        props: await embedPropImages(component.props, getDataUrl),
        children: await embedImageAssets(component.children, getDataUrl),
      };
    }),
  );
}

export default function ExportButton({ components }: { components: BuilderComponent[] }) {
  const [isExporting, setIsExporting] = useState(false);
  const getDataUrl = useAssetStore((s) => s.getDataUrl);
  const seo = useDesignStore((s) => s.seo);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      downloadHtml(await embedImageAssets(components, getDataUrl), seo);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      className="flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#0B1D40] px-3 py-2 text-[13px] font-bold text-white shadow-[0_2px_4px_rgba(11,29,64,0.3)] transition hover:bg-[#152B52] active:scale-95"
      disabled={isExporting}
      onClick={handleExport}
      type="button"
    >
      <span className="hidden lg:inline">{isExporting ? "Exporting" : "Export"}</span>
      <Download className="h-[14px] w-[14px]" />
    </button>
  );
}

"use client";

import { useState } from "react";
import { ImageIcon, Link, RefreshCw, Trash2 } from "lucide-react";
import type { BuilderComponent } from "@/types/builder";
import { ImagePicker } from "@/components/assets/ImagePicker";
import { useAssetStore } from "@/store/assetStore";

interface ImagePanelProps {
  component: BuilderComponent;
  onUpdate:  (id: string, patch: Partial<BuilderComponent>) => void;
}

export function ImagePanel({ component, onUpdate }: ImagePanelProps) {
  const getDataUrl = useAssetStore((s) => s.getDataUrl);
  const [pickerOpen, setPickerOpen] = useState(false);

  const currentSrc = component.content || "";
  const currentAlt = (component.props?.alt as string | undefined) ?? "";
  const hasImage   = !!currentSrc || !!component.props?.assetId;

  const handleSelect = async (url: string, assetId?: string) => {
    let storedUrl = url;

    if (assetId) {
      const dataUrl = await getDataUrl(assetId);
      if (dataUrl) storedUrl = dataUrl;
    }

    onUpdate(component.id, {
      content: storedUrl,
      props: { ...component.props, assetId: assetId ?? null, alt: currentAlt },
    });
    setPickerOpen(false);
  };

  const handleRemove = () => {
    onUpdate(component.id, {
      content: "",
      props: { ...component.props, assetId: null },
    });
  };

  return (
    <div className="space-y-4 px-5 py-5">
      {/* Preview + actions */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
        {hasImage ? (
          <img
            src={currentSrc || "/showcase.webp"}
            alt={currentAlt || "Preview"}
            className="h-36 w-full object-cover"
            onError={(e) => (e.currentTarget.src = "/showcase.webp")}
          />
        ) : (
          <div className="flex h-28 flex-col items-center justify-center gap-2 text-gray-300">
            <ImageIcon className="h-10 w-10" />
            <span className="text-[11px] font-medium">No image selected</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2 text-[12px] font-bold text-white hover:bg-blue-700 transition"
        >
          {hasImage ? (
            <><RefreshCw className="h-3.5 w-3.5" /> Replace</>
          ) : (
            <><ImageIcon className="h-3.5 w-3.5" /> Choose Image</>
          )}
        </button>

        {hasImage && (
          <button
            type="button"
            onClick={handleRemove}
            title="Remove image"
            className="flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-gray-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Alt text */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
          <Link className="h-3 w-3" /> Alt Text
        </label>
        <input
          value={currentAlt}
          onChange={(e) =>
            onUpdate(component.id, { props: { ...component.props, alt: e.target.value } })
          }
          placeholder="Describe the image…"
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[12px] outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <ImagePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
        currentUrl={currentSrc}
      />
    </div>
  );
}

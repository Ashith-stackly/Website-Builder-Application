"use client";

import { Maximize2, Minus, Plus } from "lucide-react";
import { useDesignStore } from "@/store/designStore";

export default function ZoomControls() {
  const zoom = useDesignStore((s) => s.zoom);
  const setZoom = useDesignStore((s) => s.setZoom);

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-[#dbe3ef] bg-white px-1 py-0.5 shadow-sm">
      <button
        type="button"
        title="Zoom out"
        onClick={() => setZoom(zoom - 10)}
        disabled={zoom <= 25}
        className="flex h-6 w-6 items-center justify-center rounded text-[#566583] transition hover:bg-gray-100 hover:text-[#0B1D40] disabled:opacity-30"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="min-w-[36px] text-center text-[11px] font-bold tabular-nums text-[#0B1D40]">
        {zoom}%
      </span>
      <button
        type="button"
        title="Zoom in"
        onClick={() => setZoom(zoom + 10)}
        disabled={zoom >= 200}
        className="flex h-6 w-6 items-center justify-center rounded text-[#566583] transition hover:bg-gray-100 hover:text-[#0B1D40] disabled:opacity-30"
      >
        <Plus className="h-3 w-3" />
      </button>
      <div className="mx-0.5 h-4 w-px bg-[#dbe3ef]" />
      <button
        type="button"
        title="Fit to view (100%)"
        onClick={() => setZoom(100)}
        className="flex h-6 w-6 items-center justify-center rounded text-[#566583] transition hover:bg-gray-100 hover:text-[#0B1D40]"
      >
        <Maximize2 className="h-3 w-3" />
      </button>
    </div>
  );
}

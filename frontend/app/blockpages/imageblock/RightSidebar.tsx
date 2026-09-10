"use client";
import React from "react";
import { Image as ImageIcon, Info } from "lucide-react";
import { useBuilder } from "./BuilderContext";

/**
 * Simplified Image RightSidebar.
 *
 * The Adjust/Crop controls have been moved inline into MainCanvas for
 * a consolidated editing experience.  This sidebar now shows contextual
 * guidance when no image is actively being edited, and a summary of
 * the active filters/crop when an image IS being edited.
 */
export default function RightSidebar() {
  const { activeFilter, activeCrop, imageAdjustments } = useBuilder();

  return (
    <aside className="relative z-30 hidden h-full w-[210px] shrink-0 flex-col overflow-hidden rounded-xl border border-[#efd9ce] bg-[#fff7f4] shadow-[0_18px_45px_rgba(110,60,35,0.10)] transition-transform duration-300 xl:flex">
      <div className="custom-scrollbar flex h-full flex-col overflow-y-auto bg-[#fff7f4]">
        <div className="flex shrink-0 border-b border-[#f2d8cf] bg-white/45 px-4 py-4">
          <h3 className="text-base font-bold text-[#0B1D40] flex items-center gap-2">
            <ImageIcon size={18} />
            Image Editor
          </h3>
        </div>

        <div className="flex flex-col gap-4 p-4">
          {/* Guidance */}
          <div className="flex items-start gap-2 rounded-lg border border-[#f2d8cf] bg-white/60 p-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#b08c7a]" />
            <p className="text-[12px] leading-relaxed text-[#6b4f42]">
              Use the <strong>main editor</strong> to upload, replace, or select
              an image from the gallery. Adjustments and crop are available
              inline.
            </p>
          </div>

          {/* Current Settings Summary */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#b08c7a]">
              Active Settings
            </h4>

            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[#6b4f42]">Filter</span>
              <span className="font-semibold text-[#0c1b33]">
                {activeFilter || "Original"}
              </span>
            </div>

            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[#6b4f42]">Crop</span>
              <span className="font-semibold text-[#0c1b33]">
                {activeCrop || "Custom"}
              </span>
            </div>

            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[#6b4f42]">Brightness</span>
              <span className="font-semibold text-[#0c1b33]">
                {imageAdjustments.brightness}
              </span>
            </div>

            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[#6b4f42]">Contrast</span>
              <span className="font-semibold text-[#0c1b33]">
                {imageAdjustments.contrast}
              </span>
            </div>

            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[#6b4f42]">Saturation</span>
              <span className="font-semibold text-[#0c1b33]">
                {imageAdjustments.saturation}
              </span>
            </div>

            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[#6b4f42]">Vignette</span>
              <span className="font-semibold text-[#0c1b33]">
                {imageAdjustments.vignette}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
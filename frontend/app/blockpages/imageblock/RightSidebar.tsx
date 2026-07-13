"use client";
import React, { useState } from "react";
import { ChevronDown, ChevronRight, Crop, Sliders, Image as ImageIcon } from "lucide-react";
import { useBuilder } from "./BuilderContext";
 
export default function RightSidebar() {
  const { elements, activeElementId, updateElement, imageAdjustments, setImageAdjustments, activeCrop, setActiveCrop } = useBuilder();
 
  // Accordion states
  const [isAdjustOpen, setIsAdjustOpen] = useState(true);
  const [isCropOpen, setIsCropOpen] = useState(true);
  const [isStyleOpen, setIsStyleOpen] = useState(true);
 
  const activeEl = activeElementId ? elements[activeElementId] : null;
 
  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeElementId) {
      const val = parseInt(e.target.value) || 0;
      updateElement(activeElementId, { opacity: Math.min(100, Math.max(0, val)) });
    }
  };
 
  const updateAdjustment = (key: keyof typeof imageAdjustments, value: number) => {
    setImageAdjustments(prev => ({ ...prev, [key]: value }));
  };
 
  return (
    <aside className="relative z-30 hidden h-full w-[210px] shrink-0 flex-col overflow-hidden rounded-xl border border-[#efd9ce] bg-[#fff7f4] shadow-[0_18px_45px_rgba(110,60,35,0.10)] transition-transform duration-300 xl:flex">
      <div className="custom-scrollbar flex h-full flex-col overflow-y-auto bg-[#fff7f4]">
        <div className="flex shrink-0 border-b border-[#f2d8cf] bg-white/45 px-4 py-4">
          <h3 className="text-base font-bold text-[#0B1D40] flex items-center gap-2">
            <ImageIcon size={18} />
            Image Editor
          </h3>
        </div>
 
        <div className={`flex flex-col flex-1 relative ${!activeEl ? 'opacity-50 pointer-events-none' : 'opacity-100 transition-opacity'}`}>
          {!activeEl && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-[85%] pointer-events-auto z-10">
              <p className="text-sm text-[#0c1b33] font-medium bg-slate-50 p-4 rounded-lg shadow-sm border border-slate-200">
                Select an image on the canvas to edit its properties.
              </p>
            </div>
          )}
 
          {/* Adjustments */}
          <div className="flex flex-col gap-4 border-b border-[#efd9ce] p-4">
            <div
              className="flex items-center justify-between text-[15px] font-bold text-[#0c1b33] cursor-pointer hover:opacity-80"
              onClick={() => setIsAdjustOpen(!isAdjustOpen)}
            >
              <div className="flex items-center gap-2">
                <Sliders size={16} />
                <span>Adjust</span>
              </div>
              {isAdjustOpen ? <ChevronDown size={18} className="text-[#0c1b33]" /> : <ChevronRight size={18} className="text-[#0c1b33]" />}
            </div>
 
            {isAdjustOpen && (
              <div className="flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
                {[{ label: 'Brightness', key: 'brightness', max: 120 }, { label: 'Contrast', key: 'contrast', max: 100 }, { label: 'Saturation', key: 'saturation', max: 100 }, { label: 'Vignette', key: 'vignette', max: 50 }].map(adj => (
                  <div key={adj.key}>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-[12px] font-bold text-[#0c1b33]">{adj.label}</label>
                      <span className="text-[11px] font-medium text-slate-500">{imageAdjustments[adj.key as keyof typeof imageAdjustments]}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={adj.max}
                      value={imageAdjustments[adj.key as keyof typeof imageAdjustments]}
                      onChange={(e) => updateAdjustment(adj.key as keyof typeof imageAdjustments, parseInt(e.target.value))}
                      className="w-full h-[3px] bg-slate-300 rounded-lg appearance-none cursor-pointer accent-[#0c1b33]"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
 
          {/* Crop */}
          <div className="flex flex-col gap-4 border-b border-[#efd9ce] p-4">
            <div
              className="flex items-center justify-between text-[15px] font-bold text-[#0c1b33] cursor-pointer hover:opacity-80"
              onClick={() => setIsCropOpen(!isCropOpen)}
            >
              <div className="flex items-center gap-2">
                <Crop size={16} />
                <span>Crop</span>
              </div>
              {isCropOpen ? <ChevronDown size={18} className="text-[#0c1b33]" /> : <ChevronRight size={18} className="text-[#0c1b33]" />}
            </div>
 
            {isCropOpen && (
              <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-200">
                {['Original', 'Square', '16:9', '4:3', '5:4', '9:16'].map(ratio => (
                  <button
                    key={ratio}
                    onClick={() => setActiveCrop(ratio)}
                    className={`py-1.5 px-2 text-[12px] font-medium rounded border transition-colors ${activeCrop === ratio ? 'border-[#0c1b33] bg-[#0c1b33] text-white' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            )}
          </div>
 
          {/* Styles (Opacity) */}
          {/* <div className="flex flex-col gap-5 border-b border-[#efd9ce] p-4">
            <div
              className="flex items-center justify-between text-[15px] font-bold text-[#0c1b33] cursor-pointer hover:opacity-80"
              onClick={() => setIsStyleOpen(!isStyleOpen)}
            >
              <span>Opacity</span>
              {isStyleOpen ? <ChevronDown size={18} className="text-[#0c1b33]" /> : <ChevronRight size={18} className="text-[#0c1b33]" />}
            </div>
 
            {isStyleOpen && (
              <div className="flex items-center gap-3 animate-in slide-in-from-top-2 duration-200">
                <div className="flex-1 relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={activeEl?.opacity ?? 100}
                    onChange={handleOpacityChange}
                    className="w-full h-[3px] bg-slate-300 rounded-lg appearance-none cursor-pointer accent-[#0c1b33]"
                  />
                </div>
                <div className="border border-slate-300 rounded-md px-2 py-1 min-w-[45px] flex justify-center bg-white shadow-sm">
                   <span className="text-[12px] font-bold text-[#0c1b33]">{activeEl?.opacity ?? 100}</span>
                </div>
              </div>
            )}
          </div> */}
 
        </div>
      </div>
    </aside>
  );
}
 
 
 
"use client";
import React from "react";
import Link from "next/link";
import { ChevronDown, Undo2, Redo2, Eye, Send, X, Image as ImageIcon, Save, Check, AlertTriangle, Loader2 } from "lucide-react";
import { useBuilder, BuilderElement } from "./BuilderContext";
import type { DraftSaveStatus } from "../BlockPagesClient";
import MyWebsiteDropdown from "../MyWebsiteDropdown";
 
export default function MainCanvas({
  editingImageId,
  onImageSelected,
  onSaveDraft,
  onPreview,
  saveStatus = "idle",
}: {
  editingImageId?: string | null;
  onImageSelected?: (url: string) => void;
  onSaveDraft?: () => void;
  onPreview?: () => void;
  saveStatus?: DraftSaveStatus;
} = {}) {
  const { elements, activeElementId, setActiveElementId, undo, redo, historyStack, futureStack, imageAdjustments, activeFilter, activeCrop } = useBuilder();
 
  const [uploadedImage, setUploadedImage] = React.useState<string | null>(null);
 
  const getFilterStyle = () => {
    return {};
  };
 
  const mountainSrc1 = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80";
  const mountainSrc2 = "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80";
 
  const fileInputRef = React.useRef<HTMLInputElement>(null);
 
  // Dynamic button styles mapper
  const getStyleClass = (style: BuilderElement["buttonStyle"]) => {
    switch (style) {
      case "circle": return "rounded-full";
      case "square": return "rounded-none";
      case "video": return "rounded-lg border-2 border-dashed";
      case "play": return "rounded-tr-xl rounded-bl-xl";
      default: return "rounded-md";
    }
  };
 
  const handleAction = (action: string) => {
    if (action === "Save Draft") {
      onSaveDraft?.();
    } else if (action === "Preview") {
      onPreview?.();
    } else {
      alert(`${action} functionality triggered successfully!`);
    }
  };
 
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
    }
    // Reset input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
 
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };
 
  const getPresetFilter = () => {
    switch (activeFilter) {
      case 'Vintage': return 'sepia(50%) hue-rotate(-30deg) contrast(120%)';
      case 'Cinematic': return 'contrast(120%) saturate(120%) brightness(90%)';
      case 'Black & White': return 'grayscale(100%)';
      case 'Nature': return 'saturate(150%) contrast(110%)';
      case 'Creative': return 'hue-rotate(90deg) saturate(150%)';
      default: return '';
    }
  };
 
  const getCropAspect = () => {
    switch (activeCrop) {
      case 'Square': return '1 / 1';
      case '16:9': return '16 / 9';
      case '5:4': return '5 / 4';
      case '4:3': return '4 / 3';
      case '9:16': return '9 / 16';
      case '7:5': return '7 / 5';
      default: return 'auto';
    }
  };
 
  const generateEditedImage = async (imageUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(imageUrl);
          return;
        }
 
        let targetWidth = img.width;
        let targetHeight = img.height;
        let sx = 0;
        let sy = 0;
        let sw = img.width;
        let sh = img.height;
 
        if (activeCrop && activeCrop !== 'Original' && activeCrop !== 'Custom') {
          let ratio = 1;
          if (activeCrop === 'Square') ratio = 1;
          else if (activeCrop === '16:9') ratio = 16/9;
          else if (activeCrop === '5:4') ratio = 5/4;
          else if (activeCrop === '4:3') ratio = 4/3;
          else if (activeCrop === '9:16') ratio = 9/16;
          else if (activeCrop === '7:5') ratio = 7/5;
 
          const imgRatio = img.width / img.height;
          if (imgRatio > ratio) {
            sh = img.height;
            sw = sh * ratio;
            sx = (img.width - sw) / 2;
          } else {
            sw = img.width;
            sh = sw / ratio;
            sy = (img.height - sh) / 2;
          }
          targetWidth = sw;
          targetHeight = sh;
        }
 
        canvas.width = targetWidth;
        canvas.height = targetHeight;
 
        if (imageAdjustments) {
          const brightness = (imageAdjustments.brightness / 60) * 100;
          const contrast = (imageAdjustments.contrast / 45) * 100;
          const saturate = (imageAdjustments.saturation / 55) * 100;
          const hueRotate = (imageAdjustments.tint - 30) * 2;
          const sepia = imageAdjustments.temperature > 65 ? (imageAdjustments.temperature - 65) : 0;
         
          let preset = '';
          if (activeFilter === 'Vintage') preset = 'sepia(50%) hue-rotate(-30deg) contrast(120%)';
          else if (activeFilter === 'Cinematic') preset = 'contrast(120%) saturate(120%) brightness(90%)';
          else if (activeFilter === 'Black & White') preset = 'grayscale(100%)';
          else if (activeFilter === 'Nature') preset = 'saturate(150%) contrast(110%)';
          else if (activeFilter === 'Creative') preset = 'hue-rotate(90deg) saturate(150%)';
 
          ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) hue-rotate(${hueRotate}deg) sepia(${sepia}%) ${preset}`;
        }
 
        ctx.globalAlpha = (elements["btn-2"]?.opacity ?? 100) / 100;
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
 
        try {
          const dataUrl = canvas.toDataURL("image/png");
          resolve(dataUrl);
        } catch(e) {
          console.error("Canvas export failed", e);
          resolve(imageUrl);
        }
      };
      img.onerror = () => resolve(imageUrl);
      img.src = imageUrl;
    });
  };
 
  return (
    <main className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#dbe3ef] bg-[#f7f9fc] shadow-[0_18px_45px_rgba(15,35,75,0.08)]">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*"
      />
 
      {imageAdjustments && (
        <style>{`
          .mobile-image-adjust {
            filter: brightness(${(imageAdjustments.brightness / 60) * 100}%)
                    contrast(${(imageAdjustments.contrast / 45) * 100}%)
                    saturate(${(imageAdjustments.saturation / 55) * 100}%)
                    drop-shadow(0 4px ${imageAdjustments.shadows / 2}px rgba(0,0,0,0.3))
                    hue-rotate(${(imageAdjustments.tint - 30) * 2}deg)
                    sepia(${imageAdjustments.temperature > 65 ? (imageAdjustments.temperature - 65) : 0}%)
                    ${getPresetFilter()};
          }
          .mobile-vignette::after {
            content: '';
            position: absolute;
            inset: 0;
            pointer-events: none;
            box-shadow: inset 0 0 ${imageAdjustments.vignette * 3}px rgba(0,0,0,0.7);
          }
          ${activeCrop !== 'Custom' && activeCrop !== 'Original' ? `
          .mobile-crop-adjust {
            aspect-ratio: ${getCropAspect()} !important;
          }
          ` : ''}
        `}</style>
      )}
 
      {/* Top Bar */}
      <div className="z-10 flex h-[64px] shrink-0 items-center justify-between gap-4 overflow-x-auto border-b border-[#dbe3ef] bg-white px-3 shadow-sm md:px-5">
        <MyWebsiteDropdown />
 
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex flex-shrink-0 items-center overflow-hidden rounded-md border border-gray-300 bg-white shadow-sm">
            <button
              onClick={undo}
              disabled={historyStack.length <= 1}
              className={`border-r border-gray-300 px-3 py-2 transition-colors ${historyStack.length > 1 ? 'text-gray-600 hover:bg-gray-50 cursor-pointer' : 'text-gray-300 cursor-not-allowed'}`}
              title="Undo"
            >
              <Undo2 className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
            <button
              onClick={redo}
              disabled={futureStack.length === 0}
              className={`px-3 py-2 transition-colors ${futureStack.length > 0 ? 'text-gray-600 hover:bg-gray-50 cursor-pointer' : 'text-gray-300 cursor-not-allowed'}`}
              title="Redo"
            >
              <Redo2 className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
          </div>
 
          <button onClick={() => handleAction("Save Draft")} disabled={saveStatus === "saving"} className={`group flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-2 text-[13px] font-bold text-[#0B1D40] shadow-sm transition-all hover:bg-gray-50 ${saveStatus === "saving" ? "opacity-70 cursor-not-allowed" : ""}`} title="Save Draft">
            {saveStatus === "saving" ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
            ) : saveStatus === "saved" ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : saveStatus === "error" ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : (
              <Save className="h-4 w-4 text-gray-600 xl:hidden group-hover:hidden" />
            )}
            <span className="hidden xl:inline group-hover:inline">
              {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : saveStatus === "error" ? "Save Failed" : "Save Draft"}
            </span>
          </button>
          <button onClick={() => handleAction("Preview")} className="group flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-2 text-[13px] font-bold text-[#0B1D40] shadow-sm transition-all hover:bg-gray-50" title="Preview">
            <Eye className="h-4 w-4 xl:hidden group-hover:hidden" />
            <span className="hidden xl:inline group-hover:inline">Preview</span>
          </button>
          <button onClick={() => handleAction("Publish")} className="group flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#0B1D40] px-3 py-2 text-[13px] font-bold text-white shadow-[0_2px_4px_rgba(11,29,64,0.3)] transition-all hover:bg-[#152B52]" title="Publish">
            <span className="hidden xl:inline group-hover:inline">Publish</span>
            <Send className="h-[14px] w-[14px] xl:hidden group-hover:hidden" />
          </button>
        </div>
      </div>
 
      {/* Canvas Area */}
      <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-5 sm:px-6 xl:px-8" onClick={() => setActiveElementId(null)}>
        {/* Editor Container */}
        <div className="min-h-full rounded-xl border border-[#dbe3ef] bg-white p-5 shadow-[0_18px_45px_rgba(15,35,75,0.08)] sm:p-8" onClick={(e) => e.stopPropagation()}>
          {/* Image Blocks Section */}
          <div className="relative rounded-xl border border-[#e6edf5] p-5 sm:p-6">
            <h2 className="text-[#0c1b33] font-bold pb-4 border-b border-slate-100 text-[15px] mb-6 flex justify-between">
              Image Blocks
              <button className="text-slate-600 hover:text-slate-900 cursor-pointer" onClick={() => handleAction("Close Panel")}>
                <X size={20} className="stroke-[2.5]" />
              </button>
            </h2>
 
            {/* Image Panel */}
            <h3 className="text-[#0c1b33] font-bold text-[14px] mb-4">Image Panel</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
 
              {/* Card 1 - Upload Generic */}
              <div className="bg-white rounded-lg shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-slate-100 p-4 pb-5 flex flex-col items-center">
                <div
                  className="w-full aspect-video bg-[#a5b4fc] bg-opacity-40 rounded-lg flex items-center justify-center mb-4 cursor-pointer hover:opacity-80 transition"
                  onClick={(e) => { e.stopPropagation(); triggerFileUpload(); }}
                >
                  <ImageIcon size={64} className="text-white" />
                </div>
                <p className="text-slate-600 text-[13px] mb-4 font-medium">Upload izze. Timraes</p>
                <div className="w-full relative">
                  {activeElementId === "btn-1" && <div className="absolute -inset-1.5 border-2 border-blue-500 rounded pointer-events-none" />}
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveElementId("btn-1"); triggerFileUpload(); }}
                    className={`w-full py-2.5 bg-[#0c1b33] text-white text-[13px] font-medium transition-all duration-300 cursor-pointer ${getStyleClass(elements["btn-1"].buttonStyle)}`}
                  >
                    {elements["btn-1"].label}
                  </button>
                </div>
              </div>
 
              {uploadedImage ? (
                <div className="bg-white rounded-lg shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-slate-100 p-4 pb-5 flex flex-col items-center">
                  {/* Uploaded Image Card */}
                  <div
                    className="w-full aspect-video rounded-lg overflow-hidden mb-4 cursor-pointer hover:opacity-80 transition relative mobile-vignette mobile-crop-adjust"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveElementId("btn-2");
                    }}
                  >
                    <img src={uploadedImage} alt="Uploaded view" className="w-full h-full object-cover mobile-image-adjust" style={{ opacity: elements["btn-2"].opacity / 100 }} />
                  </div>
                  <p className="text-slate-600 text-[13px] mb-4 font-medium">Edit Image</p>
                  <div className="w-full relative">
                    {activeElementId === "btn-2" && <div className="absolute -inset-1.5 border-2 border-blue-500 rounded pointer-events-none" />}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (onImageSelected) {
                          const finalUrl = await generateEditedImage(uploadedImage);
                          onImageSelected(finalUrl);
                        }
                      }}
                      className={`w-full py-2.5 bg-white text-slate-700 border border-slate-300 text-[13px] font-medium transition-all duration-300 hover:bg-slate-50 cursor-pointer ${getStyleClass(elements["btn-2"].buttonStyle)}`}
                    >
                      {elements["btn-2"]?.label || "Choose Image"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Card 2 - Mountain Image 1 */}
                  <div className="bg-white rounded-lg shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-slate-100 p-4 pb-5 flex flex-col items-center">
                    <div
                      className="w-full aspect-video rounded-lg overflow-hidden mb-4 cursor-pointer hover:opacity-80 transition relative mobile-vignette mobile-crop-adjust"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (onImageSelected) {
                          const finalUrl = await generateEditedImage(mountainSrc1);
                          onImageSelected(finalUrl);
                        } else {
                          triggerFileUpload();
                        }
                      }}
                    >
                      <img src={mountainSrc1} alt="Mountain view" className="w-full h-full object-cover mobile-image-adjust" style={{ opacity: elements["btn-2"].opacity / 100 }} />
                    </div>
                    <p className="text-slate-600 text-[13px] mb-4 font-medium">Upload izze. Timraes</p>
                    <div className="w-full relative">
                      {activeElementId === "btn-2" && <div className="absolute -inset-1.5 border-2 border-blue-500 rounded pointer-events-none" />}
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveElementId("btn-2"); triggerFileUpload(); }}
                        className={`w-full py-2.5 bg-white text-slate-700 border border-slate-300 text-[13px] font-medium transition-all duration-300 hover:bg-slate-50 cursor-pointer ${getStyleClass(elements["btn-2"].buttonStyle)}`}
                      >
                        {elements["btn-2"].label}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
 
            {/* Image Gallery */}
            <h3 className="text-[#0c1b33] font-bold text-[14px] mb-4">Image Gallery</h3>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 border border-slate-200 rounded-lg p-6">
 
              {/* Gallery Format 1 */}
              <div
                className="flex flex-col items-center cursor-pointer hover:opacity-80 transition p-2 rounded hover:bg-slate-50"
                onClick={(e) => { e.stopPropagation(); handleAction("Edit Gallery Formatting"); }}
              >
                <div className="flex gap-2 w-full mb-4 h-32 pointer-events-none">
                  <div className="flex-[1] rounded-md overflow-hidden relative mobile-vignette mobile-crop-adjust"><img src={mountainSrc1} className="w-full h-full object-cover mobile-image-adjust" alt="mountains" /></div>
                  <div className="flex-[1] rounded-md overflow-hidden relative mobile-vignette mobile-crop-adjust"><img src={mountainSrc2} className="w-full h-full object-cover mobile-image-adjust" alt="mountains" /></div>
                  <div className="flex-[1] rounded-md overflow-hidden relative mobile-vignette mobile-crop-adjust"><img src={mountainSrc1} className="w-full h-full object-cover mobile-image-adjust" alt="mountains" /></div>
                </div>
                <p className="text-[#0c1b33] font-bold text-[14px]">Add Your Heading Here</p>
              </div>
 
              {/* Gallery Format 2 (6 smaller images with text skeleton) */}
              <div
                className="flex flex-col w-full cursor-pointer hover:opacity-80 transition p-2 rounded hover:bg-slate-50"
                onClick={(e) => { e.stopPropagation(); handleAction("Edit Grid Formatting"); }}
              >
                <div className="grid grid-cols-6 gap-1.5 mb-6 h-[72px] pointer-events-none">
                  <div className="rounded-sm overflow-hidden relative mobile-vignette mobile-crop-adjust"><img src={mountainSrc1} className="w-full h-full object-cover mobile-image-adjust" alt="mountains" /></div>
                  <div className="rounded-sm overflow-hidden relative mobile-vignette mobile-crop-adjust"><img src={mountainSrc2} className="w-full h-full object-cover mobile-image-adjust" alt="mountains" /></div>
                  <div className="rounded-sm overflow-hidden relative mobile-vignette mobile-crop-adjust"><img src={mountainSrc1} className="w-full h-full object-cover mobile-image-adjust" alt="mountains" /></div>
                  <div className="rounded-sm overflow-hidden relative mobile-vignette mobile-crop-adjust"><img src={mountainSrc2} className="w-full h-full object-cover mobile-image-adjust" alt="mountains" /></div>
                  <div className="rounded-sm overflow-hidden relative mobile-vignette mobile-crop-adjust"><img src={mountainSrc1} className="w-full h-full object-cover mobile-image-adjust" alt="mountains" /></div>
                  <div className="rounded-sm overflow-hidden relative mobile-vignette mobile-crop-adjust"><img src={mountainSrc2} className="w-full h-full object-cover mobile-image-adjust" alt="mountains" /></div>
                </div>
 
                {/* Skeleton Text */}
                <div className="flex flex-col items-center gap-2 opacity-60 pointer-events-none">
                  <div className="h-1 bg-slate-300 rounded w-16 mb-2"></div>
                  <div className="h-2 bg-slate-300 rounded w-full"></div>
                  <div className="h-2 bg-slate-300 rounded w-[90%]"></div>
                  <div className="h-2 bg-slate-300 rounded w-[95%]"></div>
                  <div className="h-2 bg-slate-300 rounded w-[80%]"></div>
                </div>
              </div>
 
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
 
 

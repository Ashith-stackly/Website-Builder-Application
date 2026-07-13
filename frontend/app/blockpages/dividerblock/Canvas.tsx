import React from "react";
import { ChevronDown, Undo2, Redo2, Eye, Send, X, Save, Copy, Trash2, Check, AlertTriangle, Loader2 } from "lucide-react";
import DividerPreview from "./DividerPreview";
import type { DraftSaveStatus } from "../BlockPagesClient";
import {
  DIVIDER_VARIANTS,
  type DividerBlockData,
  type DividerBlockProps,
  type DividerVariant,
} from "./types";
 
interface CanvasProps {
  blocks: DividerBlockData[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onRemoveBlock: (id: string) => void;
  onUpdateBlock: (id: string, props: Partial<DividerBlockProps>) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onOpenMobileSidebar?: () => void;
  onApplyDivider?: () => void;
  onSaveDraft?: () => void;
  onPreview?: () => void;
  saveStatus?: DraftSaveStatus;
}
 
const variantToLineStyle = (variant: DividerVariant): DividerBlockProps["lineStyle"] => {
  if (variant === "dashed-line") return "dashed";
  if (variant === "dotted-line") return "dotted";
  if (variant === "double-line") return "double";
  return "solid";
};
 
export default function Canvas({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onRemoveBlock,
  onUpdateBlock,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenMobileSidebar,
  onApplyDivider,
  onSaveDraft,
  onPreview,
  saveStatus = "idle",
}: CanvasProps) {
  const handleApply = (e: React.MouseEvent, block: DividerBlockData) => {
    e.stopPropagation();
    localStorage.setItem("stackly-custom-divider", JSON.stringify(block.props));
    onApplyDivider?.();
  };
 
  const handleSelectVariant = (block: DividerBlockData, variant: DividerVariant) => {
    onUpdateBlock(block.id, {
      variant,
      lineStyle: variantToLineStyle(variant),
    });
    onSelectBlock(block.id);
    onOpenMobileSidebar?.();
  };
 
  return (
    <main
      className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#dbe3ef] bg-[#f7f9fc] shadow-sm"
      onClick={() => onSelectBlock(null)}
    >
      <div
        className="flex h-[64px] flex-shrink-0 items-center justify-between gap-4 overflow-x-auto border-b border-[#dbe3ef] bg-white px-3 shadow-[0_1px_0_rgba(15,23,42,0.03)] md:px-5"
        onClick={(e) => e.stopPropagation()}
      >
        <a href="/blockpages?template=portfolio" className="flex items-center gap-2 whitespace-nowrap rounded px-2 py-1.5 text-[14px] font-bold text-[#0B1D40] hover:bg-gray-100 md:text-[15px]">
          My Website
          <ChevronDown className="h-4 w-4 text-gray-600" />
        </a>
 
        <button
          className="xl:hidden ml-auto mr-2 flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#0f3b89] px-3 py-2 text-[13px] font-bold text-white shadow-sm hover:bg-[#0c2e6b]"
          onClick={() => onOpenMobileSidebar?.()}
        >
          Edit Styles
        </button>
 
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex flex-shrink-0 overflow-hidden rounded-md border border-gray-300 bg-white shadow-sm">
            <button
              className={`border-r border-gray-300 px-3 py-2 ${canUndo ? "text-gray-600 hover:bg-gray-50 cursor-pointer" : "text-gray-300 cursor-not-allowed"}`}
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo"
            >
              <Undo2 className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
            <button
              className={`px-3 py-2 ${canRedo ? "text-gray-600 hover:bg-gray-50 cursor-pointer" : "text-gray-300 cursor-not-allowed"}`}
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo"
            >
              <Redo2 className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
          </div>
 
          <button
            className={`flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-2 text-[13px] font-bold text-[#0B1D40] shadow-sm hover:bg-gray-50 ${saveStatus === "saving" ? "opacity-70 cursor-not-allowed" : ""}`}
            onClick={() => onSaveDraft?.()}
            disabled={saveStatus === "saving"}
            title="Save Draft"
          >
            {saveStatus === "saving" ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
            ) : saveStatus === "saved" ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : saveStatus === "error" ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : (
              <Save className="h-4 w-4 text-gray-600 xl:hidden" />
            )}
            <span className="hidden xl:inline">
              {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : saveStatus === "error" ? "Save Failed" : "Save Draft"}
            </span>
          </button>
          <button
            className="flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-2 text-[13px] font-bold text-[#0B1D40] shadow-sm hover:bg-gray-50"
            onClick={() => onPreview?.()}
            title="Preview"
          >
            <Eye className="h-4 w-4 text-gray-600" />
            <span className="hidden xl:inline">Preview</span>
          </button>
          <button
            className="flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#0B1D40] px-3 py-2 text-[13px] font-bold text-white shadow-[0_2px_4px_rgba(11,29,64,0.3)] hover:bg-[#152B52]"
            onClick={() => alert("Publish sequence initiated!")}
            title="Publish"
          >
            <span className="hidden xl:inline">Publish</span>
            <Send className="h-[14px] w-[14px]" />
          </button>
        </div>
      </div>
 
      <div className="flex flex-1 flex-col items-center gap-6 overflow-y-auto px-4 py-6 sm:px-6 xl:px-8 bg-gray-50">
        {blocks.map((block) => {
          const isSelected = selectedBlockId === block.id;
 
          return (
            <div
              key={block.id}
              className={`flex max-h-full w-full max-w-[900px] cursor-pointer flex-col overflow-hidden rounded-xl border bg-white shadow-[0_18px_45px_rgba(15,35,75,0.08)] transition ${isSelected ? "border-blue-500 ring-2 ring-blue-500/50" : "border-[#dbe3ef] hover:border-blue-300"}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectBlock(block.id);
                onOpenMobileSidebar?.();
              }}
            >
              <div className="flex items-center justify-between border-b border-[#e6edf5] bg-white px-5 py-4 sm:px-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-[#0B1D40] font-bold text-[16px]">Divider</h2>
                  <button
                    onClick={(e) => handleApply(e, block)}
                    className="bg-[#0f3b89] hover:bg-[#0c2e6b] text-white px-3 py-1 text-sm font-bold rounded shadow-sm transition-colors"
                  >
                    Apply
                  </button>
                </div>
 
                {/* <div className="flex items-center gap-2">
                  <button className="text-gray-500 hover:text-[#0B1D40] hover:bg-gray-100 p-1.5 rounded transition-colors" title="Duplicate">
                    <Copy className="w-4 h-4" strokeWidth={2} />
                  </button>
                  <button
                    className="text-gray-500 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveBlock(block.id);
                    }}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={2} />
                  </button>
                  <div className="w-[1px] h-4 bg-gray-200 mx-1" />
                  <button
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveBlock(block.id);
                    }}
                    title="Close"
                  >
                    <X className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </div> */}
              </div>
 
              <div className="relative flex w-full flex-1 flex-col overflow-y-auto p-5 sm:p-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <p className="text-[13px] text-gray-500 mb-6">
                  Add a divider to separate content and create visual spacing.
                </p>
 
                <div className="space-y-3">
                  {DIVIDER_VARIANTS.map((item) => {
                    const isActive = block.props.variant === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectVariant(block, item.id);
                        }}
                        className={`flex w-full items-center gap-4 rounded-lg border px-4 py-3 text-left transition ${isActive ? "border-[#0f3b89] bg-blue-50/40 ring-1 ring-[#0f3b89]/30" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"}`}
                      >
                        <span className="w-[140px] shrink-0 text-[13px] font-semibold text-[#0B1D40] sm:w-[160px]">
                          {item.label}
                        </span>
                        <div className="min-w-0 flex-1">
                          <DividerPreview
                            props={{
                              ...block.props,
                              variant: item.id,
                              lineStyle: variantToLineStyle(item.id),
                            }}
                            compact
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
 

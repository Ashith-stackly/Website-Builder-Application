import React from 'react';
import { ChevronDown, Undo2, Redo2, Eye, Send, X, Play, Save, Image as ImageIcon } from 'lucide-react';
import { BlockData } from './types';
 
interface CanvasProps {
  blocks: BlockData[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onRemoveBlock: (id: string) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  editingButtonId?: string | null;
  onButtonSelected?: (props: any) => void;
  onOpenMobileSidebar?: () => void;
}
 
export default function Canvas({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onRemoveBlock,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  editingButtonId,
  onButtonSelected,
  onOpenMobileSidebar
}: CanvasProps) {
  const renderBlockContent = (block: BlockData) => {
    switch (block.type) {
      case 'button': {
        const w = (block.props.width as string) || '100%';
        const parsedW = (w !== '' && !isNaN(Number(w))) ? `${w}px` : w;
        const h = (block.props.height as string) || 'auto';
        const parsedH = (h !== '' && !isNaN(Number(h))) ? `${h}px` : h;
        const bg = (block.props.backgroundColor as string) || '';
        const op = typeof block.props.opacity === 'number' ? block.props.opacity : 100;
        const align = (block.props.alignment as string) || 'center';
        const iconPos = block.props.iconPosition as string;
        const variant = block.props.buttonVariant as string;
        const br = (block.props.borderRadius as string) || '6px';
        const parsedBr = (br !== '' && !isNaN(Number(br))) ? `${br}px` : br;
        const effect = block.props.effect as string;
 
        const maxWidthValue = parsedW === 'auto' ? 'none' : parsedW.replace(/\s+/g, '');
        const actualWidth = parsedW === 'auto' ? 'auto' : '100%';
 
        const containerAlignClass = align === 'left' ? 'mr-auto ml-0' : align === 'right' ? 'ml-auto mr-0' : 'mx-auto';
 
        const buttonStyle = {
          borderRadius: variant === 'pill' ? '9999px' : parsedBr,
          height: parsedH !== 'auto' ? parsedH : undefined,
          opacity: op / 100,
          backdropFilter: effect === 'blur' ? 'blur(8px)' : undefined,
          boxShadow: block.props.dropShadow ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : undefined,
          transform: `rotate(${block.props.rotation || 0}deg) scaleX(${block.props.flipH ? -1 : 1}) scaleY(${block.props.flipV ? -1 : 1})`,
          padding: `${block.props.padding !== undefined ? block.props.padding : 16}px`,
        };
 
        return (
          <div className="w-full pb-2">
            <h3 className="text-[#0f3b89] font-bold text-[15px] mb-4">Button Blocks</h3>
            {/* BUTTONS SECTION */}
            <div
              className={`grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-[18px] w-full mb-10 ${containerAlignClass}`}
              style={{ maxWidth: maxWidthValue, width: actualWidth }}
            >
              <button
                onClick={(e) => {
                  if (editingButtonId && onButtonSelected) {
                    e.stopPropagation();
                    onButtonSelected({ ...block.props, styleVariant: 'primary' });
                  }
                }}
                className="w-full flex items-center justify-center gap-2 text-white py-3.5 font-bold text-[15px] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-lg active:scale-[0.98]"
                style={{ ...buttonStyle, background: bg || '#0f3b89' }}
              >
                {iconPos === 'left' && <Play className="w-4 h-4 fill-current" />}
                Click Me !
                {iconPos === 'right' && <Play className="w-4 h-4 fill-current" />}
              </button>
              <button
                onClick={(e) => {
                  if (editingButtonId && onButtonSelected) {
                    e.stopPropagation();
                    onButtonSelected({ ...block.props, styleVariant: 'secondary' });
                  }
                }}
                className="w-full flex items-center justify-center gap-2 border py-3.5 font-bold hover:bg-gray-50 text-[15px] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md active:scale-[0.98]"
                style={{
                  ...buttonStyle,
                  background: 'transparent',
                  borderColor: bg || '#d1d5db',
                  color: bg && !bg.includes('gradient') ? bg : '#0f3b89'
                }}
              >
                {iconPos === 'left' && <Play className="w-4 h-4 fill-current" />}
                Secondary Button
                {iconPos === 'right' && <Play className="w-4 h-4 fill-current" />}
              </button>
              <button
                onClick={(e) => {
                  if (editingButtonId && onButtonSelected) {
                    e.stopPropagation();
                    onButtonSelected({ ...block.props, styleVariant: 'primary2' });
                  }
                }}
                className="w-full flex items-center justify-center gap-2 text-white py-3.5 font-bold text-[15px] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-lg active:scale-[0.98]"
                style={{ ...buttonStyle, background: bg || '#0f3b89' }}
              >
                {iconPos === 'left' && <Play className="w-4 h-4 fill-current" />}
                Primary Button
                {iconPos === 'right' && <Play className="w-4 h-4 fill-current" />}
              </button>
              <button
                onClick={(e) => {
                  if (editingButtonId && onButtonSelected) {
                    e.stopPropagation();
                    onButtonSelected({ ...block.props, styleVariant: 'outline' });
                  }
                }}
                className="w-full flex items-center justify-center gap-2 border py-3.5 font-bold hover:bg-gray-50 text-[15px] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md active:scale-[0.98]"
                style={{
                  ...buttonStyle,
                  background: 'transparent',
                  borderColor: bg || '#d1d5db',
                  color: bg && !bg.includes('gradient') ? bg : '#0f3b89'
                }}
              >
                {iconPos === 'left' && <Play className="w-4 h-4 fill-current" />}
                Outline Button
                {iconPos === 'right' && <Play className="w-4 h-4 fill-current" />}
              </button>
            </div>
 
            {/* TEXT LINK & VIDEOS SECTION */}
            <h3 className="text-[#0f3b89] font-bold text-[15px] mb-4">Text Link</h3>
            <div className="w-full h-[1px] bg-gray-200 mb-6"></div>
            <div
              className={`grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-[18px] w-full ${containerAlignClass}`}
              style={{ maxWidth: maxWidthValue, width: actualWidth }}
            >
              {/* Upload Video Card */}
              <div
                className="border border-gray-200 bg-white flex flex-col overflow-hidden cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative"
                style={{ borderRadius: '4px' }}
              >
                <div className="relative h-[160px] w-full bg-slate-100 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=600&h=400" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Mountain" />
                  <div className="absolute inset-0 flex items-center justify-center transition-colors duration-300 group-hover:bg-black/10">
                    <div className="w-[42px] h-[42px] rounded-full border-[1.5px] border-white flex items-center justify-center bg-transparent backdrop-blur-[1px] transition-transform duration-300 group-hover:scale-110">
                      <Play className="w-[20px] h-[20px] text-white fill-white ml-[3px]" />
                    </div>
                  </div>
                </div>
                <div className="p-4 pt-5 flex-1 transition-colors duration-300 group-hover:bg-blue-50/50">
                  <h4 className="font-bold text-[#0B1D40] text-[17px] mb-2 transition-colors duration-300 group-hover:text-blue-700">Upload Video</h4>
                  <p className="text-[13px] text-gray-500 font-medium">Headro custer mbee 1000%</p>
                </div>
              </div>
 
              {/* Embed Video Card */}
              <div
                className="border border-gray-200 bg-white flex flex-col overflow-hidden cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative"
                style={{ borderRadius: '4px' }}
              >
                <div className="relative h-[160px] w-full border-b border-gray-100 flex flex-col bg-gray-50 transition-colors duration-300 group-hover:bg-gray-100 overflow-hidden">
                  {/* Broken icon + Hiker top left text */}
                  <div className="absolute top-2 left-2 flex items-center text-[14px] text-[#0B1D40] font-medium z-10 transition-transform duration-300 group-hover:translate-x-1">
                    <span className="w-4 h-4 mr-1 flex items-center justify-center bg-white rounded-sm opacity-80" aria-hidden="true">
                      <ImageIcon className="w-[14px] h-[14px] text-[#0B1D40]" />
                    </span>
                    Hiker
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[48px] h-[48px] rounded-full bg-[#E2E2E2] flex items-center justify-center transition-all duration-300 group-hover:bg-blue-500 group-hover:scale-110 group-hover:shadow-md">
                      <Play className="w-[20px] h-[20px] text-white fill-white ml-1 transition-colors duration-300" />
                    </div>
                  </div>
                </div>
                <div className="p-4 pt-5 flex-1 transition-colors duration-300 group-hover:bg-blue-50/50">
                  <h4 className="font-bold text-[#0B1D40] text-[17px] mb-2 transition-colors duration-300 group-hover:text-blue-700">Embed Video</h4>
                  <p className="text-[13px] text-gray-500 font-medium">Paste YouTube , Vimeo or custom embed Code</p>
                </div>
              </div>
            </div>
          </div>
        );
      }
      case 'video':
        return (
          <>
            <h3 className="text-[#0f3b89] font-bold text-[17px] mb-5">Text Link</h3>
            <div className="text-gray-400 py-6 flex flex-col items-center">
              <div className="text-[17px] mb-2 font-bold capitalize">{block.type} Block</div>
              <p className="text-sm">Properties and layout for {block.type} blocks will appear here.</p>
            </div>
          </>
        );
      default:
        return (
          <div className="text-gray-400 py-6 flex flex-col items-center">
            <div className="text-[17px] mb-2 font-bold capitalize">{block.type} Block</div>
            <p className="text-sm">Properties and layout for {block.type} blocks will appear here.</p>
          </div>
        );
    }
  };
 
  return (
    <main
      className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#dbe3ef] bg-[#f7f9fc] shadow-sm"
      onClick={() => onSelectBlock(null)} // Click outside to deselect
    >
      {/* Top Actions Bar */}
      <div
        className="flex h-[64px] flex-shrink-0 items-center justify-between gap-4 overflow-x-auto border-b border-[#dbe3ef] bg-white px-3 shadow-[0_1px_0_rgba(15,23,42,0.03)] md:px-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="flex items-center gap-2 whitespace-nowrap rounded px-2 py-1.5 text-[14px] font-bold text-[#0B1D40] hover:bg-gray-100 md:text-[15px]">
          My Website
          <ChevronDown className="h-4 w-4 text-gray-600" />
        </button>
 
        {/* Mobile Settings Trigger */}
        <button
          className="lg:hidden ml-auto mr-2 flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#0f3b89] px-3 py-2 text-[13px] font-bold text-white shadow-sm hover:bg-[#0c2e6b]"
          onClick={() => onOpenMobileSidebar?.()}
        >
          Edit Styles
        </button>
 
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex flex-shrink-0 overflow-hidden rounded-md border border-gray-300 bg-white shadow-sm">
            <button
              className={`border-r border-gray-300 px-3 py-2 ${canUndo ? 'text-gray-600 hover:bg-gray-50 cursor-pointer' : 'text-gray-300 cursor-not-allowed'}`}
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo"
            >
              <Undo2 className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
            <button
              className={`px-3 py-2 ${canRedo ? 'text-gray-600 hover:bg-gray-50 cursor-pointer' : 'text-gray-300 cursor-not-allowed'}`}
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo"
            >
              <Redo2 className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
          </div>
 
          <button
            className="flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-2 text-[13px] font-bold text-[#0B1D40] shadow-sm hover:bg-gray-50"
            onClick={() => alert("Draft saved locally!")}
            title="Save Draft"
          >
            <Save className="h-4 w-4 text-gray-600 lg:hidden" />
            <span className="hidden lg:inline">Save Draft</span>
          </button>
          <button
            className="flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-2 text-[13px] font-bold text-[#0B1D40] shadow-sm hover:bg-gray-50"
            onClick={() => alert("Preview mode not yet implemented.")}
            title="Preview"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden lg:inline">Preview</span>
          </button>
          <button
            className="flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#0B1D40] px-3 py-2 text-[13px] font-bold text-white shadow-[0_2px_4px_rgba(11,29,64,0.3)] hover:bg-[#152B52]"
            onClick={() => alert("Publish sequence initiated!")}
            title="Publish"
          >
            <span className="hidden lg:inline">Publish</span>
            <Send className="h-[14px] w-[14px]" />
          </button>
        </div>
      </div>
 
      {/* Canvas Fixed Area */}
      <div className="flex flex-1 flex-col items-center gap-6 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
        {blocks.length === 0 ? (
          <div
            className="flex max-h-full w-full max-w-[900px] cursor-pointer flex-col overflow-hidden rounded-xl border border-[#dbe3ef] bg-white shadow-[0_18px_45px_rgba(15,35,75,0.08)] transition hover:border-blue-300"
          >
            {/* Canvas Header */}
            <div className="flex items-center justify-between border-b border-[#e6edf5] bg-white px-5 py-4 sm:px-6">
              <h2 className="text-[#0B1D40] font-bold text-[18px] capitalize">Button Blocks</h2>
              <button className="text-red-500 hover:bg-red-50 p-1.5 rounded opacity-50 cursor-not-allowed">
                <X className="w-[18px] h-[18px]" strokeWidth={2.5} />
              </button>
            </div>
 
            {/* Block Content Region */}
            <div className="relative flex w-full flex-1 flex-col items-start overflow-y-auto p-5 pb-8 sm:p-8 sm:pb-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {renderBlockContent({ id: 'default', type: 'button', props: {} })}
            </div>
          </div>
        ) : (
          blocks.map(block => {
            const isSelected = selectedBlockId === block.id;
 
            return (
              <div
                key={block.id}
                className={`flex max-h-full w-full max-w-[900px] cursor-pointer flex-col overflow-hidden rounded-xl border bg-white shadow-[0_18px_45px_rgba(15,35,75,0.08)] transition ${isSelected ? 'border-blue-500 ring-2 ring-blue-500' : 'border-[#dbe3ef] hover:border-blue-300'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectBlock(block.id);
                  onOpenMobileSidebar?.();
                }}
              >
                {/* Canvas Header */}
                <div className="flex items-center justify-between border-b border-[#e6edf5] bg-white px-5 py-4 sm:px-6">
                  <h2 className="text-[#0B1D40] font-bold text-[18px] capitalize">{block.type} Blocks</h2>
                  <button
                    className="text-red-500 hover:bg-red-50 p-1.5 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveBlock(block.id);
                    }}
                  >
                    <X className="w-[18px] h-[18px]" strokeWidth={2.5} />
                  </button>
                </div>
 
                {/* Block Content Region */}
                <div className="relative flex w-full flex-1 flex-col items-start overflow-y-auto p-5 pb-8 sm:p-8 sm:pb-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {renderBlockContent(block)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
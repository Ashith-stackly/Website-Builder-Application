import React, { useState, useEffect } from 'react';
import { ChevronDown, Play, ChevronLeft, ChevronRight, LogOut, X, Ban, Pipette, AlignLeft, AlignCenter, AlignRight, RotateCcw, ArrowUpDown, Plus } from 'lucide-react';
import { BlockData } from './types';
 
const CornerIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mr-0.5 flex-shrink-0">
    <path d="M4 4h4" />
    <path d="M4 4v4" />
    <path d="M20 4h-4" />
    <path d="M20 4v4" />
    <path d="M4 20h4" />
    <path d="M4 20v-4" />
    <path d="M20 20h-4" />
    <path d="M20 20v-4" />
  </svg>
);
 
const colorOptions = [
  { id: 'none', icon: <Ban className="w-[14px] h-[14px] text-gray-400" /> },
  { id: 'picker', icon: <Pipette className="w-[14px] h-[14px] text-white" /> },
  { id: 'gradient', bg: 'linear-gradient(90deg, #4ade80, #f87171)' },
  { id: 'red', bg: '#ef4444' },
  { id: 'green', bg: '#22c55e' },
  { id: 'blue', bg: '#3b82f6' },
  { id: 'yellow', bg: '#eab308' },
  { id: 'salmon', bg: '#fca5a5' },
  { id: 'orange', bg: '#d97706' },
  { id: 'purple', bg: '#c084fc' },
  { id: 'pink', bg: '#ec4899' },
  { id: 'white', bg: '#ffffff' },
];
 
interface RightSidebarProps {
  selectedBlock: BlockData | null;
  onUpdateBlock: (id: string, props: Record<string, unknown>) => void;
  onClose?: () => void;
}
 
export default function RightSidebar({ selectedBlock, onUpdateBlock, onClose }: RightSidebarProps) {
  const props = selectedBlock?.props || {};
  const id = selectedBlock?.id || '';
 
  const width = (props.width as string) || '600px';
  const height = (props.height as string) || 'auto';
  const borderRadius = (props.borderRadius as string) || '18px';
  const cornerRadiusValues = (props.cornerRadiusValues as Record<string, number>) || { tl: 0, tr: 0, br: 0, bl: 0 };
  const opacity = typeof props.opacity === 'number' ? props.opacity : 100;
  const paddingVal = typeof props.padding === 'number' ? props.padding : 16;
 
  const [activeTab, setActiveTab] = useState<'button' | 'styles'>('button');
  const [showVideoSettings, setShowVideoSettings] = useState(true);
  const [showPlay, setShowPlay] = useState(true);
 
  // Local state for better usability (prevents snapping to 0 while typing)
  const [localOpacity, setLocalOpacity] = useState(opacity.toString());
  const [localPadding, setLocalPadding] = useState(paddingVal.toString());
  const [localRadii, setLocalRadii] = useState({
    tl: cornerRadiusValues.tl.toString(),
    tr: cornerRadiusValues.tr.toString(),
    br: cornerRadiusValues.br.toString(),
    bl: cornerRadiusValues.bl.toString()
  });
 
  useEffect(() => {
    setLocalOpacity(opacity.toString());
    setLocalPadding(paddingVal.toString());
    setLocalRadii({
      tl: cornerRadiusValues.tl.toString(),
      tr: cornerRadiusValues.tr.toString(),
      br: cornerRadiusValues.br.toString(),
      bl: cornerRadiusValues.bl.toString()
    });
  }, [id, opacity, paddingVal, cornerRadiusValues.tl, cornerRadiusValues.tr, cornerRadiusValues.br, cornerRadiusValues.bl]);
 
  const [localButtonHeight, setLocalButtonHeight] = useState(height);
  const [localButtonWidth, setLocalButtonWidth] = useState(width);
  const [localButtonRadius, setLocalButtonRadius] = useState(borderRadius);
 
  useEffect(() => {
    setLocalButtonHeight(height);
    setLocalButtonWidth(width);
    setLocalButtonRadius(borderRadius);
  }, [id, height, width, borderRadius]);
 
  const formatSize = (val: string, defaultVal: string) => {
    if (!val) return defaultVal;
    if (val === 'auto' || val.endsWith('%') || val.endsWith('px') || val.endsWith('rem') || val.endsWith('em') || val.endsWith('vh') || val.endsWith('vw')) return val;
    const num = parseFloat(val);
    if (isNaN(num)) return defaultVal;
    return `${num}px`;
  };
 
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };
 
  const handleWidthChange = (delta: number) => {
    let currentWidth = parseInt(width.replace(/\D/g, ''));
    if (isNaN(currentWidth)) currentWidth = 600;
    const newWidth = Math.max(100, currentWidth + delta); // minimum 100px
    onUpdateBlock(id, { ...props, width: `${newWidth}px` });
  };
 
  return (
    <aside className={`relative flex h-full w-full lg:w-[286px] flex-shrink-0 flex-col overflow-hidden rounded-xl border shadow-[0_18px_45px_rgba(113,63,18,0.10)] transition-colors duration-300 ${activeTab === 'styles' ? 'bg-[#0B1D40] border-[#0B1D40]' : 'bg-[#fff7f4] border-[#f4d8cc]'}`}>
      {activeTab === 'button' ? (
        <>
          {/* Mobile Close Button */}
          {onClose && (
            <button
              className="xl:hidden absolute top-4 right-4 p-1.5 bg-white hover:bg-gray-50 rounded-md text-gray-600 shadow-sm z-10 border border-gray-200 transition-all duration-300 hover:rotate-90 hover:scale-110"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </button>
          )}
 
          {/* Tabs */}
          <div className="flex border-b border-[#f2d8cf] bg-white/45 px-6 pt-5">
            <button
              className="flex-1 border-b-[2px] pb-4 text-base font-bold transition-colors border-[#0B1D40] text-[#0B1D40]"
              onClick={() => setActiveTab('button')}
            >
              Button
            </button>
            <button
              className="flex-1 border-b-[2px] pb-4 text-base font-bold transition-colors border-gray-300 text-[#566583] hover:text-[#0B1D40]"
              onClick={() => setActiveTab('styles')}
            >
              Styles
            </button>
          </div>
 
          <div className="flex-1 space-y-4 overflow-y-auto px-6 pb-8 pt-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* Settings Accordion Header */}
            <button
              className="w-full flex items-center justify-between text-[15px] font-bold text-[#0B1D40] hover:bg-black/5 p-1 rounded -ml-1 transition"
              onClick={() => setShowVideoSettings(!showVideoSettings)}
            >
              <span>Dimensions</span>
              <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showVideoSettings ? '' : '-rotate-90'}`} />
            </button>
 
            {showVideoSettings && (
              <div className="space-y-6 pt-2">
                {/* Height */}
                <div>
                  <h4 className="text-[#0B1D40] text-[15px] font-bold mb-3">Height</h4>
                  <div className="w-full border border-[#0B1D40] bg-transparent rounded-xl flex items-center justify-between overflow-hidden focus-within:ring-2 focus-within:ring-blue-100 transition-colors">
                    <input
                      type="text"
                      className="flex-1 px-4 py-2.5 text-[15px] text-center text-[#0B1D40] font-bold bg-transparent focus:outline-none"
                      value={localButtonHeight}
                      onChange={(e) => {
                        setLocalButtonHeight(e.target.value);
                        onUpdateBlock(id, { ...props, height: e.target.value });
                      }}
                      onKeyDown={handleKeyDown}
                      onBlur={() => {
                        const formatted = formatSize(localButtonHeight, 'auto');
                        setLocalButtonHeight(formatted);
                        onUpdateBlock(id, { ...props, height: formatted });
                      }}
                    />
                  </div>
                </div>
 
                {/* Width */}
                <div>
                  <h4 className="text-[#0B1D40] text-[15px] font-bold mb-3">Width</h4>
                  <div className="w-full border border-[#0B1D40] bg-transparent rounded-xl flex items-center justify-between overflow-hidden focus-within:ring-2 focus-within:ring-blue-100 transition-colors">
                    <input
                      type="text"
                      className="flex-1 px-4 py-2.5 text-[15px] text-center text-[#0B1D40] font-bold bg-transparent focus:outline-none"
                      value={localButtonWidth}
                      onChange={(e) => {
                        setLocalButtonWidth(e.target.value);
                        onUpdateBlock(id, { ...props, width: e.target.value });
                      }}
                      onKeyDown={handleKeyDown}
                      onBlur={() => {
                        const formatted = formatSize(localButtonWidth, '100%');
                        setLocalButtonWidth(formatted);
                        onUpdateBlock(id, { ...props, width: formatted });
                      }}
                    />
                  </div>
                </div>
 
                {/* Border Radius */}
                <div>
                  <h4 className="text-[#0B1D40] text-[15px] font-bold mb-3">Border Radius</h4>
                  <div className="w-full border border-[#0B1D40] bg-transparent rounded-xl flex items-center overflow-hidden focus-within:ring-2 focus-within:ring-blue-100 transition-colors">
                     <input
                       type="text"
                       className="w-full text-center py-2.5 text-[15px] text-[#0B1D40] font-bold bg-transparent focus:outline-none"
                       value={localButtonRadius}
                       onChange={(e) => {
                         setLocalButtonRadius(e.target.value);
                         onUpdateBlock(id, { ...props, buttonVariant: 'default', borderRadius: e.target.value });
                       }}
                       onKeyDown={handleKeyDown}
                       onBlur={() => {
                         const formatted = formatSize(localButtonRadius, '0px');
                         setLocalButtonRadius(formatted);
                         const val = parseInt(formatted) || 0;
                         onUpdateBlock(id, {
                           ...props,
                           buttonVariant: 'default', // Disable pill mode so radius applies
                           borderRadius: formatted,
                           cornerRadiusValues: { tl: val, tr: val, br: val, bl: val }
                         });
                       }}
                     />
                  </div>
                </div>
              </div>
            )}
 
            {/* Play Controls */}
            <div className="pt-2">
               <button
                 className="w-full flex items-center justify-between text-[15px] font-bold text-[#0B1D40] mb-4 hover:bg-black/5 p-1 rounded -ml-1 transition"
                 onClick={() => setShowPlay(!showPlay)}
               >
                  <span>Play</span>
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showPlay ? '' : '-rotate-90'}`} />
               </button>
 
                {showPlay && (
                 <>
                   <div className="flex items-center justify-between px-2 mt-3 mb-5">
                     <button
                       className={`w-10 h-10 rounded-xl bg-[#0B1D40] text-white flex items-center justify-center shadow-sm hover:bg-[#152B52] transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-md ${props.iconPosition === 'left' ? 'ring-2 ring-white/50' : ''}`}
                       onClick={() => onUpdateBlock(id, { ...props, iconPosition: props.iconPosition === 'left' ? 'none' : 'left' })}
                     >
                       <ChevronLeft className="w-6 h-6" />
                     </button>
                     
                     <span className="text-[#0B1D40] font-semibold text-[26px] leading-none">+</span>
                     
                     <button
                       className={`h-10 px-5 rounded-full bg-[#0B1D40] text-white flex items-center justify-center shadow-sm gap-2 hover:bg-[#152B52] transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-md ${props.buttonVariant === 'pill' ? 'ring-2 ring-white/50' : ''}`}
                       onClick={() => onUpdateBlock(id, { ...props, buttonVariant: props.buttonVariant === 'pill' ? 'default' : 'pill' })}
                     >
                       <div className="w-[12px] h-[12px] rounded-full bg-white flex-shrink-0"></div>
                       <ChevronRight className="w-6 h-6" />
                     </button>
 
                     <button
                       className={`w-10 h-10 rounded-xl bg-[#0B1D40] text-white flex items-center justify-center shadow-sm hover:bg-[#152B52] transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-md ${props.iconPosition === 'right' ? 'ring-2 ring-white/50' : ''}`}
                       onClick={() => onUpdateBlock(id, { ...props, iconPosition: props.iconPosition === 'right' ? 'none' : 'right' })}
                     >
                       <ChevronRight className="w-6 h-6" />
                     </button>
                   </div>
 
                   <div className="w-full border border-[#0B1D40] bg-transparent rounded-[14px] flex flex-row items-center justify-between px-6 py-2.5 hover:bg-black/5 transition-colors">
                     <button
                       className="text-[#0B1D40] hover:text-black font-semibold text-2xl leading-[0] flex items-center justify-center transition-transform hover:scale-110"
                       onClick={() => handleWidthChange(-20)}
                       title="Decrease Width"
                     >
                       –
                     </button>
                     <button
                       className="text-[#0B1D40] hover:text-black font-semibold text-[26px] leading-[0] flex items-center justify-center transition-transform hover:scale-110"
                       onClick={() => handleWidthChange(20)}
                       title="Increase Width"
                     >
                       +
                     </button>
                     <button
                       className="text-[#0B1D40] hover:text-black flex justify-center items-center font-medium leading-[0] transition-transform hover:translate-x-1"
                       onClick={() => onUpdateBlock(id, { ...props, width: 'auto' })}
                       title="Auto Width"
                     >
                       <ChevronRight className="w-[24px] h-[24px]" strokeWidth={2.5}/>
                     </button>
                     <button
                       className="text-[#0B1D40] hover:text-black flex items-center justify-center leading-[0]"
                       onClick={() => onUpdateBlock(id, { ...props, width: '100%' })}
                       title="Maximize Width"
                     >
                       <LogOut className="w-[20px] h-[20px]" strokeWidth={2.5} />
                     </button>
                   </div>
                 </>
                )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col h-full text-white w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
            <button onClick={() => setActiveTab('button')} className="text-white hover:bg-white/10 p-1 rounded transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-[15px] tracking-wide">Style</span>
            <button className="text-white hover:bg-white/10 p-1 rounded transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
         
          {/* Styles Content */}
          <div className="flex-1 space-y-7 overflow-y-auto px-5 py-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* Colors */}
            <div className="flex items-center justify-between flex-wrap gap-y-2">
              {colorOptions.map((c, i) => (
                <button
                  key={i}
                  className={`w-[18px] h-[18px] rounded-[4px] flex items-center justify-center transition-transform hover:scale-110 ${c.id === 'none' || c.id === 'picker' ? 'border border-white/20 bg-white/5 hover:bg-white/10' : ''}`}
                  style={c.bg ? { background: c.bg } : {}}
                  onClick={() => {
                    if (c.bg) onUpdateBlock(id, { ...props, backgroundColor: c.bg });
                    if (c.id === 'none') onUpdateBlock(id, { ...props, backgroundColor: 'transparent' });
                  }}
                >
                  {c.icon}
                </button>
              ))}
            </div>
 
            {/* Position */}
            <div className="space-y-3">
              <h4 className="text-[13px] font-medium text-gray-300">Position</h4>
              <div className="flex items-center justify-between gap-2">
                {/* Alignment Group */}
                <div className="flex border border-white/10 rounded-lg overflow-hidden bg-white/5 flex-1 justify-center">
                  <button
                    className="flex-1 py-1.5 flex justify-center hover:bg-white/10 border-r border-white/10"
                    onClick={() => onUpdateBlock(id, { ...props, alignment: 'left' })}
                  >
                    <AlignLeft className="w-4 h-4 text-white" />
                  </button>
                  <button
                    className="flex-1 py-1.5 flex justify-center hover:bg-white/10 border-r border-white/10"
                    onClick={() => onUpdateBlock(id, { ...props, alignment: 'center' })}
                  >
                    <AlignCenter className="w-4 h-4 text-white" />
                  </button>
                  <button
                    className="flex-1 py-1.5 flex justify-center hover:bg-white/10"
                    onClick={() => onUpdateBlock(id, { ...props, alignment: 'right' })}
                  >
                    <AlignRight className="w-4 h-4 text-white" />
                  </button>
                </div>
               
                {/* Rotate Group */}
                <div className="flex border border-white/10 rounded-lg overflow-hidden bg-white/5 flex-1 justify-center">
                  <button
                    className="flex-1 py-1.5 flex justify-center hover:bg-white/10 border-r border-white/10"
                    onClick={() => {
                       const currentRot = (props.rotation as number) || 0;
                       onUpdateBlock(id, { ...props, rotation: (currentRot + 90) % 360 });
                    }}
                  >
                    <RotateCcw className="w-4 h-4 text-white" />
                  </button>
                  <button
                    className="flex-1 py-1.5 flex justify-center hover:bg-white/10 border-r border-white/10"
                    onClick={() => onUpdateBlock(id, { ...props, flipH: !props.flipH })}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 20v-16"/><path d="M8 4l-6 8 6 8"/><path d="M16 4l6 8-6 8"/></svg>
                  </button>
                  <button
                    className="flex-1 py-1.5 flex justify-center hover:bg-white/10"
                    onClick={() => onUpdateBlock(id, { ...props, flipV: !props.flipV })}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M4 12h16"/><path d="M4 8l8-6 8 6"/><path d="M4 16l8 6 8-6"/></svg>
                  </button>
                </div>
 
                {/* Gap/Padding Group */}
                <div className="flex border border-white/10 rounded-lg overflow-hidden bg-white/5 flex-1">
                  <div className="flex flex-1 items-center justify-center py-1.5 border-r border-white/10">
                    <ArrowUpDown className="w-3.5 h-3.5 text-white mr-1" />
                    <input
                       type="text"
                       className="w-8 bg-transparent text-white text-[13px] text-center focus:outline-none"
                       value={localPadding}
                       onChange={(e) => setLocalPadding(e.target.value)}
                       onKeyDown={handleKeyDown}
                       onBlur={() => {
                          let val = parseInt(localPadding);
                          if (isNaN(val)) val = 0;
                          setLocalPadding(val.toString());
                          onUpdateBlock(id, { ...props, padding: val });
                       }}
                    />
                  </div>
                  <button className="px-1.5 hover:bg-white/10"><ChevronDown className="w-3.5 h-3.5 text-white" /></button>
                </div>
              </div>
            </div>
 
            {/* Effects */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[13px] font-medium text-gray-300">Effects</h4>
                <button className="text-gray-400 hover:text-white transition-colors"><Plus className="w-4 h-4" /></button>
              </div>
              <div className="space-y-2">
                <div
                  className="border border-white/10 bg-[#0B1D40] hover:bg-white/5 rounded-lg flex items-center justify-between px-3 py-2.5 transition-colors cursor-pointer"
                  onClick={() => onUpdateBlock(id, { ...props, effect: props.effect === 'blur' ? 'none' : 'blur' })}
                >
                  <span className="text-[13px] text-gray-200">
                    Background blur {props.effect === 'blur' && '(On)'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
                {/* Additional Effect: Drop Shadow */}
                <div
                  className="border border-white/10 bg-[#0B1D40] hover:bg-white/5 rounded-lg flex items-center justify-between px-3 py-2.5 transition-colors cursor-pointer"
                  onClick={() => onUpdateBlock(id, { ...props, dropShadow: !props.dropShadow })}
                >
                  <span className="text-[13px] text-gray-200">
                    Drop shadow {Boolean(props.dropShadow) && '(On)'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
 
            {/* Opacity */}
            <div className="flex items-center gap-4">
              <span className="text-[13px] font-medium text-gray-300 w-16">Opacity</span>
              <input
                type="range"
                min="0"
                max="100"
                className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                value={opacity}
                onChange={(e) => onUpdateBlock(id, { ...props, opacity: parseInt(e.target.value) })}
              />
              <div className="w-12 border border-white/10 bg-white/5 rounded-lg py-1 flex items-center justify-center">
                <input
                  type="text"
                  className="w-full bg-transparent text-white text-[13px] text-center focus:outline-none"
                  value={localOpacity}
                  onChange={(e) => setLocalOpacity(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={() => {
                     let val = parseInt(localOpacity);
                     if (isNaN(val)) val = 0;
                     if (val < 0) val = 0;
                     if (val > 100) val = 100;
                     setLocalOpacity(val.toString());
                     onUpdateBlock(id, { ...props, opacity: val });
                  }}
                />
              </div>
            </div>
 
            {/* Corner Radius */}
            <div className="space-y-3">
              <h4 className="text-[13px] font-medium text-gray-300">Corner Radius</h4>
              <div className="flex items-center gap-2">
                {(['tl', 'tr', 'br', 'bl'] as const).map((corner) => (
                  <div key={corner} className="flex-1 border border-white/10 bg-white/5 rounded-lg flex items-center px-2 py-1.5 focus-within:border-white/30 transition-colors">
                    <CornerIcon />
                    <input
                      type="text"
                      className="w-full bg-transparent text-white text-[13px] text-center focus:outline-none"
                      value={localRadii[corner]}
                      onChange={(e) => setLocalRadii({ ...localRadii, [corner]: e.target.value })}
                      onKeyDown={handleKeyDown}
                      onBlur={() => {
                         let val = parseInt(localRadii[corner]);
                         if (isNaN(val)) val = 0;
                         
                         setLocalRadii({ ...localRadii, [corner]: val.toString() });
                         const newRadius = { ...cornerRadiusValues, [corner]: val };
                         onUpdateBlock(id, {
                           ...props,
                           buttonVariant: 'default', // Disable pill mode so radius applies
                           cornerRadiusValues: newRadius,
                           borderRadius: `${newRadius.tl}px ${newRadius.tr}px ${newRadius.br}px ${newRadius.bl}px`
                         });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
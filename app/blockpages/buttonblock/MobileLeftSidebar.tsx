import React, { useState } from 'react';
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Type, Image as ImageIcon, Minus, MonitorPlay,
  LayoutTemplate, Columns, Heading, BoxSelect, Search,
  PlayCircle, Plus, Home, Info, FileText, Mail, UserRound,
  Ban, Pipette, AlignLeft, AlignCenter, AlignRight,
  RotateCw, FlipVertical, FlipHorizontal, ArrowUpDown
} from 'lucide-react';
import { BlockType } from './types';
 
interface MobileLeftSidebarProps {
  onAddBlock: (type: BlockType) => void;
  onClose: () => void;
  selectedBlock?: { id: string; props: Record<string, any> } | null;
  onUpdateBlock?: (id: string, props: Record<string, any>) => void;
}
 
export default function MobileLeftSidebar({ onAddBlock, onClose, selectedBlock, onUpdateBlock }: MobileLeftSidebarProps) {
  const [currentView, setCurrentView] = useState<'blocks' | 'button' | 'pages' | 'style'>('blocks');
  const [sections, setSections] = useState({
    basic: true,
    layout: true,
    videoSettings: true,
    playSettings: true
  });
  const [searchQuery, setSearchQuery] = useState('');
 
  // Pages state
  const [activePage, setActivePage] = useState('Home');
 
  // Button state
  const [isPlaying, setIsPlaying] = useState(false);
 
  // Style state - initialize from selectedBlock if available
  const [activeColor, setActiveColor] = useState<number | null>(null);
  const [activeAlign, setActiveAlign] = useState<'left' | 'center' | 'right'>(
    (selectedBlock?.props?.align as 'left' | 'center' | 'right') || 'center'
  );
  const [opacity, setOpacity] = useState(
    selectedBlock?.props?.opacity !== undefined ? Math.round((selectedBlock.props.opacity as number) * 100) : 100
  );
 
  const handleUpdate = (updates: Record<string, any>) => {
    if (selectedBlock && onUpdateBlock) {
      onUpdateBlock(selectedBlock.id, { ...selectedBlock.props, ...updates });
    }
  };
 
  const toggleSection = (section: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
 
  const renderCard = (label: string, icon: React.ReactNode, type: BlockType) => (
    <button
      onClick={() => onAddBlock(type)}
      className="bg-white rounded-[12px] flex flex-col items-center justify-center h-[70px] w-full gap-1.5 cursor-pointer hover:bg-gray-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-md active:scale-95 focus:outline-none"
    >
      <div className="text-[#0B1D40]">
        {icon}
      </div>
      <span className="text-[10px] font-bold text-[#0B1D40]">{label}</span>
    </button>
  );
 
  if (currentView === 'pages') {
    return (
      <div className="w-full h-full flex flex-col bg-[#06183C] text-white rounded-t-3xl overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-[#06183C]">
          <button onClick={() => setCurrentView('style')} className="p-1 focus:outline-none hover:bg-white/5 rounded transition-all duration-300 hover:-translate-x-1 hover:scale-110">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <span className="font-bold text-[18px]">Pages</span>
          <button onClick={() => setCurrentView('blocks')} className="p-1 focus:outline-none hover:bg-white/5 rounded transition-all duration-300 hover:translate-x-1 hover:scale-110">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
 
        <div className="w-full h-[1px] bg-[#1A2F5A]"></div>
 
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col">
            {['Home', 'About Us', 'Our Products', 'Categories', 'Conatct'].map((page, idx) => {
              const icons = [
                <Home key="home" className="w-5 h-5 text-white" />,
                <Info key="info" className="w-5 h-5 text-white" />,
                <FileText key="file" className="w-5 h-5 text-white" />,
                <Mail key="mail" className="w-5 h-5 text-white" />,
                <UserRound key="user" className="w-5 h-5 text-white" />,
              ];
              return (
                <button
                  key={page}
                  onClick={() => setActivePage(page)}
                  className={`flex items-center justify-between px-6 py-4 border-b border-[#1A2F5A] focus:outline-none transition-all duration-300 group hover:translate-x-1 ${activePage === page ? 'bg-[#0A1F4D]' : 'hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-4">
                    {icons[idx]}
                    <span className="text-[15px] font-medium text-white">{page}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
 
  if (currentView === 'button') {
    return (
      <div className="w-full h-full flex flex-col bg-[#06183C] text-white rounded-t-3xl overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-[#06183C]">
          <button onClick={() => setCurrentView('blocks')} className="p-1 focus:outline-none hover:bg-white/5 rounded transition-all duration-300 hover:-translate-x-1 hover:scale-110">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <span className="font-bold text-[18px]">Button</span>
          <button onClick={() => setCurrentView('style')} className="p-1 focus:outline-none hover:bg-white/5 rounded transition-all duration-300 hover:translate-x-1 hover:scale-110">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
 
        <div className="w-full h-[1px] bg-[#1A2F5A]"></div>
 
        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-20">
 
          {/* Video Settings */}
          <div className="px-6 py-4">
            <button onClick={() => toggleSection('videoSettings')} className="flex items-center justify-between w-full pb-4 text-white text-[15px] font-bold focus:outline-none">
              Video Settings
              {sections.videoSettings ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
 
            <div className={`transition-all duration-300 overflow-hidden ${sections.videoSettings ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="w-full h-[160px] rounded-xl overflow-hidden relative mb-6">
                <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1200&h=800" alt="Mountain" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <PlayCircle className="w-12 h-12 text-white stroke-[1.5]" />
                </div>
              </div>
 
              <div className="flex gap-6 mb-6">
                {/* Dimensions */}
                <div className="flex-1">
                  <span className="block text-[14px] font-bold mb-3">Dimensions</span>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center border border-[#1A2F5A] rounded-md overflow-hidden bg-[#0A1F4D] cursor-pointer">
                      <span className="px-3 text-[13px] text-gray-300">W</span>
                      <input
                        type="text"
                        className="flex-1 text-center text-[13px] font-medium bg-transparent outline-none w-full"
                        defaultValue={(selectedBlock?.props?.width as string) || "20 px"}
                        onBlur={(e) => handleUpdate({ width: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdate({ width: e.currentTarget.value });
                        }}
                      />
                      <div className="px-2 py-2 border-l border-[#1A2F5A]">
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                    </div>
                    <div className="flex items-center border border-[#1A2F5A] rounded-md overflow-hidden bg-[#0A1F4D] cursor-pointer">
                      <span className="px-3 text-[13px] text-gray-300">H</span>
                      <input
                        type="text"
                        className="flex-1 text-center text-[13px] font-medium bg-transparent outline-none w-full"
                        defaultValue={(selectedBlock?.props?.height as string) || "12 px"}
                        onBlur={(e) => handleUpdate({ height: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdate({ height: e.currentTarget.value });
                        }}
                      />
                      <div className="px-2 py-2 border-l border-[#1A2F5A]">
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
 
                {/* Border Radius */}
                <div className="flex-1">
                  <span className="block text-[14px] font-bold mb-3">Border Radius</span>
                  <div className="flex items-center border border-[#1A2F5A] rounded-md overflow-hidden bg-[#0A1F4D] cursor-pointer">
                    <span className="px-3 text-[13px] text-gray-300">R</span>
                    <input type="text" className="flex-1 text-center text-[13px] font-medium bg-transparent outline-none w-full" defaultValue="18 px" />
                    <div className="px-2 py-2 border-l border-[#1A2F5A]">
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
 
          <div className="w-full h-[2px] bg-[#1E88E5]"></div>
 
          {/* Play Settings */}
          <div className="px-6 py-4">
            <button onClick={() => toggleSection('playSettings')} className="flex items-center justify-between w-full pb-4 text-white text-[15px] font-bold focus:outline-none">
              Play
              {sections.playSettings ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
 
            <div className={`transition-all duration-300 overflow-hidden ${sections.playSettings ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button className="w-8 h-8 bg-white hover:bg-gray-200 transition-colors rounded-md flex items-center justify-center text-[#0B1D40] focus:outline-none">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <Plus className="w-5 h-5 text-gray-300" />
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`w-12 h-8 rounded-full flex items-center px-1.5 transition-colors focus:outline-none ${isPlaying ? 'bg-[#7BA9FF] justify-end' : 'bg-[#1A2F5A] justify-start'}`}
                  >
                    {!isPlaying && <ChevronRight className="w-4 h-4 text-white ml-0.5" />}
                    <div className="w-5 h-5 bg-white rounded-full transition-transform"></div>
                    {isPlaying && <ChevronLeft className="w-4 h-4 text-[#7BA9FF] mr-0.5" />}
                  </button>
                  <button className="w-8 h-8 bg-white hover:bg-gray-200 transition-colors rounded-md flex items-center justify-center text-[#0B1D40] focus:outline-none">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
 
                <div className="border border-[#1A2F5A] bg-[#0A1F4D] rounded-full px-3 py-1.5 flex items-center gap-3">
                  <button className="focus:outline-none"><div className="w-2.5 h-2.5 bg-white rounded-full"></div></button>
                  <button className="focus:outline-none hover:opacity-70"><ChevronLeft className="w-4 h-4 text-gray-300" /></button>
                  <button className="focus:outline-none hover:opacity-70"><Minus className="w-4 h-4 text-gray-300" /></button>
                  <button className="focus:outline-none hover:opacity-70"><Plus className="w-4 h-4 text-gray-300" /></button>
                  <button className="focus:outline-none hover:opacity-70"><ChevronRight className="w-4 h-4 text-gray-300" /></button>
                </div>
              </div>
            </div>
          </div>
 
        </div>
      </div>
    );
  }
 
  if (currentView === 'style') {
    return (
      <div className="w-full h-full flex flex-col bg-[#06183C] text-white rounded-t-3xl overflow-hidden relative border-2 border-[#1E88E5]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5">
          <button onClick={() => setCurrentView('button')} className="p-1 focus:outline-none hover:bg-white/5 rounded transition-all duration-300 hover:-translate-x-1 hover:scale-110">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <span className="font-bold text-[18px]">Style</span>
          <button onClick={() => setCurrentView('pages')} className="p-1 focus:outline-none hover:bg-white/5 rounded transition-all duration-300 hover:translate-x-1 hover:scale-110">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
 
        <div className="w-full h-[1px] bg-[#1A2F5A]"></div>
 
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Color Palette */}
          <div className="flex items-center gap-[6px] mb-6">
            <button onClick={() => { setActiveColor(0); handleUpdate({ bg: 'transparent' }); }} className={`w-[26px] h-[26px] rounded-[4px] border ${activeColor === 0 ? 'border-white' : 'border-[#1A2F5A]'} flex items-center justify-center bg-[#0A1F4D] transition-transform hover:scale-110`}><Ban className="w-4 h-4 text-gray-400" /></button>
            <button onClick={() => setActiveColor(1)} className={`w-[26px] h-[26px] rounded-[4px] border ${activeColor === 1 ? 'border-white' : 'border-[#1A2F5A]'} flex items-center justify-center bg-[#0A1F4D] transition-transform hover:scale-110`}><Pipette className="w-3.5 h-3.5 text-gray-400" /></button>
            <button onClick={() => { setActiveColor(2); handleUpdate({ bg: 'linear-gradient(90deg, #94ff24, #ff2f2f)' }); }} className={`w-[26px] h-[26px] rounded-[4px] bg-gradient-to-r from-[#94ff24] via-[#ff2f2f] to-[#ff2f2f] ${activeColor === 2 ? 'ring-2 ring-white' : ''} transition-transform hover:scale-110`}></button>
            <button onClick={() => { setActiveColor(3); handleUpdate({ bg: '#EF4444' }); }} className={`w-[26px] h-[26px] rounded-[4px] bg-[#EF4444] ${activeColor === 3 ? 'ring-2 ring-white' : ''} transition-transform hover:scale-110`}></button>
            <button onClick={() => { setActiveColor(4); handleUpdate({ bg: '#22C55E' }); }} className={`w-[26px] h-[26px] rounded-[4px] bg-[#22C55E] ${activeColor === 4 ? 'ring-2 ring-white' : ''} transition-transform hover:scale-110`}></button>
            <button onClick={() => { setActiveColor(5); handleUpdate({ bg: '#3B82F6' }); }} className={`w-[26px] h-[26px] rounded-[4px] bg-[#3B82F6] ${activeColor === 5 ? 'ring-2 ring-white' : ''} transition-transform hover:scale-110`}></button>
            <button onClick={() => { setActiveColor(6); handleUpdate({ bg: '#EAB308' }); }} className={`w-[26px] h-[26px] rounded-[4px] bg-[#EAB308] ${activeColor === 6 ? 'ring-2 ring-white' : ''} transition-transform hover:scale-110`}></button>
            <button onClick={() => { setActiveColor(7); handleUpdate({ bg: '#FCA5A5' }); }} className={`w-[26px] h-[26px] rounded-[4px] bg-[#FCA5A5] ${activeColor === 7 ? 'ring-2 ring-white' : ''} transition-transform hover:scale-110`}></button>
            <button onClick={() => { setActiveColor(8); handleUpdate({ bg: '#D97706' }); }} className={`w-[26px] h-[26px] rounded-[4px] bg-[#D97706] ${activeColor === 8 ? 'ring-2 ring-white' : ''} transition-transform hover:scale-110`}></button>
            <button onClick={() => { setActiveColor(9); handleUpdate({ bg: '#D8B4FE' }); }} className={`w-[26px] h-[26px] rounded-[4px] bg-[#D8B4FE] ${activeColor === 9 ? 'ring-2 ring-white' : ''} transition-transform hover:scale-110`}></button>
            <button onClick={() => { setActiveColor(10); handleUpdate({ bg: '#EC4899' }); }} className={`w-[26px] h-[26px] rounded-[4px] bg-[#EC4899] ${activeColor === 10 ? 'ring-2 ring-white' : ''} transition-transform hover:scale-110`}></button>
            <button onClick={() => { setActiveColor(11); handleUpdate({ bg: '#ffffff' }); }} className={`w-[26px] h-[26px] rounded-[4px] bg-white ${activeColor === 11 ? 'ring-2 ring-blue-500' : ''} transition-transform hover:scale-110`}></button>
          </div>
 
          {/* Position */}
          <div className="mb-6">
            <span className="block text-[13px] text-gray-300 mb-2">Position</span>
            <div className="flex items-center justify-between">
              <div className="flex items-center border border-[#1A2F5A] rounded-md overflow-hidden bg-[#0A1F4D]">
                <button onClick={() => { setActiveAlign('left'); handleUpdate({ align: 'left' }); }} className={`px-[10px] py-[6px] border-r border-[#1A2F5A] focus:outline-none transition-all duration-300 hover:scale-105 ${activeAlign === 'left' ? 'bg-white/10' : 'hover:bg-white/5'}`}><AlignLeft className="w-4 h-4 text-gray-300" /></button>
                <button onClick={() => { setActiveAlign('center'); handleUpdate({ align: 'center' }); }} className={`px-[10px] py-[6px] border-r border-[#1A2F5A] focus:outline-none transition-all duration-300 hover:scale-105 ${activeAlign === 'center' ? 'bg-white/10' : 'hover:bg-white/5'}`}><AlignCenter className="w-4 h-4 text-gray-300" /></button>
                <button onClick={() => { setActiveAlign('right'); handleUpdate({ align: 'right' }); }} className={`px-[10px] py-[6px] focus:outline-none transition-all duration-300 hover:scale-105 ${activeAlign === 'right' ? 'bg-white/10' : 'hover:bg-white/5'}`}><AlignRight className="w-4 h-4 text-gray-300" /></button>
              </div>
 
              <div className="flex items-center border border-[#1A2F5A] rounded-full overflow-hidden bg-[#2D4571] px-1 py-1">
                <button onClick={() => handleUpdate({ rotation: ((selectedBlock?.props?.rotation as number) || 0) + 90 })} className="p-1 hover:bg-white/10 focus:outline-none rounded-full transition-transform hover:scale-110 hover:rotate-90"><RotateCw className="w-3.5 h-3.5 text-white" /></button>
                <button onClick={() => handleUpdate({ flipV: !(selectedBlock?.props?.flipV as boolean) })} className="p-1 hover:bg-white/10 focus:outline-none rounded-full transition-transform hover:scale-110 hover:-rotate-90"><FlipVertical className="w-3.5 h-3.5 text-white" /></button>
                <button onClick={() => handleUpdate({ flipH: !(selectedBlock?.props?.flipH as boolean) })} className="p-1 hover:bg-white/10 focus:outline-none rounded-full transition-transform hover:scale-110 hover:rotate-90"><FlipHorizontal className="w-3.5 h-3.5 text-white" /></button>
              </div>
 
              <div className="flex items-center border border-[#1A2F5A] rounded-md overflow-hidden bg-[#0A1F4D] transition-colors focus-within:ring-1 focus-within:ring-white">
                <div className="flex items-center px-2 py-[6px] border-r border-[#1A2F5A]">
                  <ArrowUpDown className="w-3.5 h-3.5 text-gray-300 mr-1" />
                  <input type="text" className="w-[30px] bg-transparent outline-none text-[14px] font-medium" defaultValue="16" />
                </div>
                <button className="px-2 py-[6px] hover:bg-white/5 focus:outline-none transition-transform hover:scale-110"><ChevronDown className="w-4 h-4 text-gray-300" /></button>
              </div>
            </div>
          </div>
 
          {/* Effects */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] text-gray-300">Effects</span>
              <button className="focus:outline-none hover:bg-white/5 p-1 rounded"><Plus className="w-4 h-4 text-gray-400" /></button>
            </div>
            <button className="w-full flex items-center justify-between border border-[#1A2F5A] rounded-md overflow-hidden bg-[#0A1F4D] px-3 py-2.5 focus:outline-none hover:bg-white/5 transition-colors">
              <span className="text-[13px] text-gray-300">Background blur</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>
 
          {/* Opacity */}
          <div className="flex items-center justify-between mb-8 relative group">
            <span className="text-[13px] text-gray-300 w-16">Opacity</span>
            <div className="flex-1 mx-4 relative flex items-center">
              <input
                type="range"
                min="0" max="100"
                value={opacity}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setOpacity(val);
                  handleUpdate({ opacity: val / 100 });
                }}
                className="w-full h-1 bg-[#1A2F5A] rounded-full appearance-none outline-none z-10 cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
                style={{
                  background: `linear-gradient(to right, white ${opacity}%, #1A2F5A ${opacity}%)`
                }}
              />
            </div>
            <div className="bg-[#1A2F5A] rounded-md px-3 py-1.5 text-[14px] w-14 text-center font-medium">{opacity}</div>
          </div>
 
          {/* Corner Radius */}
          <div>
            <span className="block text-[13px] text-gray-300 mb-2">Corner Radius</span>
            <div className="flex items-center gap-3">
              {[0, 1, 2, 3].map((val, i) => (
                <div key={i} className="flex items-center gap-2 border border-[#1A2F5A] rounded-md bg-[#0A1F4D] px-2.5 py-1.5 flex-1 justify-center focus-within:border-blue-500 transition-colors">
                  <div className="w-3.5 h-3.5 border border-dashed border-gray-500 rounded-sm relative shrink-0">
                    {i === 0 && <div className="absolute top-[-1px] left-[-1px] w-[6px] h-[6px] border-t-[1.5px] border-l-[1.5px] border-white rounded-tl-[2px]"></div>}
                    {i === 1 && <div className="absolute top-[-1px] right-[-1px] w-[6px] h-[6px] border-t-[1.5px] border-r-[1.5px] border-white rounded-tr-[2px]"></div>}
                    {i === 2 && <div className="absolute bottom-[-1px] right-[-1px] w-[6px] h-[6px] border-b-[1.5px] border-r-[1.5px] border-white rounded-br-[2px]"></div>}
                    {i === 3 && <div className="absolute bottom-[-1px] left-[-1px] w-[6px] h-[6px] border-b-[1.5px] border-l-[1.5px] border-white rounded-bl-[2px]"></div>}
                  </div>
                  <input
                    type="text"
                    defaultValue="0"
                    className="w-full bg-transparent outline-none text-[14px] text-center"
                    onBlur={(e) => handleUpdate({ borderRadius: `${e.target.value}px` })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdate({ borderRadius: `${e.currentTarget.value}px` });
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
 
        </div>
      </div>
    );
  }
 
  const blocksContent = [
    { label: 'Text', icon: <Type className="w-5 h-5" />, type: 'text' as BlockType },
    { label: 'Images', icon: <ImageIcon className="w-5 h-5" />, type: 'image' as BlockType },
    { label: 'Button', icon: <div className="w-[24px] h-[14px] border-[1.5px] border-[#0B1D40] rounded-[4px] flex items-center justify-center"><Minus className="w-3 h-3" strokeWidth={3} /></div>, type: 'button' as BlockType },
    { label: 'Video', icon: <MonitorPlay className="w-5 h-5" />, type: 'video' as BlockType },
    { label: 'Divider', icon: <div className="w-[20px] h-[12px] border-[1.5px] border-[#0B1D40] flex items-center justify-center"><Minus className="w-3 h-3" strokeWidth={3} /></div>, type: 'divider' as BlockType },
    { label: 'Layout', icon: <LayoutTemplate className="w-5 h-5" />, type: 'section' as BlockType }
  ];
 
  const layoutContent = [
    { label: 'Section', icon: <BoxSelect className="w-5 h-5" />, type: 'section' as BlockType },
    { label: 'Columns', icon: <Columns className="w-5 h-5" />, type: 'columns' as BlockType },
    { label: 'Header', icon: <Heading className="w-5 h-5" />, type: 'header' as BlockType }
  ];
 
  const filteredBlocks = blocksContent.filter(b => b.label.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredLayout = layoutContent.filter(b => b.label.toLowerCase().includes(searchQuery.toLowerCase()));
 
  return (
    <div className="w-full h-full flex flex-col bg-[#06183C] text-white rounded-t-3xl overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 bg-[#06183C]">
        <button onClick={() => setCurrentView('pages')} className="p-1 focus:outline-none hover:bg-white/5 rounded transition-all duration-300 hover:-translate-x-1 hover:scale-110">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <span className="font-bold text-[18px]">Blocks</span>
        <button onClick={() => setCurrentView('button')} className="p-1 focus:outline-none hover:bg-white/5 rounded transition-all duration-300 hover:translate-x-1 hover:scale-110">
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>
 
      <div className="w-full h-[1px] bg-[#1A2F5A]"></div>
 
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 pb-20 relative">
 
        {/* Search */}
        <div className="mb-6">
          <div className="relative border border-[#1A2F5A] rounded-md overflow-hidden bg-[#0A1F4D]">
            <input
              type="text"
              placeholder="Search Blocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-white text-[14px] px-4 py-3 outline-none placeholder-gray-400 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
 
        {/* Basic Blocks */}
        <div className="py-2 border-b border-transparent">
          <button
            onClick={() => toggleSection('basic')}
            className="flex items-center justify-between w-full pb-4 text-white text-[15px] font-bold focus:outline-none"
          >
            Basic Blocks
            {sections.basic ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
 
          <div className={`grid grid-cols-5 gap-x-2 gap-y-4 transition-all duration-300 overflow-hidden ${sections.basic ? 'max-h-[500px] pb-6 opacity-100' : 'max-h-0 pb-0 opacity-0'}`}>
            {filteredBlocks.map(b => renderCard(b.label, b.icon, b.type))}
            {filteredBlocks.length === 0 && <span className="text-gray-400 text-sm col-span-5">No blocks found.</span>}
          </div>
        </div>
 
        {/* Layout Blocks */}
        <div className="py-4">
          <button
            onClick={() => toggleSection('layout')}
            className="flex items-center justify-between w-full pb-4 text-white text-[15px] font-bold focus:outline-none"
          >
            Layout Blocks
            {sections.layout ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
 
          <div className={`grid grid-cols-5 gap-x-2 gap-y-4 transition-all duration-300 overflow-hidden ${sections.layout ? 'max-h-[500px] pb-4 opacity-100' : 'max-h-0 pb-0 opacity-0'}`}>
            {filteredLayout.map(b => renderCard(b.label, b.icon, b.type))}
            {filteredLayout.length === 0 && <span className="text-gray-400 text-sm col-span-5">No layout blocks found.</span>}
          </div>
        </div>
 
      </div>
 
      {/* Floating Help Button */}
      <button
        className="absolute bottom-6 right-6 w-[52px] h-[52px] bg-[#7BA9FF] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#6094F8] transition-colors focus:outline-none"
        aria-label="Help"
        onClick={() => alert("Help clicked!")}
      >
        <span className="text-[24px] font-medium leading-none">?</span>
      </button>
 
    </div>
  );
}
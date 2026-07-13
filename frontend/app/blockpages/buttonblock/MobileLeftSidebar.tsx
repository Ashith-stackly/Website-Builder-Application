import React, { useState } from 'react';
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Type, Image as ImageIcon, Minus, MonitorPlay,
  LayoutTemplate, Columns, Heading, BoxSelect, Search,
  PlayCircle, Plus, Home, Info, FileText, Mail, UserRound,
  Ban, Pipette, AlignLeft, AlignCenter, AlignRight,
  RotateCw, FlipVertical, FlipHorizontal, ArrowUpDown, Play, Download, ShoppingBag
} from 'lucide-react';
import { BlockType } from './types';
 
interface MobileLeftSidebarProps {
  onAddBlock: (type: BlockType) => void;
  onClose: () => void;
  selectedBlock?: { id: string; props: Record<string, unknown> } | null;
  onUpdateBlock?: (id: string, props: Record<string, unknown>) => void;
}
 
export default function MobileLeftSidebar({ onAddBlock, onClose, selectedBlock, onUpdateBlock }: MobileLeftSidebarProps) {
  const [currentView, setCurrentView] = useState<'blocks' | 'button' | 'pages'>('blocks');
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
  const [buttonTab, setButtonTab] = useState<'Label' | 'Link'>('Label');
 
  const applyPreset = (props: Record<string, unknown>) => {
    handleUpdate(props);
  };
 
  // Style state - initialize from selectedBlock if available
  const [activeColor, setActiveColor] = useState<number | null>(null);
  const [activeAlign, setActiveAlign] = useState<'left' | 'center' | 'right'>(
    (selectedBlock?.props?.align as 'left' | 'center' | 'right') || 'center'
  );
  const [opacity, setOpacity] = useState(
    selectedBlock?.props?.opacity !== undefined ? Math.round((selectedBlock.props.opacity as number) * 100) : 100
  );
 
  const handleUpdate = (updates: Record<string, unknown>) => {
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
          <button onClick={() => setCurrentView('button')} className="p-1 focus:outline-none hover:bg-white/5 rounded transition-all duration-300 hover:-translate-x-1 hover:scale-110">
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
            {['Home', 'About Me', 'Our Products', 'Categories', 'Video Block', 'Get in Touch (Contact)'].map((page, idx) => {
              const icons = [
                <Home key="home" className="w-5 h-5 text-white" />,
                <Info key="info" className="w-5 h-5 text-white" />,
                <FileText key="file" className="w-5 h-5 text-white" />,
                <Mail key="mail" className="w-5 h-5 text-white" />,
                <MonitorPlay key="video" className="w-5 h-5 text-white" />,
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
          <button onClick={() => setCurrentView('pages')} className="p-1 focus:outline-none hover:bg-white/5 rounded transition-all duration-300 hover:translate-x-1 hover:scale-110">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
 
        <div className="w-full h-[1px] bg-[#1A2F5A]"></div>
 
        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-20">
 
          {/* Button Label and Link Headers */}
          <div className="px-6 py-6">
            <div className="flex items-center gap-4 sm:gap-8 mb-6">
              <button
                onClick={() => setButtonTab('Label')}
                className={`font-bold text-[14px] sm:text-[15px] whitespace-nowrap transition-colors ${buttonTab === 'Label' ? 'text-white' : 'text-[#8495A5]'}`}
              >
                Button Label
              </button>
              <button
                onClick={() => setButtonTab('Link')}
                className={`font-bold text-[14px] sm:text-[15px] whitespace-nowrap transition-colors ${buttonTab === 'Link' ? 'text-white' : 'text-[#8495A5]'}`}
              >
                Button Link
              </button>
            </div>
 
            {buttonTab === 'Label' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
                {/* Row 1 */}
                <button onClick={() => applyPreset({ label: 'Create Account', backgroundColor: '#10B981', borderRadius: '12px', color: '#fff', iconType: 'none', iconPosition: 'none', buttonVariant: 'custom', dropShadow: false })} className="bg-[#10B981] hover:bg-[#059669] text-white text-[11px] sm:text-[12px] font-medium py-3.5 px-2 rounded-xl transition-colors">
                  Create Account
                </button>
                <button onClick={() => applyPreset({ label: 'Get Started', iconPosition: 'right', iconType: 'arrow', backgroundColor: '#4F46E5', color: '#fff', borderRadius: '12px', buttonVariant: 'custom', dropShadow: false })} className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[11px] sm:text-[12px] font-medium py-3.5 px-2 rounded-xl transition-colors flex items-center justify-center gap-1">
                  Get Started <span className="font-light">→</span>
                </button>
                <button onClick={() => applyPreset({ label: 'Try it for free', iconPosition: 'right', iconType: 'chevron', backgroundColor: '#262626', color: '#fff', borderRadius: '4px', buttonVariant: 'custom', dropShadow: false })} className="bg-[#262626] border border-[#404040] hover:bg-[#404040] text-white text-[11px] sm:text-[12px] font-medium py-3.5 px-2 rounded-sm transition-colors flex items-center justify-center gap-1">
                  Try it for free <ChevronRight size={12} className="text-[#8495A5]" />
                </button>
 
                {/* Row 2 */}
                <button onClick={() => applyPreset({ label: 'Sign Up', backgroundColor: '#5B21B6', color: '#fff', buttonVariant: 'pill', iconType: 'none', iconPosition: 'none', dropShadow: false })} className="bg-[#5B21B6] hover:bg-[#4C1D95] text-white text-[11px] sm:text-[12px] font-medium py-3.5 px-2 rounded-full transition-colors">
                  Sign Up
                </button>
                <button onClick={() => applyPreset({ label: 'Click Me', backgroundColor: '#D946EF', color: '#fff', borderRadius: '12px', buttonVariant: 'custom', iconType: 'none', iconPosition: 'none', dropShadow: false })} className="bg-[#D946EF] hover:bg-[#C026D3] text-white text-[11px] sm:text-[12px] font-medium py-3.5 px-2 rounded-xl transition-colors">
                  Click Me
                </button>
                <button onClick={() => applyPreset({ label: 'Get it', backgroundColor: '#EF4444', color: '#fff', buttonVariant: 'pill', iconType: 'none', iconPosition: 'none', dropShadow: false })} className="bg-[#EF4444] hover:bg-[#DC2626] text-white text-[11px] sm:text-[12px] font-medium py-3.5 px-2 rounded-full transition-colors">
                  Get it
                </button>
 
                {/* Row 3 */}
                <button onClick={() => applyPreset({ label: 'Click Me', backgroundColor: '#FFFFFF', color: '#000000', buttonVariant: 'pill', dropShadow: true, iconType: 'none', iconPosition: 'none' })} className="bg-white text-black text-[11px] sm:text-[12px] font-medium py-3.5 px-2 rounded-full transition-transform hover:-translate-y-0.5 shadow-[-4px_4px_0_#262626] ml-1 mb-1">
                  Click Me
                </button>
                <button onClick={() => applyPreset({ label: 'Sign In', backgroundColor: 'linear-gradient(to right, #D946EF, #8B5CF6)', color: '#fff', borderRadius: '12px', buttonVariant: 'custom', dropShadow: false, iconType: 'none', iconPosition: 'none' })} className="bg-gradient-to-r from-[#D946EF] to-[#8B5CF6] hover:opacity-90 text-white text-[11px] sm:text-[12px] font-medium py-3.5 px-2 rounded-xl transition-opacity">
                  Sign In
                </button>
                <button onClick={() => applyPreset({ label: 'Get in touch', backgroundColor: '#F59E0B', color: '#fff', borderRadius: '20px 6px 6px 20px', buttonVariant: 'custom', dropShadow: false, iconType: 'none', iconPosition: 'none' })} className="bg-[#F59E0B] hover:bg-[#D97706] text-white text-[11px] sm:text-[12px] font-medium py-3.5 px-2 rounded-tl-[20px] rounded-br-[20px] rounded-tr-md rounded-bl-md transition-colors">
                  Get in touch
                </button>
 
                {/* Row 4 */}
                <div className="bg-white rounded-xl p-1.5 flex flex-col sm:flex-row items-center col-span-2 h-auto sm:h-[46px] gap-1 sm:gap-0">
                  <button onClick={() => applyPreset({ label: 'Free trail', backgroundColor: '#262626', color: '#fff', borderRadius: '10px', buttonVariant: 'custom', dropShadow: false, iconType: 'none', iconPosition: 'none' })} className="bg-[#262626] text-white text-[11px] sm:text-[12px] font-medium px-4 py-2 sm:py-0 rounded-[10px] whitespace-nowrap w-full sm:w-auto h-full flex items-center justify-center">
                    Free trail
                  </button>
 
                </div>
                <button onClick={() => applyPreset({ label: 'Sign up for free', backgroundColor: '#22D3EE', color: '#0B182B', buttonVariant: 'pill', dropShadow: false, iconType: 'none', iconPosition: 'none' })} className="bg-[#22D3EE] hover:bg-[#06B6D4] text-[#0B182B] text-[11px] sm:text-[12px] font-medium py-3.5 px-2 rounded-full transition-colors">
                  Sign up for free
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
                <button onClick={() => applyPreset({ label: 'READ MORE', backgroundColor: 'linear-gradient(to right, #D946EF, #7C3AED)', color: '#fff', borderRadius: '10px', iconPosition: 'right', iconType: 'chevron-circle', buttonVariant: 'custom' })} className="bg-gradient-to-r from-[#D946EF] to-[#7C3AED] flex items-center justify-between px-2 py-3.5 rounded-[10px] text-white text-[9px] sm:text-[10px] font-medium transition-transform hover:scale-105 shadow-sm">
                  <span>READ MORE</span>
                  <div className="bg-white rounded-full p-[2px] text-[#7C3AED]"><ChevronRight size={10} strokeWidth={3} /></div>
                </button>
 
                <button onClick={() => applyPreset({ label: 'LEARN MORE', backgroundColor: 'linear-gradient(to right, #22D3EE, #2563EB)', color: '#fff', borderRadius: '10px', iconPosition: 'right', iconType: 'chevron-circle', buttonVariant: 'custom' })} className="bg-gradient-to-r from-[#22D3EE] to-[#2563EB] flex items-center justify-between px-2 py-3.5 rounded-[10px] text-white text-[9px] sm:text-[10px] font-medium transition-transform hover:scale-105 shadow-sm">
                  <span>LEARN MORE</span>
                  <div className="bg-white rounded-full p-[2px] text-[#2563EB]"><ChevronRight size={10} strokeWidth={3} /></div>
                </button>
 
                <button onClick={() => applyPreset({ label: 'WATCH NOW', backgroundColor: 'linear-gradient(to right, #FBBF24, #F59E0B)', color: '#fff', borderRadius: '10px', iconPosition: 'right', iconType: 'play-circle', buttonVariant: 'custom' })} className="bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] flex items-center justify-between px-2 py-3.5 rounded-[10px] text-white text-[9px] sm:text-[10px] font-medium transition-transform hover:scale-105 shadow-sm">
                  <span>WATCH NOW</span>
                  <div className="bg-white rounded-full p-[2px] text-[#F59E0B]"><Play size={10} strokeWidth={3} fill="currentColor" /></div>
                </button>
 
                <button onClick={() => applyPreset({ label: 'BOOK NOW', backgroundColor: 'linear-gradient(to right, #FBBF24, #F59E0B)', color: '#fff', borderRadius: '10px', iconPosition: 'right', iconType: 'chevron-circle', buttonVariant: 'custom' })} className="bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] flex items-center justify-between px-2 py-3.5 rounded-[10px] text-white text-[9px] sm:text-[10px] font-medium transition-transform hover:scale-105 shadow-sm">
                  <span>BOOK NOW</span>
                  <div className="bg-white rounded-full p-[2px] text-[#F59E0B]"><ChevronRight size={10} strokeWidth={3} /></div>
                </button>
 
                <button onClick={() => applyPreset({ label: 'DOWNLOAD', backgroundColor: 'linear-gradient(to right, #D946EF, #7C3AED)', color: '#fff', borderRadius: '10px', iconPosition: 'right', iconType: 'download-circle', buttonVariant: 'custom' })} className="bg-gradient-to-r from-[#D946EF] to-[#7C3AED] flex items-center justify-between px-2 py-3.5 rounded-[10px] text-white text-[9px] sm:text-[10px] font-medium transition-transform hover:scale-105 shadow-sm">
                  <span>DOWNLOAD</span>
                  <div className="bg-white rounded-full p-[2px] text-[#7C3AED]"><Download size={10} strokeWidth={3} /></div>
                </button>
 
                <button onClick={() => applyPreset({ label: 'BUY NOW', backgroundColor: 'linear-gradient(to right, #22D3EE, #2563EB)', color: '#fff', borderRadius: '10px', iconPosition: 'right', iconType: 'shopping-circle', buttonVariant: 'custom' })} className="bg-gradient-to-r from-[#22D3EE] to-[#2563EB] flex items-center justify-between px-2 py-3.5 rounded-[10px] text-white text-[9px] sm:text-[10px] font-medium transition-transform hover:scale-105 shadow-sm">
                  <span>BUY NOW</span>
                  <div className="bg-white rounded-full p-[2px] text-[#2563EB]"><ShoppingBag size={10} strokeWidth={3} /></div>
                </button>
              </div>
            )}
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
 
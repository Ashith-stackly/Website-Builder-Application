"use client";

import React, { useState, useEffect } from 'react';
import {
  Search, Mic, Type, Image as ImageIcon, MousePointer2,
  Video, Minus, AppWindow, Columns, Heading,
  ChevronDown, Circle, ChevronLeft, ChevronRight, Plus, AlignLeft, AlignCenter, AlignRight, Ban, Pipette,
  Play, Download, ShoppingBag, FlipHorizontal, FlipVertical, RotateCcw, ArrowUpDown, SlidersHorizontal, Filter, Crop,
  Section, X, Star
} from 'lucide-react';
import { useBuilder } from './BuilderContext';
import {
  FaWindowMinimize
} from "react-icons/fa";
export type BlockPageType = 'image' | 'button' | 'text' | 'video' | 'divider' | 'icons';

import type { TextBlockState, TextSectionProps } from "../textblock/types";


type LeftSidebarProps = {
  activeBlockPage?: BlockPageType;
  onSelectBlockPage?: (page: BlockPageType) => void;
  isImageEditingMode?: boolean;
  editingImageId?: string | null;
  isButtonEditingMode?: boolean;
  editingButtonId?: string | null;
  isVideoEditingMode?: boolean;
  isIconEditingMode?: boolean;
  onUpdateButtonStyle?: (props: Record<string, unknown>) => void;
  onUpdateVideoStyle?: (props: any) => void;
  onImageSelected?: (url: string) => void;
  onCloseMobileImageSelect?: () => void;
  activeTextTarget?: "main" | "text" | "header" | "footer" | null;
  onSelectTextTarget?: (target: "main" | "text" | "header" | "footer") => void;
  onUpdateTextStyles?: (styles: Record<string, string>) => void;
  onUpdateTextSection?: (props: Record<string, string | boolean>) => void;
  textBlockState?: TextBlockState;
  onUpdateTextBlockState?: (state: TextBlockState) => void;
};
const styleColors = [
  { class: 'bg-gradient-to-r from-[#22C55E] to-[#EF4444]', value: 'linear-gradient(90deg, #22C55E, #EF4444)' },
  { class: 'bg-[#EF4444]', value: '#EF4444' },
  { class: 'bg-[#22C55E]', value: '#22C55E' },
  { class: 'bg-[#3B82F6]', value: '#3B82F6' },
  { class: 'bg-[#EAB308]', value: '#EAB308' },
  { class: 'bg-[#FCA5A5]', value: '#FCA5A5' },
  { class: 'bg-[#D97706]', value: '#D97706' },
  { class: 'bg-[#C084FC]', value: '#C084FC' },
  { class: 'bg-[#EC4899]', value: '#EC4899' },
  { class: 'bg-[#FFFFFF]', value: '#FFFFFF' }
];

const blockCategories = [
  {
    title: 'Basic Blocks',
    blocks: [
      { name: 'Text', icon: <Type className="w-[18px] h-[18px] mb-1.5 text-[#517AA5]" strokeWidth={1.5} /> },
      { name: 'Image', icon: <ImageIcon className="w-[18px] h-[18px] mb-1.5 text-[#517AA5]" strokeWidth={1.5} /> },
      { name: 'Button', icon: <MousePointer2 className="w-[18px] h-[18px] mb-1.5 text-[#517AA5]" strokeWidth={1.5} /> },
    ]
  },
  {
    title: 'Advanced Blocks',
    blocks: [
      { name: 'Video', icon: <Video className="w-[18px] h-[18px] mb-1.5 text-[#517AA5]" strokeWidth={1.5} /> },
      { name: 'Icon', icon: <ImageIcon className="w-[18px] h-[18px] mb-1.5 text-[#517AA5]" strokeWidth={1.5} /> },
      { name: 'Divider', icon: <Minus className="w-[18px] h-[18px] mb-1.5 text-[#517AA5]" strokeWidth={1.5} /> },
    ]
  },
  {
    title: 'Layout Blocks',
    blocks: [
      { name: 'Section', icon: <AppWindow className="w-[18px] h-[18px] mb-1.5 text-[#517AA5]" strokeWidth={1.5} /> },
      { name: 'Footer', icon: <FaWindowMinimize className="w-[18px] h-[18px] mb-1.5 text-[#517AA5]" strokeWidth={1.5} /> },
      { name: 'Header', icon: <Heading className="w-[18px] h-[18px] mb-1.5 text-[#517AA5]" strokeWidth={1.5} /> },
    ]
  }
];

export default function LeftSidebar({
  activeBlockPage = 'text',
  onSelectBlockPage,
  isImageEditingMode,
  editingImageId,
  isButtonEditingMode,
  editingButtonId,
  isVideoEditingMode,
  isIconEditingMode,
  onUpdateButtonStyle,
  onUpdateVideoStyle,
  onImageSelected,
  onCloseMobileImageSelect,
  activeTextTarget,
  onSelectTextTarget,
  onUpdateTextStyles,
  onUpdateTextSection,
  textBlockState,
  onUpdateTextBlockState
}: LeftSidebarProps) {
  const [activeTab, setActiveTab] = useState('Blocks');
  const [openCategories, setOpenCategories] = useState<number[]>([0, 1, 2]);
  const [subTab, setSubTab] = useState<'all' | 'next'>('all');
  const [isOpen, setIsOpen] = useState(false);
  const [mobileOverlayTab, setMobileOverlayTab] = useState('Typography');
  const [mobileView, setMobileView] = useState<'Blocks' | 'Blocks Adjust' | 'Pages' | 'Button'>('Blocks');
  const [activeAdjustSection, setActiveAdjustSection] = useState<string | null>(null);
  const [buttonTab, setButtonTab] = useState<'Label' | 'Link'>('Label');
  const [activeMobilePage, setActiveMobilePage] = useState('Home Page');
  const [activeSwatch, setActiveSwatch] = useState(0);
  const [activeAlign, setActiveAlign] = useState<'left' | 'center' | 'right'>('left');
  const [transformState, setTransformState] = useState({ rotate: false, flipV: false, flipH: false });
  const [opacity, setOpacity] = useState(100);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeTypographyAlign, setActiveTypographyAlign] = useState<'left' | 'center' | 'right'>('left');
  const [activeTypographyAlign2, setActiveTypographyAlign2] = useState<'left' | 'center' | 'right'>('left');
  const [showHelpPopup, setShowHelpPopup] = useState(false);

  // Typography local states
  const [activeLanguage, setActiveLanguage] = useState('English');
  const [activeFont, setActiveFont] = useState('New Font Name');
  const [activeFontSize1, setActiveFontSize1] = useState('16');
  const [activeLineHeight, setActiveLineHeight] = useState('Auto');
  const [activeLetterSpacing, setActiveLetterSpacing] = useState('Normal');
  const [activeFontWeight, setActiveFontWeight] = useState('normal');

  // Style local states
  const [mobileStyleColor, setMobileStyleColor] = useState<number | null>(0);
  const [mobileStyleOpacity, setMobileStyleOpacity] = useState(100);
  const [mobileStyleSize, setMobileStyleSize] = useState(50);
  const [mobileCornerRadii, setMobileCornerRadii] = useState([0, 0, 0, 0]);

  const handlePageClick = (pageName: string, id: string) => {
    setActiveMobilePage(pageName);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('scrollToSectionEvent', { detail: id }));
    }
  };

  // Builder Context for Image Block
  const { activeElementId, updateElement, imageAdjustments, setImageAdjustments, activeFilter, setActiveFilter, activeCrop, setActiveCrop } = useBuilder();

  const fontOptions = [
    { label: 'New Font Name', value: '' },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Times New Roman', value: "'Times New Roman', serif" },
    { label: 'Courier New', value: "'Courier New', monospace" },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Verdana', value: 'Verdana, sans-serif' },
    { label: 'Inter', value: 'Inter, sans-serif' },
    { label: 'Roboto', value: 'Roboto, sans-serif' },
    { label: 'Open Sans', value: "'Open Sans', sans-serif" }
  ];

  const updateCornerRadius = (idx: number) => {
    const val = prompt('Enter corner radius value:', mobileCornerRadii[idx].toString());
    if (val !== null && !isNaN(parseInt(val))) {
      setMobileCornerRadii(prev => {
        const newRadii = [...prev];
        newRadii[idx] = parseInt(val);
        return newRadii;
      });
    }
  };

  const toggleDropdown = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    setActiveDropdown(prev => prev === name ? null : name);
  };

  const mobileAddBlock = (type: string) => {
    alert(`Successfully added to canvas: ${type}`);
  };

  useEffect(() => {
    const closeDropdown = (e: Event) => {
      setActiveDropdown(null);
    };
    document.addEventListener('click', closeDropdown);
    document.addEventListener('touchstart', closeDropdown);
    return () => {
      document.removeEventListener('click', closeDropdown);
      document.removeEventListener('touchstart', closeDropdown);
    };
  }, []);

  useEffect(() => {
    if (editingImageId && typeof window !== 'undefined' && window.innerWidth < 1024) {
      window.setTimeout(() => {
        setIsOpen(true);
        setMobileView('Blocks Adjust');
        setMobileOverlayTab('Images');
      }, 0);
    }
  }, [editingImageId]);

  const colors = [
    'bg-gradient-to-r from-[#22C55E] to-[#EF4444]',
    'bg-[#EF4444]',
    'bg-[#22C55E]',
    'bg-[#3B82F6]',
    'bg-[#EAB308]',
    'bg-[#FCA5A5]',
    'bg-[#D97706]',
    'bg-[#C084FC]',
    'bg-[#EC4899]',
    'bg-[#FFFFFF]'
  ];

  const addBlock = (type: string) => {
    if (type === 'Image') {
      onSelectBlockPage?.('image');
      return;
    }

    if (type === 'Button') {
      onSelectBlockPage?.('button');
      return;
    }

    if (type === 'Video') {
      onSelectBlockPage?.('video');
      return;
    }

    if (type === 'Divider') {
      onSelectBlockPage?.('divider');
      return;
    }

    if (type === 'Icon') {
      onSelectBlockPage?.('icons');
      return;
    }

    if (type === 'Text') {
      onSelectTextTarget?.('text');
      return;
    }

    if (type === 'Header') {
      onSelectTextTarget?.('header');
      return;
    }

    if (type === 'Footer') {
      onSelectTextTarget?.('footer');
      return;
    }

    if (type === 'Section') {
      onSelectTextTarget?.('main');
      return;
    }

    console.log(`Add block: ${type}`);
  };

  const toggleCategory = (idx: number) => {
    setOpenCategories(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleUpdateText = (key: string, value: string) => {
    if (activeBlockPage === 'button' || isButtonEditingMode) {
      if (onUpdateButtonStyle) {
        onUpdateButtonStyle({ [key]: value });
      }
    }

    if (activeTextTarget === 'header') {
      if (key === 'fontFamily') onUpdateTextSection?.({ headerFontFamily: value });
      else if (key === 'fontSize') onUpdateTextSection?.({ headerFontSize: value });
      else if (key === 'fontWeight') onUpdateTextSection?.({ headerFontWeight: value });
      else if (key === 'color') onUpdateTextSection?.({ headerText: value });
      else if (key === 'lineHeight') onUpdateTextSection?.({ headerLineHeight: value });
      else if (key === 'letterSpacing') onUpdateTextSection?.({ headerLetterSpacing: value });
      else if (key === 'textAlign') onUpdateTextSection?.({ alignment: value as 'left' | 'center' | 'right' }); // Assuming alignment is shared or mapped to alignment
    } else if (activeTextTarget === 'main') {
      if (key === 'color') onUpdateTextSection?.({ backgroundColor: value });
      else if (key === 'textAlign') onUpdateTextSection?.({ alignment: value as 'left' | 'center' | 'right' });

      onUpdateTextStyles?.({ [key]: value });
    } else {
      onUpdateTextStyles?.({ [key]: value });
    }
  };

  return (
    <>
      {/* Mobile Toggle Button (Visible when closed) */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setMobileView('Blocks');
          }}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-40 xl:hidden bg-[#0c1b33] text-white p-1.5 rounded-r-md shadow-md border border-l-0 border-[#203354] cursor-pointer flex items-center justify-center w-8 h-12"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* Mobile Bottom Sheet Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end xl:hidden pointer-events-auto">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setIsOpen(false);
              onCloseMobileImageSelect?.();
            }}
          />

          {/* Overlay Content */}
          <div className="relative bg-[#0B182B] rounded-t-3xl w-full flex flex-col shadow-[0_-4px_20px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-full duration-300 max-h-[50vh] overflow-y-auto no-scrollbar pb-32">
            {/* Header */}
            <div className={`flex items-center justify-between px-5 pt-5 pb-4 ${mobileView !== 'Blocks' ? 'border-b border-[#203354]' : ''}`}>
              <button
                onClick={() => {
                  if (mobileView === 'Button') setMobileView('Pages');
                  else if (mobileView === 'Pages') setMobileView('Blocks Adjust');
                  else if (mobileView === 'Blocks Adjust') setMobileView('Blocks');
                  else setMobileView('Button');
                }}
                className="text-white p-1 cursor-pointer transition-transform hover:-translate-x-1 focus:outline-none"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-white font-bold text-base">
                {mobileView === 'Blocks' || mobileView === 'Blocks Adjust' ? 'Blocks' : mobileView === 'Pages' ? 'Pages' : 'Button'}
              </h2>
              <button
                onClick={() => {
                  if (mobileView === 'Blocks') setMobileView('Blocks Adjust');
                  else if (mobileView === 'Blocks Adjust') setMobileView('Pages');
                  else if (mobileView === 'Pages') setMobileView('Button');
                  else setMobileView('Blocks');
                }}
                className="text-white p-1 cursor-pointer transition-transform hover:translate-x-1 focus:outline-none"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {mobileView === 'Blocks' && (
              <>
                {/* Search */}
                <div className="px-5 mb-5">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter text..."
                    className="w-full bg-[#11213A] border border-[#203354] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#8495A5] focus:outline-none focus:border-[#517AA5]"
                  />
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 mb-5 shrink-0">
                  <button
                    onClick={() => setMobileOverlayTab('Typography')}
                    className={`font-semibold text-[14px] whitespace-nowrap transition-colors ${mobileOverlayTab === 'Typography' ? 'text-white' : 'text-[#8495A5]'}`}
                  >
                    Typography
                  </button>
                  <button
                    onClick={() => setMobileOverlayTab('Style')}
                    className={`font-semibold text-[14px] whitespace-nowrap transition-colors ${mobileOverlayTab === 'Style' ? 'text-white' : 'text-[#8495A5]'}`}
                  >
                    Style
                  </button>
                  <button
                    onClick={() => setMobileOverlayTab('Size')}
                    className={`font-semibold text-[14px] whitespace-nowrap transition-colors ${mobileOverlayTab === 'Size' ? 'text-white' : 'text-[#8495A5]'}`}
                  >
                    Size
                  </button>
                  <button
                    onClick={() => setMobileOverlayTab('Section')}
                    className={`font-semibold text-[14px] whitespace-nowrap transition-colors ${mobileOverlayTab === 'Section' ? 'text-white' : 'text-[#8495A5]'}`}
                  >
                    Section
                  </button>
                  <button
                    onClick={() => setMobileOverlayTab('Images')}
                    className={`font-semibold text-[14px] whitespace-nowrap transition-colors ${mobileOverlayTab === 'Images' ? 'text-white' : 'text-[#8495A5]'}`}
                  >
                    Images
                  </button>
                  <button
                    onClick={() => setMobileOverlayTab('Video')}
                    className={`font-semibold text-[14px] whitespace-nowrap transition-colors ${mobileOverlayTab === 'Video' ? 'text-white' : 'text-[#8495A5]'}`}
                  >
                    Video
                  </button>
                </div>

                {/* Typography Content */}
                {mobileOverlayTab === 'Typography' && (
                  <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                    {/* Fonts Row 1 (Removed) */}                    {/* Fonts Row 2 */}
                    <div className="flex items-center gap-2 px-5 mb-5 overflow-visible pb-2 relative z-20">
                      <div className="relative shrink-0">
                        <div onClick={(e) => toggleDropdown('fonts', e)} className="flex items-center justify-between bg-transparent border border-[#203354] rounded-full px-3 py-1.5 min-w-[100px] cursor-pointer hover:border-[#517AA5] transition-colors">
                          <span className="text-[#8495A5] text-[12px]">{activeFont}</span>
                          <ChevronDown size={14} className={`text-[#8495A5] transition-transform duration-200 ${activeDropdown === 'fonts' ? 'rotate-180' : ''}`} />
                        </div>
                        {activeDropdown === 'fonts' && (
                          <div
                            className="absolute top-full left-0 mt-1 bg-[#1A2B4C] border border-[#203354] rounded-lg shadow-lg z-[100] py-1 w-40 max-h-48 overflow-y-auto"
                            onClick={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
                            onTouchStart={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
                          >
                            {fontOptions.map(f => (
                              <div key={f.label} onClick={() => { setActiveFont(f.label); setActiveDropdown(null); handleUpdateText('fontFamily', f.value); }} className="px-3 py-1.5 text-xs text-white hover:bg-[#203354] cursor-pointer whitespace-nowrap">{f.label}</div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="relative shrink-0">
                        <div onClick={(e) => toggleDropdown('fontSize1', e)} className="flex items-center justify-between bg-transparent border border-[#203354] rounded-full px-3 py-1.5 min-w-[60px] cursor-pointer hover:border-[#517AA5] transition-colors">
                          <span className="text-[#8495A5] text-[12px]">{activeFontSize1}</span>
                          <ChevronDown size={14} className={`text-[#8495A5] transition-transform duration-200 ${activeDropdown === 'fontSize1' ? 'rotate-180' : ''}`} />
                        </div>
                        {activeDropdown === 'fontSize1' && (
                          <div
                            className="absolute top-full left-0 mt-1 bg-[#1A2B4C] border border-[#203354] rounded-lg shadow-lg z-[100] py-1 w-20 max-h-40 overflow-y-auto"
                            onClick={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
                            onTouchStart={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
                          >
                            {['12', '14', '16', '18', '24'].map(s => (
                              <div key={s} onClick={() => { setActiveFontSize1(s); setActiveDropdown(null); handleUpdateText('fontSize', s); }} className="px-3 py-1.5 text-xs text-white hover:bg-[#203354] cursor-pointer text-center">{s}</div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="relative shrink-0">
                        <div onClick={(e) => toggleDropdown('lineHeight', e)} className="flex items-center gap-1.5 bg-transparent border border-[#203354] rounded-full px-3 py-1.5 cursor-pointer whitespace-nowrap hover:border-[#517AA5] transition-colors">
                          <div className="w-3 h-3 border border-[#8495A5] rounded-[2px] flex items-center justify-center text-[8px] text-[#8495A5]">A</div>
                          <span className="text-[#8495A5] text-[12px]">{activeLineHeight}</span>
                        </div>
                        {activeDropdown === 'lineHeight' && (
                          <div
                            className="absolute top-full left-0 mt-1 bg-[#1A2B4C] border border-[#203354] rounded-lg shadow-lg z-[100] py-1 w-24 max-h-40 overflow-y-auto"
                            onClick={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
                            onTouchStart={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
                          >
                            {['Auto', '1.2', '1.4', '1.6', '1.8', '2.0'].map(h => (
                              <div key={h} onClick={() => { setActiveLineHeight(h); setActiveDropdown(null); handleUpdateText('lineHeight', h === 'Auto' ? 'normal' : h); }} className="px-3 py-1.5 text-xs text-white hover:bg-[#203354] cursor-pointer text-center">{h}</div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="relative shrink-0">
                        <div onClick={(e) => toggleDropdown('letterSpacing', e)} className="flex items-center gap-1.5 bg-transparent border border-[#203354] rounded-full px-3 py-1.5 cursor-pointer whitespace-nowrap hover:border-[#517AA5] transition-colors">
                          <div className="flex flex-col gap-[2px]">
                            <div className="w-3 h-[1px] bg-[#8495A5]"></div>
                            <div className="w-[10px] h-[1px] bg-[#8495A5]"></div>
                            <div className="w-3 h-[1px] bg-[#8495A5]"></div>
                          </div>
                          <span className="text-[#8495A5] text-[12px]">{activeLetterSpacing}</span>
                        </div>
                        {activeDropdown === 'letterSpacing' && (
                          <div
                            className="absolute top-full left-0 mt-1 bg-[#1A2B4C] border border-[#203354] rounded-lg shadow-lg z-[100] py-1 w-24 max-h-40 overflow-y-auto"
                            onClick={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
                            onTouchStart={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
                          >
                            {['Normal', '1px', '2px', '3px', '4px', '5px'].map(sp => (
                              <div key={sp} onClick={() => { setActiveLetterSpacing(sp); setActiveDropdown(null); handleUpdateText('letterSpacing', sp === 'Normal' ? 'normal' : sp); }} className="px-3 py-1.5 text-xs text-white hover:bg-[#203354] cursor-pointer text-center">{sp}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Align Row */}
                    <div className="flex items-center gap-3 px-5 mb-8">
                      <div
                        className={`flex items-center justify-center border border-[#203354] rounded-full w-[28px] h-[28px] cursor-pointer hover:border-[#517AA5] transition-colors ${activeFontWeight === 'bold' ? 'bg-[#203354]' : ''}`}
                        onClick={() => {
                          const newWeight = activeFontWeight === 'bold' ? 'normal' : 'bold';
                          setActiveFontWeight(newWeight);
                          handleUpdateText('fontWeight', newWeight);
                        }}
                      >
                        <span className="font-bold text-white text-[13px]">N</span>
                      </div>
                      <div className="flex items-center border border-[#203354] rounded-full px-2 py-1 gap-1">
                        <button onClick={() => { setActiveTypographyAlign('left'); handleUpdateText('textAlign', 'left'); }} className={`p-1 transition-colors ${activeTypographyAlign === 'left' ? 'text-white' : 'text-[#8495A5] hover:text-white'}`}><AlignLeft size={16} /></button>
                        <button onClick={() => { setActiveTypographyAlign('center'); handleUpdateText('textAlign', 'center'); }} className={`p-1 transition-colors ${activeTypographyAlign === 'center' ? 'text-white' : 'text-[#8495A5] hover:text-white'}`}><AlignCenter size={16} /></button>
                        <button onClick={() => { setActiveTypographyAlign('right'); handleUpdateText('textAlign', 'right'); }} className={`p-1 transition-colors ${activeTypographyAlign === 'right' ? 'text-white' : 'text-[#8495A5] hover:text-white'}`}><AlignRight size={16} /></button>
                      </div>

                    </div>

                    {/* Blocks Grid */}
                    <div className="flex justify-between items-center gap-2 px-5 pb-4 overflow-x-auto no-scrollbar">
                      <div onClick={() => {
                        addBlock('Text');
                      }} className={`bg-white rounded-xl flex flex-col items-center justify-center w-[60px] h-[64px] shrink-0 cursor-pointer shadow-sm hover:scale-105 transition-transform border hover:border-[#0B182B]/20 ${activeTextTarget === 'text' ? 'ring-2 ring-[#517AA5] border-[#517AA5]' : 'border-transparent'}`}>
                        <Type className="w-5 h-5 text-[#0B182B] mb-1" strokeWidth={1.5} />
                        <span className="text-[10px] font-semibold text-[#0B182B]">Text</span>
                      </div>

                      <div onClick={() => {
                        onSelectBlockPage?.('image');
                      }} className={`bg-white rounded-xl flex flex-col items-center justify-center w-[60px] h-[64px] shrink-0 cursor-pointer shadow-sm hover:scale-105 transition-transform border hover:border-[#0B182B]/20 ${(activeBlockPage === 'image' || isImageEditingMode) ? 'ring-2 ring-[#517AA5] border-[#517AA5]' : 'border-transparent'}`}>
                        <ImageIcon className="w-5 h-5 text-[#0B182B] mb-1" strokeWidth={1.5} />
                        <span className="text-[10px] font-semibold text-[#0B182B]">Images</span>
                      </div>
                      <div onClick={() => {
                        onSelectBlockPage?.('button');
                      }} className={`bg-white rounded-xl flex flex-col items-center justify-center w-[60px] h-[64px] shrink-0 cursor-pointer shadow-sm hover:scale-105 transition-transform border hover:border-[#0B182B]/20 ${(activeBlockPage === 'button' || isButtonEditingMode) ? 'ring-2 ring-[#517AA5] border-[#517AA5]' : 'border-transparent'}`}>
                        <div className="w-5 h-5 border-[1.5px] border-[#0B182B] rounded-md flex items-center justify-center mb-1">
                          <div className="w-2.5 h-[1.5px] bg-[#0B182B]"></div>
                        </div>
                        <span className="text-[10px] font-semibold text-[#0B182B]">Button</span>
                      </div>
                      <div onClick={() => setMobileOverlayTab('Video')} className="bg-white rounded-xl flex flex-col items-center justify-center w-[60px] h-[64px] shrink-0 cursor-pointer shadow-sm hover:scale-105 transition-transform border border-transparent hover:border-[#0B182B]/20">
                        <Video className="w-5 h-5 text-[#0B182B] mb-1" strokeWidth={1.5} />
                        <span className="text-[10px] font-semibold text-[#0B182B]">Video</span>
                      </div>
                      <div onClick={() => addBlock('Icon')} className={`bg-white rounded-xl flex flex-col items-center justify-center w-[60px] h-[64px] shrink-0 cursor-pointer shadow-sm hover:scale-105 transition-transform border hover:border-[#0B182B]/20 ${(activeBlockPage === 'icons' || isIconEditingMode) ? 'ring-2 ring-[#517AA5] border-[#517AA5]' : 'border-transparent'}`}>
                        <ImageIcon className="w-5 h-5 text-[#0B182B] mb-1" strokeWidth={1.5} />
                        <span className="text-[10px] font-semibold text-[#0B182B]">Icon</span>
                      </div>
                      <div onClick={() => addBlock('Divider')} className="bg-white rounded-xl flex flex-col items-center justify-center w-[60px] h-[64px] shrink-0 cursor-pointer shadow-sm hover:scale-105 transition-transform border border-transparent hover:border-[#0B182B]/20">
                        <Minus className="w-5 h-5 text-[#0B182B] mb-1" strokeWidth={1.5} />
                        <span className="text-[10px] font-semibold text-[#0B182B]">Divider</span>
                      </div>

                      {/* <div onClick={() => {
                        addBlock('Section');
                      }} className="bg-white rounded-xl flex flex-col items-center justify-center w-[60px] h-[64px] shrink-0 cursor-pointer shadow-sm hover:scale-105 transition-transform border border-transparent hover:border-[#0B182B]/20">
                        <AppWindow className="w-5 h-5 text-[#0B182B] mb-1" strokeWidth={1.5} />
                        <span className="text-[10px] font-semibold text-[#0B182B]">Section</span>
                      </div> */}

                      <div onClick={() => {
                        addBlock('Footer');
                      }} className={`bg-white rounded-xl flex flex-col items-center justify-center w-[60px] h-[64px] shrink-0 cursor-pointer shadow-sm hover:scale-105 transition-transform border hover:border-[#0B182B]/20 ${activeTextTarget === 'footer' ? 'ring-2 ring-[#517AA5] border-[#517AA5]' : 'border-transparent'}`}>
                        <FaWindowMinimize className="w-5 h-5 text-[#0B182B] mb-1" strokeWidth={1.5} />
                        <span className="text-[10px] font-semibold text-[#0B182B]">Footer</span>
                      </div>

                      <div onClick={() => {
                        addBlock('Header');
                      }} className={`bg-white rounded-xl flex flex-col items-center justify-center w-[60px] h-[64px] shrink-0 cursor-pointer shadow-sm hover:scale-105 transition-transform border hover:border-[#0B182B]/20 ${activeTextTarget === 'header' ? 'ring-2 ring-[#517AA5] border-[#517AA5]' : 'border-transparent'}`}>
                        <Heading className="w-5 h-5 text-[#0B182B] mb-1" strokeWidth={1.5} />
                        <span className="text-[10px] font-semibold text-[#0B182B]">Header</span>
                      </div>


                    </div>
                  </div>
                )}

                {/* Style Content */}
                {mobileOverlayTab === 'Style' && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    {/* Colour Buttons */}
                    <div className="flex items-center gap-3 px-5 mb-4">
                      <button onClick={() => mobileAddBlock('Colour Mode')} className="bg-[#203354] hover:bg-[#2a436e] text-[#517AA5] text-[13px] px-4 py-1.5 rounded-lg font-medium transition-colors border border-transparent shadow-sm">
                        Colour
                      </button>
                      <button onClick={() => mobileAddBlock('Add Colour')} className="bg-[#203354]/70 hover:bg-[#203354] text-[#8495A5] text-[13px] px-4 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1">
                        <Plus size={14} /> Add Colour
                      </button>
                    </div>

                    {/* Colors Row */}
                    <div className="flex items-center gap-2.5 px-5 mb-5 overflow-x-auto no-scrollbar pb-2">
                      <button onClick={() => {
                        setMobileStyleColor(null);
                        if (isButtonEditingMode && onUpdateButtonStyle) onUpdateButtonStyle({ backgroundColor: 'transparent' });
                      }} className={`w-8 h-8 rounded-lg border border-[#203354] flex items-center justify-center shrink-0 hover:bg-[#203354]/50 transition-all ${mobileStyleColor === null ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0B182B]' : ''}`}>
                        <Ban size={16} className="text-[#8495A5]" />
                      </button>
                      <button onClick={() => mobileAddBlock('Pipette Tool')} className="w-8 h-8 rounded-lg border border-[#203354] flex items-center justify-center shrink-0 hover:bg-[#203354]/50 transition-colors">
                        <Pipette size={16} className="text-[#8495A5]" />
                      </button>

                      {/* Swatches mapping */}
                      {styleColors.map((colorObj, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setMobileStyleColor(idx);
                            if (activeBlockPage === 'button' || isButtonEditingMode) {
                              if (onUpdateButtonStyle) {
                                onUpdateButtonStyle({ backgroundColor: colorObj.value });
                              }
                            } else {
                              handleUpdateText('color', colorObj.value);
                            }
                          }}
                          className={`w-8 h-8 rounded-lg shrink-0 ${colorObj.class} shadow-sm transition-transform ${mobileStyleColor === idx ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0B182B] scale-110' : 'hover:scale-110'}`}
                        ></button>
                      ))}
                    </div>

                    {/* Divider */}
                    <div className="w-full h-[1px] bg-[#203354] mb-6"></div>

                    {/* Sliders */}
                    <div className="px-5 flex flex-col gap-5 mb-8">
                      <div className="flex items-center gap-6">
                        <span className="text-white text-[13px] font-medium w-12 shrink-0">Size</span>
                        <input
                          type="range"
                          min="0" max="100"
                          value={mobileStyleSize}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setMobileStyleSize(val);
                            if (isButtonEditingMode && onUpdateButtonStyle) {
                              // Map 0-100 to 100px-600px width
                              onUpdateButtonStyle({ width: `${100 + (val * 5)}px` });
                            } else if (activeBlockPage === 'image' && activeElementId) {
                              updateElement(activeElementId, { position: val.toString() });
                            } else if (activeBlockPage === 'text') {
                              handleUpdateText('fontSize', String(10 + Math.floor(val / 2)));
                            }
                          }}
                          className="flex-1 h-[2px] bg-[#517AA5] rounded-lg appearance-none cursor-pointer accent-white"
                        />
                        <span className="text-white text-[11px] w-6 text-right">{mobileStyleSize}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-white text-[13px] font-medium w-12 shrink-0">Opacity</span>
                        <input
                          type="range"
                          min="0" max="100"
                          value={mobileStyleOpacity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setMobileStyleOpacity(val);
                            if (isButtonEditingMode && onUpdateButtonStyle) {
                              onUpdateButtonStyle({ opacity: val });
                            } else if (activeBlockPage === 'image' && activeElementId) {
                              updateElement(activeElementId, { opacity: val });
                            } else if (activeBlockPage === 'text') {
                              const activeText = document.querySelector('.editable-text-active') as HTMLElement;
                              if (activeText) {
                                activeText.style.setProperty('opacity', `${val / 100}`, 'important');
                              }
                            }
                          }}
                          className="flex-1 h-[2px] bg-[#517AA5] rounded-lg appearance-none cursor-pointer accent-white"
                        />
                        <span className="text-white text-[11px] w-6 text-right">{mobileStyleOpacity}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Size Content */}
                {mobileOverlayTab === 'Size' && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="px-5 flex flex-col gap-6 mb-8 mt-2">
                      {/* Width Slider */}
                      <div className="flex items-center gap-6">
                        <span className="text-white text-[13px] font-medium w-[80px] shrink-0">Width</span>
                        <input
                          type="range"
                          min="50" max="600"
                          defaultValue="200"
                          onChange={(e) => {
                            if ((isButtonEditingMode || activeBlockPage === 'button') && onUpdateButtonStyle) {
                              onUpdateButtonStyle({ width: `${e.target.value}px` });
                            }
                          }}
                          className="flex-1 h-[2px] bg-[#517AA5] rounded-lg appearance-none cursor-pointer accent-white"
                        />
                      </div>

                      {/* Height Slider */}
                      <div className="flex items-center gap-6">
                        <span className="text-white text-[13px] font-medium w-[80px] shrink-0">Height</span>
                        <input
                          type="range"
                          min="30" max="200"
                          defaultValue="50"
                          onChange={(e) => {
                            if ((isButtonEditingMode || activeBlockPage === 'button') && onUpdateButtonStyle) {
                              onUpdateButtonStyle({ height: `${e.target.value}px` });
                            }
                          }}
                          className="flex-1 h-[2px] bg-[#517AA5] rounded-lg appearance-none cursor-pointer accent-white"
                        />
                      </div>

                      {/* Border Radius Slider */}
                      <div className="flex items-center gap-6">
                        <span className="text-white text-[13px] font-medium w-[80px] shrink-0">Radius</span>
                        <input
                          type="range"
                          min="0" max="100"
                          defaultValue="6"
                          onChange={(e) => {
                            if ((isButtonEditingMode || activeBlockPage === 'button') && onUpdateButtonStyle) {
                              onUpdateButtonStyle({ borderRadius: `${e.target.value}px`, buttonVariant: 'default' });
                            }
                          }}
                          className="flex-1 h-[2px] bg-[#517AA5] rounded-lg appearance-none cursor-pointer accent-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Section Content */}
                {mobileOverlayTab === 'Section' && textBlockState && onUpdateTextBlockState && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300 px-5 space-y-6">
                    <div>
                      <h4 className="mb-2 text-[14px] font-bold text-white">Editable Text</h4>
                      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#203354] bg-[#11213A] px-3 py-2 text-sm font-semibold text-white transition-colors hover:border-[#517AA5]">
                        <input
                          type="checkbox"
                          checked={textBlockState.isTextEditable}
                          onChange={(event) => onUpdateTextBlockState({ ...textBlockState, isTextEditable: event.target.checked })}
                          className="accent-[#517AA5]"
                        />
                        Enable text editing
                      </label>
                    </div>

                    <div>
                      <h4 className="mb-2 text-[14px] font-bold text-white">Alignment</h4>
                      <select
                        value={textBlockState.section.alignment}
                        onChange={(event) => onUpdateTextBlockState({ ...textBlockState, section: { ...textBlockState.section, alignment: event.target.value as TextSectionProps["alignment"] } })}
                        className="w-full rounded-xl border border-[#203354] bg-[#11213A] px-3 py-2.5 text-[14px] font-bold text-white outline-none focus:border-[#517AA5]"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>

                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#203354] bg-[#11213A] px-3 py-2 text-sm font-semibold text-white transition-colors hover:border-[#517AA5]">
                      <input
                        type="checkbox"
                        checked={textBlockState.section.shadow}
                        onChange={(event) => onUpdateTextBlockState({ ...textBlockState, section: { ...textBlockState.section, shadow: event.target.checked } })}
                        className="accent-[#517AA5]"
                      />
                      Enable card shadows
                    </label>

                    <div className="w-full h-[1px] bg-[#203354]"></div>

                    <div>
                      <h4 className="mb-2 text-[14px] font-bold text-white">Select Section</h4>
                      <select
                        value={textBlockState.activeSectionId || "home"}
                        onChange={(e) => {
                          const targetId = e.target.value;
                          onUpdateTextBlockState({ ...textBlockState, activeSectionId: targetId });
                          if (typeof window !== "undefined") {
                            window.dispatchEvent(new CustomEvent('scrollToSectionEvent', { detail: targetId }));
                          }
                        }}
                        className="w-full rounded-xl border border-[#203354] bg-[#11213A] px-3 py-2.5 text-[14px] font-bold text-white outline-none mb-4 focus:border-[#517AA5]"
                      >
                        <option value="home">Home</option>
                        <option value="about">About Me</option>
                        <option value="projects">Projects</option>
                        <option value="video">Video Block</option>
                        <option value="contact">Contact</option>
                        <option value="footer">Footer</option>
                      </select>

                      <h4 className="mb-2 text-[14px] font-bold text-white">Background Color</h4>
                      <div className="flex items-center gap-2 mb-4">
                        <input
                          type="color"
                          value={textBlockState.sectionStyles?.[textBlockState.activeSectionId || "home"]?.backgroundColor || "#ffffff"}
                          onChange={(e) => {
                            const currentId = textBlockState.activeSectionId || "home";
                            const currentStyles = textBlockState.sectionStyles || {};
                            onUpdateTextBlockState({
                              ...textBlockState,
                              sectionStyles: {
                                ...currentStyles,
                                [currentId]: { ...(currentStyles[currentId] || {}), backgroundColor: e.target.value }
                              }
                            });
                          }}
                          className="h-10 w-10 cursor-pointer border-0 bg-transparent p-0"
                        />
                        <span className="font-mono text-xs text-[#8495A5]">{textBlockState.sectionStyles?.[textBlockState.activeSectionId || "home"]?.backgroundColor || "#ffffff"}</span>
                      </div>

                      <h4 className="mb-2 text-[14px] font-bold text-white">Gradient Background</h4>
                      <input
                        type="text"
                        placeholder="e.g. linear-gradient(to right, red, blue)"
                        value={textBlockState.sectionStyles?.[textBlockState.activeSectionId || "home"]?.gradientBackground || ""}
                        onChange={(e) => {
                          const currentId = textBlockState.activeSectionId || "home";
                          const currentStyles = textBlockState.sectionStyles || {};
                          onUpdateTextBlockState({
                            ...textBlockState,
                            sectionStyles: {
                              ...currentStyles,
                              [currentId]: { ...(currentStyles[currentId] || {}), gradientBackground: e.target.value }
                            }
                          });
                        }}
                        className="w-full rounded-xl border border-[#203354] bg-[#11213A] px-3 py-2.5 text-[14px] text-white outline-none focus:border-[#517AA5] mb-8"
                      />
                    </div>
                  </div>
                )}

                {/* Images Content */}
                {mobileOverlayTab === 'Images' && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300 px-5 pb-8">
                    <input
                      type="file"
                      id="mobile-image-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            onImageSelected?.(reader.result as string);
                            setIsOpen(false);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <h3 className="text-white font-medium text-[15px] mb-4">Images</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {/* Upload Image Button */}
                      <label htmlFor="mobile-image-upload" className="border border-[#4E627C] rounded-xl flex flex-col items-center justify-center aspect-square cursor-pointer hover:bg-[#203354]/50 transition-colors">
                        <Plus size={24} className="text-[#8495A5] mb-2" strokeWidth={1.5} />
                        <span className="text-[11px] text-[#8495A5] font-medium text-center leading-tight">Upload<br />Image</span>
                      </label>

                      {/* Image Thumbnails */}
                      {[
                        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80",
                        "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80"
                      ].map((imgSrc, i) => (
                        <div onClick={() => {
                          if (editingImageId) {
                            onImageSelected?.(imgSrc);
                            setIsOpen(false);
                          } else {
                            mobileAddBlock(`Image ${i}`);
                          }
                        }} key={i} className="rounded-xl overflow-hidden aspect-square border-2 border-transparent hover:border-[#517AA5] cursor-pointer transition-colors">
                          <img
                            src={imgSrc}
                            alt={`Preset ${i}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Button Content (Under Blocks) */}
                {mobileOverlayTab === 'Button' && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300 px-5 pb-8">
                    <h3 className="text-white font-medium text-[15px] mb-4">Button</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {/* Row 1: Small */}
                      <button onClick={() => mobileAddBlock('Small Solid Fuchsia Button')} className="bg-[#B80E9A] text-white text-[11px] font-medium py-2 px-2 rounded-[8px] hover:bg-[#C010A6] transition-colors shadow-sm">Small</button>
                      <button onClick={() => mobileAddBlock('Small Solid Purple Button')} className="bg-[#8B148B] text-white text-[11px] font-medium py-2 px-2 rounded-[8px] hover:bg-[#961696] transition-colors shadow-sm">Small</button>
                      <button onClick={() => mobileAddBlock('Small Outline Button')} className="bg-transparent border border-[#B80E9A] text-white text-[11px] font-medium py-2 px-2 rounded-[8px] hover:bg-[#B80E9A]/20 transition-colors">Small</button>

                      {/* Row 2: Medium */}
                      <button onClick={() => mobileAddBlock('Medium Solid Fuchsia Button')} className="bg-[#B80E9A] text-white text-[12px] font-medium py-3 px-2 rounded-[8px] hover:bg-[#C010A6] transition-colors shadow-sm">Medium</button>
                      <button onClick={() => mobileAddBlock('Medium Solid Purple Button')} className="bg-[#8B148B] text-white text-[12px] font-medium py-3 px-2 rounded-[8px] hover:bg-[#961696] transition-colors shadow-sm">Medium</button>
                      <button onClick={() => mobileAddBlock('Medium Outline Button')} className="bg-transparent border border-[#B80E9A] text-white text-[12px] font-medium py-3 px-2 rounded-[8px] hover:bg-[#B80E9A]/20 transition-colors">Medium</button>

                      {/* Row 3: Large */}
                      <button onClick={() => mobileAddBlock('Large Solid Fuchsia Button')} className="bg-[#B80E9A] text-white text-[13px] font-medium py-5 px-2 rounded-[8px] hover:bg-[#C010A6] transition-colors shadow-sm">Large</button>
                      <button onClick={() => mobileAddBlock('Large Solid Purple Button')} className="bg-[#8B148B] text-white text-[13px] font-medium py-5 px-2 rounded-[8px] hover:bg-[#961696] transition-colors shadow-sm">Large</button>
                      <button onClick={() => mobileAddBlock('Large Outline Button')} className="bg-transparent border border-[#B80E9A] text-white text-[13px] font-medium py-5 px-2 rounded-[8px] hover:bg-[#B80E9A]/20 transition-colors">Large</button>
                    </div>
                  </div>
                )}

                {/* Video Content (Under Blocks) */}
                {mobileOverlayTab === 'Video' && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300 px-5 pb-8">
                    <h3 className="text-white font-medium text-[15px] mb-4">Video</h3>
                    <div className="flex flex-col gap-4">
                      {/* Upload Video Button */}
                      <label className="border border-[#4E627C] rounded-xl flex items-center justify-center h-[120px] cursor-pointer hover:bg-[#203354]/50 transition-colors">
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && onUpdateVideoStyle) {
                              const url = URL.createObjectURL(file);
                              const sizeMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
                              onUpdateVideoStyle({
                                uploadUrl: url,
                                uploadFileName: file.name,
                                uploadFileSize: sizeMB,
                                sourceType: 'upload'
                              });
                            }
                          }}
                        />
                        <div className="flex items-center gap-3">
                          <Plus size={28} className="text-[#8495A5]" strokeWidth={1.5} />
                          <span className="text-[14px] text-[#8495A5] font-medium">Upload Video</span>
                        </div>
                      </label>

                      {/* Video Thumbnail */}
                      <div onClick={() => onSelectBlockPage?.('video')} className="rounded-xl overflow-hidden relative border-[1.5px] border-transparent hover:border-[#517AA5] aspect-[2.5/1] cursor-pointer group transition-colors">
                        <img
                          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=240&fit=crop"
                          alt="Video thumbnail"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                          <div className="w-9 h-9 rounded-full border-[1.5px] border-white flex items-center justify-center pl-0.5 shadow-sm">
                            <Play size={16} className="text-white" fill="currentColor" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {mobileView === 'Blocks Adjust' && (
              <div className="p-5 min-h-[400px] animate-in slide-in-from-right-8 duration-300 flex flex-col gap-4">
                {/* Adjustment Section (Basic) */}
                <div className="border border-[#4E627C] rounded-xl overflow-hidden bg-transparent transition-colors">
                  <button
                    onClick={() => setActiveAdjustSection(prev => prev === 'basic' ? null : 'basic')}
                    className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-[#203354]/30"
                  >
                    <div className="flex items-center gap-4">
                      <SlidersHorizontal size={20} className="text-white" strokeWidth={1.5} />
                      <span className="text-white text-[14px] font-medium">Adjustment Section (Basic)</span>
                    </div>
                    <ChevronDown size={16} className={`text-white transition-transform duration-200 ${activeAdjustSection === 'basic' ? 'rotate-180' : ''}`} strokeWidth={1.5} />
                  </button>
                  {activeAdjustSection === 'basic' && (
                    <div className="p-4 border-t border-[#4E627C] bg-transparent flex flex-col gap-5">
                      {[
                        { id: 'brightness', label: 'Brightness' },
                        { id: 'contrast', label: 'Contrast' },
                        { id: 'saturation', label: 'Saturation' },
                        { id: 'vignette', label: 'Vignette' },
                        { id: 'shadows', label: 'Shadows' },
                        { id: 'temperature', label: 'Temperature' },
                        { id: 'tint', label: 'Tint' }
                      ].map(slider => (
                        <div key={slider.id} className="flex flex-col gap-2.5">
                          <span className="text-[#E2E8F0] text-[12px]">{slider.label}</span>
                          <input
                            type="range"
                            min="0" max="100"
                            value={imageAdjustments[slider.id as keyof typeof imageAdjustments]}
                            onChange={(e) => setImageAdjustments({ ...imageAdjustments, [slider.id]: parseInt(e.target.value) })}
                            className="w-full h-[2px] rounded-lg appearance-none cursor-pointer accent-white"
                            style={{ background: `linear-gradient(to right, white ${imageAdjustments[slider.id as keyof typeof imageAdjustments]}%, #4E627C ${imageAdjustments[slider.id as keyof typeof imageAdjustments]}%)` }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filters & Presets Section */}
                <div className="border border-[#4E627C] rounded-xl overflow-hidden bg-transparent transition-colors">
                  <button
                    onClick={() => setActiveAdjustSection(prev => prev === 'filters' ? null : 'filters')}
                    className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-[#203354]/30"
                  >
                    <div className="flex items-center gap-4">
                      <Filter size={20} className="text-white" strokeWidth={1.5} />
                      <span className="text-white text-[14px] font-medium">Filters & Presets Section</span>
                    </div>
                    <ChevronDown size={16} className={`text-white transition-transform duration-200 ${activeAdjustSection === 'filters' ? 'rotate-180' : ''}`} strokeWidth={1.5} />
                  </button>
                  {activeAdjustSection === 'filters' && (
                    <div className="p-4 border-t border-[#4E627C] bg-transparent">
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { id: 'Original', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop' },
                          { id: 'Vintage', img: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=150&h=150&fit=crop&grayscale' },
                          { id: 'Cinematic', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop' },
                          { id: 'Black & White', img: 'https://placebear.com/g/150/150' },
                          { id: 'Nature', img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=150&h=150&fit=crop' },
                          { id: 'Creative', img: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=150&h=150&fit=crop' }
                        ].map(filter => (
                          <div
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id)}
                            className="flex flex-col items-center gap-2 cursor-pointer group"
                          >
                            <div className={`w-full aspect-square rounded-[14px] overflow-hidden transition-all duration-300 ${activeFilter === filter.id ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0B182B]' : 'hover:scale-105 border border-transparent hover:border-[#4E627C]'}`}>
                              <img src={filter.img} alt={filter.id} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[#E2E8F0] text-[10px] text-center">{filter.id}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Crop & Transform Section */}
                <div className="border border-[#4E627C] rounded-xl overflow-hidden bg-transparent transition-colors">
                  <button
                    onClick={() => setActiveAdjustSection(prev => prev === 'crop' ? null : 'crop')}
                    className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-[#203354]/30"
                  >
                    <div className="flex items-center gap-4">
                      <Crop size={20} className="text-white" strokeWidth={1.5} />
                      <span className="text-white text-[14px] font-medium">Crop & Transform Section</span>
                    </div>
                    <ChevronDown size={16} className={`text-white transition-transform duration-200 ${activeAdjustSection === 'crop' ? 'rotate-180' : ''}`} strokeWidth={1.5} />
                  </button>
                  {activeAdjustSection === 'crop' && (
                    <div className="p-5 border-t border-[#4E627C] bg-transparent">
                      <div className="grid grid-cols-4 gap-y-7 gap-x-2">
                        {/* Custom */}
                        <div onClick={() => setActiveCrop('Custom')} className={`flex flex-col items-center gap-3 cursor-pointer transition-all duration-300 ${activeCrop === 'Custom' ? 'opacity-100 scale-105' : 'opacity-70 hover:opacity-100'}`}>
                          <div className="h-[28px] flex items-center justify-center">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 9V5a1 1 0 0 1 1-1h4"></path>
                              <path d="M20 9V5a1 1 0 0 0-1-1h-4"></path>
                              <path d="M4 15v4a1 1 0 0 0 1 1h4"></path>
                              <path d="M20 15v4a1 1 0 0 1-1 1h-4"></path>
                            </svg>
                          </div>
                          <span className={`text-[10px] text-white ${activeCrop === 'Custom' ? 'font-medium' : ''}`}>Custom</span>
                        </div>

                        {/* Original */}
                        <div onClick={() => setActiveCrop('Original')} className={`flex flex-col items-center gap-3 cursor-pointer transition-all duration-300 ${activeCrop === 'Original' ? 'opacity-100 scale-105' : 'opacity-70 hover:opacity-100'}`}>
                          <div className="h-[28px] flex items-center justify-center">
                            <ImageIcon size={28} className="text-white" strokeWidth={1.5} />
                          </div>
                          <span className={`text-[10px] text-white ${activeCrop === 'Original' ? 'font-medium' : ''}`}>Original</span>
                        </div>

                        {/* Square */}
                        <div onClick={() => setActiveCrop('Square')} className={`flex flex-col items-center gap-3 cursor-pointer transition-all duration-300 ${activeCrop === 'Square' ? 'opacity-100 scale-105' : 'opacity-70 hover:opacity-100'}`}>
                          <div className="h-[28px] flex items-center justify-center">
                            <div className="w-[26px] h-[26px] rounded-[6px] border-[1.5px] border-white"></div>
                          </div>
                          <span className={`text-[10px] text-white ${activeCrop === 'Square' ? 'font-medium' : ''}`}>Square</span>
                        </div>

                        {/* 16:9 */}
                        <div onClick={() => setActiveCrop('16:9')} className={`flex flex-col items-center gap-3 cursor-pointer transition-all duration-300 ${activeCrop === '16:9' ? 'opacity-100 scale-105' : 'opacity-70 hover:opacity-100'}`}>
                          <div className="h-[28px] flex items-center justify-center">
                            <div className="w-[30px] h-[18px] border-[1.5px] border-white"></div>
                          </div>
                          <span className={`text-[10px] text-white ${activeCrop === '16:9' ? 'font-medium' : ''}`}>16:9</span>
                        </div>

                        {/* 5:4 */}
                        <div onClick={() => setActiveCrop('5:4')} className={`flex flex-col items-center gap-3 cursor-pointer transition-all duration-300 ${activeCrop === '5:4' ? 'opacity-100 scale-105' : 'opacity-70 hover:opacity-100'}`}>
                          <div className="h-[28px] flex items-center justify-center">
                            <div className="w-[25px] h-[20px] border-[1.5px] border-white"></div>
                          </div>
                          <span className={`text-[10px] text-white ${activeCrop === '5:4' ? 'font-medium' : ''}`}>5:4</span>
                        </div>

                        {/* 4:3 */}
                        <div onClick={() => setActiveCrop('4:3')} className={`flex flex-col items-center gap-3 cursor-pointer transition-all duration-300 ${activeCrop === '4:3' ? 'opacity-100 scale-105' : 'opacity-70 hover:opacity-100'}`}>
                          <div className="h-[28px] flex items-center justify-center">
                            <div className="w-[28px] h-[21px] border-[1.5px] border-white"></div>
                          </div>
                          <span className={`text-[10px] text-white ${activeCrop === '4:3' ? 'font-medium' : ''}`}>4:3</span>
                        </div>

                        {/* 9:16 */}
                        <div onClick={() => setActiveCrop('9:16')} className={`flex flex-col items-center gap-3 cursor-pointer transition-all duration-300 ${activeCrop === '9:16' ? 'opacity-100 scale-105' : 'opacity-70 hover:opacity-100'}`}>
                          <div className="h-[28px] flex items-center justify-center">
                            <div className="w-[16px] h-[28px] border-[1.5px] border-white"></div>
                          </div>
                          <span className={`text-[10px] text-white ${activeCrop === '9:16' ? 'font-medium' : ''}`}>9:16</span>
                        </div>

                        {/* 7:5 */}
                        <div onClick={() => setActiveCrop('7:5')} className={`flex flex-col items-center gap-3 cursor-pointer transition-all duration-300 ${activeCrop === '7:5' ? 'opacity-100 scale-105' : 'opacity-70 hover:opacity-100'}`}>
                          <div className="h-[28px] flex items-center justify-center">
                            <div className="w-[30px] h-[20px] border-[1.5px] border-white"></div>
                          </div>
                          <span className={`text-[10px] text-white ${activeCrop === '7:5' ? 'font-medium' : ''}`}>7:5</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {mobileView === 'Pages' && (
              <div className="p-5 min-h-[250px] animate-in slide-in-from-right-8 duration-300">
                {/* Pages Content for Mobile */}
                <div className="flex flex-col gap-3">
                  <div
                    onClick={() => handlePageClick('Home Page', 'home')}
                    className={`border rounded-lg p-3 cursor-pointer hover:bg-[#2a436e] hover:border-[#517AA5] transition-all duration-300 ${activeMobilePage === 'Home Page' ? 'bg-[#1f345c] border-[#517AA5]' : 'bg-[#1A2B4C] border-[#4E627C]'}`}>
                    <span className={`text-sm font-medium ${activeMobilePage === 'Home Page' ? 'text-white' : 'text-[#8495A5]'}`}>Home Page</span>
                  </div>
                  <div
                    onClick={() => handlePageClick('About Us', 'about')}
                    className={`border rounded-lg p-3 cursor-pointer hover:bg-[#2a436e] hover:border-[#517AA5] transition-all duration-300 ${activeMobilePage === 'About Us' ? 'bg-[#1f345c] border-[#517AA5]' : 'bg-[#1A2B4C] border-[#4E627C]'}`}>
                    <span className={`text-sm font-medium ${activeMobilePage === 'About Us' ? 'text-white' : 'text-[#8495A5]'}`}>About Us</span>
                  </div>
                  <div
                    onClick={() => handlePageClick('Projects', 'projects')}
                    className={`border rounded-lg p-3 cursor-pointer hover:bg-[#2a436e] hover:border-[#517AA5] transition-all duration-300 ${activeMobilePage === 'Projects' ? 'bg-[#1f345c] border-[#517AA5]' : 'bg-[#1A2B4C] border-[#4E627C]'}`}>
                    <span className={`text-sm font-medium ${activeMobilePage === 'Projects' ? 'text-white' : 'text-[#8495A5]'}`}>Projects</span>
                  </div>
                  <div
                    onClick={() => handlePageClick('Contact', 'contact')}
                    className={`border rounded-lg p-3 cursor-pointer hover:bg-[#2a436e] hover:border-[#517AA5] transition-all duration-300 ${activeMobilePage === 'Contact' ? 'bg-[#1f345c] border-[#517AA5]' : 'bg-[#1A2B4C] border-[#4E627C]'}`}>
                    <span className={`text-sm font-medium ${activeMobilePage === 'Contact' ? 'text-white' : 'text-[#8495A5]'}`}>Contact</span>
                  </div>

                  {/* <button
                    onClick={() => console.log('Add New Page')}
                    className="text-sm font-semibold text-[#517AA5] border border-dashed border-[#517AA5] rounded-lg py-2 mt-4 hover:bg-[#517AA5]/10 hover:shadow-sm active:scale-95 transition-all duration-300">
                    + Add New Page
                  </button> */}
                </div>
              </div>
            )}



            {mobileView === 'Button' && (
              <div className="p-5 min-h-[400px] animate-in slide-in-from-right-8 duration-300">
                {/* Headers */}
                <div className="flex items-center gap-8 mb-6 px-1">
                  <button
                    onClick={() => setButtonTab('Label')}
                    className={`font-bold text-[15px] transition-colors ${buttonTab === 'Label' ? 'text-white' : 'text-[#8495A5]'}`}
                  >
                    Button Label
                  </button>
                  <button
                    onClick={() => setButtonTab('Link')}
                    className={`font-bold text-[15px] transition-colors ${buttonTab === 'Link' ? 'text-white' : 'text-[#8495A5]'}`}
                  >
                    Button Link
                  </button>
                </div>

                {buttonTab === 'Label' ? (
                  <div className="grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
                    {/* Row 1 */}
                    <button onClick={() => mobileAddBlock('Create Account Button')} className="bg-[#10B981] hover:bg-[#059669] text-white text-[11px] sm:text-[12px] font-medium py-3.5 px-2 rounded-xl transition-colors">
                      Create Account
                    </button>
                    <button onClick={() => mobileAddBlock('Get Started Button')} className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[11px] sm:text-[12px] font-medium py-3.5 px-2 rounded-xl transition-colors flex items-center justify-center gap-1">
                      Get Started <span className="font-light">→</span>
                    </button>
                    <button onClick={() => mobileAddBlock('Try it for free Button')} className="bg-[#262626] border border-[#404040] hover:bg-[#404040] text-white text-[11px] sm:text-[12px] font-medium py-3.5 px-2 rounded-sm transition-colors flex items-center justify-center gap-1">
                      Try it for free <ChevronRight size={12} className="text-[#8495A5]" />
                    </button>

                    {/* Row 2 */}
                    <button onClick={() => mobileAddBlock('Sign Up Button')} className="bg-[#5B21B6] hover:bg-[#4C1D95] text-white text-[11px] sm:text-[12px] font-medium py-3.5 px-2 rounded-full transition-colors">
                      Sign Up
                    </button>
                    <button onClick={() => mobileAddBlock('Click Me Purple Button')} className="bg-[#D946EF] hover:bg-[#C026D3] text-white text-[11px] sm:text-[12px] font-medium py-3.5 px-2 rounded-xl transition-colors">
                      Click Me
                    </button>
                    <button onClick={() => mobileAddBlock('Get it Button')} className="bg-[#EF4444] hover:bg-[#DC2626] text-white text-[11px] sm:text-[12px] font-medium py-3.5 px-2 rounded-full transition-colors">
                      Get it
                    </button>

                    {/* Row 3 */}
                    <button onClick={() => mobileAddBlock('Click Me White Button')} className="bg-white text-black text-[11px] sm:text-[12px] font-medium py-3.5 px-2 rounded-full transition-transform hover:-translate-y-0.5 shadow-[-4px_4px_0_#262626] ml-1 mb-1">
                      Click Me
                    </button>
                    <button onClick={() => mobileAddBlock('Sign In Button')} className="bg-gradient-to-r from-[#D946EF] to-[#8B5CF6] hover:opacity-90 text-white text-[11px] sm:text-[12px] font-medium py-3.5 px-2 rounded-xl transition-opacity">
                      Sign In
                    </button>
                    <button onClick={() => mobileAddBlock('Get in touch Button')} className="bg-[#F59E0B] hover:bg-[#D97706] text-white text-[11px] sm:text-[12px] font-medium py-3.5 px-2 rounded-tl-[20px] rounded-br-[20px] rounded-tr-md rounded-bl-md transition-colors">
                      Get in touch
                    </button>

                    {/* Row 4 */}
                    <div className="bg-white rounded-xl p-1.5 flex items-center col-span-2 h-[46px]">
                      <button onClick={() => mobileAddBlock('Free trail Label')} className="bg-[#262626] text-white text-[11px] sm:text-[12px] font-medium px-4 rounded-[10px] whitespace-nowrap h-full flex items-center justify-center">
                        Free trail
                      </button>
                      <button onClick={() => mobileAddBlock('Get Started Label')} className="flex-1 text-[#0B182B] text-[11px] sm:text-[12px] font-medium px-2 flex items-center justify-center gap-1 whitespace-nowrap h-full">
                        Get Started <span className="font-light">→</span>
                      </button>
                    </div>
                    <button onClick={() => mobileAddBlock('Sign up for free Button')} className="bg-[#22D3EE] hover:bg-[#06B6D4] text-[#0B182B] text-[11px] sm:text-[12px] font-medium py-3.5 px-2 rounded-full transition-colors">
                      Sign up for free
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
                    <button onClick={() => mobileAddBlock('Read More Link')} className="bg-gradient-to-r from-[#D946EF] to-[#7C3AED] flex items-center justify-between px-2 py-3.5 rounded-[10px] text-white text-[9px] sm:text-[10px] font-medium transition-transform hover:scale-105 shadow-sm">
                      <span>READ MORE</span>
                      <div className="bg-white rounded-full p-[2px] text-[#7C3AED]"><ChevronRight size={10} strokeWidth={3} /></div>
                    </button>

                    <button onClick={() => mobileAddBlock('Learn More Link')} className="bg-gradient-to-r from-[#22D3EE] to-[#2563EB] flex items-center justify-between px-2 py-3.5 rounded-[10px] text-white text-[9px] sm:text-[10px] font-medium transition-transform hover:scale-105 shadow-sm">
                      <span>LEARN MORE</span>
                      <div className="bg-white rounded-full p-[2px] text-[#2563EB]"><ChevronRight size={10} strokeWidth={3} /></div>
                    </button>

                    <button onClick={() => mobileAddBlock('Watch Now Link')} className="bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] flex items-center justify-between px-2 py-3.5 rounded-[10px] text-white text-[9px] sm:text-[10px] font-medium transition-transform hover:scale-105 shadow-sm">
                      <span>WATCH NOW</span>
                      <div className="bg-white rounded-full p-[2px] text-[#F59E0B]"><Play size={10} strokeWidth={3} fill="currentColor" /></div>
                    </button>

                    <button onClick={() => mobileAddBlock('Book Now Link')} className="bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] flex items-center justify-between px-2 py-3.5 rounded-[10px] text-white text-[9px] sm:text-[10px] font-medium transition-transform hover:scale-105 shadow-sm">
                      <span>BOOK NOW</span>
                      <div className="bg-white rounded-full p-[2px] text-[#F59E0B]"><ChevronRight size={10} strokeWidth={3} /></div>
                    </button>

                    <button onClick={() => mobileAddBlock('Download Link')} className="bg-gradient-to-r from-[#D946EF] to-[#7C3AED] flex items-center justify-between px-2 py-3.5 rounded-[10px] text-white text-[9px] sm:text-[10px] font-medium transition-transform hover:scale-105 shadow-sm">
                      <span>DOWNLOAD</span>
                      <div className="bg-white rounded-full p-[2px] text-[#7C3AED]"><Download size={10} strokeWidth={3} /></div>
                    </button>

                    <button onClick={() => mobileAddBlock('Buy Now Link')} className="bg-gradient-to-r from-[#22D3EE] to-[#2563EB] flex items-center justify-between px-2 py-3.5 rounded-[10px] text-white text-[9px] sm:text-[10px] font-medium transition-transform hover:scale-105 shadow-sm">
                      <span>BUY NOW</span>
                      <div className="bg-white rounded-full p-[2px] text-[#2563EB]"><ShoppingBag size={10} strokeWidth={3} /></div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Desktop Sidebar Container (Hidden on mobile) */}
      <aside className="relative z-50 hidden h-full w-[210px] shrink-0 flex-col overflow-hidden rounded-xl border border-[#203b66] bg-[#1A2B4C] text-white shadow-[0_18px_45px_rgba(11,29,64,0.14)] xl:flex">

        <div className="flex flex-col h-full w-full pl-4 pr-4">

          {/* Tabs */}
          <div className="flex border-b border-[#4E627C] pt-8 mb-4">
            <button
              onClick={() => setActiveTab('Blocks')}
              className={`flex-1 border-b-[2px] pb-3 text-sm font-bold transition-colors ${activeTab === 'Blocks' ? 'border-white text-white' : 'border-transparent text-[#8495A5] hover:text-white'}`}
            >
              Blocks
            </button>
            <button
              onClick={() => setActiveTab('Pages')}
              className={`flex-1 border-b-[2px] pb-3 text-sm font-bold transition-colors ${activeTab === 'Pages' ? 'border-white text-white' : 'border-transparent text-[#8495A5] hover:text-white'}`}
            >
              Pages
            </button>
          </div>

          {/* Search */}
          <div className="py-2 mb-4">
            <div className="bg-[#F6F4EB] rounded-[10px] flex items-center px-3 py-2">
              <Search className="w-4 h-4 text-[#517AA5] mr-2 shrink-0" strokeWidth={2} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Blocks..."
                className="bg-transparent border-none outline-none w-full text-xs font-medium text-[#517AA5] placeholder:text-[#517AA5]/70"
              />
              {/* <Mic className="w-4 h-4 text-[#517AA5] ml-1 shrink-0" strokeWidth={2} /> */}
            </div>
          </div>

          {/* Sidebar Content Area */}
          <div className="flex-1 overflow-y-auto no-scrollbar pb-3 pr-2 -mr-2">
            {activeTab === 'Blocks' ? (
              /* Blocks Content */
              <>
                {blockCategories.map((cat, idx) => {
                  const filteredBlocks = cat.blocks.filter(block =>
                    block.name.toLowerCase().includes(searchQuery.toLowerCase())
                  );

                  if (searchQuery && filteredBlocks.length === 0) return null;

                  const isOpen = searchQuery ? true : openCategories.includes(idx);
                  return (
                    <div key={idx} className="mb-6">
                      <div
                        className="flex items-center justify-between cursor-pointer mb-3.5"
                        onClick={() => !searchQuery && toggleCategory(idx)}
                      >
                        <span className="font-semibold text-[15px]">{cat.title}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-white transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          strokeWidth={2}
                        />
                      </div>

                      {isOpen && (
                        <>
                          <div className="grid grid-cols-3 gap-2">
                            {filteredBlocks.map((block, bIdx) => {
                              const isActive =
                                (block.name === 'Image' && (activeBlockPage === 'image' || isImageEditingMode)) ||
                                (block.name === 'Button' && (activeBlockPage === 'button' || isButtonEditingMode)) ||
                                (block.name === 'Video' && (activeBlockPage === 'video' || isVideoEditingMode)) ||
                                (block.name === 'Divider' && activeBlockPage === 'divider') ||
                                (block.name === 'Icon' && (activeBlockPage === 'icons' || isIconEditingMode)) ||
                                (block.name === 'Text' && activeTextTarget === 'text') ||
                                (block.name === 'Header' && activeTextTarget === 'header') ||
                                (block.name === 'Footer' && activeTextTarget === 'footer') ||
                                (block.name === 'Section' && activeTextTarget === 'main');

                              return (
                                <div
                                  key={bIdx}
                                  onClick={() => addBlock(block.name)}
                                  className={`bg-[#FAF8ED] rounded-xl flex flex-col items-center justify-center pt-2 pb-1.5 cursor-pointer shadow-sm border hover:ring-2 hover:ring-[#517AA5] hover:-translate-y-1 hover:shadow-md transition-all duration-300 ${isActive ? 'ring-2 ring-[#517AA5] border-[#517AA5]' : 'border-[#E8E6DB]'}`}
                                >
                                  {block.icon}
                                  <span className="text-[10px] font-semibold text-[#517AA5]">{block.name}</span>
                                </div>
                              );
                            })}
                          </div>

                          {idx === 0 && !searchQuery && (
                            <div className="mt-4 bg-[#F6F4EB] rounded-[8px] p-[3px] flex items-center" title="Work in progress">
                              <button
                                onClick={() => { setSubTab('all'); alert('Work in progress'); }}
                                title="Work in progress"
                                className={`flex-[1.5] text-[11px] font-semibold py-[6px] rounded-[6px] transition-colors cursor-pointer ${subTab === 'all' ? 'bg-white text-[#517AA5] shadow-sm' : 'text-[#8495A5] hover:text-[#517AA5] bg-transparent'}`}
                              >
                                All Bosie
                              </button>
                              <button
                                onClick={() => { setSubTab('next'); alert('Work in progress'); }}
                                title="Work in progress"
                                className={`flex-1 text-[11px] font-semibold py-[6px] rounded-[6px] transition-colors cursor-pointer ${subTab === 'next' ? 'bg-white text-[#517AA5] shadow-sm' : 'text-[#8495A5] hover:text-[#517AA5] bg-transparent'}`}
                              >
                                Next
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </>
            ) : (
              /* Pages Content */
              <div className="flex flex-col gap-3">
                <div
                  onClick={() => handlePageClick('Home Page', 'home')}
                  className={`border rounded-lg p-3 cursor-pointer hover:bg-[#2a436e] hover:border-[#517AA5] transition-all duration-300 ${activeMobilePage === 'Home Page' ? 'bg-[#1f345c] border-[#517AA5]' : 'bg-[#1A2B4C] border-[#4E627C]'}`}>
                  <span className={`text-sm font-medium ${activeMobilePage === 'Home Page' ? 'text-white' : 'text-[#8495A5]'}`}>Home Page</span>
                </div>
                <div
                  onClick={() => handlePageClick('About Us', 'about')}
                  className={`border rounded-lg p-3 cursor-pointer hover:bg-[#2a436e] hover:border-[#517AA5] transition-all duration-300 ${activeMobilePage === 'About Us' ? 'bg-[#1f345c] border-[#517AA5]' : 'bg-[#1A2B4C] border-[#4E627C]'}`}>
                  <span className={`text-sm font-medium ${activeMobilePage === 'About Us' ? 'text-white' : 'text-[#8495A5]'}`}>About Us</span>
                </div>
                <div
                  onClick={() => handlePageClick('Projects', 'projects')}
                  className={`border rounded-lg p-3 cursor-pointer hover:bg-[#2a436e] hover:border-[#517AA5] transition-all duration-300 ${activeMobilePage === 'Projects' ? 'bg-[#1f345c] border-[#517AA5]' : 'bg-[#1A2B4C] border-[#4E627C]'}`}>
                  <span className={`text-sm font-medium ${activeMobilePage === 'Projects' ? 'text-white' : 'text-[#8495A5]'}`}>Projects</span>
                </div>
                <div
                  onClick={() => handlePageClick('Contact', 'contact')}
                  className={`border rounded-lg p-3 cursor-pointer hover:bg-[#2a436e] hover:border-[#517AA5] transition-all duration-300 ${activeMobilePage === 'Contact' ? 'bg-[#1f345c] border-[#517AA5]' : 'bg-[#1A2B4C] border-[#4E627C]'}`}>
                  <span className={`text-sm font-medium ${activeMobilePage === 'Contact' ? 'text-white' : 'text-[#8495A5]'}`}>Contact</span>
                </div>
                {/* <button className="text-sm font-semibold text-[#517AA5] border border-dashed border-[#517AA5] rounded-lg py-2 mt-4 hover:bg-[#517AA5]/10 hover:shadow-sm active:scale-95 transition-all duration-300">
                  + Add New Page
                </button> */}
              </div>
            )}
          </div>

          {/* Help Button */}
          <div className="pb-6 bg-[#1A2B4C]">
            <button
              onClick={() => setShowHelpPopup(true)}
              className="cursor-pointer flex items-center justify-between w-full rounded-xl bg-[#F5F2DF] px-4 py-2 text-[#517AA5] shadow-sm hover:bg-[#EBE7Ce] hover:scale-105 hover:shadow-md active:scale-95 transition-all duration-300"
            >
              <div className="flex items-center gap-2">
                <svg width="18" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 3C6 3 5 5 5 7V17C5 20 7 21 9 21H13C16 21 18 10 18 8C18 5 16 3 13 3H9Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <span className="text-[15px] font-semibold">Help</span>
              </div>

              <Circle className="h-[18px] w-[18px] opacity-70" strokeWidth={2} />
            </button>
          </div>

        </div>
      </aside>

      {/* Help Modal */}
      {showHelpPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B182B]/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-[#F6F4EB]">
              <h2 className="text-2xl font-bold text-[#0B1D40] flex items-center gap-3">
                <span className="bg-[#517AA5] text-white w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-sm">?</span>
                Blocks Usage Documentation
              </h2>
              <button
                onClick={() => setShowHelpPopup(false)}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-8 flex-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-50 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-[#0B1D40] flex items-center gap-2">
                  <Type className="text-[#517AA5]" size={20} /> Text Block
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  The Text Block allows you to add rich typography to your canvas. Click the <strong>Text</strong> button to drop a new text element. You can then use the <strong>Typography</strong> tab to adjust the font family, font size, line height, letter spacing, and alignment. Toggle <strong>Enable text editing</strong> to start typing directly onto the canvas.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-[#0B1D40] flex items-center gap-2">
                  <ImageIcon className="text-[#517AA5]" size={20} /> Image Block
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  The <strong>Image Block</strong> allows you to manage and customize images across the canvas. Selecting the <strong>Image</strong> option highlights all image elements and displays an <strong>Edit</strong> icon for each one. Click the Edit icon to open the Image Editor, where you can replace the image and modify its available properties.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-[#0B1D40] flex items-center gap-2">
                  <MousePointer2 className="text-[#517AA5]" size={20} /> Button Block
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  The <strong>Button Block</strong> enables you to edit and customize all button elements on the canvas. Selecting the <strong>Button</strong> option highlights every button and displays an <strong>Edit</strong> icon. Click the Edit icon to open the Button Editor, where you can update the button text, destination link, styling, and other available settings.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-[#0B1D40] flex items-center gap-2">
                  <Video className="text-[#517AA5]" size={20} /> Video Block
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  The <strong>Video Block</strong> provides an easy way to manage video elements within your design. Selecting the <strong>Video</strong> option highlights all videos on the canvas and displays an <strong>Edit</strong> icon for each one. Click the Edit icon to open the Video Editor, where you can replace the video and configure its available properties.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-[#0B1D40] flex items-center gap-2">
                  <Star className="text-[#517AA5]" size={20} /> Icon Block
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  The <strong>Icon Block</strong> allows you to customize icon elements throughout your design. Selecting the <strong>Icon</strong> option highlights all icons on the canvas and displays an <strong>Edit</strong> icon. Click the Edit icon to open the Icon Editor, where you can change the icon and adjust its available properties.
                </p>
              </div>


              <div className="space-y-3">
                <h3 className="text-lg font-bold text-[#0B1D40] flex items-center gap-2">
                  <Minus className="text-[#517AA5]" size={20} /> Divider Block
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Add visual separation between sections of your design. You can customize the divider's line style (solid, dashed, or dotted), adjust the thickness, and choose a custom color. Drag and drop the divider to move it around your canvas and use the scale controls to resize it perfectly to fit your layout.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-[#0B1D40] flex items-center gap-2">
                  <AppWindow className="text-[#517AA5]" size={20} /> Layout Blocks (Section, Header, Footer)
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Use these blocks to structure your page. The <strong>Section</strong> block creates a new content container where you can set global background colors and apply dynamic <strong>Card Shadows</strong>. The <strong>Header</strong> and <strong>Footer</strong> blocks let you quickly configure navigation and bottom links.
                </p>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}

import React, { useState } from 'react';
import {
  Search, Mic, Type, Image as ImageIcon, MousePointerSquareDashed,
  Video, MonitorPlay, Minus, LayoutTemplate, Columns, Heading,
  HelpCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { BlockType } from './types';
 
interface LeftSidebarProps {
  onAddBlock: (type: BlockType) => void;
}
 
export default function LeftSidebar({ onAddBlock }: LeftSidebarProps) {
  const [activeTab, setActiveTab] = useState<'blocks' | 'pages'>('blocks');
  const [searchQuery, setSearchQuery] = useState('');
  const [sections, setSections] = useState({
    basic: true,
    media: false,
    layout: false
  });
 
  const toggleSection = (section: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
 
  const matchesSearch = (text: string) => {
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };
 
  return (
    <aside className="flex h-full w-[248px] flex-shrink-0 flex-col overflow-hidden rounded-xl border border-[#183765] bg-[#0B1D40] text-white shadow-[0_18px_45px_rgba(11,29,64,0.18)]">
      {/* Tabs */}
      <div className="flex border-b border-[#1A315E] px-6 pt-5">
        <button
          className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all duration-300 hover:-translate-y-[1px] ${activeTab === 'blocks' ? 'border-blue-500 text-white' : 'text-gray-400 hover:text-gray-200 border-transparent'}`}
          onClick={() => setActiveTab('blocks')}
        >
          Blocks
        </button>
        <div className="w-[1px] h-4 bg-[#1A315E] mx-2 self-center"></div>
        <button
          className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all duration-300 hover:-translate-y-[1px] ${activeTab === 'pages' ? 'border-blue-500 text-white' : 'text-gray-400 hover:text-gray-200 border-transparent'}`}
          onClick={() => setActiveTab('pages')}
        >
          Pages
        </button>
      </div>
 
      <div className="w-full flex-1 overflow-y-auto p-5">
        {activeTab === 'blocks' ? (
          <>
            {/* Search */}
            <div className="relative mb-6">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search Blocks"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-gray-800 rounded-full py-2 pl-9 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Mic className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 cursor-pointer" />
            </div>
 
            {/* Accordion List */}
            <div className="space-y-4">
              {/* Basic Blocks */}
              <div>
                <button
                  className="w-full flex items-center justify-between text-sm mb-4 font-medium"
                  onClick={() => toggleSection('basic')}
                >
                  Basic Blocks
                  {sections.basic ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {sections.basic && (
                  <>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {matchesSearch('Text') && (
                        <div
                          onClick={() => onAddBlock('text')}
                          className="bg-[#F3F4F6] text-gray-700 flex flex-col items-center justify-center p-2 rounded text-[11px] gap-1 cursor-pointer hover:bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-md active:scale-95"
                        >
                          <Type className="w-4 h-4 text-gray-500 mb-0.5" />
                          Text
                        </div>
                      )}
                      {matchesSearch('Images') && (
                        <div
                          onClick={() => onAddBlock('image')}
                          className="bg-[#F3F4F6] text-gray-700 flex flex-col items-center justify-center p-2 rounded text-[11px] gap-1 cursor-pointer hover:bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-md active:scale-95"
                        >
                          <ImageIcon className="w-4 h-4 text-gray-500 mb-0.5" />
                          Images
                        </div>
                      )}
                      {matchesSearch('Button') && (
                        <div
                          onClick={() => onAddBlock('button')}
                          className="bg-[#F3F4F6] text-gray-700 flex flex-col items-center justify-center p-2 rounded text-[11px] gap-1 cursor-pointer ring-2 ring-blue-500 ring-offset-1 ring-offset-[#0B1D40] hover:bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-md active:scale-95"
                        >
                          <MousePointerSquareDashed className="w-4 h-4 text-gray-500 mb-0.5" />
                          Button
                        </div>
                      )}
                    </div>
 
                    {/* Active Tool Sub-options */}
                    <div className="flex bg-white rounded overflow-hidden text-xs mb-6">
                      <button
                        className="flex-1 bg-blue-600 hover:bg-blue-700 transition-colors text-white py-2 font-medium"
                        onClick={() => alert("Showing all Basic tools")}
                      >
                        All Basic
                      </button>
                      <button
                        className="flex-1 text-gray-700 hover:bg-gray-100 transition-colors py-2 font-medium text-center relative border-l border-gray-200"
                        onClick={() => alert("Loading next tools layout")}
                      >
                        Next
                        <div className="absolute top-0 right-0 w-0 h-0 border-t-[8px] border-r-[8px] border-t-white border-r-transparent"></div>
                      </button>
                    </div>
                  </>
                )}
              </div>
 
              {/* Media Blocks */}
              <div>
                <button
                  className="w-full flex items-center justify-between text-sm mb-4 font-medium opacity-90"
                  onClick={() => toggleSection('media')}
                >
                  Basic Blocks
                  {sections.media ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {sections.media && (
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {matchesSearch('Videos') && (
                      <div
                        onClick={() => onAddBlock('video')}
                          className="bg-[#F3F4F6] text-gray-700 flex flex-col items-center justify-center p-2 rounded text-[11px] gap-1 cursor-pointer hover:bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-md active:scale-95"
                      >
                        <MonitorPlay className="w-4 h-4 text-gray-500 mb-0.5" />
                        Videos
                      </div>
                    )}
                    {matchesSearch('Cards') && (
                      <div
                        onClick={() => onAddBlock('card')}
                          className="bg-[#F3F4F6] text-gray-700 flex flex-col items-center justify-center p-2 rounded text-[11px] gap-1 cursor-pointer hover:bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-md active:scale-95"
                      >
                        <Video className="w-4 h-4 text-gray-500 mb-0.5" />
                        Cards
                      </div>
                    )}
                    {matchesSearch('Divider') && (
                      <div
                        onClick={() => onAddBlock('divider')}
                          className="bg-[#F3F4F6] text-gray-700 flex flex-col items-center justify-center p-2 rounded text-[11px] gap-1 cursor-pointer hover:bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-md active:scale-95"
                      >
                        <Minus className="w-4 h-4 text-gray-500 mb-0.5" />
                        Divider
                      </div>
                    )}
                  </div>
                )}
              </div>
 
              {/* Layout Blocks */}
              <div>
                <button
                  className="w-full flex items-center justify-between text-sm mb-4 font-medium opacity-90"
                  onClick={() => toggleSection('layout')}
                >
                  Layout Blocks
                  {sections.layout ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {sections.layout && (
                  <div className="grid grid-cols-3 gap-3">
                    {matchesSearch('Section') && (
                      <div
                        onClick={() => onAddBlock('section')}
                          className="bg-[#F3F4F6] text-gray-700 flex flex-col items-center justify-center p-2 rounded text-[11px] gap-1 cursor-pointer hover:bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-md active:scale-95"
                      >
                        <LayoutTemplate className="w-4 h-4 text-gray-500 mb-0.5" />
                        Section
                      </div>
                    )}
                    {matchesSearch('Columns') && (
                      <div
                        onClick={() => onAddBlock('columns')}
                          className="bg-[#F3F4F6] text-gray-700 flex flex-col items-center justify-center p-2 rounded text-[11px] gap-1 cursor-pointer hover:bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-md active:scale-95"
                      >
                        <Columns className="w-4 h-4 text-gray-500 mb-0.5" />
                        Columns
                      </div>
                    )}
                    {matchesSearch('Header') && (
                      <div
                        onClick={() => onAddBlock('header')}
                          className="bg-[#F3F4F6] text-gray-700 flex flex-col items-center justify-center p-2 rounded text-[11px] gap-1 cursor-pointer hover:bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-md active:scale-95"
                      >
                        <Heading className="w-4 h-4 text-gray-500 mb-0.5" />
                        Header
                      </div>
                    )}
                  </div>
                )}
              </div>
 
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center gap-4 px-4 pt-10">
            <LayoutTemplate className="w-12 h-12 text-gray-600 opacity-50" />
            <div>
              <p className="font-semibold text-gray-300">Pages Manager</p>
              <p className="text-xs mt-2">Create new layouts, route domains, and manage SEO links here.</p>
            </div>
            <button
              className="mt-4 px-4 py-2 border border-gray-600 rounded-md text-xs hover:bg-gray-800 transition"
              onClick={() => alert("Page Creation flow opened.")}
            >
              + Create New Page
            </button>
          </div>
        )}
      </div>
 
      <div className="border-t border-[#1A315E] p-5">
        <button
          className="w-full bg-white text-gray-800 rounded py-2.5 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all duration-300 shadow-sm"
          onClick={() => alert("Help Center Modal Opened.")}
        >
          Help
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
 
 
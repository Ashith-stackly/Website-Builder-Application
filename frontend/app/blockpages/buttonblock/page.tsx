"use client";
 
import React, { useState } from 'react';
import Footer from '@/components/Footer';
import LeftSidebar from './LeftSidebar';
import MobileLeftSidebar from './MobileLeftSidebar';
import RightSidebar from './RightSidebar';
import Canvas from './Canvas';
import { BlockData, BlockType } from './types';
import { ChevronRight } from 'lucide-react';
 
export default function Page() {
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
 
  // Mobile Responsiveness Sidebars
  const [isLeftOpen, setIsLeftOpen] = useState(false);
 
  // History tracking
  const [pastStates, setPastStates] = useState<BlockData[][]>([]);
  const [futureStates, setFutureStates] = useState<BlockData[][]>([]);
 
  const pushState = (newBlocks: BlockData[]) => {
    setPastStates([...pastStates, blocks]);
    setFutureStates([]);
    setBlocks(newBlocks);
  };
 
  const undo = () => {
    if (pastStates.length === 0) return;
    const previous = pastStates[pastStates.length - 1];
    setFutureStates([blocks, ...futureStates]);
    setPastStates(pastStates.slice(0, pastStates.length - 1));
    setBlocks(previous);
  };
 
  const redo = () => {
    if (futureStates.length === 0) return;
    const next = futureStates[0];
    setPastStates([...pastStates, blocks]);
    setFutureStates(futureStates.slice(1));
    setBlocks(next);
  };
 
  const handleAddBlock = (type: BlockType) => {
    const newBlock: BlockData = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      props: {
        width: '600 px',
        borderRadius: '18 px'
      }
    };
    pushState([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };
 
  const handleRemoveBlock = (id: string) => {
    pushState(blocks.filter(b => b.id !== id));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
  };
 
  const handleUpdateBlock = (id: string, newProps: Record<string, unknown>) => {
    pushState(blocks.map(b =>
      b.id === id ? { ...b, props: { ...b.props, ...newProps } } : b
    ));
  };
 
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#e9eef6] font-sans">
      <div className="relative flex min-h-[calc(100vh-64px)] w-full flex-1 flex-shrink-0 gap-4 overflow-hidden p-4">
        <button
          className="absolute left-0 top-5 z-40 flex h-11 w-8 items-center justify-center rounded-r-md border border-l-0 border-[#152B52] bg-[#0B1D40] text-white shadow-lg transition-all duration-300 hover:bg-[#152B52] active:scale-95 xl:hidden"
          onClick={() => setIsLeftOpen(true)}
          aria-label="Open left sidebar"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
       
        {/* Left Sidebar (Desktop Only) */}
        <div className="hidden xl:flex xl:relative xl:translate-x-0 inset-y-0 left-0">
          <LeftSidebar onAddBlock={(type) => { handleAddBlock(type); }} />
        </div>
 
        {/* Mobile Left Sidebar Overlay (Bottom Sheet) */}
        <div className={`fixed inset-0 z-[60] xl:hidden transition-opacity duration-300 ${isLeftOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsLeftOpen(false)}></div>
          <div className={`absolute bottom-0 left-0 w-full h-[65vh] max-h-[800px] bg-[#0A193A] rounded-t-3xl transform transition-transform duration-300 ${isLeftOpen ? 'translate-y-0' : 'translate-y-full'} overflow-hidden flex flex-col shadow-2xl`}>
            <MobileLeftSidebar
              onAddBlock={(type) => { handleAddBlock(type); setIsLeftOpen(false); }}
              onClose={() => setIsLeftOpen(false)}
              selectedBlock={blocks.find(b => b.id === selectedBlockId) || null}
              onUpdateBlock={handleUpdateBlock}
            />
          </div>
        </div>
       
        <Canvas
          blocks={blocks}
          selectedBlockId={selectedBlockId}
          onSelectBlock={setSelectedBlockId}
          onRemoveBlock={handleRemoveBlock}
          canUndo={pastStates.length > 0}
          canRedo={futureStates.length > 0}
          onUndo={undo}
          onRedo={redo}
        />
       
        {/* Right Sidebar (Desktop Only) */}
        <div className="hidden xl:flex xl:relative xl:translate-x-0 inset-y-0 right-0 h-full transition-transform duration-300">
          <RightSidebar
            selectedBlock={blocks.find(b => b.id === selectedBlockId) || null}
            onUpdateBlock={handleUpdateBlock}
          />
        </div>
       
      </div>
      <Footer />
    </div>
  );
}
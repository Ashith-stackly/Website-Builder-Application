import React, { useState } from 'react';
import { ChevronDown, FileVideo, X, Settings, Image as ImageIcon } from 'lucide-react';
import { VideoBlockData } from './types';
 
interface RightSidebarProps {
  selectedBlock: VideoBlockData | null;
  onUpdateBlock: (id: string, props: Partial<VideoBlockData['props']>) => void;
  onClose?: () => void;
}
 
export default function RightSidebar({ selectedBlock, onUpdateBlock, onClose }: RightSidebarProps) {
  const props = selectedBlock?.props || {} as Partial<VideoBlockData['props']>;
  const id = selectedBlock?.id || '';
 
  const [activeTab, setActiveTab] = useState<'video' | 'styles'>('video');
  const [showVideoSettings, setShowVideoSettings] = useState(true);
 
  const handleToggle = (key: keyof typeof props) => {
    onUpdateBlock(id, { [key]: !props[key] });
  };
 
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      onUpdateBlock(id, {
        uploadUrl: url,
        uploadFileName: file.name,
        uploadFileSize: sizeMB
      });
    }
  };
 
  const handlePosterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdateBlock(id, { posterImage: url });
    }
  };
 
  return (
    <aside className="relative flex h-full w-full xl:w-[210px] flex-shrink-0 flex-col overflow-hidden rounded-xl border shadow-[0_18px_45px_rgba(113,63,18,0.10)] transition-colors duration-300 bg-[#fff7f4] border-[#f4d8cc]">
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
      <div className="flex border-b border-[#f2d8cf] bg-white/45 px-4 pt-5">
        <button
          className={`flex-1 border-b-[2px] pb-4 text-base font-bold transition-colors ${activeTab === 'video' ? 'border-[#0B1D40] text-[#0B1D40]' : 'border-gray-300 text-[#566583] hover:text-[#0B1D40]'}`}
          onClick={() => setActiveTab('video')}
        >
          Video
        </button>
        <button
          className={`flex-1 border-b-[2px] pb-4 text-base font-bold transition-colors ${activeTab === 'styles' ? 'border-[#0B1D40] text-[#0B1D40]' : 'border-gray-300 text-[#566583] hover:text-[#0B1D40]'}`}
          onClick={() => setActiveTab('styles')}
        >
          Styles
        </button>
      </div>
 
      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-8 pt-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {activeTab === 'video' ? (
          <>
            {/* Video Settings Accordion Header */}
            <button
              className="w-full flex items-center justify-between text-[15px] font-bold text-[#0B1D40] hover:bg-black/5 p-1 rounded -ml-1 transition mb-2"
              onClick={() => setShowVideoSettings(!showVideoSettings)}
            >
              <span>Video Settings</span>
              <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showVideoSettings ? '' : '-rotate-90'}`} />
            </button>
 
            {showVideoSettings && (
              <div className="space-y-6 pt-2">
                {/* Video Source */}
                <div>
                  <h4 className="text-[#0B1D40] text-sm font-bold mb-3">Video source</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-4 h-4 rounded-full border-[5px] flex items-center justify-center transition-colors ${props.sourceType === 'upload' ? 'border-[#0B1D40]' : 'border-gray-300 group-hover:border-gray-400'}`}></div>
                      <span className={`text-[14px] ${props.sourceType === 'upload' ? 'text-[#0B1D40] font-medium' : 'text-gray-600'}`}>Upload Video</span>
                      <input
                        type="radio"
                        name="videoSource"
                        className="hidden"
                        checked={props.sourceType === 'upload'}
                        onChange={() => onUpdateBlock(id, { sourceType: 'upload' })}
                      />
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-4 h-4 rounded-full border-[5px] flex items-center justify-center transition-colors ${props.sourceType === 'embed' ? 'border-[#0B1D40]' : 'border-gray-300 group-hover:border-gray-400'}`}></div>
                      <span className={`text-[14px] ${props.sourceType === 'embed' ? 'text-[#0B1D40] font-medium' : 'text-gray-600'}`}>Embed Code or Link</span>
                      <input
                        type="radio"
                        name="videoSource"
                        className="hidden"
                        checked={props.sourceType === 'embed'}
                        onChange={() => onUpdateBlock(id, { sourceType: 'embed' })}
                      />
                    </label>
                  </div>
                </div>
 
                {/* Upload Video Section */}
                {props.sourceType === 'upload' ? (
                  <div>
                    <h4 className="text-[#0B1D40] text-sm font-bold mb-3">Upload Video</h4>
                    {props.uploadFileName ? (
                      <div className="flex items-center justify-between border border-[#0B1D40] bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileVideo className="w-5 h-5 text-gray-500 shrink-0" strokeWidth={1.5} />
                          <div className="flex flex-col min-w-0">
                            <span className="text-[13px] text-[#0B1D40] font-medium truncate">{props.uploadFileName}</span>
                            <span className="text-[11px] text-gray-500">{props.uploadFileSize || '0 MB'}</span>
                          </div>
                        </div>
                        <button
                          className="text-[#0B1D40] hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors shrink-0"
                          onClick={() => onUpdateBlock(id, { uploadUrl: '', uploadFileName: '' })}
                        >
                          <X className="w-4 h-4" strokeWidth={2} />
                        </button>
                      </div>
                    ) : (
                      <label className="w-full border-2 border-dashed border-[#0B1D40]/30 hover:border-[#0B1D40] bg-white/50 rounded-xl p-6 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer">
                        <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                          <FileVideo strokeWidth={1.5} />
                        </div>
                        <span className="text-sm font-medium text-[#0B1D40]">Click to upload</span>
                      </label>
                    )}
                  </div>
                ) : (
                  <div>
                    <h4 className="text-[#0B1D40] text-sm font-bold mb-3">Embed Code or Link</h4>
                    <textarea
                      className="w-full border border-gray-300 rounded-xl p-3 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1D40] focus:border-transparent transition-all min-h-[100px] resize-none"
                      placeholder="Paste YouTube, Vimeo, or custom iframe code here..."
                      value={props.embedCode || ''}
                      onChange={(e) => onUpdateBlock(id, { embedCode: e.target.value })}
                    />
                  </div>
                )}
 
                {/* Poster Image */}
                <div>
                  <h4 className="text-[#0B1D40] text-sm font-bold mb-3">Poster Image</h4>
                  <div className="w-full aspect-video rounded-xl bg-gray-100 border border-gray-200 overflow-hidden mb-3 relative group">
                    {props.posterImage ? (
                      <img src={props.posterImage} alt="Poster" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 flex-col gap-2">
                        <ImageIcon strokeWidth={1.5} />
                        <span className="text-xs">No image</span>
                      </div>
                    )}
                  </div>
                  <label className="w-full border border-gray-300 hover:border-[#0B1D40] hover:bg-black/5 bg-transparent rounded-lg py-2.5 text-[14px] font-bold text-[#0B1D40] transition-colors flex items-center justify-center cursor-pointer">
                    Change Image
                    <input type="file" accept="image/*" className="hidden" onChange={handlePosterUpload} />
                  </label>
                </div>
 
                {/* Play Options */}
                <div>
                  <h4 className="text-[#0B1D40] text-sm font-bold mb-4">Play Options</h4>
                  <div className="space-y-4">
                    {[
                      { key: 'autoplay', label: 'Autoplay' },
                      { key: 'loop', label: 'Loop' },
                      { key: 'muted', label: 'Muted' },
                      { key: 'showControls', label: 'Show Controls' },
                    ].map((option) => (
                      <div key={option.key} className="flex items-center justify-between">
                        <span className="text-[14px] text-gray-600 font-medium">{option.label}</span>
                        <button
                          className={`w-11 h-6 rounded-full relative transition-colors ${props[option.key as keyof typeof props] ? 'bg-[#0B1D40]' : 'bg-gray-300'}`}
                          onClick={() => handleToggle(option.key as keyof typeof props)}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white absolute top-[2px] transition-transform ${props[option.key as keyof typeof props] ? 'translate-x-[22px]' : 'translate-x-[2px]'}`}></div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
 
                {/* Trim Options */}
                <div>
                  <h4 className="text-[#0B1D40] text-sm font-bold mb-4">Trim Video (Seconds)</h4>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-[12px] text-gray-500 font-medium mb-1 block">Start Time</label>
                      <input
                        type="number"
                        min="0"
                        max={props.endTime !== undefined ? props.endTime - 1 : undefined}
                        step="1"
                        className="w-full border border-gray-300 rounded-lg p-2 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1D40] transition-all"
                        placeholder="0"
                        value={props.startTime !== undefined ? props.startTime : ''}
                        onChange={(e) => {
                          const val = e.target.value ? parseFloat(e.target.value) : undefined;
                          onUpdateBlock(id, { startTime: val });
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[12px] text-gray-500 font-medium mb-1 block">End Time</label>
                      <input
                        type="number"
                        min={props.startTime !== undefined ? props.startTime + 1 : 0}
                        step="1"
                        className="w-full border border-gray-300 rounded-lg p-2 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1D40] transition-all"
                        placeholder="End"
                        value={props.endTime !== undefined ? props.endTime : ''}
                        onChange={(e) => {
                          const val = e.target.value ? parseFloat(e.target.value) : undefined;
                          onUpdateBlock(id, { endTime: val });
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2">Leave blank to play full video.</p>
                </div>
 
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center h-full text-gray-500 py-10">
            <Settings className="w-10 h-10 mb-4 opacity-50" strokeWidth={1.5} />
            <p className="text-sm font-medium">Style settings coming soon.</p>
          </div>
        )}
      </div>
    </aside>
  );
}
 
 
 
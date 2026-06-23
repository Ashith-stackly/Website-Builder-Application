export type VideoSourceType = 'upload' | 'embed';
 
export interface VideoBlockProps {
  sourceType: VideoSourceType;
  uploadUrl?: string;
  uploadFileName?: string;
  uploadFileSize?: string;
  embedCode?: string;
  posterImage?: string;
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
  showControls: boolean;
  startTime?: number;
  endTime?: number;
}
 
export interface VideoBlockData {
  id: string;
  type: 'video';
  props: VideoBlockProps;
}
 
 
 
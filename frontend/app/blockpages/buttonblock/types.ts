export type BlockType = 'button' | 'video' | 'text' | 'image' | 'card' | 'divider' | 'section' | 'columns' | 'header';

export interface BlockData {
  id: string;
  type: BlockType;
  props: {
    width?: string;
    borderRadius?: string;
    content?: string;
    [key: string]: unknown;
  };
}

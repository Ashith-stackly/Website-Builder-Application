import {
  User,
  Search,
  Download,
  Copy,
  Cloud,
  Clock,
  X,
  Camera,
  Heart,
  type LucideIcon,
} from "lucide-react";
import type { IconBlockProps, IconType } from "./types";
import { Image as ImageIcon } from "lucide-react";
 
const ICON_MAP: Record<IconType, LucideIcon> = {
  user: User,
  search: Search,
  download: Download,
  copy: Copy,
  cloud: Cloud,
  clock: Clock,
  cancel: X,
  camera: Camera,
  heart: Heart,
};
 
export function getIconComponent(type: IconType): LucideIcon {
  return ICON_MAP[type] ?? User;
}
 
export default function IconPreview({
  props,
  className = "",
}: {
  props: IconBlockProps;
  className?: string;
}) {
  const size = parseInt(props.size, 10) || 48;
 
  if (props.customIconUrl) {
    return (
      <img
        src={props.customIconUrl}
        alt="Custom Icon"
        width={size}
        height={size}
        className={className}
        style={{ objectFit: "contain" }}
      />
    );
  }
 
  if (!props.iconType || props.iconType === "none" as any) {
    return (
      <div className="w-full h-full min-h-[120px] flex flex-col items-center justify-center text-gray-400 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-4">
        <ImageIcon className="w-8 h-8 mb-2 opacity-30" />
        <p className="font-medium text-[11px] text-center">No Icon</p>
      </div>
    );
  }
 
  const Icon = getIconComponent(props.iconType);
 
  return (
    <Icon
      className={className}
      size={size}
      color={props.color}
      strokeWidth={props.thickness}
    />
  );
}
 
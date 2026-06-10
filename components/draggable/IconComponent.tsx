"use client";

import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { BuilderComponent } from "@/types/builder";

export const ICON_NAMES = [
  "Star", "Heart", "Check", "X", "Plus", "Minus", "Search", "Edit2",
  "ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown",
  "ChevronRight", "ChevronLeft", "ChevronDown", "ChevronUp",
  "Mail", "Phone", "MessageCircle", "Send", "Bell", "Share2",
  "ThumbsUp", "Bookmark", "Flag", "Award", "Trophy",
  "Image", "Camera", "Video", "Music", "Download", "Upload",
  "Settings", "Info", "AlertCircle", "CheckCircle", "Shield", "Lock",
  "MapPin", "Globe", "Home", "Building2",
  "User", "Users", "Briefcase", "Calendar", "Clock",
  "CreditCard", "ShoppingCart", "Package", "Gift", "Rocket",
  "Zap", "Cpu", "Code", "Database", "Wifi", "Link",
  "Sun", "Moon", "Cloud", "Smile", "Layers", "Sparkles",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export function getIcon(name: string): LucideIcon | undefined {
  return (LucideIcons as unknown as Record<string, LucideIcon | undefined>)[name];
}

export default function IconComponent({
  component,
}: {
  component: BuilderComponent;
  isEditing?: boolean;
  onUpdate?: (content: string | null) => void;
}) {
  const iconName = component.content || "Star";
  const Icon = getIcon(iconName);
  const size = parseInt(component.styles.fontSize || "32") || 32;
  const color = component.styles.color || "#0B1D40";
  const textAlign = component.styles.textAlign || "left";

  const wrapStyle: React.CSSProperties = {
    display: "flex",
    justifyContent:
      textAlign === "center"
        ? "center"
        : textAlign === "right"
          ? "flex-end"
          : "flex-start",
    padding: component.styles.padding,
    margin: component.styles.margin,
    width: component.styles.width || "auto",
    backgroundColor: component.styles.backgroundColor,
    borderRadius: component.styles.borderRadius,
  };

  if (!Icon) {
    return (
      <div style={wrapStyle}>
        <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">?</div>
      </div>
    );
  }

  return (
    <div style={wrapStyle}>
      <Icon size={size} color={color} strokeWidth={1.75} />
    </div>
  );
}


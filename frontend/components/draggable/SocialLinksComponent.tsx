"use client";

import { Globe, Hash, Heart, Link2, MessageCircle, Share2, Tv } from "lucide-react";
import type { BuilderComponent, SocialLinksProps } from "@/types/builder";
import { getBaseStyles } from "./componentStyles";

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Hash,
  twitter: MessageCircle,
  instagram: Heart,
  linkedin: Link2,
  youtube: Tv,
  github: Share2,
  website: Globe,
};

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "#1877F2",
  twitter: "#1DA1F2",
  instagram: "#E4405F",
  linkedin: "#0A66C2",
  youtube: "#FF0000",
  github: "#333",
  website: "#0B1D40",
};

const SIZE_MAP = { sm: 28, md: 36, lg: 44 };
const ICON_CLS = { sm: "h-3.5 w-3.5", md: "h-[18px] w-[18px]", lg: "h-[22px] w-[22px]" };

export const socialLinksDefaults: SocialLinksProps = {
  links: [
    { platform: "facebook", url: "https://facebook.com" },
    { platform: "twitter", url: "https://twitter.com" },
    { platform: "instagram", url: "https://instagram.com" },
    { platform: "linkedin", url: "https://linkedin.com" },
  ],
  size: "md",
  style: "filled",
};

export default function SocialLinksComponent({
  component,
}: {
  component: BuilderComponent;
  children?: React.ReactNode;
  isEditing?: boolean;
  onUpdate?: (content: string | null) => void;
  onPatch?: (patch: Partial<BuilderComponent>) => void;
}) {
  const props = (component.props as unknown as SocialLinksProps) || socialLinksDefaults;
  const base = getBaseStyles(component);
  const sz = SIZE_MAP[props.size] || SIZE_MAP.md;
  const iconCls = ICON_CLS[props.size] || ICON_CLS.md;

  return (
    <div style={base} className="flex w-full items-center justify-center gap-3 py-3">
      {props.links.map((link, i) => {
        const Icon = PLATFORM_ICONS[link.platform] || Globe;
        const color = PLATFORM_COLORS[link.platform] || "#0B1D40";
        const isFilled = props.style === "filled";
        const isOutline = props.style === "outline";

        return (
          <a
            key={i}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 hover:shadow-lg"
            style={{
              width: sz,
              height: sz,
              backgroundColor: isFilled ? color : "transparent",
              border: isOutline ? `2px solid ${color}` : "none",
              color: isFilled ? "#fff" : color,
            }}
            onClick={(e) => e.preventDefault()}
          >
            <Icon className={`flex-shrink-0 ${iconCls}`} />
          </a>
        );
      })}
    </div>
  );
}


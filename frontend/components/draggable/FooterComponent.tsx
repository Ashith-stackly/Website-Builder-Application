"use client";

import { Globe, Hash, Heart, Link2, MessageCircle, Share2, Tv } from "lucide-react";
import type { BuilderComponent, FooterProps, SocialLink } from "@/types/builder";
import { getBaseStyles } from "./componentStyles";

const SOCIAL_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Hash, twitter: MessageCircle, instagram: Heart,
  linkedin: Link2, youtube: Tv, github: Share2, website: Globe,
};

export const footerDefaults: FooterProps = {
  brand: "Stackly",
  tagline: "Build beautiful websites in minutes.",
  columns: [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#" },
        { label: "Pricing", href: "#" },
        { label: "Templates", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Careers", href: "#" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Help Center", href: "#" },
        { label: "Contact", href: "#" },
        { label: "Status", href: "#" },
      ],
    },
  ],
  copyright: `© ${new Date().getFullYear()} Stackly. All rights reserved.`,
  socials: [
    { platform: "twitter", url: "#" },
    { platform: "linkedin", url: "#" },
    { platform: "github", url: "#" },
  ],
};

export default function FooterComponent({
  component,
}: {
  component: BuilderComponent;
  children?: React.ReactNode;
  isEditing?: boolean;
  onUpdate?: (content: string | null) => void;
  onPatch?: (patch: Partial<BuilderComponent>) => void;
}) {
  const props = (component.props as unknown as FooterProps) || footerDefaults;
  const base = getBaseStyles(component);

  return (
    <footer style={{ ...base, backgroundColor: base.backgroundColor || "#0B1D40" }} className="w-full">
      <div className="mx-auto max-w-[1100px] px-6 py-12">
        {/* Top: brand + columns */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand col */}
          <div className="flex flex-col gap-3">
            <span className="text-xl font-black text-white">{props.brand}</span>
            {props.tagline && (
              <p className="text-sm font-medium leading-relaxed text-white/60">{props.tagline}</p>
            )}
            {/* Socials */}
            {props.socials && props.socials.length > 0 && (
              <div className="mt-3 flex gap-2">
                {props.socials.map((s: SocialLink, i: number) => {
                  const Icon = SOCIAL_ICON[s.platform] || Globe;
                  return (
                    <a
                      key={i}
                      href={s.url}
                      onClick={(e) => e.preventDefault()}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Link columns */}
          {props.columns.map((col, i) => (
            <div key={i}>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-white/40">
                {col.title}
              </h4>
              <ul className="flex flex-col gap-2">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <a
                      href={link.href}
                      onClick={(e) => e.preventDefault()}
                      className="text-sm font-medium text-white/60 transition hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="my-8 h-px w-full bg-white/10" />

        {/* Copyright */}
        <p className="text-center text-xs font-medium text-white/40">
          {props.copyright}
        </p>
      </div>
    </footer>
  );
}


"use client";

import { Globe, Hash, Heart, Link2, MessageCircle, Share2, Tv } from "lucide-react";
import InlineText from "@/components/builder/InlineText";
import type { BuilderComponent, FooterProps, SocialLink } from "@/types/builder";
import { getItemStyle, getTargetTextStyles, getTextStyles, toReactStyle } from "./componentStyles";
import { useBuilderStore } from "@/store/builderStore";

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

/* ── Safe reader ────────────────────────────────────────────────────── */
function readFooterData(component: BuilderComponent): FooterProps {
  const p = component.props as Record<string, unknown> | undefined;
  if (!p || typeof p !== "object") return footerDefaults;
  return {
    brand: typeof p.brand === "string" ? p.brand : footerDefaults.brand,
    tagline: typeof p.tagline === "string" ? p.tagline : footerDefaults.tagline,
    columns: Array.isArray(p.columns) ? (p.columns as FooterProps["columns"]) : footerDefaults.columns,
    copyright: typeof p.copyright === "string" ? p.copyright : footerDefaults.copyright,
    socials: Array.isArray(p.socials) ? (p.socials as FooterProps["socials"]) : footerDefaults.socials,
  };
}

export default function FooterComponent({
  component,
  onPatch,
}: {
  component: BuilderComponent;
  children?: React.ReactNode;
  isEditing?: boolean;
  onUpdate?: (content: string | null) => void;
  onPatch?: (patch: Partial<BuilderComponent>) => void;
}) {
  const props = readFooterData(component);
  const textStyle = getTextStyles(component.styles);
  const viewport = useBuilderStore((s) => s.viewport);
  const selectSubItem = useBuilderStore((s) => s.selectSubItem);
  const selectedSubItem = useBuilderStore((s) => s.selectedSubItem);

  // Build base styles, preserving user-set backgroundColor or falling back to dark theme
  const baseStyle = toReactStyle(component.styles);
  const footerStyle = {
    ...baseStyle,
    backgroundColor: baseStyle.backgroundColor || "#0B1D40",
  };

  const isColSelected = (index: number) =>
    selectedSubItem?.componentId === component.id && selectedSubItem.itemIndex === index;

  const gridClass = viewport === "mobile"
    ? "grid gap-10 grid-cols-1"
    : viewport === "tablet"
      ? "grid gap-10 grid-cols-2"
      : "grid gap-10 grid-cols-4";

  function saveProp(field: keyof FooterProps, value: unknown) {
    onPatch?.({ props: { [field]: value } });
  }

  function saveColTitle(index: number, title: string) {
    const next = props.columns.map((col, idx) => (idx === index ? { ...col, title } : col));
    saveProp("columns", next);
  }

  return (
    <footer style={footerStyle} className="w-full">
      <div className="mx-auto max-w-[1100px] px-6 py-12">
        {/* Top: brand + columns */}
        <div className={gridClass}>
          {/* Brand col */}
          <div className="flex flex-col gap-3">
            <InlineText
              componentId={component.id}
              textKey="footer.brand"
              textLabel="Footer brand"
              as="span"
              value={props.brand}
              onSave={(v) => saveProp("brand", v)}
              className="text-xl font-black text-white"
              style={getTargetTextStyles(component, "footer.brand", { color: "#ffffff" })}
            />
            {props.tagline && (
              <InlineText
                componentId={component.id}
                textKey="footer.tagline"
                textLabel="Footer tagline"
                as="p"
                value={props.tagline}
                onSave={(v) => saveProp("tagline", v)}
                className="text-sm font-medium leading-relaxed text-white/60"
                style={getTargetTextStyles(component, "footer.tagline", { color: "rgba(255,255,255,0.6)" })}
              />
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
            <div
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                selectSubItem({
                  componentId: component.id,
                  itemIndex: i,
                  element: "column",
                });
              }}
              className={`cursor-pointer rounded-xl p-3 transition-all duration-200 ${
                isColSelected(i) ? "ring-2 ring-violet-500 ring-offset-2 ring-offset-[#0B1D40]" : ""
              }`}
              style={getItemStyle(col.style)}
            >
              <InlineText
                componentId={component.id}
                textKey={`footer.column.${i}.title`}
                textLabel={`Footer Column ${i + 1} title`}
                as="h4"
                value={col.title}
                onSave={(v) => saveColTitle(i, v)}
                className="mb-3 block text-xs font-bold uppercase tracking-widest text-white/40"
                style={getTargetTextStyles(component, `footer.column.${i}.title`, { color: "rgba(255,255,255,0.4)" })}
              />
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
        <InlineText
          componentId={component.id}
          textKey="footer.copyright"
          textLabel="Footer copyright"
          as="p"
          value={props.copyright || ""}
          onSave={(v) => saveProp("copyright", v)}
          className="text-center text-xs font-medium text-white/40"
          style={getTargetTextStyles(component, "footer.copyright", { color: "rgba(255,255,255,0.4)" })}
        />
      </div>
    </footer>
  );
}

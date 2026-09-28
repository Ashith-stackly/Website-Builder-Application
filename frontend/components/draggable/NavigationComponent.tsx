"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu as MenuIcon, X as XIcon } from "lucide-react";
import InlineText from "@/components/builder/InlineText";
import { readNavigation } from "@/components/blocks/navigation/spec";
import type { BuilderComponent, NavigationLogoConfig } from "@/types/builder";
import { useBuilderStore } from "@/store/builderStore";
import { getTargetTextStyles, getTextStyles, toReactStyle } from "./componentStyles";

export default function NavigationComponent({
  component,
  onPatch,
}: {
  component: BuilderComponent;
  isEditing?: boolean;
  onUpdate?: (content: string | null) => void;
  onPatch?: (patch: Partial<BuilderComponent>) => void;
}) {
  const { brand, logo: logoConfig, logoUrl, links, cta } = readNavigation(component);
  const textStyle = getTextStyles(component.styles);
  const viewport = useBuilderStore((s) => s.viewport);
  const [isOpen, setIsOpen] = useState(false);

  // Resolve effective logo config (with legacy fallback)
  const logo: NavigationLogoConfig = logoConfig ?? { type: "text" };

  // For legacy compat: if logo.type is "text" but legacy logoUrl exists, treat as image-text
  const effectiveType: NavigationLogoConfig["type"] =
    logo.type === "text" && logoUrl ? "image-text" : logo.type;
  const effectiveSrc = logo.src || logoUrl || "";
  const effectiveWidth = logo.width ?? 120;
  const effectiveAlt = logo.alt || `${brand} logo`;

  function saveProp<K extends "brand">(key: K, value: string) {
    onPatch?.({ props: { [key]: value } });
  }

  function saveLinkLabel(i: number, label: string) {
    const next = links.map((link, idx) => (idx === i ? { ...link, label } : link));
    onPatch?.({ props: { links: next } });
  }

  function saveCtaLabel(label: string) {
    onPatch?.({ props: { cta: { ...cta, label } } });
  }

  const isMobile = viewport === "mobile" || viewport === "tablet";
  const isTablet = viewport === "tablet";

  const showBrandText = effectiveType === "text" || effectiveType === "image-text";
  const showLogoImage = (effectiveType === "image" || effectiveType === "image-text") && effectiveSrc;

  /** Renders the logo image element, preventing builder-time navigation */
  const renderLogoImage = () => {
    if (!showLogoImage) return null;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={effectiveSrc}
        alt={effectiveAlt}
        className="shrink-0 object-contain max-w-[80px] sm:max-w-[120px] md:max-w-none"
        style={{
          width: isMobile ? `${Math.min(effectiveWidth, 100)}px` : `${effectiveWidth}px`,
          height: "auto",
          maxHeight: "48px",
        }}
        onError={(e) => { e.currentTarget.style.display = "none"; }}
        draggable={false}
      />
    );
  };

  return (
    <nav
      className="relative flex w-full flex-col border border-[#dbe3ef] shadow-sm transition-all duration-300"
      style={toReactStyle(component.styles)}
    >
      {/* Main bar */}
      <div className="flex w-full items-center justify-between gap-4 p-4">
        {/* Brand Group */}
        <div className="flex shrink-0 items-center gap-3">
          {renderLogoImage()}
          {showBrandText && (
            <InlineText
              componentId={component.id}
              textKey="navigation.brand"
              textLabel="Navigation brand"
              as="span"
              value={brand}
              onSave={(v) => saveProp("brand", v)}
              className="text-lg font-bold whitespace-nowrap"
              style={getTargetTextStyles(component, "navigation.brand", textStyle)}
            />
          )}
        </div>

        {/* Desktop & Tablet Links (hidden on Mobile) */}
        {!isMobile && (
          <div className={`flex items-center gap-4 text-sm font-semibold text-[#566583] ${isTablet ? "gap-3 text-xs" : ""}`}>
            {links.map((link, i) => (
              <InlineText
                key={i}
                componentId={component.id}
                textKey={`navigation.link.${i}`}
                textLabel={`Navigation link ${i + 1}`}
                as="span"
                value={link.label}
                onSave={(v) => saveLinkLabel(i, v)}
                className="transition hover:text-[#0B1D40]"
                style={getTargetTextStyles(component, `navigation.link.${i}`, textStyle)}
              />
            ))}
          </div>
        )}

        {/* Desktop & Tablet CTA (hidden on Mobile) */}
        {!isMobile && (
          <InlineText
            componentId={component.id}
            textKey="navigation.cta"
            textLabel="Navigation button"
            as="button"
            value={cta.label}
            onSave={(v) => saveCtaLabel(v)}
            className="px-4 py-2 text-sm font-bold shadow-sm transition hover:opacity-90"
            style={getTargetTextStyles(component, "navigation.cta", {
              color: "#ffffff",
              backgroundColor: "#0B1D40",
              borderRadius: "6px",
            })}
          />
        )}

        {/* Mobile Hamburger Button */}
        {isMobile && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-[#0B1D40] shadow-sm transition hover:bg-gray-50 active:scale-95"
            aria-label="Toggle Navigation"
          >
            {isOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        )}
      </div>

      {/* Mobile Links & CTA Dropdown */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="w-full overflow-hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2"
          >
            <div className="flex flex-col gap-3 text-sm font-semibold text-[#566583]">
              {links.map((link, i) => (
                <div key={i} className="py-1.5 border-b border-gray-50 last:border-0">
                  <InlineText
                    componentId={component.id}
                    textKey={`navigation.link.${i}`}
                    textLabel={`Navigation link ${i + 1}`}
                    as="span"
                    value={link.label}
                    onSave={(v) => saveLinkLabel(i, v)}
                    className="w-full transition hover:text-[#0B1D40]"
                    style={getTargetTextStyles(component, `navigation.link.${i}`, textStyle)}
                  />
                </div>
              ))}
              <div className="mt-2 pt-2 border-t border-gray-100">
                <InlineText
                  componentId={component.id}
                  textKey="navigation.cta"
                  textLabel="Navigation button"
                  as="button"
                  value={cta.label}
                  onSave={(v) => saveCtaLabel(v)}
                  className="w-full justify-center px-4 py-2.5 text-sm font-bold shadow-sm transition hover:opacity-90"
                  style={getTargetTextStyles(component, "navigation.cta", {
                    color: "#ffffff",
                    backgroundColor: "#0B1D40",
                    borderRadius: "6px",
                  })}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

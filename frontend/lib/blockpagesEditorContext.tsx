"use client";

import { createContext, useContext, useMemo, useRef, type ReactNode } from "react";
import type { BlockpagesTemplateId } from "@/lib/blockpagesTemplates";
import { getCustomButtonStyle } from "@/lib/blockpagesButtonStyles";

export type BlockpagesPreviewDevice = "desktop" | "tablet" | "mobile";

type BlockpagesEditorContextValue = {
  enabled: true;
  template: BlockpagesTemplateId;
  deviceMode: BlockpagesPreviewDevice;
  customImages?: Record<string, string>;
  customButtons?: Record<string, any>;
  customIcons?: Record<string, any>;
  customTexts?: Record<string, string>;
  textStyles?: Record<string, any>;
  sectionStyles?: Record<string, any>;
  getImageSrc?: (defaultSrc: string, imageId: string) => string;
  getTextContent?: (defaultText: string, textId: string) => string;
  getButtonStyle?: (buttonId: string, defaultClassName?: string) => { className: string; style: any };
  onPreview?: () => void;
};

const BlockpagesEditorContext = createContext<BlockpagesEditorContextValue | null>(null);

export function BlockpagesEditorProvider({
  children,
  template,
  deviceMode = "desktop",
  customImages = {},
  customButtons = {},
  customIcons = {},
  customTexts = {},
  textStyles = {},
  sectionStyles = {},
  onPreview,
}: {
  children: ReactNode;
  template: BlockpagesTemplateId;
  deviceMode?: BlockpagesPreviewDevice;
  customImages?: Record<string, string>;
  customButtons?: Record<string, any>;
  customIcons?: Record<string, any>;
  customTexts?: Record<string, string>;
  textStyles?: Record<string, any>;
  sectionStyles?: Record<string, any>;
  onPreview?: () => void;
}) {
  const customTextsRef = useRef(customTexts);
  customTextsRef.current = customTexts;

  const getImageSrc = (defaultSrc: string, imageId: string): string => {
    return customImages?.[imageId] || defaultSrc;
  };

  const getTextContent = (defaultText: string, textId: string): string => {
    return customTextsRef.current?.[textId] ?? defaultText;
  };

  const getButtonStyle = (buttonId: string, defaultClassName = "") => {
    return getCustomButtonStyle(buttonId, customButtons, defaultClassName);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo<BlockpagesEditorContextValue>(() => ({
    enabled: true as const,
    template,
    deviceMode,
    customImages,
    customButtons,
    customIcons,
    customTexts,
    textStyles,
    sectionStyles,
    getImageSrc,
    getTextContent,
    getButtonStyle,
    onPreview,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [template, deviceMode, customImages, customButtons, customIcons, textStyles, sectionStyles, onPreview]);

  return (
    <BlockpagesEditorContext.Provider value={value}>
      {children}
    </BlockpagesEditorContext.Provider>
  );
}

export function useBlockpagesEditor() {
  return useContext(BlockpagesEditorContext);
}

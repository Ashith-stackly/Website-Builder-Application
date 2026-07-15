"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { BlockpagesTemplateId } from "@/lib/blockpagesTemplates";

export type BlockpagesPreviewDevice = "desktop" | "tablet" | "mobile";

type BlockpagesEditorContextValue = {
  enabled: true;
  template: BlockpagesTemplateId;
  deviceMode: BlockpagesPreviewDevice;
  onPreview?: () => void;
};

const BlockpagesEditorContext = createContext<BlockpagesEditorContextValue | null>(null);

export function BlockpagesEditorProvider({
  children,
  template,
  deviceMode = "desktop",
  onPreview,
}: {
  children: ReactNode;
  template: BlockpagesTemplateId;
  deviceMode?: BlockpagesPreviewDevice;
  onPreview?: () => void;
}) {
  return (
    <BlockpagesEditorContext.Provider value={{ enabled: true, template, deviceMode, onPreview }}>
      {children}
    </BlockpagesEditorContext.Provider>
  );
}

export function useBlockpagesEditor() {
  return useContext(BlockpagesEditorContext);
}

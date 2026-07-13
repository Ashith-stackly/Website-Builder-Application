"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { BlockpagesTemplateId } from "@/lib/blockpagesTemplates";

type BlockpagesEditorContextValue = {
  enabled: true;
  template: BlockpagesTemplateId;
  onPreview?: () => void;
};

const BlockpagesEditorContext = createContext<BlockpagesEditorContextValue | null>(null);

export function BlockpagesEditorProvider({
  children,
  template,
  onPreview,
}: {
  children: ReactNode;
  template: BlockpagesTemplateId;
  onPreview?: () => void;
}) {
  return (
    <BlockpagesEditorContext.Provider value={{ enabled: true, template, onPreview }}>
      {children}
    </BlockpagesEditorContext.Provider>
  );
}

export function useBlockpagesEditor() {
  return useContext(BlockpagesEditorContext);
}

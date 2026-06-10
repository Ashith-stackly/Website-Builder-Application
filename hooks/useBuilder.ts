"use client";

import { useBuilderStore } from "@/store/builderStore";
import { useShallow } from "zustand/react/shallow";

export const useBuilder = () => useBuilderStore();

export const useBuilderActions = () =>
  useBuilderStore(
    useShallow((s) => ({
      addComponent: s.addComponent,
      insertComponentBefore: s.insertComponentBefore,
      updateComponent: s.updateComponent,
      duplicateComponent: s.duplicateComponent,
      deleteComponent: s.deleteComponent,
      selectComponent: s.selectComponent,
      reorderComponents: s.reorderComponents,
      loadStarterWebsite: s.loadStarterWebsite,
      loadWebsiteFromRequirements: s.loadWebsiteFromRequirements,
      clearCanvas: s.clearCanvas,
      undo: s.undo,
      redo: s.redo,
      saveToLocalStorage: s.saveToLocalStorage,
      loadFromLocalStorage: s.loadFromLocalStorage,
      /* Wix-style freeform editing */
      toggleSelectComponent: s.toggleSelectComponent,
      copyComponents: s.copyComponents,
      pasteComponents: s.pasteComponents,
      moveLayer: s.moveLayer,
      moveComponent: s.moveComponent,
      resizeComponent: s.resizeComponent,
      toggleLock: s.toggleLock,
    })),
  );

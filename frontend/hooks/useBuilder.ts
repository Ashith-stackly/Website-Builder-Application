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
      loadProject: s.loadProject,
      autosave: s.autosave,
      markDirty: s.markDirty,
      saveHtml: s.saveHtml,
      saveDraft: s.saveDraft,
      /* Wix-style freeform editing */
      toggleSelectComponent: s.toggleSelectComponent,
      copyComponents: s.copyComponents,
      pasteComponents: s.pasteComponents,
      moveLayer: s.moveLayer,
      moveComponent: s.moveComponent,
      resizeComponent: s.resizeComponent,
      toggleLock: s.toggleLock,
      /* Module 4: additional actions */
      moveComponentUp: s.moveComponentUp,
      moveComponentDown: s.moveComponentDown,
      hideComponent: s.hideComponent,
      exportJSON: s.exportJSON,
      importJSON: s.importJSON,
    })),
  );

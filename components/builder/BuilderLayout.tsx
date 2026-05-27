"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DndContext, DragOverlay, PointerSensor, closestCenter, pointerWithin, useSensor, useSensors, type CollisionDetection, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { ChevronRight, GripVertical, SlidersHorizontal } from "lucide-react";
import { PreviewModal } from "./PreviewModal";
import { useSearchParams } from "next/navigation";
import Canvas from "./Canvas";
import ComponentPalette from "./ComponentPalette";
import PropertyEditor from "./PropertyEditor";
import { useBuilder } from "@/hooks/useBuilder";
import type { BuilderComponent, ComponentType } from "@/types/builder";

function findByIdDeep(components: BuilderComponent[], id: string): BuilderComponent | null {
  for (const c of components) {
    if (c.id === id) return c;
    const found = findByIdDeep(c.children, id);
    if (found) return found;
  }
  return null;
}

const collisionDetectionStrategy: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);

  if (pointerCollisions.length > 0) {
    const itemHit = pointerCollisions.find((c) => c.id !== "builder-canvas");
    return itemHit ? [itemHit] : pointerCollisions;
  }

  return closestCenter(args);
};

export default function BuilderLayout() {
  const { components, selectedComponentId, isInlineEditing, addComponent, updateComponent, duplicateComponent, deleteComponent, selectComponent, reorderComponents, loadStarterWebsite, loadWebsiteFromRequirements, clearCanvas, undo, redo, exportHtml, saveToLocalStorage } = useBuilder();
  const [activePaletteType, setActivePaletteType] = useState<ComponentType | null>(null);
  const [activeCanvasType, setActiveCanvasType] = useState<ComponentType | null>(null);
  const [isLeftOpen, setIsLeftOpen] = useState(false);
  const [isRightOpen, setIsRightOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const searchParams = useSearchParams();
  const hasLoadedRequirements = useRef(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 3 } }));

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isInlineEditing) return;
      const tag = (e.target as HTMLElement)?.tagName;
      const inInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement)?.isContentEditable;
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const ctrl = isMac ? e.metaKey : e.ctrlKey;

      if (ctrl) {
        if (e.key === "z" && !e.shiftKey)         { e.preventDefault(); undo(); return; }
        if ((e.key === "z" && e.shiftKey) || e.key === "y") { e.preventDefault(); redo(); return; }
        if (e.key === "s")                         { e.preventDefault(); saveToLocalStorage(); return; }
        if (e.key === "d" && selectedComponentId) { e.preventDefault(); duplicateComponent(selectedComponentId); return; }
      }

      if (!inInput) {
        if ((e.key === "Delete" || e.key === "Backspace") && selectedComponentId) {
          e.preventDefault(); deleteComponent(selectedComponentId);
        }
        if (e.key === "Escape" && selectedComponentId) {
          selectComponent(null);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isInlineEditing, selectedComponentId, undo, redo, saveToLocalStorage, duplicateComponent, deleteComponent, selectComponent]);
  const selectedComponent = selectedComponentId ? findByIdDeep(components, selectedComponentId) : null;

  useEffect(() => {
    if (hasLoadedRequirements.current) {
      return;
    }

    const projectName = searchParams.get("projectName");
    const category = searchParams.get("category");
    const style = searchParams.get("style");
    const sections = searchParams.get("sections");

    if (!projectName && !category && !style && !sections) {
      return;
    }

    hasLoadedRequirements.current = true;
    loadWebsiteFromRequirements({
      projectName: projectName || "My Website",
      category: category || "Business",
      style: style || "Modern",
      sections: sections ? sections.split(",").filter(Boolean) : [],
    });
  }, [loadWebsiteFromRequirements, searchParams]);

  const handleDragStart = (event: DragStartEvent) => {
    const fromPalette = Boolean(event.active.data.current?.fromPalette);
    const type = event.active.data.current?.type as ComponentType | undefined;

    if (fromPalette && type) {
      setActivePaletteType(type);
      return;
    }

    const dragged = components.find((c) => c.id === String(event.active.id));
    setActiveCanvasType(dragged?.type ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActivePaletteType(null);
    setActiveCanvasType(null);

    if (!over) return;

    const fromPalette = Boolean(active.data.current?.fromPalette);
    const type = active.data.current?.type as ComponentType | undefined;
    const activeId = String(active.id);
    const overId = String(over.id);
    const isOverCanvas = overId === "builder-canvas";
    const isOverItem = Boolean(over.data.current?.fromCanvas);

    if (fromPalette && type) {
      if (isOverCanvas) {
        addComponent(type);
      } else if (isOverItem) {
        const overComponent = components.find((c) => c.id === overId);

        if (overComponent?.type === "container" || overComponent?.type === "columns") {
          addComponent(type, overId);
        } else {
          addComponent(type, null, overId);
        }
      } else {
        addComponent(type);
      }

      setIsLeftOpen(false);
      return;
    }

    if (activeId !== overId) {
      reorderComponents(activeId, overId);
    }
  };

  const handleDragCancel = () => {
    setActivePaletteType(null);
    setActiveCanvasType(null);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={collisionDetectionStrategy} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
      <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#e9eef6] font-sans">
        <div className="relative flex min-h-screen w-full flex-1 flex-shrink-0 gap-4 overflow-hidden p-4">
          <button
            aria-label="Open left sidebar"
            className="absolute left-0 top-5 z-40 flex h-11 w-8 items-center justify-center rounded-r-md border border-l-0 border-[#152B52] bg-[#0B1D40] text-white shadow-lg transition-all duration-300 hover:bg-[#152B52] active:scale-95 lg:hidden"
            onClick={() => setIsLeftOpen(true)}
            type="button"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="hidden lg:flex">
            <ComponentPalette onAdd={addComponent} onLoadStarter={loadStarterWebsite} />
          </div>

          <AnimatePresence>
            {isLeftOpen && (
              <motion.div
                key="left-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[60] lg:hidden"
              >
                <button aria-label="Close left sidebar" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsLeftOpen(false)} type="button" />
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 380, damping: 38 }}
                  className="absolute bottom-0 left-0 flex h-[65vh] max-h-[800px] w-full flex-col overflow-hidden rounded-t-3xl bg-[#0A193A] shadow-2xl"
                >
                  <div className="mx-auto mt-3 h-1 w-10 flex-shrink-0 rounded-full bg-white/20" />
                  <ComponentPalette className="w-full flex-1 rounded-none border-0" onAdd={(type) => { addComponent(type); setIsLeftOpen(false); }} onLoadStarter={() => { loadStarterWebsite(); setIsLeftOpen(false); }} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <Canvas
            components={components}
            onClear={clearCanvas}
            onDelete={deleteComponent}
            onDuplicate={duplicateComponent}
            onLoadStarter={loadStarterWebsite}
            onSelect={selectComponent}
            onPreview={() => setIsPreviewOpen(true)}
          />

          <PropertyEditor component={selectedComponent} onUpdate={updateComponent} />

          {/* Mobile: floating Edit Properties button when a block is selected */}
          <AnimatePresence>
            {selectedComponent && (
              <motion.button
                key="fab-edit"
                initial={{ opacity: 0, scale: 0.8, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 12 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Edit properties"
                className="fixed bottom-6 right-5 z-50 flex items-center gap-2 rounded-full bg-[#0B1D40] px-4 py-3 text-sm font-bold text-white shadow-xl xl:hidden"
                onClick={() => setIsRightOpen(true)}
                type="button"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Edit
              </motion.button>
            )}
          </AnimatePresence>

          {/* Mobile PropertyEditor bottom sheet */}
          <AnimatePresence>
            {isRightOpen && (
              <motion.div
                key="right-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[70] xl:hidden"
              >
                <button aria-label="Close properties" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsRightOpen(false)} type="button" />
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 380, damping: 38 }}
                  className="absolute bottom-0 left-0 flex h-[72vh] max-h-[740px] w-full flex-col overflow-hidden rounded-t-3xl border-t border-[#f4d8cc] bg-[#fff7f4] shadow-2xl"
                >
                  <div className="mx-auto mt-3 h-1 w-10 flex-shrink-0 rounded-full bg-gray-300" />
                  <PropertyEditor
                    className="relative flex h-full w-full flex-col overflow-hidden bg-[#fff7f4]"
                    component={selectedComponent}
                    onClose={() => setIsRightOpen(false)}
                    onUpdate={updateComponent}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {isPreviewOpen && (
        <PreviewModal srcDoc={exportHtml()} onClose={() => setIsPreviewOpen(false)} />
      )}

      <DragOverlay dropAnimation={null}>
        {(activePaletteType ?? activeCanvasType) ? (
          <div
            className={`flex min-w-[140px] rotate-[1.5deg] items-center gap-2.5 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold capitalize shadow-[0_12px_32px_rgba(15,35,75,0.22)] ring-1 ${
              activeCanvasType
                ? "border-blue-300 text-blue-700 ring-blue-200/50"
                : "border-[#dbe3ef] text-[#0B1D40] ring-black/5"
            }`}
          >
            <GripVertical className="h-4 w-4 shrink-0 text-gray-400" />
            <span>{activePaletteType ?? activeCanvasType}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

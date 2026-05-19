"use client";

import { useEffect, useRef, useState } from "react";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { ChevronRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Canvas from "./Canvas";
import ComponentPalette from "./ComponentPalette";
import PropertyEditor from "./PropertyEditor";
import { useBuilder } from "@/hooks/useBuilder";
import type { ComponentType } from "@/types/builder";

export default function BuilderLayout() {
  const { components, selectedComponentId, addComponent, updateComponent, duplicateComponent, deleteComponent, selectComponent, reorderComponents, loadStarterWebsite, loadWebsiteFromRequirements, clearCanvas } = useBuilder();
  const [activePaletteType, setActivePaletteType] = useState<ComponentType | null>(null);
  const [isLeftOpen, setIsLeftOpen] = useState(false);
  const searchParams = useSearchParams();
  const hasLoadedRequirements = useRef(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 3 } }));
  const selectedComponent = components.find((component) => component.id === selectedComponentId) || null;

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
    const type = event.active.data.current?.type as ComponentType | undefined;
    setActivePaletteType(type || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const type = active.data.current?.type as ComponentType | undefined;
    const fromPalette = Boolean(active.data.current?.fromPalette);

    setActivePaletteType(null);

    if (!over) {
      return;
    }

    if (fromPalette && type) {
      const droppedOnCanvas = over.id === "builder-canvas" || Boolean(over.data.current?.fromCanvas);

      if (droppedOnCanvas) {
        addComponent(type);
      }

      setIsLeftOpen(false);
      return;
    }

    if (active.id !== over.id && over.id !== "builder-canvas") {
      reorderComponents(String(active.id), String(over.id));
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
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

          <div className={`fixed inset-0 z-[60] transition-opacity duration-300 lg:hidden ${isLeftOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}>
            <button aria-label="Close left sidebar" className="absolute inset-0 bg-black/60" onClick={() => setIsLeftOpen(false)} type="button" />
            <div className={`absolute bottom-0 left-0 flex h-[65vh] max-h-[800px] w-full transform flex-col overflow-hidden rounded-t-3xl bg-[#0A193A] shadow-2xl transition-transform duration-300 ${isLeftOpen ? "translate-y-0" : "translate-y-full"}`}>
              <ComponentPalette className="w-full rounded-t-3xl rounded-b-none border-0" onAdd={(type) => { addComponent(type); setIsLeftOpen(false); }} onLoadStarter={() => { loadStarterWebsite(); setIsLeftOpen(false); }} />
            </div>
          </div>

          <Canvas
            components={components}
            onClear={clearCanvas}
            onDelete={deleteComponent}
            onDuplicate={duplicateComponent}
            onLoadStarter={loadStarterWebsite}
            onSelect={selectComponent}
            selectedComponentId={selectedComponentId}
          />

          <PropertyEditor component={selectedComponent} onUpdate={updateComponent} />
        </div>
      </div>

      <DragOverlay>
        {activePaletteType ? (
          <div className="rounded border border-[#dbe3ef] bg-white px-4 py-3 text-sm font-bold capitalize text-[#0B1D40] shadow-lg">
            {activePaletteType}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

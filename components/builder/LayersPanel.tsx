"use client";

import { memo, useState } from "react";
import {
  ChevronRight,
  Contact,
  Heading1,
  Home,
  LayoutGrid,
  Image,
  Images,
  Layers,
  LayoutTemplate,
  Menu,
  Minus,
  MousePointerSquareDashed,
  PanelsTopLeft,
  Play,
  Star,
  TextCursorInput,
  Type,
} from "lucide-react";
import { useBuilderStore } from "@/store/builderStore";
import type { BuilderComponent, ComponentType } from "@/types/builder";

const TYPE_ICONS: Record<ComponentType, React.ComponentType<{ className?: string }>> = {
  navigation: Menu,
  hero: Home,
  features: PanelsTopLeft,
  gallery: Images,
  contact: Contact,
  heading: Heading1,
  text: Type,
  button: MousePointerSquareDashed,
  icon: Star,
  "feature-item": Layers,
  columns: LayoutGrid,
  image: Image,
  input: TextCursorInput,
  divider: Minus,
  container: LayoutTemplate,
  video: Play,
};

const LayerRow = memo(function LayerRow({
  component,
  depth,
  onSelect,
}: {
  component: BuilderComponent;
  depth: number;
  onSelect: (id: string) => void;
}) {
  const isSelected = useBuilderStore((s) => s.selectedComponentId === component.id);
  const [expanded, setExpanded] = useState(true);
  const hasChildren = component.children.length > 0;
  const Icon = TYPE_ICONS[component.type];

  return (
    <>
      <div
        className={`flex w-full cursor-pointer select-none items-center gap-1.5 rounded-md py-[5px] pr-2 text-xs transition-colors duration-100 ${
          isSelected
            ? "bg-blue-500/[0.08] font-semibold text-blue-600"
            : "font-medium text-[#566583] hover:bg-black/[0.04] hover:text-[#0B1D40]"
        }`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        role="button"
        tabIndex={0}
        onClick={() => onSelect(component.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onSelect(component.id);
        }}
      >
        <button
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded text-[#94a3b8] transition-transform duration-150 hover:text-[#0B1D40] ${hasChildren ? "" : "invisible"}`}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          tabIndex={-1}
          type="button"
        >
          <ChevronRight
            className={`h-3 w-3 transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}
          />
        </button>
        <Icon className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-blue-500" : "text-[#94a3b8]"}`} />
        <span className="truncate capitalize">{component.type}</span>
        {isSelected && (
          <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
        )}
      </div>
      {hasChildren &&
        expanded &&
        component.children.map((child) => (
          <LayerRow
            key={child.id}
            component={child}
            depth={depth + 1}
            onSelect={onSelect}
          />
        ))}
    </>
  );
});

export default function LayersPanel() {
  const components = useBuilderStore((s) => s.components);
  const selectComponent = useBuilderStore((s) => s.selectComponent);

  if (components.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <Layers className="h-8 w-8 text-[#dbe3ef]" />
        <p className="text-xs font-semibold text-[#566583]">No layers yet</p>
        <p className="text-[11px] leading-5 text-[#94a3b8]">
          Add blocks from the palette to see your component tree here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-px px-2 py-2">
      {components.map((component) => (
        <LayerRow
          key={component.id}
          component={component}
          depth={0}
          onSelect={selectComponent}
        />
      ))}
    </div>
  );
}

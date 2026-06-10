"use client";

import type { BuilderComponent, MapProps } from "@/types/builder";
import { getBaseStyles } from "./componentStyles";

export const mapDefaults: MapProps = {
  address: "New York, NY, USA",
  zoom: 12,
  height: "300px",
};

export default function MapComponent({
  component,
}: {
  component: BuilderComponent;
  children?: React.ReactNode;
  isEditing?: boolean;
  onUpdate?: (content: string | null) => void;
  onPatch?: (patch: Partial<BuilderComponent>) => void;
}) {
  const props = (component.props as unknown as MapProps) || mapDefaults;
  const base = getBaseStyles(component);
  const encodedAddress = encodeURIComponent(props.address);
  const embedUrl = `https://www.google.com/maps?q=${encodedAddress}&z=${props.zoom}&output=embed`;

  return (
    <div style={base} className="w-full overflow-hidden rounded-xl">
      <div
        className="relative w-full overflow-hidden rounded-xl border-2 border-[#e6edf5] shadow-[0_4px_16px_rgba(15,35,75,0.08)]"
        style={{ height: props.height }}
      >
        <iframe
          title={`Map: ${props.address}`}
          src={embedUrl}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
        {/* Overlay to prevent map interaction in builder */}
        <div className="pointer-events-auto absolute inset-0 z-10 cursor-pointer bg-transparent" />
      </div>
      <p className="mt-2 text-center text-xs font-medium text-[#94a3b8]">📍 {props.address}</p>
    </div>
  );
}


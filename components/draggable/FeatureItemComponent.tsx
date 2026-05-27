"use client";

import type { BuilderComponent } from "@/types/builder";
import { readFeatureItem } from "@/components/blocks/feature-item/spec";
import { getIcon } from "./IconComponent";
import { toReactStyle } from "./componentStyles";

export default function FeatureItemComponent({
  component,
}: {
  component: BuilderComponent;
  isEditing?: boolean;
  onUpdate?: (content: string | null) => void;
}) {
  // Typed read — see `@/components/blocks/feature-item/spec` for shape + legacy fallback.
  const { icon: iconName, layout, title, description: desc, cta: btnText } = readFeatureItem(component);

  const Icon = getIcon(iconName);
  const iconColor = component.styles.color || "#0B1D40";
  const cardStyle = toReactStyle(component.styles);

  if (layout === "card") {
    return (
      <div
        className="flex w-full flex-col items-center rounded-xl border border-[#e6edf5] bg-white p-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        style={cardStyle}
      >
        {Icon && (
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef4fb]">
            <Icon size={24} color={iconColor} />
          </div>
        )}
        <h3 className="mb-2 text-base font-bold text-[#0B1D40]">{title}</h3>
        <p className="text-sm leading-6 text-[#566583]">{desc}</p>
        {btnText && (
          <span className="mt-3 inline-block text-sm font-bold text-blue-600">
            {btnText} →
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex w-full items-start gap-4 rounded-xl border border-[#e6edf5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      style={cardStyle}
    >
      {Icon && (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef4fb]">
          <Icon size={22} color={iconColor} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="mb-1 text-base font-bold text-[#0B1D40]">{title}</h3>
        <p className="text-sm leading-6 text-[#566583]">{desc}</p>
        {btnText && (
          <span className="mt-2 inline-block text-sm font-bold text-blue-600">
            {btnText} →
          </span>
        )}
      </div>
    </div>
  );
}

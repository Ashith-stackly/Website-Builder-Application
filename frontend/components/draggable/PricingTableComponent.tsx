"use client";

import { Check } from "lucide-react";
import InlineText from "@/components/builder/InlineText";
import type { BuilderComponent, PricingTableProps, PricingTier } from "@/types/builder";
import { getItemStyle, getTargetTextStyles, getTextStyles, toReactStyle } from "./componentStyles";
import { useBuilderStore } from "@/store/builderStore";

export const pricingTableDefaults: PricingTableProps = {
  heading: "Choose Your Plan",
  tiers: [
    {
      name: "Starter",
      price: "$9",
      period: "/month",
      features: ["1 Website", "5GB Storage", "Email Support", "Basic Analytics"],
      cta: "Get Started",
      highlighted: false,
    },
    {
      name: "Professional",
      price: "$29",
      period: "/month",
      features: ["5 Websites", "50GB Storage", "Priority Support", "Advanced Analytics", "Custom Domain", "SSL Certificate"],
      cta: "Start Free Trial",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "$79",
      period: "/month",
      features: ["Unlimited Websites", "500GB Storage", "24/7 Phone Support", "Full Analytics Suite", "Custom Domain", "SSL Certificate", "Team Collaboration"],
      cta: "Contact Sales",
      highlighted: false,
    },
  ],
};

/* ── Safe reader (mirrors the pattern in migratedSpecs.tsx) ──────────── */
function readPricing(component: BuilderComponent): PricingTableProps {
  const p = component.props as Record<string, unknown> | undefined;
  if (!p || typeof p !== "object") return pricingTableDefaults;
  return {
    heading: typeof p.heading === "string" ? p.heading : pricingTableDefaults.heading,
    tiers: Array.isArray(p.tiers) ? (p.tiers as PricingTier[]) : pricingTableDefaults.tiers,
  };
}

export default function PricingTableComponent({
  component,
  onPatch,
}: {
  component: BuilderComponent;
  children?: React.ReactNode;
  isEditing?: boolean;
  onUpdate?: (content: string | null) => void;
  onPatch?: (patch: Partial<BuilderComponent>) => void;
}) {
  const data = readPricing(component);
  const textStyle = getTextStyles(component.styles);
  const viewport = useBuilderStore((s) => s.viewport);
  const selectSubItem = useBuilderStore((s) => s.selectSubItem);
  const selectedSubItem = useBuilderStore((s) => s.selectedSubItem);

  const tiers = data.tiers;
  const heading = data.heading ?? "";

  const colCount = Math.min(tiers.length, 3);
  const currentCols = viewport === "mobile"
    ? 1
    : (viewport === "tablet" ? 2 : colCount);

  /** Check if a specific pricing tier is currently sub-selected */
  const isTierSelected = (index: number) =>
    selectedSubItem?.componentId === component.id && selectedSubItem.itemIndex === index;

  /** Update heading inline */
  function saveHeading(value: string) {
    onPatch?.({ props: { heading: value } });
  }

  /** Update one field in a specific tier immutably */
  function saveTierField(index: number, field: keyof PricingTier, value: string | boolean | string[]) {
    const next = tiers.map((tier, i) =>
      i === index ? { ...tier, [field]: value } : tier
    );
    onPatch?.({ props: { tiers: next } });
  }

  return (
    <div className="w-full py-6" style={toReactStyle(component.styles)}>
      {heading && (
        <InlineText
          componentId={component.id}
          textKey="pricing.heading"
          textLabel="Pricing heading"
          as="h2"
          value={heading}
          onSave={saveHeading}
          className="mb-8 text-center text-2xl font-extrabold sm:text-3xl"
          style={getTargetTextStyles(component, "pricing.heading", textStyle)}
        />
      )}

      <div
        className="mx-auto grid w-full gap-5"
        style={{ gridTemplateColumns: `repeat(${currentCols}, minmax(0, 1fr))`, maxWidth: 960 }}
      >
        {tiers.map((tier, i) => (
          <div
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              selectSubItem({
                componentId: component.id,
                itemIndex: i,
                element: "tier",
              });
            }}
            className={`relative flex flex-col cursor-pointer transition-all duration-200 ${
              isTierSelected(i) ? "ring-2 ring-violet-500 ring-offset-2" : ""
            } ${tier.highlighted ? "scale-[1.03] z-10" : ""}`}
            style={getItemStyle(tier.style, {
              backgroundColor: tier.highlighted ? "#f8faff" : "#ffffff",
              borderRadius: "16px",
              border: tier.highlighted ? "2px solid #0B1D40" : "2px solid #e6edf5",
              boxShadow: tier.highlighted
                ? "0 12px 40px rgba(11,29,64,0.18)"
                : "0 4px 16px rgba(15,35,75,0.06)",
              padding: "24px",
            })}
          >
            {tier.highlighted && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#0B1D40] to-[#3b82f6] px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-md">
                Most Popular
              </div>
            )}
            <InlineText
              componentId={component.id}
              textKey={`pricing.tier.${i}.name`}
              textLabel={`Tier ${i + 1} name`}
              as="h3"
              value={tier.name}
              onSave={(v) => saveTierField(i, "name", v)}
              className="text-[15px] font-bold uppercase tracking-wider text-[#566583]"
              style={getTargetTextStyles(component, `pricing.tier.${i}.name`, { color: "#566583" })}
            />
            <div className="mt-3 flex items-baseline gap-1">
              <InlineText
                componentId={component.id}
                textKey={`pricing.tier.${i}.price`}
                textLabel={`Tier ${i + 1} price`}
                as="span"
                value={tier.price}
                onSave={(v) => saveTierField(i, "price", v)}
                className="text-4xl font-black text-[#0B1D40]"
                style={getTargetTextStyles(component, `pricing.tier.${i}.price`, { color: "#0B1D40" })}
              />
              <InlineText
                componentId={component.id}
                textKey={`pricing.tier.${i}.period`}
                textLabel={`Tier ${i + 1} period`}
                as="span"
                value={tier.period}
                onSave={(v) => saveTierField(i, "period", v)}
                className="text-sm font-semibold text-[#94a3b8]"
                style={getTargetTextStyles(component, `pricing.tier.${i}.period`, { color: "#94a3b8" })}
              />
            </div>
            <ul className="mt-6 flex flex-1 flex-col gap-2.5">
              {tier.features.map((f, j) => (
                <li key={j} className="flex items-start gap-2 text-sm font-medium text-[#566583]">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                  {f}
                </li>
              ))}
            </ul>
            <InlineText
              componentId={component.id}
              textKey={`pricing.tier.${i}.cta`}
              textLabel={`Tier ${i + 1} button`}
              as="button"
              value={tier.cta}
              onSave={(v) => saveTierField(i, "cta", v)}
              className={`mt-6 w-full rounded-xl py-3 text-sm font-bold transition-all duration-200 hover:shadow-md active:scale-[0.98] ${
                tier.highlighted
                  ? "bg-[#0B1D40] text-white hover:bg-[#152B52]"
                  : "border-2 border-[#0B1D40] bg-transparent text-[#0B1D40] hover:bg-[#0B1D40] hover:text-white"
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

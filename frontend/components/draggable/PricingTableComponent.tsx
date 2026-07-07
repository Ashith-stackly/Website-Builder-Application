"use client";

import { Check } from "lucide-react";
import type { BuilderComponent, PricingTableProps } from "@/types/builder";
import { getBaseStyles } from "./componentStyles";

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

export default function PricingTableComponent({
  component,
}: {
  component: BuilderComponent;
  children?: React.ReactNode;
  isEditing?: boolean;
  onUpdate?: (content: string | null) => void;
  onPatch?: (patch: Partial<BuilderComponent>) => void;
}) {
  const props = (component.props as unknown as PricingTableProps) || pricingTableDefaults;
  const base = getBaseStyles(component);

  return (
    <div style={base} className="w-full py-6">
      {props.heading && (
        <h2
          className="mb-8 text-center text-2xl font-extrabold sm:text-3xl"
          style={{ color: base.color || "#0B1D40" }}
        >
          {props.heading}
        </h2>
      )}

      <div
        className="mx-auto grid w-full gap-5"
        style={{ gridTemplateColumns: `repeat(${Math.min(props.tiers.length, 3)}, minmax(0, 1fr))`, maxWidth: 960 }}
      >
        {props.tiers.map((tier, i) => (
          <div
            key={i}
            className={`relative flex flex-col rounded-2xl border-2 p-6 transition-all duration-200 ${
              tier.highlighted
                ? "border-[#0B1D40] shadow-[0_12px_40px_rgba(11,29,64,0.18)] scale-[1.03] z-10"
                : "border-[#e6edf5] shadow-[0_4px_16px_rgba(15,35,75,0.06)]"
            }`}
            style={{ backgroundColor: tier.highlighted ? "#f8faff" : "#fff" }}
          >
            {tier.highlighted && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#0B1D40] to-[#3b82f6] px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-md">
                Most Popular
              </div>
            )}
            <h3 className="text-[15px] font-bold uppercase tracking-wider text-[#566583]">{tier.name}</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-black text-[#0B1D40]">{tier.price}</span>
              <span className="text-sm font-semibold text-[#94a3b8]">{tier.period}</span>
            </div>
            <ul className="mt-6 flex flex-1 flex-col gap-2.5">
              {tier.features.map((f, j) => (
                <li key={j} className="flex items-start gap-2 text-sm font-medium text-[#566583]">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={`mt-6 w-full rounded-xl py-3 text-sm font-bold transition-all duration-200 hover:shadow-md active:scale-[0.98] ${
                tier.highlighted
                  ? "bg-[#0B1D40] text-white hover:bg-[#152B52]"
                  : "border-2 border-[#0B1D40] bg-transparent text-[#0B1D40] hover:bg-[#0B1D40] hover:text-white"
              }`}
            >
              {tier.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}


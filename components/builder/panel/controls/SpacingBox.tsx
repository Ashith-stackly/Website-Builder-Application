"use client";

import { useState } from "react";
import { Link2, Unlink2 } from "lucide-react";

type Side = "top" | "right" | "bottom" | "left";

/** Parses a shorthand like "12px 24px" → { top:12, right:24, bottom:12, left:24 } */
function parseShorthand(raw: string): Record<Side, string> {
  if (!raw) return { top: "", right: "", bottom: "", left: "" };
  const parts = raw.trim().split(/\s+/);
  const px = (v: string) => v.replace(/[^0-9.-]/g, "") || "";
  if (parts.length === 1) {
    const v = px(parts[0]);
    return { top: v, right: v, bottom: v, left: v };
  }
  if (parts.length === 2) {
    const [tb, lr] = parts.map(px);
    return { top: tb, right: lr, bottom: tb, left: lr };
  }
  if (parts.length === 3) {
    const [t, lr, b] = parts.map(px);
    return { top: t, right: lr, bottom: b, left: lr };
  }
  const [t, r, b, l] = parts.map(px);
  return { top: t, right: r, bottom: b, left: l };
}

function buildShorthand(v: Record<Side, string>, unit: string): string {
  const s = (x: string) => (x ? `${x}${unit}` : "0");
  if (v.top === v.right && v.right === v.bottom && v.bottom === v.left) return s(v.top);
  if (v.top === v.bottom && v.right === v.left) return `${s(v.top)} ${s(v.right)}`;
  return `${s(v.top)} ${s(v.right)} ${s(v.bottom)} ${s(v.left)}`;
}

export function SpacingBox({
  label,
  value,
  onChange,
  unit = "px",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
}) {
  const [linked, setLinked] = useState(true);
  const sides = parseShorthand(value);

  const update = (side: Side, raw: string) => {
    if (linked) {
      onChange(raw ? `${raw}${unit}` : "0");
    } else {
      const next = { ...sides, [side]: raw };
      onChange(buildShorthand(next, unit));
    }
  };

  const SideInput = ({ side, cls }: { side: Side; cls: string }) => (
    <input
      type="number"
      value={linked ? (sides.top || "") : (sides[side] || "")}
      placeholder="0"
      onChange={(e) => update(side, e.target.value)}
      className={`w-14 rounded border border-[#dbe3ef] bg-transparent py-1.5 text-center text-[12px] font-bold text-[#0B1D40] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${cls}`}
    />
  );

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] font-bold uppercase tracking-wider text-[#566583]">{label}</span>
        <button
          type="button"
          title={linked ? "Unlink sides" : "Link sides"}
          onClick={() => setLinked((l) => !l)}
          className="rounded p-1 text-[#566583] transition hover:bg-gray-100 hover:text-blue-600"
        >
          {linked ? <Link2 className="h-3.5 w-3.5" /> : <Unlink2 className="h-3.5 w-3.5" />}
        </button>
      </div>
      <div className="flex flex-col items-center gap-1">
        <SideInput side="top" cls="" />
        <div className="flex items-center gap-1">
          <SideInput side="left" cls="" />
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f7f9fc] text-[10px] font-bold text-[#566583] ring-1 ring-[#dbe3ef]">
            {label.slice(0, 1).toUpperCase()}
          </div>
          <SideInput side="right" cls="" />
        </div>
        <SideInput side="bottom" cls="" />
      </div>
    </div>
  );
}

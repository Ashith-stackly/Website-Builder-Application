"use client";

import { useState, useEffect } from "react";

const UNITS = ["px", "%", "rem", "em", "vh", "vw", "auto"] as const;
type Unit = (typeof UNITS)[number];

/** Splits a CSS value like "16px" → { num: 16, unit: "px" } */
function parse(raw: string): { num: string; unit: Unit } {
  if (!raw || raw === "auto") return { num: "", unit: "auto" };
  const match = raw.match(/^(-?[\d.]+)\s*(px|%|rem|em|vh|vw)?$/);
  if (!match) return { num: raw, unit: "px" };
  return { num: match[1], unit: (match[2] as Unit) || "px" };
}

export function UnitInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const parsed = parse(value);
  const [num, setNum] = useState(parsed.num);
  const [unit, setUnit] = useState<Unit>(parsed.unit);

  useEffect(() => {
    const p = parse(value);
    setNum(p.num);
    setUnit(p.unit);
  }, [value]);

  const emit = (n: string, u: Unit) => {
    if (u === "auto") { onChange("auto"); return; }
    if (n === "") { onChange(""); return; }
    onChange(`${n}${u}`);
  };

  return (
    <div>
      <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#566583]">{label}</span>
      <div className="flex overflow-hidden rounded-lg border border-[#dbe3ef] focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
        <input
          type="number"
          value={num}
          placeholder={placeholder ?? "0"}
          onChange={(e) => { setNum(e.target.value); emit(e.target.value, unit); }}
          disabled={unit === "auto"}
          className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-[13px] font-bold text-[#0B1D40] outline-none disabled:opacity-40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <select
          value={unit}
          onChange={(e) => { const u = e.target.value as Unit; setUnit(u); emit(num, u); }}
          className="border-l border-[#dbe3ef] bg-[#f7f9fc] px-1.5 text-[11px] font-bold text-[#566583] outline-none"
        >
          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
    </div>
  );
}

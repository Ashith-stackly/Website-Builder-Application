"use client";
 
import { useState, useEffect } from "react";
 
const DEFAULT_UNITS = ["px", "%", "rem", "em", "vh", "vw"] as const;
type Unit = string;
 
/** Splits a CSS value like "16px" → { num: "16", unit: "px" } */
function parse(
  raw?: string,
  defaultUnit: Unit = "px",
  allowAuto: boolean = false
): { num: string; unit: Unit } {
  if (!raw || raw.trim() === "") {
    return { num: "", unit: defaultUnit };
  }
  const trimmed = raw.trim();
  if (trimmed === "auto") {
    return { num: "", unit: allowAuto ? "auto" : defaultUnit };
  }
  const match = trimmed.match(/^(-?[\d.]+)\s*([a-zA-Z%]+)?$/);
  if (!match) return { num: trimmed, unit: defaultUnit };
  return { num: match[1], unit: match[2] || defaultUnit };
}
 
export function UnitInput({
  label,
  value,
  onChange,
  placeholder,
  units = DEFAULT_UNITS,
  defaultUnit = "px",
  allowAuto = false,
  className = "",
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  units?: readonly string[];
  defaultUnit?: string;
  allowAuto?: boolean;
  className?: string;
}) {
  const parsed = parse(value, defaultUnit, allowAuto);
  const [num, setNum] = useState(parsed.num);
  const [unit, setUnit] = useState<Unit>(parsed.unit);
 
  useEffect(() => {
    const p = parse(value, defaultUnit, allowAuto);
    setNum(p.num);
    setUnit(p.unit);
  }, [value, defaultUnit, allowAuto]);
 
  const emit = (n: string, u: Unit) => {
    if (u === "auto") {
      onChange("auto");
      return;
    }
    const trimmed = n.trim();
    if (trimmed === "") {
      onChange("");
      return;
    }
    onChange(`${trimmed}${u}`);
  };
 
  const unitList = allowAuto && !units.includes("auto") ? [...units, "auto"] : units;
 
  return (
    <div className={`min-w-0 ${className}`}>
      {label && (
        <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-[#566583] truncate">
          {label}
        </span>
      )}
      <div className="flex h-[38px] w-full min-w-0 overflow-hidden rounded-lg border border-[#dbe3ef] bg-[#f7f9fc] transition-colors focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
        <input
          type="number"
          value={num}
          placeholder={placeholder ?? "0"}
          onChange={(e) => {
            const val = e.target.value;
            setNum(val);
            emit(val, unit === "auto" ? defaultUnit : unit);
          }}
          disabled={unit === "auto"}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[12px] font-bold text-[#0B1D40] outline-none placeholder:text-[#94a3b8] disabled:opacity-40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        {unitList.length > 1 ? (
          <select
            value={unit}
            onChange={(e) => {
              const u = e.target.value;
              setUnit(u);
              emit(num, u);
            }}
            className="shrink-0 border-l border-[#dbe3ef] bg-[#f7f9fc] hover:bg-[#edf2f7] px-2 text-[11px] font-bold text-[#566583] outline-none cursor-pointer transition-colors focus:bg-white"
          >
            {unitList.map((u) => (
              <option key={u} value={u} className="bg-white text-[#0B1D40] py-0.5">
                {u}
              </option>
            ))}
          </select>
        ) : (
          <span className="flex shrink-0 items-center border-l border-[#dbe3ef] bg-[#f7f9fc] px-2.5 text-[11px] font-bold text-[#566583]">
            {unitList[0] || defaultUnit}
          </span>
        )}
      </div>
    </div>
  );
}
 
 
 
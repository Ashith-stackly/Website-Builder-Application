"use client";

import { useRef } from "react";

const PRESET_COLORS = [
  "#0B1D40", "#152B52", "#1e3a5f", "#ffffff", "#f8fafc",
  "#f1f5f9", "#e2e8f0", "#64748b", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899",
  "#000000",
];

export function ColorSwatch({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const display = value || "#000000";

  return (
    <div>
      <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-[#566583]">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          title="Open colour picker"
          className="h-8 w-8 flex-shrink-0 cursor-pointer rounded-lg border-2 border-white shadow-md ring-1 ring-[#dbe3ef] transition hover:scale-110 hover:ring-blue-300"
          style={{ backgroundColor: display }}
          onClick={() => inputRef.current?.click()}
        />
        <input
          ref={inputRef}
          type="color"
          value={display}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
          tabIndex={-1}
        />
        <input
          type="text"
          value={display}
          maxLength={9}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,8}$/.test(v)) onChange(v);
          }}
          className="w-full rounded-lg border border-[#dbe3ef] bg-transparent px-2.5 py-1.5 font-mono text-[13px] text-[#0B1D40] outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          spellCheck={false}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            title={c}
            onClick={() => onChange(c)}
            className={`h-5 w-5 rounded-md border-2 transition hover:scale-110 ${display === c ? "border-blue-500 scale-110" : "border-white ring-1 ring-[#dbe3ef]"}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: T;
  options: Array<{ value: T; label?: string; icon?: ReactNode; title?: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      {label && (
        <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-[#566583]">{label}</span>
      )}
      <div className="flex overflow-hidden rounded-lg border border-[#dbe3ef]">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            title={opt.title ?? opt.label ?? opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex flex-1 items-center justify-center gap-1 py-2 text-[12px] font-bold transition ${
              value === opt.value
                ? "bg-[#0B1D40] text-white"
                : "bg-transparent text-[#566583] hover:bg-[#f7f9fc] hover:text-[#0B1D40]"
            }`}
          >
            {opt.icon}
            {opt.label && <span>{opt.label}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

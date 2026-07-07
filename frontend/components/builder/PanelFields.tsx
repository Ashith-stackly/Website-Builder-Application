"use client";

/**
 * Shared primitive field components used by all block Panel components.
 * Centralising them here keeps every Panel's JSX focused on layout/logic
 * rather than repeating the same input markup.
 */

export const contentInputClass =
  "w-full rounded-xl border border-[#0B1D40] bg-transparent px-4 py-2.5 text-[14px] font-semibold text-[#0B1D40] outline-none transition focus:ring-2 focus:ring-blue-100";

export function ContentField({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-bold text-[#0B1D40]">{label}</span>
      <input
        className={contentInputClass}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
    </label>
  );
}

export function TextareaField({
  label,
  minHeight = "min-h-[72px]",
  onChange,
  placeholder,
  value,
}: {
  label: string;
  minHeight?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-bold text-[#0B1D40]">{label}</span>
      <textarea
        className={`${contentInputClass} ${minHeight} resize-none`}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

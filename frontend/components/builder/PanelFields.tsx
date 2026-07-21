"use client";

import { useEffect } from "react";
import { Sparkles } from "lucide-react";
import { useAITextAssist } from "@/components/builder/AIAssistDialog";

/**
 * Shared primitive field components used by all block Panel components.
 * Centralising them here keeps every Panel's JSX focused on layout/logic
 * rather than repeating the same input markup.
 */

export const contentInputClass =
  "w-full rounded-xl border border-[#0B1D40] bg-transparent px-4 py-2.5 text-[14px] font-semibold text-[#0B1D40] outline-none transition focus:ring-2 focus:ring-blue-100";

function GenerateTextButton({
  field,
  label,
  onChange,
  value,
}: {
  field?: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const assistant = useAITextAssist();
  useEffect(() => {
    if (!assistant) return;
    return assistant.registerTextField({ field, label, value, onReplace: onChange, onInsert: onChange });
  }, [assistant, field, label, onChange, value]);

  if (!assistant) return null;

  return (
    <button
      type="button"
      onClick={() =>
        assistant.openTextAssistant({
          field,
          label,
          value,
          onReplace: onChange,
          onInsert: onChange,
        })
      }
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-extrabold text-violet-700 transition hover:bg-violet-100 hover:text-violet-900 focus:outline-none focus:ring-2 focus:ring-violet-300"
      title={`Generate ${label.toLowerCase()} with AI`}
      aria-label={`Generate ${label.toLowerCase()} with AI`}
    >
      <Sparkles className="h-3 w-3" />
      Generate text
    </button>
  );
}

export function ContentField({
  field,
  label,
  onChange,
  placeholder,
  value,
}: {
  field?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <div className="block">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[13px] font-bold text-[#0B1D40]">{label}</span>
        <GenerateTextButton field={field} label={label} value={value} onChange={onChange} />
      </div>
      <label className="block">
        <span className="sr-only">{label}</span>
        <input
          className={contentInputClass}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type="text"
          value={value}
        />
      </label>
    </div>
  );
}

export function TextareaField({
  field,
  label,
  minHeight = "min-h-[72px]",
  onChange,
  placeholder,
  value,
}: {
  field?: string;
  label: string;
  minHeight?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <div className="block">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[13px] font-bold text-[#0B1D40]">{label}</span>
        <GenerateTextButton field={field} label={label} value={value} onChange={onChange} />
      </div>
      <label className="block">
        <span className="sr-only">{label}</span>
        <textarea
          className={`${contentInputClass} ${minHeight} resize-none`}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          value={value}
        />
      </label>
    </div>
  );
}

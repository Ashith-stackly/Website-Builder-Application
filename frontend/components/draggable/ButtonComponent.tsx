"use client";

import { useLayoutEffect, useRef } from "react";
import type { BuilderComponent } from "@/types/builder";
import { toReactStyle } from "./componentStyles";

export default function ButtonComponent({
  component,
  isEditing = false,
  onUpdate,
}: {
  component: BuilderComponent;
  isEditing?: boolean;
  onUpdate?: (content: string | null) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const originalRef = useRef(component.content);
  const committedRef = useRef(false);

  useLayoutEffect(() => {
    if (!isEditing || !ref.current) return;
    originalRef.current = component.content;
    committedRef.current = false;
    ref.current.textContent = component.content;
    ref.current.focus();
    const sel = window.getSelection();
    if (sel) {
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [component.content, isEditing]);

  return (
    <button
      ref={ref}
      contentEditable={isEditing ? "true" : undefined}
      suppressContentEditableWarning
      className={`inline-flex items-center justify-center font-bold shadow-sm transition-[outline,box-shadow] duration-150 ${
        isEditing
          ? "cursor-text ring-2 ring-blue-400/70 ring-offset-1"
          : "hover:-translate-y-[1px] hover:shadow-md active:scale-[0.98]"
      }`}
      style={toReactStyle(component.styles)}
      type="button"
      onBlur={
        isEditing
          ? (e) => {
              if (committedRef.current) { committedRef.current = false; return; }
              onUpdate?.(e.currentTarget.textContent ?? "");
            }
          : undefined
      }
      onKeyDown={
        isEditing
          ? (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                committedRef.current = true;
                onUpdate?.(e.currentTarget.textContent ?? "");
              } else if (e.key === "Escape") {
                e.preventDefault();
                committedRef.current = true;
                if (ref.current) ref.current.textContent = originalRef.current;
                onUpdate?.(null);
              }
            }
          : undefined
      }
    >
      {isEditing ? null : component.content}
    </button>
  );
}


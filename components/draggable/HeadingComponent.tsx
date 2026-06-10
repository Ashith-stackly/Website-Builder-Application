"use client";

import { useLayoutEffect, useRef } from "react";
import type { BuilderComponent } from "@/types/builder";
import { toReactStyle } from "./componentStyles";

export default function HeadingComponent({
  component,
  isEditing = false,
  onUpdate,
}: {
  component: BuilderComponent;
  isEditing?: boolean;
  onUpdate?: (content: string | null) => void;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
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
    <h1
      ref={ref}
      contentEditable={isEditing ? "true" : undefined}
      suppressContentEditableWarning
      className={`font-bold leading-tight tracking-normal transition-[outline] duration-100 ${
        isEditing
          ? "cursor-text rounded-sm outline outline-2 outline-blue-400/70 outline-offset-2 whitespace-pre-wrap pointer-events-auto"
          : "outline-none pointer-events-none select-none"
      }`}
      style={toReactStyle(component.styles)}
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
    </h1>
  );
}


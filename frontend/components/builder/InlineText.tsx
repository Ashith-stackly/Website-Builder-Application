"use client";

import { type CSSProperties, type FocusEvent, type KeyboardEvent, type LegacyRef, type MouseEvent, type PointerEvent, useLayoutEffect, useRef, useState } from "react";
import { useBuilderStore } from "@/store/builderStore";

type InlineTextTag = "span" | "h1" | "h2" | "h3" | "p" | "figcaption" | "button";

export default function InlineText({
  as = "span",
  value,
  onSave,
  className = "",
  style,
  componentId,
  textKey,
  textLabel,
}: {
  as?: InlineTextTag;
  value: string;
  onSave: (v: string) => void;
  className?: string;
  style?: CSSProperties;
  componentId?: string;
  textKey?: string;
  textLabel?: string;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const original = useRef(value);
  const committed = useRef(false);
  const setInlineEditing = useBuilderStore((s) => s.setInlineEditing);
  const selectTextStyleTarget = useBuilderStore((s) => s.selectTextStyleTarget);

  useLayoutEffect(() => {
    if (!editing || !ref.current) return;
    ref.current.textContent = value;
    ref.current.focus();
    const sel = window.getSelection();
    if (sel) {
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [editing, value]);

  function stopCanvasEvent(event: MouseEvent<HTMLElement> | PointerEvent<HTMLElement>) {
    event.stopPropagation();
  }

  function startEdit(event: MouseEvent<HTMLElement>) {
    event.stopPropagation();
    if (editing) return;
    original.current = value;
    committed.current = false;
    setEditing(true);
    setInlineEditing(true);
  }

  function save(text: string) {
    if (committed.current) return;
    committed.current = true;
    setEditing(false);
    setInlineEditing(false);
    onSave(text || original.current);
  }

  function discard() {
    committed.current = true;
    if (ref.current) ref.current.textContent = original.current;
    setEditing(false);
    setInlineEditing(false);
  }

  function selectTextForStyle(event: MouseEvent<HTMLElement>) {
    if (!componentId || !textKey) return;
    event.preventDefault();
    event.stopPropagation();
    selectTextStyleTarget({
      componentId,
      key: textKey,
      label: textLabel || value.slice(0, 32) || "Text",
    });
  }

  const Tag = (as === "button" ? "span" : as) as "span";
  const buttonLayoutClass = as === "button" ? "inline-flex w-fit items-center justify-center whitespace-nowrap align-middle" : "";

  return (
    <Tag
      ref={ref as unknown as LegacyRef<HTMLSpanElement>}
      role={as === "button" ? "button" : undefined}
      tabIndex={as === "button" ? 0 : undefined}
      contentEditable={editing ? "true" : undefined}
      suppressContentEditableWarning
      className={`rounded-sm transition-[outline] duration-100 ${buttonLayoutClass} ${className} ${
        editing
          ? "cursor-text outline outline-2 outline-blue-400/70 outline-offset-1"
          : "cursor-text hover:outline hover:outline-1 hover:outline-blue-200/80 hover:outline-offset-1"
      }`}
      style={style}
      onDoubleClick={stopCanvasEvent}
      onClick={startEdit}
      onContextMenu={selectTextForStyle}
      onPointerDown={stopCanvasEvent}
      onBlur={
        editing
          ? (e: FocusEvent<HTMLSpanElement>) => {
              if (committed.current) { committed.current = false; return; }
              save(e.currentTarget.textContent ?? "");
            }
          : undefined
      }
      onKeyDown={
        editing
          ? (e: KeyboardEvent<HTMLSpanElement>) => {
              e.stopPropagation();
              if (e.key === "Enter") { e.preventDefault(); save(e.currentTarget.textContent ?? ""); }
              else if (e.key === "Escape") { e.preventDefault(); discard(); }
            }
          : undefined
      }
    >
      {editing ? null : value}
    </Tag>
  );
}

import type { FocusEvent, MouseEvent } from "react";

/** Select all input text when focused (e.g. after Tab). */
export function handleResetFlowInputFocus(
  e: FocusEvent<HTMLInputElement>
): void {
  const input = e.currentTarget;
  requestAnimationFrame(() => {
    if (document.activeElement === input) {
      input.select();
    }
  });
}

/** Allow click-to-place-caret when the field is already focused. */
export function handleResetFlowInputMouseDown(
  e: MouseEvent<HTMLInputElement>
): void {
  if (e.currentTarget === document.activeElement) {
    e.preventDefault();
  }
}

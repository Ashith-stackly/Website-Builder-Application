import type {
  ChangeEvent,
  ClipboardEvent,
  Dispatch,
  KeyboardEvent,
  SetStateAction,
} from "react";

export function focusOtpInput(inputIdPrefix: string, index: number): void {
  const el = document.getElementById(`${inputIdPrefix}-${index}`);
  if (el instanceof HTMLInputElement) {
    el.focus();
    el.select();
  }
}

function applyOtpDigits(
  digits: string,
  startIndex: number,
  length: number,
  inputIdPrefix: string,
  setCode: Dispatch<SetStateAction<string[]>>,
  onClearError?: () => void
): void {
  const clean = digits.replace(/\D/g, "");
  if (!clean) {
    return;
  }

  setCode((prev) => {
    const next = [...prev];
    let digitIndex = 0;
    for (let i = startIndex; i < length && digitIndex < clean.length; i++) {
      next[i] = clean[digitIndex++];
    }
    return next;
  });

  const focusIndex = Math.min(startIndex + clean.length - 1, length - 1);
  requestAnimationFrame(() => focusOtpInput(inputIdPrefix, focusIndex));
  onClearError?.();
}

export function createOtpChangeHandler(
  index: number,
  length: number,
  inputIdPrefix: string,
  setCode: Dispatch<SetStateAction<string[]>>,
  onClearError?: () => void
) {
  return (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");

    if (raw.length > 1) {
      applyOtpDigits(raw, index, length, inputIdPrefix, setCode, onClearError);
      return;
    }

    const value = raw.slice(-1);
    setCode((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (value && index < length - 1) {
      focusOtpInput(inputIdPrefix, index + 1);
    }
    onClearError?.();
  };
}

export function createOtpPasteHandler(
  index: number,
  length: number,
  inputIdPrefix: string,
  setCode: Dispatch<SetStateAction<string[]>>,
  onClearError?: () => void
) {
  return (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    applyOtpDigits(
      e.clipboardData.getData("text"),
      index,
      length,
      inputIdPrefix,
      setCode,
      onClearError
    );
  };
}

/** On empty field, Backspace moves to the previous box and clears that digit. */
export function createOtpKeyDownHandler(
  index: number,
  code: string[],
  inputIdPrefix: string,
  setCode: Dispatch<SetStateAction<string[]>>,
  onClearError?: () => void
) {
  return (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Backspace" || code[index] || index <= 0) {
      return;
    }
    e.preventDefault();
    setCode((prev) => {
      const next = [...prev];
      next[index - 1] = "";
      return next;
    });
    focusOtpInput(inputIdPrefix, index - 1);
    onClearError?.();
  };
}

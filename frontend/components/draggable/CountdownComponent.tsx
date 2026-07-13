"use client";

import { useEffect, useState, useCallback } from "react";
import type { BuilderComponent, CountdownProps } from "@/types/builder";
import { getBaseStyles } from "./componentStyles";

export const countdownDefaults: CountdownProps = {
  targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  label: "Launching Soon",
  finishedText: "We're Live! 🎉",
};

function getTimeLeft(target: string) {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, finished: true };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    finished: false,
  };
}

const DIGIT_STYLE =
  "flex flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-[#0B1D40] to-[#1a3564] text-white shadow-[0_8px_30px_rgba(11,29,64,0.35)]";

export default function CountdownComponent({
  component,
}: {
  component: BuilderComponent;
  children?: React.ReactNode;
  isEditing?: boolean;
  onUpdate?: (content: string | null) => void;
  onPatch?: (patch: Partial<BuilderComponent>) => void;
}) {
  const props = (component.props as unknown as CountdownProps) || countdownDefaults;
  const base = getBaseStyles(component);
  const getTime = useCallback(() => getTimeLeft(props.targetDate), [props.targetDate]);
  const [time, setTime] = useState(getTime);

  useEffect(() => {
    const id = setInterval(() => setTime(getTime()), 1000);
    return () => clearInterval(id);
  }, [getTime]);

  const units = [
    { label: "Days", value: time.days },
    { label: "Hours", value: time.hours },
    { label: "Minutes", value: time.minutes },
    { label: "Seconds", value: time.seconds },
  ];

  return (
    <div style={base} className="flex w-full flex-col items-center gap-5 py-8">
      {props.label && (
        <h3 className="text-lg font-bold" style={{ color: base.color || "#0B1D40" }}>
          {props.label}
        </h3>
      )}

      {time.finished ? (
        <p className="text-2xl font-bold" style={{ color: base.color || "#0B1D40" }}>
          {props.finishedText || "Time's up!"}
        </p>
      ) : (
        <div className="flex items-center gap-3 sm:gap-5">
          {units.map(({ label, value }) => (
            <div key={label} className={DIGIT_STYLE} style={{ width: 72, height: 84, padding: "8px" }}>
              <span className="text-2xl font-black tabular-nums leading-none sm:text-3xl">
                {String(value).padStart(2, "0")}
              </span>
              <span className="mt-1 text-[9px] font-bold uppercase tracking-widest text-blue-200">
                {label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


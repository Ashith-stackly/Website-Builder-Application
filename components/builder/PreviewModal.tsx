"use client";

import { useState } from "react";
import { Monitor, Smartphone, Tablet, X } from "lucide-react";

const DEVICES = [
  { id: "desktop" as const, label: "Desktop", Icon: Monitor, width: "100%" },
  { id: "tablet"  as const, label: "Tablet",  Icon: Tablet,  width: "768px" },
  { id: "mobile"  as const, label: "Mobile",  Icon: Smartphone, width: "375px" },
];

export function PreviewModal({
  srcDoc,
  onClose,
}: {
  srcDoc: string;
  onClose: () => void;
}) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const frameWidth = DEVICES.find((d) => d.id === device)?.width ?? "100%";

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const PREVIEW_INJECTIONS =
    `<base href="${origin}/" />` +
    `<script>` +
    `(function(){` +
    `document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a');if(a){e.preventDefault();e.stopPropagation();}},true);` +
    `document.addEventListener('submit',function(e){e.preventDefault();},true);` +
    `})();` +
    `<\/script>`;

  const previewDoc = srcDoc.replace('</head>', PREVIEW_INJECTIONS + '</head>');

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col bg-[#111827]" role="dialog" aria-modal="true" aria-label="Page preview">
      {/* ── Toolbar ── */}
      <div className="flex h-14 flex-shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4 md:px-6">
        <span className="text-sm font-bold text-white">Preview</span>

        {/* Device toggle */}
        <div className="flex items-center gap-1 rounded-lg bg-white/10 p-1">
          {DEVICES.map(({ id, label, Icon }) => (
            <button
              key={id}
              title={label}
              type="button"
              onClick={() => setDevice(id)}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold transition ${
                device === id
                  ? "bg-white text-[#111827] shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          title="Close preview"
          onClick={onClose}
          className="rounded-md p-2 text-gray-400 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* ── Browser chrome mockup ── */}
      <div className="flex flex-1 items-start justify-center overflow-auto bg-[#1f2937] p-4 md:p-8">
        <div
          className="flex flex-col overflow-hidden rounded-xl shadow-2xl transition-all duration-300"
          style={{ width: frameWidth, maxWidth: "100%", minHeight: "calc(100vh - 140px)" }}
        >
          {/* Fake browser bar */}
          <div className="flex h-9 flex-shrink-0 items-center gap-2 bg-[#374151] px-3">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#ef4444]" />
              <span className="h-3 w-3 rounded-full bg-[#f59e0b]" />
              <span className="h-3 w-3 rounded-full bg-[#22c55e]" />
            </div>
            <div className="mx-2 flex flex-1 items-center rounded bg-[#1f2937] px-3 py-0.5">
              <span className="text-[11px] text-gray-400">preview · stackly.studio</span>
            </div>
          </div>

          {/* Preview frame */}
          <iframe
            key={device}
            title="Page preview"
            srcDoc={previewDoc}
            sandbox="allow-scripts"
            className="flex-1 border-0 bg-white"
            style={{
              minHeight: "calc(100vh - 196px)",
              width: frameWidth,
              maxWidth: "100%",
              overflowX: "hidden",
            }}
          />
        </div>
      </div>
    </div>
  );
}

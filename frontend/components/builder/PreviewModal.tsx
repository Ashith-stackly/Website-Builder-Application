"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Monitor, Smartphone, Tablet, X } from "lucide-react";

const DEVICES = [
  { id: "desktop" as const, label: "Desktop", Icon: Monitor, width: "100%" },
  { id: "tablet" as const, label: "Tablet", Icon: Tablet, width: "768px" },
  { id: "mobile" as const, label: "Mobile", Icon: Smartphone, width: "375px" },
];

export function PreviewModal({
  srcDoc,
  onClose,
}: {
  srcDoc: string;
  onClose: () => void;
}) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const activeDevice = DEVICES.find((d) => d.id === device) ?? DEVICES[0];
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const PREVIEW_INJECTIONS =
    `<base href="${origin}/" />` +
    `<script>` +
    `(function(){` +
    `document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a');if(a){e.preventDefault();e.stopPropagation();}},true);` +
    `document.addEventListener('submit',function(e){e.preventDefault();},true);` +
    `})();` +
    `<\/script>`;

  const previewDoc = srcDoc.replace("</head>", PREVIEW_INJECTIONS + "</head>");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] flex flex-col bg-[#111827]"
      role="dialog"
      aria-modal="true"
      aria-label="Page preview"
    >
      <div className="flex h-14 flex-shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-[#0f172a] px-4 md:px-6">
        <div className="min-w-0">
          <span className="text-sm font-bold text-white">Preview</span>
          <span className="ml-3 hidden text-[11px] font-semibold uppercase tracking-widest text-slate-500 sm:inline">
            {activeDevice.label}
          </span>
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

      <div className="relative flex flex-1 items-start justify-center overflow-auto bg-[#1f2937] px-3 pb-28 pt-4 md:px-8 md:pt-8">
        <motion.div
          key={device}
          layout
          initial={{ opacity: 0, y: 14, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.24, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.35)]"
          style={{ width: activeDevice.width, maxWidth: "100%", minHeight: "calc(100vh - 140px)" }}
        >
          <div className="flex h-9 flex-shrink-0 items-center gap-2 border-b border-slate-200 bg-slate-100 px-3">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#ef4444]" />
              <span className="h-3 w-3 rounded-full bg-[#f59e0b]" />
              <span className="h-3 w-3 rounded-full bg-[#22c55e]" />
            </div>
            <div className="mx-2 flex min-w-0 flex-1 items-center rounded-md border border-slate-200 bg-white px-3 py-0.5">
              <span className="truncate text-[11px] font-semibold text-slate-400">preview · stackly.studio</span>
            </div>
          </div>

          <iframe
            key={device}
            title="Page preview"
            srcDoc={previewDoc}
            sandbox="allow-scripts"
            className="flex-1 border-0 bg-white"
            style={{
              minHeight: "calc(100vh - 196px)",
              width: activeDevice.width,
              maxWidth: "100%",
              overflowX: "hidden",
            }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed bottom-6 left-1/2 z-[10001] -translate-x-1/2"
        >
          <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white/95 px-3 py-2 shadow-[0_14px_40px_rgba(0,0,0,0.22)] backdrop-blur">
            {DEVICES.map(({ id, label, Icon }) => {
              const active = device === id;

              return (
                <button
                  key={id}
                  title={`${label} view`}
                  type="button"
                  onClick={() => setDevice(id)}
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full border text-[#0B1D40] transition ${
                    active
                      ? "border-[#0B1D40]"
                      : "border-slate-100 text-[#0B1D40]/60 hover:bg-slate-50 hover:text-[#0B1D40]"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="preview-device-active"
                      className="absolute inset-0 rounded-full bg-[#eef4fb] ring-2 ring-[#0B1D40]"
                      transition={{ type: "spring", stiffness: 520, damping: 36 }}
                    />
                  )}
                  <Icon className="relative h-4 w-4" />
                  <span className="sr-only">{label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

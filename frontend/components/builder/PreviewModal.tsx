"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, Smartphone, Tablet, X, Wifi, Battery, Signal } from "lucide-react";

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
    `window.__stackly_preview = true;` +
    `(function(){` +
    `document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a');if(a){e.preventDefault();e.stopPropagation();}},true);` +
    `document.addEventListener('submit',function(e){e.preventDefault();},true);` +
    `})();` +
    `<\/script>`;

  // The analytics tracker is an inline head script in generated HTML. Put the
  // preview marker at the start of the head so it is visible before that script
  // can run; preview traffic must never become production analytics.
  const previewDoc = srcDoc.replace("<head>", "<head>" + PREVIEW_INJECTIONS);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] flex flex-col bg-[#0f172a] font-sans"
      role="dialog"
      aria-modal="true"
      aria-label="Page preview"
    >
      {/* Top Header Bar */}
      <div className="flex h-14 flex-shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-[#0B1528] px-4 md:px-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-white tracking-wide">Live Preview</span>
          <div className="h-4 w-px bg-white/20" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#64748b]">
            {activeDevice.label} Mode
          </span>
        </div>

        <button
          type="button"
          title="Close preview"
          onClick={onClose}
          className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white active:scale-90"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Workspace for Simulator */}
      <div className="relative flex flex-1 items-center justify-center overflow-auto bg-[#1e293b]/60 px-4 py-8 md:px-12">
        <AnimatePresence mode="wait">
          {device === "mobile" && (
            <motion.div
              key="mobile-simulator"
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="relative flex flex-col overflow-hidden bg-white shadow-[0_30px_100px_rgba(0,0,0,0.6)] border-[14px] border-slate-950 rounded-[50px] w-[375px] h-[780px] max-h-[90vh]"
            >
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-b-2xl z-50 flex items-center justify-center">
                <span className="w-10 h-1 bg-slate-800 rounded-full absolute top-1" />
                <span className="w-2.5 h-2.5 bg-slate-900 rounded-full absolute right-6 top-2" />
              </div>

              {/* Status Bar */}
              <div className="flex h-10 items-center justify-between px-6 bg-[#f8fafc] text-slate-800 text-[11px] font-bold select-none pt-2 shrink-0">
                <span>9:41</span>
                <div className="flex items-center gap-1">
                  <Signal className="h-3.5 w-3.5 text-slate-800" />
                  <Wifi className="h-3.5 w-3.5 text-slate-800" />
                  <Battery className="h-4 w-4 text-slate-800" />
                </div>
              </div>

              {/* Inner IFrame */}
              <iframe
                title="Mobile preview"
                srcDoc={previewDoc}
                sandbox="allow-scripts"
                className="flex-1 w-full border-0 bg-white"
              />

              {/* Home Indicator */}
              <div className="h-6 bg-white flex items-center justify-center shrink-0">
                <div className="w-28 h-1 bg-slate-900/40 rounded-full" />
              </div>
            </motion.div>
          )}

          {device === "tablet" && (
            <motion.div
              key="tablet-simulator"
              initial={{ opacity: 0, scale: 0.92, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 25 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="relative flex flex-col overflow-hidden bg-white shadow-[0_30px_100px_rgba(0,0,0,0.6)] border-[18px] border-slate-950 rounded-[36px] w-[768px] h-[920px] max-h-[90vh]"
            >
              {/* Camera dot */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rounded-full z-50" />

              {/* Status Bar */}
              <div className="flex h-8 items-center justify-between px-6 bg-[#f8fafc] text-slate-800 text-[11px] font-bold select-none shrink-0">
                <span>9:41 AM</span>
                <div className="flex items-center gap-1.5">
                  <Wifi className="h-3.5 w-3.5 text-slate-800" />
                  <span>100%</span>
                  <Battery className="h-4 w-4 text-slate-800" />
                </div>
              </div>

              {/* Inner IFrame */}
              <iframe
                title="Tablet preview"
                srcDoc={previewDoc}
                sandbox="allow-scripts"
                className="flex-1 w-full border-0 bg-white"
              />

              {/* Home Indicator button area */}
              <div className="h-3 bg-white shrink-0" />
            </motion.div>
          )}

          {device === "desktop" && (
            <motion.div
              key="desktop-simulator"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="relative flex flex-col overflow-hidden bg-white shadow-[0_30px_100px_rgba(0,0,0,0.6)] border border-slate-850 rounded-xl w-full h-full max-h-[90vh]"
            >
              {/* Browser chrome header */}
              <div className="flex h-10 shrink-0 items-center gap-2 border-b border-slate-200 bg-slate-100 px-4">
                <div className="flex gap-1.5 shrink-0">
                  <span className="h-3 w-3 rounded-full bg-[#ef4444] transition-transform hover:scale-105" />
                  <span className="h-3 w-3 rounded-full bg-[#f59e0b] transition-transform hover:scale-105" />
                  <span className="h-3 w-3 rounded-full bg-[#22c55e] transition-transform hover:scale-105" />
                </div>
                <div className="mx-8 flex min-w-0 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-500 shadow-sm max-w-lg">
                  <span className="truncate">preview · stackly.studio</span>
                </div>
              </div>

              {/* Inner IFrame */}
              <iframe
                title="Desktop preview"
                srcDoc={previewDoc}
                sandbox="allow-scripts"
                className="flex-1 w-full border-0 bg-white"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating device switcher tab bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.2 }}
          className="fixed bottom-8 left-1/2 z-[10001] -translate-x-1/2"
        >
          <div className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/90 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
            {DEVICES.map(({ id, label, Icon }) => {
              const active = device === id;

              return (
                <button
                  key={id}
                  title={`${label} view`}
                  type="button"
                  onClick={() => setDevice(id)}
                  className={`relative flex h-10 items-center justify-center gap-2 rounded-full px-4 text-xs font-bold transition-all duration-300 ${
                    active ? "text-slate-900" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="preview-device-pill"
                      className="absolute inset-0 rounded-full bg-white shadow-md"
                      transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    />
                  )}
                  <Icon className="relative h-4 w-4 z-10" />
                  <span className="relative z-10 hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

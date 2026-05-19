"use client";

import { Download } from "lucide-react";
import { downloadHtml } from "@/lib/exportHtml";
import type { BuilderComponent } from "@/types/builder";

export default function ExportButton({ components }: { components: BuilderComponent[] }) {
  return (
    <button
      className="flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#0B1D40] px-3 py-2 text-[13px] font-bold text-white shadow-[0_2px_4px_rgba(11,29,64,0.3)] transition hover:bg-[#152B52] active:scale-95"
      onClick={() => downloadHtml(components)}
      type="button"
    >
      <span className="hidden lg:inline">Export</span>
      <Download className="h-[14px] w-[14px]" />
    </button>
  );
}

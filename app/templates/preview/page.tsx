"use client";

import React, { Suspense } from "react";
import TemplatePreviewClient from "./TemplatePreviewClient";

export default function TemplatePreviewPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#FFF1F2]">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#06224C]" />
            <p className="text-sm font-bold text-gray-500">Loading preview page...</p>
          </div>
        </main>
      }
    >
      <TemplatePreviewClient />
    </Suspense>
  );
}

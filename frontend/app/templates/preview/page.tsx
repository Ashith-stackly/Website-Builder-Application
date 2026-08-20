import { Suspense } from "react";
import TemplatePreviewClient from "./TemplatePreviewClient";

export default function TemplatePreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-sm font-semibold text-gray-500">Loading template preview...</p>
          </div>
        </div>
      }
    >
      <TemplatePreviewClient />
    </Suspense>
  );
}
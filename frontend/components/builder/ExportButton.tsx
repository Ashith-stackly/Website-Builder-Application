"use client";

import { useState } from "react";
import { AlertCircle, Download, Loader2 } from "lucide-react";
import { createStandaloneHtml } from "@/lib/deploymentPackage";
import { useBuilderStore } from "@/store/builderStore";

function downloadStandaloneHtml(html: string, filename = "stackly-page.html") {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * A single-file download remains convenient for local handoff. It is now
 * derived from the same manifest-backed deployment package used by Publish,
 * so it cannot silently leave object URLs or unresolved local files behind.
 */
export default function ExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prepareDeploymentPackage = useBuilderStore((state) => state.prepareDeploymentPackage);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setError(null);
    try {
      const deploymentPackage = await prepareDeploymentPackage();
      if (deploymentPackage.errors.length > 0) {
        throw new Error(deploymentPackage.errors[0].message);
      }
      downloadStandaloneHtml(await createStandaloneHtml(deploymentPackage));
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Unable to prepare a complete export package.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      className="flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#0B1D40] px-3 py-2 text-[13px] font-bold text-white shadow-[0_2px_4px_rgba(11,29,64,0.3)] transition hover:bg-[#152B52] active:scale-95 disabled:cursor-wait disabled:opacity-70"
      disabled={isExporting}
      onClick={() => void handleExport()}
      title={error || "Prepare a validated standalone HTML export"}
      type="button"
    >
      {isExporting ? <Loader2 className="h-[14px] w-[14px] animate-spin" /> : error ? <AlertCircle className="h-[14px] w-[14px] text-amber-300" /> : <Download className="h-[14px] w-[14px]" />}
      <span className="hidden lg:inline">{isExporting ? "Preparing" : error ? "Fix assets" : "Export"}</span>
    </button>
  );
}

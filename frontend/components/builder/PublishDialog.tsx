"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  FileClock,
  Globe2,
  History,
  Loader2,
  RefreshCw,
  Rocket,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  getActiveDeployment,
  getDeploymentUrl,
  getDeployments,
  publishSite,
  rollbackDeployment,
  type Deployment,
} from "@/lib/publishApi";
import {
  formatDeploymentBytes,
  type DeploymentPackageSummary,
  type SerializedDeploymentPackage,
} from "@/lib/deploymentPackage";
import { backdrop, modalPanel } from "@/lib/motion";

type PublishPhase = "ready" | "preparing" | "publishing" | "monitoring" | "success" | "error";

type PreparedPublish = {
  workspaceId: string;
  deploymentPackage: SerializedDeploymentPackage;
  summary: DeploymentPackageSummary;
};

type PublishDialogProps = {
  open: boolean;
  projectName: string;
  websiteName: string;
  workspaceId: string | null;
  onClose: () => void;
  /** Builds/validates a package, saves it, and syncs WorkspaceState. */
  onPreparePublish: () => Promise<PreparedPublish>;
  /** Read-only preflight used to show asset/package health before publishing. */
  onInspectPackage: () => Promise<DeploymentPackageSummary>;
};

function formatDate(value?: string): string {
  if (!value) return "Not published yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not published yet";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function statusLabel(status?: Deployment["status"]): string {
  switch (status) {
    case "deployed": return "Published";
    case "building": return "Publishing";
    case "failed": return "Failed";
    case "rolled_back": return "Rolled back";
    case "pending": return "Queued";
    default: return "Not published";
  }
}

function statusClass(status?: Deployment["status"]): string {
  switch (status) {
    case "deployed": return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "failed": return "border-red-200 bg-red-50 text-red-700";
    case "building":
    case "pending": return "border-blue-200 bg-blue-50 text-blue-700";
    default: return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function friendlyError(error: unknown): string {
  if (error instanceof TypeError || (error instanceof Error && /failed to fetch|networkerror|load failed/i.test(error.message))) {
    return "We could not reach the publishing service. Check your connection and try again.";
  }
  if (error instanceof Error && error.message) return error.message;
  return "Publishing failed before a deployment could be created. Please try again.";
}

function isBuilding(status?: Deployment["status"]): boolean {
  return status === "pending" || status === "building";
}

export default function PublishDialog({
  open,
  projectName,
  websiteName,
  workspaceId,
  onClose,
  onPreparePublish,
  onInspectPackage,
}: PublishDialogProps) {
  const [phase, setPhase] = useState<PublishPhase>("ready");
  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [resolvedWorkspaceId, setResolvedWorkspaceId] = useState<string | null>(workspaceId);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [activeDeployment, setActiveDeployment] = useState<Deployment | null>(null);
  const [createdDeploymentId, setCreatedDeploymentId] = useState<string | null>(null);
  const [createdDeploymentFallback, setCreatedDeploymentFallback] = useState<Deployment | null>(null);
  const [packageSummary, setPackageSummary] = useState<DeploymentPackageSummary | null>(null);
  const [isInspectingPackage, setIsInspectingPackage] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [rollbackCandidate, setRollbackCandidate] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  const activeWorkspaceId = resolvedWorkspaceId ?? workspaceId;
  const isBusy = phase === "preparing" || phase === "publishing" || isRollingBack;
  const latestAttempt = useMemo(() => {
    if (createdDeploymentId) {
      return deployments.find((deployment) => deployment._id === createdDeploymentId)
        ?? (createdDeploymentFallback?._id === createdDeploymentId ? createdDeploymentFallback : null);
    }
    return activeDeployment ?? deployments[0] ?? null;
  }, [activeDeployment, createdDeploymentFallback, createdDeploymentId, deployments]);
  const liveDeployment = activeDeployment;
  const liveDeploymentUrl = getDeploymentUrl(liveDeployment);

  const refreshDeployments = useCallback(async (id: string, signal?: AbortSignal) => {
    setIsRefreshing(true);
    try {
      const [history, active] = await Promise.all([
        getDeployments(id, signal),
        getActiveDeployment(id, signal),
      ]);
      if (signal?.aborted) return null;
      const nextDeployments = Array.isArray(history.deployments) ? history.deployments : [];
      setDeployments(nextDeployments);
      setActiveDeployment(active);
      setHistoryError(null);
      return { deployments: nextDeployments, active };
    } catch (refreshError) {
      if (signal?.aborted) return null;
      setHistoryError(friendlyError(refreshError));
      return null;
    } finally {
      if (!signal?.aborted) setIsRefreshing(false);
    }
  }, []);

  const inspectPackage = useCallback(async () => {
    setIsInspectingPackage(true);
    try {
      const summary = await onInspectPackage();
      setPackageSummary(summary);
      return summary;
    } catch (inspectError) {
      const issue = {
        code: "missing-asset" as const,
        severity: "error" as const,
        fieldPath: "package",
        message: friendlyError(inspectError),
      };
      const summary: DeploymentPackageSummary = {
        filesPrepared: [],
        assetCount: 0,
        imageCount: 0,
        totalBytes: 0,
        warnings: [],
        errors: [issue],
      };
      setPackageSummary(summary);
      return summary;
    } finally {
      setIsInspectingPackage(false);
    }
  }, [onInspectPackage]);

  useEffect(() => {
    if (!open) {
      setPhase("ready");
      setError(null);
      setHistoryError(null);
      setCreatedDeploymentId(null);
      setCreatedDeploymentFallback(null);
      setRollbackCandidate(null);
      setCopied(false);
      return;
    }

    setResolvedWorkspaceId(workspaceId);
    const controller = new AbortController();
    if (workspaceId) void refreshDeployments(workspaceId, controller.signal);
    else {
      setDeployments([]);
      setActiveDeployment(null);
    }
    void inspectPackage();
    return () => controller.abort();
  }, [inspectPackage, open, refreshDeployments, workspaceId]);

  useEffect(() => {
    if (!open || phase !== "monitoring" || !activeWorkspaceId || !createdDeploymentId) return;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void refreshDeployments(activeWorkspaceId, controller.signal).then((snapshot) => {
        const deployment = snapshot?.deployments.find((item) => item._id === createdDeploymentId)
          ?? (createdDeploymentFallback?._id === createdDeploymentId ? createdDeploymentFallback : null);
        if (!deployment || isBuilding(deployment.status)) return;
        if (deployment.status === "failed") {
          setError("The deployment service reported a failure. Review your assets and try again.");
          setPhase("error");
          return;
        }
        if (deployment.status === "deployed") setPhase("success");
      });
    }, 3000);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [activeWorkspaceId, createdDeploymentFallback, createdDeploymentId, open, phase, refreshDeployments]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isBusy) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isBusy, onClose, open]);

  const handlePublish = async () => {
    if (isBusy || phase === "monitoring" || isInspectingPackage || packageSummary?.errors.length) return;
    setError(null);
    setPhase("preparing");

    try {
      const prepared = await onPreparePublish();
      setPackageSummary(prepared.summary);
      if (prepared.summary.errors.length > 0) {
        throw new Error(prepared.summary.errors[0].message);
      }

      setResolvedWorkspaceId(prepared.workspaceId);
      setPhase("publishing");
      const deployment = await publishSite(prepared.workspaceId, prepared.deploymentPackage);
      setCreatedDeploymentId(deployment._id);
      setCreatedDeploymentFallback(deployment);
      const snapshot = await refreshDeployments(prepared.workspaceId);
      const latest = snapshot?.deployments.find((item) => item._id === deployment._id) ?? deployment;
      if (latest.status === "failed") {
        setError("The deployment service reported a failure. Please try publishing again.");
        setPhase("error");
      } else if (isBuilding(latest.status)) {
        setPhase("monitoring");
      } else {
        setPhase("success");
      }
    } catch (publishError) {
      setError(friendlyError(publishError));
      setPhase("error");
    }
  };

  const handleRollback = async (deployment: Deployment) => {
    if (!activeWorkspaceId || isBusy || phase === "monitoring" || isRollingBack) return;
    setIsRollingBack(true);
    setError(null);
    try {
      const restored = await rollbackDeployment(activeWorkspaceId, deployment._id);
      setCreatedDeploymentId(restored._id);
      setCreatedDeploymentFallback(restored);
      setRollbackCandidate(null);
      const snapshot = await refreshDeployments(activeWorkspaceId);
      const latest = snapshot?.deployments.find((item) => item._id === restored._id) ?? restored;
      setPhase(latest.status === "deployed" ? "success" : "monitoring");
    } catch (rollbackError) {
      setError(friendlyError(rollbackError));
      setPhase("error");
    } finally {
      setIsRollingBack(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!liveDeploymentUrl) return;
    try {
      await navigator.clipboard.writeText(liveDeploymentUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("The deployment URL could not be copied. You can select it below instead.");
    }
  };

  const deploymentSummary = useMemo(() => {
    if (phase === "preparing") return "Validating assets and saving the latest package…";
    if (phase === "publishing") return "Creating a versioned deployment…";
    if (phase === "monitoring") return "The deployment is building. This dialog will refresh its status automatically.";
    if (phase === "success") return "Your latest package is ready to view.";
    return "Publishing saves a complete builder snapshot, HTML, CSS, scripts, and asset manifest.";
  }, [phase]);

  const hasPackageErrors = Boolean(packageSummary?.errors.length);
  const publishDisabled = isBusy || phase === "monitoring" || isInspectingPackage || hasPackageErrors;

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={backdrop}
        className="fixed inset-0 z-[500] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-5"
        onMouseDown={() => { if (!isBusy) onClose(); }}
      >
        <motion.section
          role="dialog"
          aria-modal="true"
          aria-labelledby="publish-dialog-title"
          variants={modalPanel}
          onMouseDown={(event) => event.stopPropagation()}
          className="flex max-h-[94svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_32px_100px_rgba(2,6,23,0.42)] sm:max-h-[90svh] sm:rounded-3xl"
        >
          <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                <Rocket className="h-3.5 w-3.5" /> Publishing
              </div>
              <h2 id="publish-dialog-title" className="text-xl font-black tracking-tight text-[#0B1D40] sm:text-2xl">
                {phase === "success" ? "Deployment ready" : phase === "monitoring" ? "Publishing your website" : "Publish your website"}
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-500">{deploymentSummary}</p>
            </div>
            <button
              type="button"
              aria-label="Close publish dialog"
              disabled={isBusy}
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-wait disabled:opacity-40"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
            <AnimatePresence initial={false}>
              {isBusy ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 overflow-hidden rounded-2xl border border-blue-100 bg-blue-50 p-4"
                  aria-live="polite"
                >
                  <div className="flex items-center justify-between gap-3 text-xs font-bold text-blue-800">
                    <span>{phase === "preparing" ? "1 of 2 · Preparing deployment package" : "2 of 2 · Creating deployment"}</span>
                    <span>{phase === "preparing" ? "50%" : "90%"}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-100">
                    <motion.div
                      initial={{ width: "12%" }}
                      animate={{ width: phase === "preparing" ? "58%" : "92%" }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                    />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {phase === "monitoring" ? (
              <div className="mb-5 flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900" role="status" aria-live="polite">
                <Loader2 className="mt-0.5 h-6 w-6 shrink-0 animate-spin text-blue-600" />
                <div>
                  <p className="font-extrabold">Version {latestAttempt?.version ?? "—"} is still publishing</p>
                  <p className="mt-1 text-sm leading-5 text-blue-700">You can return to the builder; publishing continues in the background.</p>
                </div>
              </div>
            ) : null}

            {phase === "success" ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"
                role="status"
                aria-live="polite"
              >
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-extrabold">Your site was published</p>
                    <p className="mt-1 text-sm leading-5 text-emerald-700">Version {latestAttempt?.version ?? "—"} is the latest deployment.</p>
                  </div>
                </div>
              </motion.div>
            ) : null}

            {phase === "error" && error ? (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mb-5 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800" role="alert">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-bold">Publishing could not be completed</p>
                  <p className="mt-1 text-sm leading-5 text-red-700">{error}</p>
                </div>
              </motion.div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow label="Website name" value={websiteName || projectName || "Untitled website"} Icon={Globe2} />
              <InfoRow label="Project name" value={projectName || "Untitled project"} Icon={FileClock} />
              <InfoRow label="Workspace" value={activeWorkspaceId ? `Connected · ${activeWorkspaceId.slice(-8)}` : "Created automatically on publish"} Icon={ShieldCheck} />
              <InfoRow label="Last published" value={formatDate(liveDeployment?.deployedAt)} Icon={History} />
            </div>

            <section className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4" aria-labelledby="deployment-package-heading">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p id="deployment-package-heading" className="text-sm font-extrabold text-[#0B1D40]">Deployment package</p>
                  <p className="mt-0.5 text-xs text-slate-500">Reusable files prepared locally; assets are never uploaded from this dialog.</p>
                </div>
                <button type="button" onClick={() => void inspectPackage()} disabled={isInspectingPackage || isBusy} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
                  <RefreshCw className={`h-3.5 w-3.5 ${isInspectingPackage ? "animate-spin" : ""}`} /> Check package
                </button>
              </div>
              {isInspectingPackage ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Inspecting assets…</div>
              ) : packageSummary ? (
                <>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-4">
                    <PackageMetric label="Files prepared" value={String(packageSummary.filesPrepared.length)} />
                    <PackageMetric label="Assets" value={String(packageSummary.assetCount)} />
                    <PackageMetric label="Images" value={String(packageSummary.imageCount)} />
                    <PackageMetric label="Package size" value={formatDeploymentBytes(packageSummary.totalBytes)} />
                  </div>
                  <p className="mt-3 truncate text-xs font-medium text-slate-500" title={packageSummary.filesPrepared.join(" · ")}>{packageSummary.filesPrepared.join(" · ") || "No files prepared yet"}</p>
                  {packageSummary.errors.length > 0 ? (
                    <IssueList title="Fix before publishing" issues={packageSummary.errors} tone="error" />
                  ) : null}
                  {packageSummary.warnings.length > 0 ? (
                    <IssueList title="Warnings" issues={packageSummary.warnings} tone="warning" />
                  ) : null}
                </>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Package details will appear once the canvas is checked.</p>
              )}
            </section>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-extrabold text-[#0B1D40]">Deployment status</p>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(isBusy ? "building" : latestAttempt?.status)}`}>
                  {(isBusy || phase === "monitoring" || isBuilding(latestAttempt?.status)) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {statusLabel(isBusy ? "building" : latestAttempt?.status)}
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                  <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">Latest version</span>
                  <span className="mt-0.5 block font-bold text-slate-700">{latestAttempt ? `v${latestAttempt.version}` : "—"}</span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                  <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">Live domain / deployment URL</span>
                  {liveDeploymentUrl ? (
                    <span className="mt-0.5 block truncate font-bold text-blue-700" title={liveDeploymentUrl}>{liveDeploymentUrl}</span>
                  ) : (
                    <span className="mt-0.5 block font-medium text-slate-500">Available when hosting is configured</span>
                  )}
                </div>
              </div>
            </div>

            <div ref={historyRef} className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-extrabold text-[#0B1D40]">Publish history</p>
                  <p className="mt-0.5 text-xs text-slate-500">Versioned deployments for this workspace.</p>
                </div>
                {activeWorkspaceId ? (
                  <button type="button" onClick={() => void refreshDeployments(activeWorkspaceId)} disabled={isRefreshing} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
                    <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} /> Refresh
                  </button>
                ) : null}
              </div>
              {historyError ? (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800" role="status">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{historyError}</span>
                </div>
              ) : null}
              {deployments.length > 0 ? (
                <ul className="mt-3 divide-y divide-slate-100">
                  {deployments.slice(0, 4).map((deployment) => (
                    <li key={deployment._id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-700">Version {deployment.version}</span>
                        <span className="ml-2 text-xs text-slate-400">{formatDate(deployment.deployedAt || deployment.createdAt)}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {deployment.status === "deployed" && deployment._id !== liveDeployment?._id ? (
                          rollbackCandidate === deployment._id ? (
                            <span className="flex items-center gap-1">
                              <button type="button" onClick={() => setRollbackCandidate(null)} disabled={isRollingBack} className="rounded-md px-1.5 py-1 text-[11px] font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
                              <button type="button" onClick={() => void handleRollback(deployment)} disabled={isRollingBack} className="rounded-md bg-amber-100 px-1.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-200 disabled:opacity-50">{isRollingBack ? "Restoring…" : "Confirm"}</button>
                            </span>
                          ) : (
                            <button type="button" onClick={() => setRollbackCandidate(deployment._id)} disabled={isBusy} className="rounded-md px-1.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-50 disabled:opacity-50">Restore</button>
                          )
                        ) : null}
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusClass(deployment.status)}`}>{statusLabel(deployment.status)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Your first deployment will appear here.</p>
              )}
            </div>
          </div>

          <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            {phase === "success" || phase === "monitoring" ? (
              <>
                <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100">Return to Builder</button>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => historyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50">View history</button>
                  <button type="button" onClick={() => void handlePublish()} disabled={publishDisabled} className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"><Rocket className="h-4 w-4" />Republish</button>
                  {liveDeploymentUrl ? (
                    <>
                      <button type="button" onClick={() => void handleCopyUrl()} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"><Clipboard className="h-4 w-4" />{copied ? "Copied" : "Copy URL"}</button>
                      <button type="button" onClick={() => window.open(liveDeploymentUrl, "_blank", "noopener,noreferrer")} className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B1D40] px-3 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#152B52]"><ExternalLink className="h-4 w-4" />Open Website</button>
                    </>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <button type="button" disabled={isBusy} onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40">Cancel</button>
                <motion.button type="button" disabled={publishDisabled} onClick={() => void handlePublish()} whileHover={!publishDisabled ? { y: -1 } : undefined} whileTap={!publishDisabled ? { scale: 0.98 } : undefined} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1D40] px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_8px_22px_rgba(11,29,64,0.24)] transition hover:bg-[#152B52] disabled:cursor-not-allowed disabled:opacity-75">
                  {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                  {phase === "preparing" ? "Preparing package…" : phase === "publishing" ? "Publishing…" : hasPackageErrors ? "Resolve asset issues" : phase === "error" ? "Try publishing again" : "Publish website"}
                </motion.button>
              </>
            )}
          </footer>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}

function InfoRow({ label, value, Icon }: { label: string; value: string; Icon: typeof Globe2 }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><Icon className="h-4 w-4" /></span>
      <div className="min-w-0">
        <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
        <span className="block truncate text-sm font-bold text-slate-700" title={value}>{value}</span>
      </div>
    </div>
  );
}

function PackageMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
      <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
      <span className="mt-0.5 block truncate text-sm font-bold text-slate-700" title={value}>{value}</span>
    </div>
  );
}

function IssueList({
  title,
  issues,
  tone,
}: {
  title: string;
  issues: DeploymentPackageSummary["errors"];
  tone: "error" | "warning";
}) {
  const className = tone === "error"
    ? "border-red-200 bg-red-50 text-red-800"
    : "border-amber-200 bg-amber-50 text-amber-800";
  return (
    <div className={`mt-3 rounded-xl border p-3 text-xs ${className}`}>
      <p className="font-extrabold">{title}</p>
      <ul className="mt-1.5 list-disc space-y-1 pl-4 leading-5">
        {issues.slice(0, 3).map((issue, index) => <li key={`${issue.fieldPath}-${index}`}>{issue.message}</li>)}
        {issues.length > 3 ? <li>and {issues.length - 3} more issue{issues.length === 4 ? "" : "s"}.</li> : null}
      </ul>
    </div>
  );
}

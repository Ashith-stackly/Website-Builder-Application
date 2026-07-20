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
  type Deployment,
} from "@/lib/publishApi";
import { backdrop, modalPanel } from "@/lib/motion";

type PublishPhase = "ready" | "saving" | "publishing" | "success" | "error";

type PublishDialogProps = {
  open: boolean;
  projectName: string;
  websiteName: string;
  workspaceId: string | null;
  onClose: () => void;
  /** Saves project HTML/JSON and the publish-compatible workspace state. */
  onPreparePublish: () => Promise<string>;
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

export default function PublishDialog({
  open,
  projectName,
  websiteName,
  workspaceId,
  onClose,
  onPreparePublish,
}: PublishDialogProps) {
  const [phase, setPhase] = useState<PublishPhase>("ready");
  const [error, setError] = useState<string | null>(null);
  const [resolvedWorkspaceId, setResolvedWorkspaceId] = useState<string | null>(workspaceId);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [activeDeployment, setActiveDeployment] = useState<Deployment | null>(null);
  const [createdDeployment, setCreatedDeployment] = useState<Deployment | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  const activeWorkspaceId = resolvedWorkspaceId ?? workspaceId;
  const isBusy = phase === "saving" || phase === "publishing";
  const currentDeployment = createdDeployment ?? activeDeployment ?? deployments[0] ?? null;
  const deploymentUrl = getDeploymentUrl(currentDeployment);

  const refreshDeployments = useCallback(async (id: string, signal?: AbortSignal) => {
    setIsRefreshing(true);
    try {
      const [history, active] = await Promise.all([
        getDeployments(id, signal),
        getActiveDeployment(id, signal),
      ]);
      if (signal?.aborted) return;
      setDeployments(Array.isArray(history.deployments) ? history.deployments : []);
      setActiveDeployment(active);
    } catch (refreshError) {
      if (signal?.aborted) return;
      // History is supplementary; keep a successful publish usable if it
      // cannot be refreshed immediately.
      if (!createdDeployment) setError(friendlyError(refreshError));
    } finally {
      if (!signal?.aborted) setIsRefreshing(false);
    }
  }, [createdDeployment]);

  useEffect(() => {
    if (!open) {
      setPhase("ready");
      setError(null);
      setCreatedDeployment(null);
      setCopied(false);
      return;
    }

    setResolvedWorkspaceId(workspaceId);
    if (!workspaceId) {
      setDeployments([]);
      setActiveDeployment(null);
      return;
    }
    const controller = new AbortController();
    void refreshDeployments(workspaceId, controller.signal);
    return () => controller.abort();
  }, [open, refreshDeployments, workspaceId]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isBusy) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isBusy, onClose, open]);

  const handlePublish = async () => {
    if (isBusy) return;
    setError(null);
    setPhase("saving");

    try {
      const id = await onPreparePublish();
      setResolvedWorkspaceId(id);
      setPhase("publishing");
      const deployment = await publishSite(id);
      setCreatedDeployment(deployment);
      await refreshDeployments(id);
      setPhase("success");
    } catch (publishError) {
      setError(friendlyError(publishError));
      setPhase("error");
    }
  };

  const handleCopyUrl = async () => {
    if (!deploymentUrl) return;
    try {
      await navigator.clipboard.writeText(deploymentUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("The deployment URL could not be copied. You can select it below instead.");
    }
  };

  const deploymentSummary = useMemo(() => {
    if (phase === "saving") return "Saving the latest canvas, HTML, and styling…";
    if (phase === "publishing") return "Creating a versioned deployment…";
    if (phase === "success" && currentDeployment?.status === "building") {
      return "Your deployment was created and is now building.";
    }
    if (phase === "success") return "Your latest saved changes are in this deployment.";
    return "Publishing always saves the latest builder state first.";
  }, [currentDeployment?.status, phase]);

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
                {phase === "success" ? "Deployment created" : "Publish your website"}
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
                    <span>{phase === "saving" ? "1 of 2 · Saving website snapshot" : "2 of 2 · Creating deployment"}</span>
                    <span>{phase === "saving" ? "50%" : "100%"}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-100">
                    <motion.div
                      initial={{ width: "12%" }}
                      animate={{ width: phase === "saving" ? "58%" : "92%" }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                    />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {phase === "success" ? (
                <motion.div
                  key="publish-success"
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex gap-3">
                    <motion.div initial={{ scale: 0.5, rotate: -25 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 400, damping: 18 }}>
                      <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
                    </motion.div>
                    <div>
                      <p className="font-extrabold">{currentDeployment?.status === "building" ? "Your site is publishing" : "Your site was published"}</p>
                      <p className="mt-1 text-sm leading-5 text-emerald-700">
                        Version {currentDeployment?.version ?? "—"} is ready to {currentDeployment?.status === "building" ? "finish building" : "view"}.
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

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
              <InfoRow label="Last published" value={formatDate(currentDeployment?.deployedAt)} Icon={History} />
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-extrabold text-[#0B1D40]">Deployment status</p>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(currentDeployment?.status)}`}>
                  {(isBusy || currentDeployment?.status === "building") && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {statusLabel(isBusy ? "building" : currentDeployment?.status)}
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                  <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">Current version</span>
                  <span className="mt-0.5 block font-bold text-slate-700">{currentDeployment ? `v${currentDeployment.version}` : "—"}</span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                  <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">Domain / deployment URL</span>
                  {deploymentUrl ? (
                    <span className="mt-0.5 block truncate font-bold text-blue-700" title={deploymentUrl}>{deploymentUrl}</span>
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
              {deployments.length > 0 ? (
                <ul className="mt-3 divide-y divide-slate-100">
                  {deployments.slice(0, 4).map((deployment) => (
                    <li key={deployment._id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-700">Version {deployment.version}</span>
                        <span className="ml-2 text-xs text-slate-400">{formatDate(deployment.deployedAt || deployment.createdAt)}</span>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusClass(deployment.status)}`}>{statusLabel(deployment.status)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Your first deployment will appear here.</p>
              )}
            </div>
          </div>

          <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            {phase === "success" ? (
              <>
                <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100">Return to Builder</button>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => historyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50">View Deployment</button>
                  <button type="button" onClick={() => void handlePublish()} className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100"><Rocket className="h-4 w-4" />Republish</button>
                  {deploymentUrl ? (
                    <>
                      <button type="button" onClick={() => void handleCopyUrl()} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"><Clipboard className="h-4 w-4" />{copied ? "Copied" : "Copy URL"}</button>
                      <button type="button" onClick={() => window.open(deploymentUrl, "_blank", "noopener,noreferrer")} className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B1D40] px-3 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#152B52]"><ExternalLink className="h-4 w-4" />Open Website</button>
                    </>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <button type="button" disabled={isBusy} onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40">Cancel</button>
                <motion.button type="button" disabled={isBusy} onClick={() => void handlePublish()} whileHover={!isBusy ? { y: -1 } : undefined} whileTap={!isBusy ? { scale: 0.98 } : undefined} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1D40] px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_8px_22px_rgba(11,29,64,0.24)] transition hover:bg-[#152B52] disabled:cursor-wait disabled:opacity-75">
                  {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                  {phase === "saving" ? "Saving latest changes…" : phase === "publishing" ? "Publishing…" : phase === "error" ? "Try publishing again" : "Publish website"}
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

"use client";

import { memo, useCallback, useEffect, useRef, useState, useMemo, useLayoutEffect, type ReactNode } from "react";
import { Check, ChevronDown, CloudOff, Download, Eye, FileUp, FolderOpen, Images, Layers, Loader2, Monitor, MoreHorizontal, Palette, Pencil, Redo2, Save, Smartphone, Sparkles, Tablet, Trash2, Undo2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { AssetManager } from "@/components/assets/AssetManager";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import SortableItem from "./SortableItem";
import QuickInsertBar from "./QuickInsertBar";
import ExportButton from "./ExportButton";
import ButtonComponent from "@/components/draggable/ButtonComponent";
import IconComponent from "@/components/draggable/IconComponent";
import { useBuilderStore } from "@/store/builderStore";
import { useDesignStore } from "@/store/designStore";
import { useBuilderUiStore } from "@/store/builderUiStore";
import type { BuilderComponent, ComponentType, Viewport } from "@/types/builder";
import { VIEWPORT_WIDTHS } from "@/types/builder";
import { staggerContainer } from "@/lib/motion";

function Canvas({
  components,
  onSelect,
  onDelete,
  onDuplicate,
  onLoadStarter,
  onClear,
  onPreview,
  selectionToolbar,
}: {
  components: BuilderComponent[];
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onLoadStarter: () => void;
  onClear: () => void;
  onPreview: () => void;
  /** Context actions supplied by BuilderLayout for the current selection. */
  selectionToolbar?: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "builder-canvas" });
  const flowComponents = useMemo(
    () => components.filter((component) => !isFloatingComponent(component)),
    [components],
  );
  const floatingComponents = useMemo(
    () => components.filter(isFloatingComponent),
    [components],
  );
  const sortableIds = useMemo(() => flowComponents.map((c) => c.id), [flowComponents]);

  /* ── Store actions for new features ── */
  const undo = useBuilderStore((s) => s.undo);
  const redo = useBuilderStore((s) => s.redo);
  const canUndo = useBuilderStore((s) => s.history.length > 0);
  const canRedo = useBuilderStore((s) => s.future.length > 0);
  const currentProjectId = useBuilderStore((s) => s.currentProjectId);
  const currentProjectName = useBuilderStore((s) => s.currentProjectName);
  const isDirty = useBuilderStore((s) => s.isDirty);
  const isSaving = useBuilderStore((s) => s.isSaving);
  const saveStatus = useBuilderStore((s) => s.saveStatus);
  const saveError = useBuilderStore((s) => s.saveError);
  const loadProject = useBuilderStore((s) => s.loadProject);
  const autosave = useBuilderStore((s) => s.autosave);
  const saveHtml = useBuilderStore((s) => s.saveHtml);
  const markDirty = useBuilderStore((s) => s.markDirty);
  const canvasMode = useBuilderStore((s) => s.canvasMode);
  const autoSaveEnabled = useDesignStore((s) => s.autoSaveEnabled);
  const tokens = useDesignStore((s) => s.tokens);
  const seo = useDesignStore((s) => s.seo);
  const setLastSavedAt = useDesignStore((s) => s.setLastSavedAt);
  const toggleGlobalStyles = useDesignStore((s) => s.toggleGlobalStyles);
  const storeAddComponent = useBuilderStore((s) => s.addComponent);
  const insertComponentBefore = useBuilderStore((s) => s.insertComponentBefore);
  const exportJSON = useBuilderStore((s) => s.exportJSON);
  const importJSON = useBuilderStore((s) => s.importJSON);
  const viewport = useBuilderStore((s) => s.viewport);
  const setViewport = useBuilderStore((s) => s.setViewport);
  const zoom = useDesignStore((s) => s.zoom);
  const showGrid = useBuilderUiStore((s) => s.showGrid);
  const gridSize = useBuilderUiStore((s) => s.gridSize);
  const canvasBackground = useBuilderUiStore((s) => s.canvasBackground);
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  /* ── Quick-insert helpers ── */
  const handleQuickInsertBefore = useCallback(
    (type: ComponentType, beforeId: string) => {
      insertComponentBefore(type, beforeId);
    },
    [insertComponentBefore],
  );

  const handleQuickInsertAfter = useCallback(
    (type: ComponentType, afterId: string) => {
      storeAddComponent(type, null, afterId);
    },
    [storeAddComponent],
  );

  /* ── Project name (local state, persisted via save) ── */
  const [projectName, setProjectName] = useState("My Website");
  const [editingName, setEditingName] = useState(false);
  const [isAssetsOpen, setIsAssetsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const toolsBtnRef = useRef<HTMLButtonElement>(null);
  const [toolsPos, setToolsPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (editingName) nameInputRef.current?.select();
  }, [editingName]);

  useEffect(() => {
    if (!toolsOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node) &&
          toolsBtnRef.current && !toolsBtnRef.current.contains(event.target as Node)) {
        setToolsOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setToolsOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [toolsOpen]);

  // Calculate dropdown position from button rect
  useLayoutEffect(() => {
    if (!toolsOpen || !toolsBtnRef.current) { setToolsPos(null); return; }
    const rect = toolsBtnRef.current.getBoundingClientRect();
    const dropdownWidth = 220;
    let left = rect.right - dropdownWidth;
    // Keep within viewport
    if (left < 8) left = 8;
    if (left + dropdownWidth > window.innerWidth - 8) left = window.innerWidth - dropdownWidth - 8;
    setToolsPos({ top: rect.bottom + 6, left });
  }, [toolsOpen]);

  /* ── Save feedback ── */
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedProjectRef = useRef<string | null>(null);
  const autosaveFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    if (!projectId || loadedProjectRef.current === projectId) return;
    loadedProjectRef.current = projectId;
    autosaveFingerprintRef.current = null;
    const controller = new AbortController();
    void loadProject(projectId, controller.signal);
    return () => controller.abort();
  }, [loadProject, projectId]);

  useEffect(() => {
    if (currentProjectName) {
      const id = window.setTimeout(() => setProjectName(currentProjectName), 0);
      return () => window.clearTimeout(id);
    }
  }, [currentProjectName]);

  useEffect(() => {
    const queryProjectName = searchParams.get("projectName");
    if (!projectId && queryProjectName) {
      const id = window.setTimeout(() => setProjectName(queryProjectName), 0);
      return () => window.clearTimeout(id);
    }
  }, [projectId, searchParams]);

  const handleSave = async () => {
    useBuilderStore.setState({ currentProjectName: projectName.trim() || currentProjectName || "My Website" });
    const ok = await saveHtml();
    if (!ok) return;

    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 2200);
    setLastSavedAt(Date.now());
  };

  /* ── Backend autosave after a 5-second debounce ── */
  useEffect(() => {
    if (!autoSaveEnabled || !currentProjectId || components.length === 0) return;

    const fingerprint = JSON.stringify({ components, tokens, seo, canvasMode });
    if (autosaveFingerprintRef.current === null) {
      autosaveFingerprintRef.current = fingerprint;
      return;
    }
    if (autosaveFingerprintRef.current === fingerprint) return;

    autosaveFingerprintRef.current = fingerprint;
    markDirty();

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      useBuilderStore.setState({ currentProjectName: projectName.trim() || currentProjectName || "My Website" });
      void autosave(controller.signal).then((ok) => {
        if (ok) setLastSavedAt(Date.now());
      });
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [autoSaveEnabled, autosave, canvasMode, components, currentProjectId, currentProjectName, markDirty, projectName, seo, setLastSavedAt, tokens]);

  const handleLoad = () => {
    if (!currentProjectId) {
      alert("Open a saved backend project to reload it.");
      return;
    }
    const controller = new AbortController();
    void loadProject(currentProjectId, controller.signal);
  };

  const runTool = (action: () => void) => {
    action();
    setToolsOpen(false);
  };

  const handleImportJSON = async () => {
    const { openJSONFile } = await import("@/lib/jsonExportImport");
    const content = await openJSONFile();
    if (!content) return;
    const error = importJSON(content);
    if (error) {
      alert(`Import failed: ${error}`);
    }
  };

  return (
    <main
      className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#dbe3ef] bg-[#f7f9fc] shadow-sm"
      onClick={() => onSelect(null)}
    >
      {/* ── Toolbar ── */}
      <div
        className="relative z-40 flex h-[60px] flex-shrink-0 items-center justify-between gap-3 overflow-visible border-b border-[#dbe3ef] bg-white px-3 shadow-[0_1px_0_rgba(15,23,42,0.03)] md:px-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: undo/redo + project name */}
        <div className="flex min-w-0 items-center gap-1.5">
          <button
            type="button"
            title="Undo (Ctrl+Z)"
            disabled={!canUndo}
            onClick={undo}
            className="flex h-8 w-8 items-center justify-center rounded text-[#566583] transition hover:bg-gray-100 hover:text-[#0B1D40] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Redo (Ctrl+Shift+Z)"
            disabled={!canRedo}
            onClick={redo}
            className="flex h-8 w-8 items-center justify-center rounded text-[#566583] transition hover:bg-gray-100 hover:text-[#0B1D40] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Redo2 className="h-4 w-4" />
          </button>

          <div className="mx-1 h-5 w-px bg-[#dbe3ef]" />

          {/* Editable project name */}
          {editingName ? (
            <input
              ref={nameInputRef}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingName(false); }}
              className="w-32 rounded border border-blue-300 bg-blue-50 px-2 py-1 text-[13px] font-bold text-[#0B1D40] outline-none focus:ring-2 focus:ring-blue-200 sm:w-44"
            />
          ) : (
            <button
              type="button"
              title="Rename project"
              onClick={() => setEditingName(true)}
              className="flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] font-bold text-[#0B1D40] transition hover:bg-gray-100"
            >
              <Layers className="h-3.5 w-3.5 flex-shrink-0 text-[#566583]" />
              <span className="max-w-[92px] truncate sm:max-w-[180px]">{projectName}</span>
              <Pencil className="h-3 w-3 text-gray-400" />
            </button>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex flex-shrink-0 items-center gap-1.5 md:gap-2">
          <div className="relative">
            <button
              ref={toolsBtnRef}
              type="button"
              title="Builder tools"
              onClick={() => setToolsOpen((open) => !open)}
              className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-gray-200 bg-white px-2.5 text-[12px] font-bold text-[#0B1D40] shadow-sm transition hover:bg-gray-50 active:scale-95 sm:px-3"
            >
              <MoreHorizontal className="h-4 w-4 text-gray-500" />
              <span className="hidden sm:inline">Tools</span>
            </button>
          </div>
          <button
            type="button"
            title="Preview page"
            onClick={onPreview}
            className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-blue-100 bg-blue-50 px-2.5 text-[12px] font-bold text-blue-700 shadow-sm transition hover:bg-blue-100 active:scale-95 sm:px-3"
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </button>

          {/* Animated save-status pill (backend persistence feedback) */}
          {(() => {
            const status = isSaving
              ? "saving"
              : saveStatus === "error"
                ? "error"
                : isDirty
                  ? "dirty"
                  : saveStatus === "saved"
                    ? "saved"
                    : "idle";
            if (status === "idle") return null;
            const config = {
              saving: { label: "Saving…", Icon: Loader2, spin: true, cls: "border-blue-100 bg-blue-50 text-blue-600" },
              saved: { label: "Saved", Icon: Check, spin: false, cls: "border-green-100 bg-green-50 text-green-700" },
              dirty: { label: "Unsaved", Icon: CloudOff, spin: false, cls: "border-amber-100 bg-amber-50 text-amber-600" },
              error: { label: saveError || "Save failed", Icon: CloudOff, spin: false, cls: "border-red-100 bg-red-50 text-red-600" },
            }[status];
            return (
              <div className="hidden lg:flex" title={saveError ?? undefined}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={status}
                    initial={{ opacity: 0, y: -4, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.94 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className={`inline-flex max-w-[180px] items-center gap-1.5 truncate rounded-full border px-2.5 py-1 text-[11px] font-bold ${config.cls}`}
                  >
                    <config.Icon className={`h-3.5 w-3.5 shrink-0 ${config.spin ? "animate-spin" : ""}`} />
                    <span className="truncate">{config.label}</span>
                  </motion.span>
                </AnimatePresence>
              </div>
            );
          })()}

          <ExportButton components={components} />
        </div>
      </div>

      {/* ── Viewport / device switcher ── */}
      <div
        className="flex h-9 flex-shrink-0 items-center justify-center gap-1 border-b border-[#dbe3ef] bg-white/80 px-4"
        onClick={(e) => e.stopPropagation()}
      >
        {([
          { id: "desktop" as Viewport, Icon: Monitor,    label: "Desktop" },
          { id: "tablet"  as Viewport, Icon: Tablet,     label: "Tablet" },
          { id: "mobile"  as Viewport, Icon: Smartphone, label: "Mobile" },
        ]).map(({ id, Icon, label }) => (
          <button
            key={id}
            type="button"
            title={`${label} (${VIEWPORT_WIDTHS[id]}px)`}
            onClick={() => setViewport(id)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-bold transition ${
              viewport === id
                ? "bg-[#0B1D40] text-white shadow-sm"
                : "text-[#566583] hover:bg-gray-100 hover:text-[#0B1D40]"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
        <AnimatePresence>
          {viewport !== "desktop" && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="ml-2 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200"
            >
              {VIEWPORT_WIDTHS[viewport]}px
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ── Canvas drop zone ── */}
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col items-center overflow-y-auto px-3 py-4 transition sm:px-4 ${isOver ? "bg-blue-50/50" : "bg-[#f0f3f8]"}`}
        style={{
          backgroundColor: tokens.colors.background,
          color: tokens.colors.text,
          fontFamily: tokens.typography.fontFamily,
          fontSize: tokens.typography.baseFontSize,
          // Canvas grid / dots overlay (builderUiStore) — purely visual guide.
          ...(showGrid && canvasBackground !== "plain"
            ? canvasBackground === "dots"
              ? {
                  backgroundImage: "radial-gradient(rgba(15,35,75,0.12) 1px, transparent 1px)",
                  backgroundSize: `${gridSize}px ${gridSize}px`,
                }
              : {
                  backgroundImage:
                    "linear-gradient(rgba(15,35,75,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(15,35,75,0.06) 1px, transparent 1px)",
                  backgroundSize: `${gridSize}px ${gridSize}px`,
                }
            : {}),
        }}
      >
        {selectionToolbar && (
          <div className="sticky top-0 z-20 flex justify-center pb-2 pointer-events-none">
            {selectionToolbar}
          </div>
        )}
        <motion.div
          layout
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative flex min-h-[680px] w-full flex-col gap-3"
          style={{
            // CSS `zoom` (not transform) keeps @dnd-kit hit-testing correct.
            ...(zoom !== 100 ? { zoom: zoom / 100 } : {}),
            ...(viewport !== "desktop" ? { maxWidth: VIEWPORT_WIDTHS[viewport], margin: "0 auto" } : {}),
          }}
        >
          {flowComponents.length === 0 && floatingComponents.length === 0 ? (
            <div className="flex min-h-[280px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#dbe3ef] bg-white px-6 text-center shadow-[0_18px_45px_rgba(15,35,75,0.08)] transition">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#eef4fb] text-[#0B1D40]">
                <ChevronDown className="h-7 w-7" />
              </div>
              <h2 className="text-[18px] font-bold text-[#0B1D40]">Drop blocks here</h2>
              <p className="mt-2 max-w-[360px] text-sm font-medium leading-6 text-[#566583]">
                Drag a block from the sidebar or click a palette item to start building.
              </p>
              <button
                type="button"
                className="mt-6 flex items-center gap-2 rounded-md bg-[#0B1D40] px-5 py-3 text-sm font-bold text-white shadow-[0_2px_4px_rgba(11,29,64,0.3)] transition hover:bg-[#152B52] active:scale-95"
                onClick={(e) => { e.stopPropagation(); onLoadStarter(); }}
              >
                <Sparkles className="h-4 w-4" />
                Create Starter Website
              </button>
            </div>
          ) : (
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              {flowComponents.map((component, index) => (
                <div key={component.id} className="w-full">
                  {/* Quick-insert bar BEFORE this block */}
                  {index === 0 && (
                    <QuickInsertBar
                      onInsert={(type) => handleQuickInsertBefore(type, component.id)}
                    />
                  )}
                  <SortableItem
                    component={component}
                    onDelete={onDelete}
                    onDuplicate={onDuplicate}
                    onSelect={onSelect}
                  />
                  {/* Quick-insert bar AFTER this block */}
                  <QuickInsertBar
                    onInsert={(type) => handleQuickInsertAfter(type, component.id)}
                  />
                </div>
              ))}
            </SortableContext>
          )}

          {floatingComponents.length > 0 && (
            <div className="pointer-events-none absolute inset-0 z-40">
              {floatingComponents.map((component) => (
                <FloatingCanvasItem
                  key={component.id}
                  component={component}
                  onDelete={onDelete}
                  onSelect={onSelect}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <AssetManager open={isAssetsOpen} onClose={() => setIsAssetsOpen(false)} />

      {/* ── Tools dropdown (portal to escape stacking context) ── */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {toolsOpen && toolsPos && (
            <motion.div
              ref={toolsMenuRef}
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="fixed z-[200] w-[220px] overflow-hidden rounded-xl border border-[#dbe3ef] bg-white p-1.5 shadow-[0_18px_50px_rgba(15,35,75,0.18)]"
              style={{ top: toolsPos.top, left: toolsPos.left }}
            >
              <ToolMenuButton label="Design" Icon={Palette} tone="text-violet-700 bg-violet-50 border-violet-100" onClick={() => runTool(toggleGlobalStyles)} />
              <ToolMenuButton label="Assets" Icon={Images} tone="text-slate-700 bg-slate-50 border-slate-100" onClick={() => runTool(() => setIsAssetsOpen(true))} />
              <ToolMenuButton label="Starter" Icon={Sparkles} tone="text-blue-700 bg-blue-50 border-blue-100" onClick={() => runTool(onLoadStarter)} />
              <ToolMenuButton label="Load" Icon={FolderOpen} tone="text-slate-700 bg-slate-50 border-slate-100" onClick={() => runTool(handleLoad)} />
              <ToolMenuButton label={isSaving ? "Saving" : saved || saveStatus === "saved" ? "Saved" : "Save"} Icon={saved || saveStatus === "saved" ? Check : Save} tone={saved || saveStatus === "saved" ? "text-green-700 bg-green-50 border-green-100" : "text-slate-700 bg-slate-50 border-slate-100"} onClick={() => runTool(() => { void handleSave(); })} />
              <ToolMenuButton label="Clear" Icon={Trash2} tone="text-red-700 bg-red-50 border-red-100" onClick={() => runTool(onClear)} />
              <div className="mx-1.5 my-1 h-px bg-gray-100" />
              <ToolMenuButton label="Export JSON" Icon={Download} tone="text-slate-700 bg-slate-50 border-slate-100" onClick={() => runTool(() => { exportJSON(); })} />
              <ToolMenuButton label="Import JSON" Icon={FileUp} tone="text-slate-700 bg-slate-50 border-slate-100" onClick={() => runTool(handleImportJSON)} />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </main>
  );
}

function ToolMenuButton({
  label,
  Icon,
  tone,
  onClick,
}: {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  tone: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12px] font-bold text-[#0B1D40] transition hover:bg-[#f7f9fc]"
    >
      <span className={`flex h-7 w-7 items-center justify-center rounded-md border ${tone}`}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="flex-1">{label}</span>
    </button>
  );
}

const isFloatingComponent = (component: BuilderComponent) =>
  (component.type === "icon" || component.type === "button") && component.props?.floating === true;

function FloatingCanvasItem({
  component,
  onDelete,
  onSelect,
}: {
  component: BuilderComponent;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const selectedComponentId = useBuilderStore((s) => s.selectedComponentId);
  const moveComponent = useBuilderStore((s) => s.moveComponent);
  const isSelected = selectedComponentId === component.id;
  const position = component.position ?? { x: 32, y: 32 };
  const zIndex = Number(component.styles.zIndex || component.zIndex || 60);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || component.locked) return;

    event.preventDefault();
    event.stopPropagation();
    onSelect(component.id);

    const startPointer = { x: event.clientX, y: event.clientY };
    const startPosition = component.position ?? { x: 32, y: 32 };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startPointer.x;
      const dy = moveEvent.clientY - startPointer.y;
      moveComponent(component.id, startPosition.x + dx, startPosition.y + dy);
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  };

  return (
    <motion.div
      className="pointer-events-auto absolute"
      style={{
        left: position.x,
        top: position.y,
        zIndex: isSelected ? zIndex + 20 : zIndex,
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.16, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(component.id);
      }}
    >
      <div
        role="button"
        tabIndex={0}
        title={component.locked ? "Element locked" : `Drag ${component.type}`}
        onPointerDown={handlePointerDown}
        className={`group/icon flex cursor-grab items-center justify-center rounded-md p-1 transition active:cursor-grabbing ${
          isSelected ? "bg-white/80 ring-2 ring-blue-500 shadow-[0_8px_24px_rgba(37,99,235,0.18)]" : "hover:bg-white/70 hover:ring-1 hover:ring-blue-200"
        }`}
      >
        {component.type === "button" ? <ButtonComponent component={component} /> : <IconComponent component={component} />}
      </div>
      {isSelected && (
        <button
          type="button"
          title={`Delete ${component.type}`}
          onClick={(event) => {
            event.stopPropagation();
            onDelete(component.id);
          }}
          className="absolute -right-3 -top-3 flex h-6 w-6 items-center justify-center rounded-full border border-red-100 bg-white text-red-500 shadow-sm transition hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </motion.div>
  );
}

export default memo(Canvas);

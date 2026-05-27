"use client";

import { memo, useEffect, useRef, useState, useMemo } from "react";
import { Check, ChevronDown, Eye, FolderOpen, Images, Layers, Monitor, Pencil, Redo2, Save, Smartphone, Sparkles, Tablet, Trash2, Undo2 } from "lucide-react";
import { AssetManager } from "@/components/assets/AssetManager";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableItem from "./SortableItem";
import ExportButton from "./ExportButton";
import { useBuilderStore } from "@/store/builderStore";
import type { BuilderComponent } from "@/types/builder";

function Canvas({
  components,
  onSelect,
  onDelete,
  onDuplicate,
  onLoadStarter,
  onClear,
  onPreview,
}: {
  components: BuilderComponent[];
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onLoadStarter: () => void;
  onClear: () => void;
  onPreview: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "builder-canvas" });
  const sortableIds = useMemo(() => components.map((c) => c.id), [components]);

  /* ── Store actions for new features ── */
  const undo = useBuilderStore((s) => s.undo);
  const redo = useBuilderStore((s) => s.redo);
  const canUndo = useBuilderStore((s) => s.history.length > 0);
  const canRedo = useBuilderStore((s) => s.future.length > 0);
  const saveToLocalStorage = useBuilderStore((s) => s.saveToLocalStorage);
  const loadFromLocalStorage = useBuilderStore((s) => s.loadFromLocalStorage);
  const viewport = useBuilderStore((s) => s.viewport);
  const setViewport = useBuilderStore((s) => s.setViewport);

  /* ── Project name (local state, persisted via save) ── */
  const [projectName, setProjectName] = useState("My Website");
  const [editingName, setEditingName] = useState(false);
  const [isAssetsOpen, setIsAssetsOpen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingName) nameInputRef.current?.select();
  }, [editingName]);

  /* ── Save feedback ── */
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSave = () => {
    saveToLocalStorage();
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 2200);
  };

  const handleLoad = () => {
    const ok = loadFromLocalStorage();
    if (!ok) {
      // Brief shake feedback would be ideal; keeping simple for now
      alert("No saved draft found.");
    }
  };

  return (
    <main
      className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#dbe3ef] bg-[#f7f9fc] shadow-sm"
      onClick={() => onSelect(null)}
    >
      {/* ── Toolbar ── */}
      <div
        className="flex h-[60px] flex-shrink-0 items-center justify-between gap-2 overflow-x-auto border-b border-[#dbe3ef] bg-white px-3 shadow-[0_1px_0_rgba(15,23,42,0.03)] md:px-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: undo/redo + project name */}
        <div className="flex items-center gap-1">
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

          <div className="mx-1 hidden h-5 w-px bg-[#dbe3ef] lg:block" />

          {/* Editable project name */}
          {editingName ? (
            <input
              ref={nameInputRef}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingName(false); }}
              className="hidden w-36 rounded border border-blue-300 bg-blue-50 px-2 py-1 text-[13px] font-bold text-[#0B1D40] outline-none focus:ring-2 focus:ring-blue-200 lg:block"
            />
          ) : (
            <button
              type="button"
              title="Rename project"
              onClick={() => setEditingName(true)}
              className="hidden items-center gap-1.5 rounded px-2 py-1 text-[13px] font-bold text-[#0B1D40] transition hover:bg-gray-100 lg:flex"
            >
              <Layers className="h-3.5 w-3.5 text-[#566583]" />
              {projectName}
              <Pencil className="h-3 w-3 text-gray-400" />
            </button>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 md:gap-2">
          <button
            type="button"
            title="Asset Library"
            onClick={() => setIsAssetsOpen(true)}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[12px] font-bold text-[#0B1D40] shadow-sm transition hover:bg-gray-50 active:scale-95 md:px-3 md:text-[13px]"
          >
            <Images className="h-3.5 w-3.5 text-gray-500" />
            <span className="hidden xl:inline">Assets</span>
          </button>

          <button
            type="button"
            title="Starter Website"
            onClick={onLoadStarter}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[12px] font-bold text-[#0B1D40] shadow-sm transition hover:bg-gray-50 active:scale-95 md:px-3 md:text-[13px]"
          >
            <Sparkles className="h-3.5 w-3.5 text-gray-500" />
            <span className="hidden xl:inline">Starter</span>
          </button>

          <button
            type="button"
            title="Clear canvas"
            onClick={onClear}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[12px] font-bold text-[#0B1D40] shadow-sm transition hover:bg-red-50 hover:text-red-600 active:scale-95 md:px-3 md:text-[13px]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Clear</span>
          </button>

          <div className="hidden h-5 w-px bg-[#dbe3ef] sm:block" />

          {/* Load Draft */}
          <button
            type="button"
            title="Load saved draft"
            onClick={handleLoad}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[12px] font-bold text-[#0B1D40] shadow-sm transition hover:bg-gray-50 active:scale-95 md:px-3 md:text-[13px]"
          >
            <FolderOpen className="h-3.5 w-3.5 text-gray-500" />
            <span className="hidden lg:inline">Load</span>
          </button>

          {/* Save Draft with visual feedback */}
          <button
            type="button"
            title="Save draft to browser storage"
            onClick={handleSave}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 py-1.5 text-[12px] font-bold shadow-sm transition active:scale-95 md:px-3 md:text-[13px] ${
              saved
                ? "border-green-300 bg-green-50 text-green-700"
                : "border-gray-200 bg-white text-[#0B1D40] hover:bg-gray-50"
            }`}
          >
            {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5 text-gray-500" />}
            <span className="hidden lg:inline">{saved ? "Saved!" : "Save"}</span>
          </button>

          {/* Preview */}
          <button
            type="button"
            title="Preview page"
            onClick={onPreview}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[12px] font-bold text-[#0B1D40] shadow-sm transition hover:bg-blue-50 hover:text-blue-700 active:scale-95 md:px-3 md:text-[13px]"
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Preview</span>
          </button>

          <ExportButton components={components} />
        </div>
      </div>

      {/* ── Viewport / device switcher ── */}
      <div
        className="flex h-10 flex-shrink-0 items-center justify-center gap-1 border-b border-[#dbe3ef] bg-[#f7f9fc]"
        onClick={(e) => e.stopPropagation()}
      >
        {([
          { id: "desktop" as const, Icon: Monitor,    label: "Desktop",  width: "1280" },
          { id: "tablet"  as const, Icon: Tablet,     label: "Tablet",   width: "768" },
          { id: "mobile"  as const, Icon: Smartphone, label: "Mobile",   width: "390" },
        ] as const).map(({ id, Icon, label, width }) => (
          <button
            key={id}
            type="button"
            title={`${label} (${width}px)`}
            onClick={() => setViewport(id)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-bold transition ${
              viewport === id
                ? "bg-[#0B1D40] text-white shadow-sm"
                : "text-[#566583] hover:bg-white hover:text-[#0B1D40]"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
            {viewport === id && <span className="hidden text-[9px] font-normal opacity-70 lg:inline">{width}px</span>}
          </button>
        ))}
      </div>

      {/* ── Canvas drop zone ── */}
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col items-center overflow-y-auto px-3 py-4 transition sm:px-4 ${isOver ? "bg-blue-50/50" : "bg-[#f0f3f8]"}`}
      >
        {/* Viewport-width frame */}
        <div
          className="flex w-full flex-col gap-3 transition-all duration-300"
          style={{
            maxWidth: viewport === "desktop" ? "100%" : viewport === "tablet" ? "768px" : "390px",
          }}
        >
          {components.length === 0 ? (
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
              {components.map((component) => (
                <SortableItem
                  component={component}
                  key={component.id}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  onSelect={onSelect}
                />
              ))}
            </SortableContext>
          )}
        </div>
      </div>

      <AssetManager open={isAssetsOpen} onClose={() => setIsAssetsOpen(false)} />
    </main>
  );
}

export default memo(Canvas);

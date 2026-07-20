"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Clock,
  Contact,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Heading1,
  Heart,
  Home,
  Image,
  Images,
  Layers,
  LayoutGrid,
  LayoutTemplate,
  List,
  Lock,
  MapPin,
  Menu,
  Minus,
  MousePointerSquareDashed,
  PanelsTopLeft,
  Pencil,
  Play,
  Search,
  Share2,
  ShoppingBag,
  Star,
  Table,
  TextCursorInput,
  Trash2,
  Type,
  Unlock,
  X,
} from "lucide-react";
import { useBuilderStore } from "@/store/builderStore";
import type { BuilderComponent, ComponentType } from "@/types/builder";

/**
 * This metadata intentionally lives in the generic `props` bag so it is
 * persisted with a builder document without changing the public component
 * schema. Block renderers ignore unknown props, so a layer name never changes
 * a page's visual output or exported markup.
 */
const LAYER_NAME_PROP = "__stacklyLayerName";
const MAX_LAYER_NAME_LENGTH = 80;

const TYPE_ICONS: Record<ComponentType, React.ComponentType<{ className?: string }>> = {
  navigation: Menu,
  hero: Home,
  features: PanelsTopLeft,
  gallery: Images,
  contact: Contact,
  heading: Heading1,
  text: Type,
  button: MousePointerSquareDashed,
  icon: Star,
  "feature-item": Layers,
  columns: LayoutGrid,
  image: Image,
  input: TextCursorInput,
  divider: Minus,
  container: LayoutTemplate,
  video: Play,
  map: MapPin,
  accordion: List,
  tabs: LayoutTemplate,
  spacer: Minus,
  "social-links": Share2,
  countdown: Clock,
  "pricing-table": Table,
  "product-collection": ShoppingBag,
  testimonial: Heart,
  footer: AlignLeft,
  form: FileText,
  row: LayoutGrid,
};

type LayerTreeNode = {
  component: BuilderComponent;
  children: LayerTreeNode[];
};

type LayerEntry = {
  component: BuilderComponent;
  depth: number;
  parentId: string | null;
  hasVisibleChildren: boolean;
};

function childrenOf(component: BuilderComponent): BuilderComponent[] {
  // Imported legacy data is normalized before use in the store, but this
  // defensive fallback keeps the navigation panel resilient while a project
  // is loading.
  return component.children ?? [];
}

function typeLabel(type: ComponentType): string {
  return type
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getLayerName(component: BuilderComponent): string {
  const configured = component.props?.[LAYER_NAME_PROP];
  if (typeof configured === "string" && configured.trim()) {
    return configured.trim();
  }

  return typeLabel(component.type);
}

function normaliseLayerName(value: string): string {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_LAYER_NAME_LENGTH);
}

function componentMatchesSearch(component: BuilderComponent, query: string): boolean {
  if (!query) return true;

  return [getLayerName(component), typeLabel(component.type), component.content]
    .join(" ")
    .toLocaleLowerCase()
    .includes(query);
}

/** Keep matching descendants visible with their ancestor path. */
function buildFilteredTree(components: BuilderComponent[], query: string): LayerTreeNode[] {
  return components.flatMap((component) => {
    const children = buildFilteredTree(childrenOf(component), query);
    if (!componentMatchesSearch(component, query) && children.length === 0) {
      return [];
    }

    return [{ component, children }];
  });
}

function flattenVisibleTree(
  nodes: LayerTreeNode[],
  collapsedIds: ReadonlySet<string>,
  forceExpanded: boolean,
  depth = 0,
  parentId: string | null = null,
): LayerEntry[] {
  return nodes.flatMap((node) => {
    const entry: LayerEntry = {
      component: node.component,
      depth,
      parentId,
      hasVisibleChildren: node.children.length > 0,
    };
    const isExpanded = forceExpanded || !collapsedIds.has(node.component.id);

    return [
      entry,
      ...(isExpanded
        ? flattenVisibleTree(node.children, collapsedIds, forceExpanded, depth + 1, node.component.id)
        : []),
    ];
  });
}

function collectIds(components: BuilderComponent[], ids: Set<string> = new Set()): Set<string> {
  for (const component of components) {
    ids.add(component.id);
    collectIds(childrenOf(component), ids);
  }
  return ids;
}

function selectionLabel(count: number): string {
  return `${count} layer${count === 1 ? "" : "s"} selected`;
}

const IconButton = memo(function IconButton({
  label,
  onClick,
  children,
  active = false,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={`grid h-6 w-6 shrink-0 place-items-center rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 ${
        danger
          ? "text-[#94a3b8] hover:bg-rose-50 hover:text-rose-600"
          : active
            ? "bg-blue-100 text-blue-700"
            : "text-[#94a3b8] hover:bg-[#eaf0f8] hover:text-[#0B1D40]"
      }`}
    >
      {children}
    </button>
  );
});

const LayerRow = memo(function LayerRow({
  entry,
  isPrimarySelected,
  isTabStop,
  isMultiSelected,
  isExpanded,
  isRenaming,
  renameValue,
  onSelect,
  onToggleExpand,
  onStartRename,
  onRenameChange,
  onRenameCommit,
  onRenameCancel,
  onDuplicate,
  onDelete,
  onToggleHidden,
  onToggleLock,
  onUngroup,
  canUngroup,
  onMoveUp,
  onMoveDown,
  onRowKeyDown,
  registerRowRef,
}: {
  entry: LayerEntry;
  isPrimarySelected: boolean;
  isTabStop: boolean;
  isMultiSelected: boolean;
  isExpanded: boolean;
  isRenaming: boolean;
  renameValue: string;
  onSelect: (event: React.MouseEvent, id: string) => void;
  onToggleExpand: (id: string) => void;
  onStartRename: (component: BuilderComponent) => void;
  onRenameChange: (value: string) => void;
  onRenameCommit: (component: BuilderComponent) => void;
  onRenameCancel: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleHidden: (id: string) => void;
  onToggleLock: (id: string) => void;
  onUngroup: (id: string) => void;
  canUngroup: boolean;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onRowKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>, entry: LayerEntry) => void;
  registerRowRef: (id: string, node: HTMLDivElement | null) => void;
}) {
  const { component, depth, hasVisibleChildren } = entry;
  const Icon = TYPE_ICONS[component.type];
  const label = getLayerName(component);
  const isLocked = Boolean(component.locked);
  const isHidden = Boolean(component.hidden);

  return (
    <div
      ref={(node) => registerRowRef(component.id, node)}
      role="treeitem"
      aria-level={depth + 1}
      aria-selected={isMultiSelected}
      aria-expanded={hasVisibleChildren ? isExpanded : undefined}
      tabIndex={isTabStop ? 0 : -1}
      className={`group flex min-h-8 w-full select-none items-center gap-1 rounded-md py-1 pr-1 text-xs outline-none transition-colors duration-100 focus-visible:ring-2 focus-visible:ring-blue-300 ${
        isPrimarySelected
          ? "bg-blue-500/[0.12] font-semibold text-blue-700"
          : isMultiSelected
            ? "bg-blue-500/[0.07] font-semibold text-blue-600"
            : "font-medium text-[#566583] hover:bg-black/[0.04] hover:text-[#0B1D40]"
      }`}
      style={{ paddingLeft: `${8 + depth * 14}px` }}
      onClick={(event) => onSelect(event, component.id)}
      onKeyDown={(event) => onRowKeyDown(event, entry)}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label={`${isExpanded ? "Collapse" : "Expand"} ${label}`}
        aria-hidden={!hasVisibleChildren}
        disabled={!hasVisibleChildren}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[#94a3b8] transition-transform duration-150 hover:bg-[#eaf0f8] hover:text-[#0B1D40] disabled:pointer-events-none ${
          hasVisibleChildren ? "" : "invisible"
        }`}
        onClick={(event) => {
          event.stopPropagation();
          onToggleExpand(component.id);
        }}
      >
        <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-150 ${isExpanded ? "rotate-90" : ""}`} />
      </button>

      <Icon className={`h-3.5 w-3.5 shrink-0 ${isMultiSelected ? "text-blue-500" : "text-[#94a3b8]"}`} />

      {isRenaming ? (
        <input
          autoFocus
          value={renameValue}
          maxLength={MAX_LAYER_NAME_LENGTH}
          aria-label={`Rename ${typeLabel(component.type)} layer`}
          className="min-w-0 flex-1 rounded border border-blue-300 bg-white px-1.5 py-0.5 text-xs font-medium text-[#0B1D40] outline-none ring-2 ring-blue-100"
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => onRenameChange(event.target.value)}
          onBlur={() => onRenameCommit(component)}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === "Enter") {
              event.preventDefault();
              onRenameCommit(component);
            }
            if (event.key === "Escape") {
              event.preventDefault();
              onRenameCancel();
            }
          }}
        />
      ) : (
        <span className={`min-w-0 flex-1 truncate ${isHidden ? "line-through opacity-70" : ""}`} title={label}>
          {label}
        </span>
      )}

      {!isRenaming && (
        <div className="flex shrink-0 items-center opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <IconButton label="Rename layer" onClick={() => onStartRename(component)}>
            <Pencil className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton label="Move layer up" onClick={() => onMoveUp(component.id)}>
            <ArrowUp className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton label="Move layer down" onClick={() => onMoveDown(component.id)}>
            <ArrowDown className="h-3.5 w-3.5" />
          </IconButton>
          {canUngroup
            && component.type === "container"
            && component.props?.__stacklyGroup === true
            && childrenOf(component).length > 0 && (
            <IconButton label="Ungroup container" onClick={() => onUngroup(component.id)}>
              <LayoutTemplate className="h-3.5 w-3.5" />
            </IconButton>
          )}
          <IconButton label="Duplicate layer" onClick={() => onDuplicate(component.id)}>
            <Copy className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton label={isHidden ? "Show layer" : "Hide layer"} active={isHidden} onClick={() => onToggleHidden(component.id)}>
            {isHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </IconButton>
          <IconButton label={isLocked ? "Unlock layer" : "Lock layer"} active={isLocked} onClick={() => onToggleLock(component.id)}>
            {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
          </IconButton>
          <IconButton label="Delete layer" danger onClick={() => onDelete(component.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      )}
    </div>
  );
});

export default function LayersPanel() {
  const components = useBuilderStore((s) => s.components);
  const selectedComponentId = useBuilderStore((s) => s.selectedComponentId);
  const selectedComponentIds = useBuilderStore((s) => s.selectedComponentIds);
  const canvasMode = useBuilderStore((s) => s.canvasMode);
  const selectComponent = useBuilderStore((s) => s.selectComponent);
  const toggleSelectComponent = useBuilderStore((s) => s.toggleSelectComponent);
  const setSelectedComponentIds = useBuilderStore((s) => s.setSelectedComponentIds);
  const updateComponent = useBuilderStore((s) => s.updateComponent);
  const duplicateComponent = useBuilderStore((s) => s.duplicateComponent);
  const duplicateSelectedComponents = useBuilderStore((s) => s.duplicateSelectedComponents);
  const deleteComponent = useBuilderStore((s) => s.deleteComponent);
  const deleteSelectedComponents = useBuilderStore((s) => s.deleteSelectedComponents);
  const groupSelectedComponents = useBuilderStore((s) => s.groupSelectedComponents);
  const ungroupComponent = useBuilderStore((s) => s.ungroupComponent);
  const applyStylesToSelected = useBuilderStore((s) => s.applyStylesToSelected);
  const hideComponent = useBuilderStore((s) => s.hideComponent);
  const toggleLock = useBuilderStore((s) => s.toggleLock);
  const moveComponentUp = useBuilderStore((s) => s.moveComponentUp);
  const moveComponentDown = useBuilderStore((s) => s.moveComponentDown);
  const moveLayer = useBuilderStore((s) => s.moveLayer);
  const copyComponents = useBuilderStore((s) => s.copyComponents);
  const pasteComponents = useBuilderStore((s) => s.pasteComponents);

  const [query, setQuery] = useState("");
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const selectionAnchorRef = useRef<string | null>(null);
  const renameSettledRef = useRef(false);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());

  const normalisedQuery = query.trim().toLocaleLowerCase();
  const filteredTree = useMemo(
    () => buildFilteredTree(components, normalisedQuery),
    [components, normalisedQuery],
  );
  const visibleEntries = useMemo(
    () => flattenVisibleTree(filteredTree, collapsedIds, Boolean(normalisedQuery)),
    [filteredTree, collapsedIds, normalisedQuery],
  );
  const componentIds = useMemo(() => collectIds(components), [components]);
  const selectedIdSet = useMemo(() => new Set(selectedComponentIds), [selectedComponentIds]);

  useEffect(() => {
    // A deleted/imported layer should not leave stale collapse state behind.
    setCollapsedIds((current) => {
      const next = new Set([...current].filter((id) => componentIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [componentIds]);

  useEffect(() => {
    if (renamingId && !componentIds.has(renamingId)) {
      setRenamingId(null);
      setRenameValue("");
    }
  }, [componentIds, renamingId]);

  const focusEntry = useCallback((id: string) => {
    window.requestAnimationFrame(() => rowRefs.current.get(id)?.focus());
  }, []);

  const registerRowRef = useCallback((id: string, node: HTMLDivElement | null) => {
    if (node) rowRefs.current.set(id, node);
    else rowRefs.current.delete(id);
  }, []);

  const selectSingle = useCallback((id: string, focus = false) => {
    selectionAnchorRef.current = id;
    selectComponent(id);
    if (focus) focusEntry(id);
  }, [focusEntry, selectComponent]);

  const toggleSelection = useCallback((id: string, focus = false) => {
    selectionAnchorRef.current ??= id;
    toggleSelectComponent(id);
    if (focus) focusEntry(id);
  }, [focusEntry, toggleSelectComponent]);

  const selectRange = useCallback((id: string, focus = false) => {
    const targetIndex = visibleEntries.findIndex((entry) => entry.component.id === id);
    if (targetIndex < 0) return;

    const anchorId = selectionAnchorRef.current ?? selectedComponentId ?? id;
    const anchorIndex = visibleEntries.findIndex((entry) => entry.component.id === anchorId);
    const start = Math.min(anchorIndex < 0 ? targetIndex : anchorIndex, targetIndex);
    const end = Math.max(anchorIndex < 0 ? targetIndex : anchorIndex, targetIndex);

    setSelectedComponentIds(visibleEntries.slice(start, end + 1).map((entry) => entry.component.id));
    if (focus) focusEntry(id);
  }, [focusEntry, selectedComponentId, setSelectedComponentIds, visibleEntries]);

  const toggleExpand = useCallback((id: string) => {
    setCollapsedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => setCollapsedIds(new Set()), []);
  const collapseAll = useCallback(() => setCollapsedIds(new Set([...componentIds])), [componentIds]);

  const startRename = useCallback((component: BuilderComponent) => {
    renameSettledRef.current = false;
    setRenamingId(component.id);
    setRenameValue(getLayerName(component));
  }, []);

  const cancelRename = useCallback(() => {
    renameSettledRef.current = true;
    setRenamingId(null);
    setRenameValue("");
  }, []);

  const commitRename = useCallback((component: BuilderComponent) => {
    // Enter causes a blur after this handler. Only persist the rename once,
    // and let Escape cancel without the following blur accidentally saving.
    if (renameSettledRef.current) return;
    renameSettledRef.current = true;

    const nextName = normaliseLayerName(renameValue);
    const configuredName = component.props?.[LAYER_NAME_PROP];

    // Empty values restore the default type label. `undefined` is omitted by
    // JSON serialization, while the component readers continue to ignore this
    // editor-only prop.
    const defaultName = typeLabel(component.type);
    const shouldClear = !nextName || nextName === defaultName;
    const nextStoredName = shouldClear ? undefined : nextName;
    if (nextStoredName !== configuredName) {
      updateComponent(component.id, { props: { [LAYER_NAME_PROP]: nextStoredName } });
    }
    setRenamingId(null);
    setRenameValue("");
  }, [renameValue, updateComponent]);

  const handleSelect = useCallback((event: React.MouseEvent, id: string) => {
    if (event.shiftKey) {
      selectRange(id);
      return;
    }
    if (event.metaKey || event.ctrlKey) {
      toggleSelection(id);
      return;
    }
    selectSingle(id);
  }, [selectRange, selectSingle, toggleSelection]);

  const handleDuplicateSelection = useCallback(() => {
    duplicateSelectedComponents();
  }, [duplicateSelectedComponents]);

  const handleDeleteSelection = useCallback(() => {
    deleteSelectedComponents();
  }, [deleteSelectedComponents]);

  const handleTreeKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>, entry: LayerEntry) => {
    const currentIndex = visibleEntries.findIndex((item) => item.component.id === entry.component.id);
    const current = currentIndex >= 0 ? visibleEntries[currentIndex] : entry;
    const isMod = event.metaKey || event.ctrlKey;
    const stop = () => {
      event.preventDefault();
      event.stopPropagation();
    };

    if (isMod) {
      const key = event.key.toLowerCase();
      if (key === "a") {
        stop();
        selectionAnchorRef.current = visibleEntries[0]?.component.id ?? null;
        setSelectedComponentIds(visibleEntries.map((item) => item.component.id));
        return;
      }
      if (key === "c") {
        stop();
        copyComponents();
        return;
      }
      if (key === "v") {
        stop();
        pasteComponents();
        return;
      }
      if (key === "d") {
        stop();
        handleDuplicateSelection();
        return;
      }
      if (key === "x") {
        stop();
        copyComponents();
        handleDeleteSelection();
        return;
      }
      if (key === "g") {
        stop();
        if (event.shiftKey) ungroupComponent(current.component.id);
        else groupSelectedComponents();
        return;
      }
    }

    if (event.key === "Delete" || event.key === "Backspace") {
      stop();
      handleDeleteSelection();
      return;
    }

    if (event.key === "F2") {
      stop();
      startRename(current.component);
      return;
    }

    if (event.key === "Escape") {
      stop();
      setSelectedComponentIds([]);
      return;
    }

    if (event.key === " " || event.key === "Enter") {
      stop();
      if (event.key === " ") toggleSelection(current.component.id, true);
      else selectSingle(current.component.id, true);
      return;
    }

    if (event.key === "Home" && visibleEntries[0]) {
      stop();
      selectSingle(visibleEntries[0].component.id, true);
      return;
    }

    if (event.key === "End" && visibleEntries.length > 0) {
      stop();
      selectSingle(visibleEntries[visibleEntries.length - 1].component.id, true);
      return;
    }

    if (event.key === "ArrowDown") {
      stop();
      if (currentIndex < visibleEntries.length - 1) {
        const next = visibleEntries[currentIndex + 1];
        if (event.shiftKey) selectRange(next.component.id, true);
        else selectSingle(next.component.id, true);
      }
      return;
    }

    if (event.key === "ArrowUp") {
      stop();
      if (currentIndex > 0) {
        const previous = visibleEntries[currentIndex - 1];
        if (event.shiftKey) selectRange(previous.component.id, true);
        else selectSingle(previous.component.id, true);
      }
      return;
    }

    if (event.key === "ArrowRight") {
      stop();
      if (current.hasVisibleChildren) {
        const isCollapsed = collapsedIds.has(current.component.id) && !normalisedQuery;
        if (isCollapsed) {
          toggleExpand(current.component.id);
        } else {
          const child = visibleEntries.find((item) => item.parentId === current.component.id);
          if (child) selectSingle(child.component.id, true);
        }
      }
      return;
    }

    if (event.key === "ArrowLeft") {
      stop();
      const isExpanded = current.hasVisibleChildren && (!collapsedIds.has(current.component.id) || Boolean(normalisedQuery));
      if (isExpanded && !normalisedQuery) {
        toggleExpand(current.component.id);
      } else if (current.parentId) {
        selectSingle(current.parentId, true);
      }
    }
  }, [collapsedIds, copyComponents, groupSelectedComponents, handleDeleteSelection, handleDuplicateSelection, normalisedQuery, pasteComponents, selectRange, selectSingle, setSelectedComponentIds, startRename, toggleExpand, toggleSelection, ungroupComponent, visibleEntries]);

  const moveUp = useCallback((id: string) => {
    if (canvasMode === "freeform") moveLayer(id, "forward");
    else moveComponentUp(id);
  }, [canvasMode, moveComponentUp, moveLayer]);

  const moveDown = useCallback((id: string) => {
    if (canvasMode === "freeform") moveLayer(id, "backward");
    else moveComponentDown(id);
  }, [canvasMode, moveComponentDown, moveLayer]);

  if (components.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <Layers className="h-8 w-8 text-[#dbe3ef]" />
        <p className="text-xs font-semibold text-[#566583]">No layers yet</p>
        <p className="text-[11px] leading-5 text-[#94a3b8]">
          Add blocks from the palette to see your component tree here.
        </p>
      </div>
    );
  }

  return (
    <section className="flex min-h-0 flex-col" aria-label="Layers">
      <div className="sticky top-0 z-10 space-y-2 border-b border-[#edf1f6] bg-white px-3 py-2.5">
        <label className="relative block">
          <span className="sr-only">Search layers</span>
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search layers"
            className="h-8 w-full rounded-md border border-[#dbe3ef] bg-[#f8fafc] py-1 pl-8 pr-7 text-xs text-[#0B1D40] outline-none placeholder:text-[#94a3b8] focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            onKeyDown={(event) => {
              // BuilderLayout owns global shortcuts. Keep normal text editing
              // inside the search field from triggering canvas operations.
              event.stopPropagation();
              if (event.key === "Escape" && query) {
                event.preventDefault();
                setQuery("");
              }
            }}
          />
          {query && (
            <button
              type="button"
              aria-label="Clear layer search"
              onClick={() => setQuery("")}
              className="absolute right-1.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded text-[#94a3b8] hover:bg-[#eaf0f8] hover:text-[#0B1D40]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </label>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">
            {normalisedQuery ? `${visibleEntries.length} result${visibleEntries.length === 1 ? "" : "s"}` : "Layer hierarchy"}
          </span>
          <div className="flex items-center gap-1 text-[10px] font-semibold">
            <button type="button" onClick={expandAll} className="rounded px-1.5 py-1 text-[#566583] hover:bg-[#eef3f9] hover:text-[#0B1D40]">
              Expand
            </button>
            <button type="button" onClick={collapseAll} className="rounded px-1.5 py-1 text-[#566583] hover:bg-[#eef3f9] hover:text-[#0B1D40]">
              Collapse
            </button>
          </div>
        </div>
      </div>

      {selectedComponentIds.length > 1 && (
        <div className="mx-2 mt-2 flex items-center gap-1 rounded-md border border-blue-100 bg-blue-50 px-2 py-1.5 text-[11px] text-blue-800">
          <span className="min-w-0 flex-1 truncate font-semibold">{selectionLabel(selectedComponentIds.length)}</span>
          <IconButton label="Copy selected layers" onClick={copyComponents}>
            <Copy className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton label="Duplicate selected layers" onClick={handleDuplicateSelection}>
            <Copy className="h-3.5 w-3.5" />
          </IconButton>
          {canvasMode === "flow" && (
            <IconButton label="Group selected layers" onClick={groupSelectedComponents}>
              <LayoutTemplate className="h-3.5 w-3.5" />
            </IconButton>
          )}
          <label title="Apply text color to selected layers" className="flex h-6 items-center gap-0.5 rounded px-0.5 text-[10px] font-bold text-blue-700 hover:bg-blue-100">
            T
            <input
              aria-label="Apply text color to selected layers"
              type="color"
              defaultValue="#0b1d40"
              onChange={(event) => applyStylesToSelected({ color: event.currentTarget.value })}
              className="h-4 w-4 cursor-pointer rounded border border-blue-200 bg-white p-0"
            />
          </label>
          <label title="Apply background color to selected layers" className="flex h-6 items-center gap-0.5 rounded px-0.5 text-[10px] font-bold text-blue-700 hover:bg-blue-100">
            F
            <input
              aria-label="Apply background color to selected layers"
              type="color"
              defaultValue="#ffffff"
              onChange={(event) => applyStylesToSelected({ backgroundColor: event.currentTarget.value })}
              className="h-4 w-4 cursor-pointer rounded border border-blue-200 bg-white p-0"
            />
          </label>
          <IconButton label="Delete selected layers" danger onClick={handleDeleteSelection}>
            <Trash2 className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      )}

      {canvasMode === "freeform" && (
        <p className="mx-2 mt-2 rounded-md border border-amber-100 bg-amber-50 px-2 py-1.5 text-[10px] leading-4 text-amber-800">
          Freeform positions top-level blocks. Nested layers keep their parent&apos;s flow layout.
        </p>
      )}

      {visibleEntries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <Search className="h-5 w-5 text-[#cbd5e1]" />
          <p className="text-xs font-semibold text-[#566583]">No matching layers</p>
          <button type="button" onClick={() => setQuery("")} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
            Clear search
          </button>
        </div>
      ) : (
        <div className="px-2 py-2" role="tree" aria-label="Page layers" aria-multiselectable="true">
          {visibleEntries.map((entry) => {
            const id = entry.component.id;
            return (
              <LayerRow
                key={id}
                entry={entry}
                isPrimarySelected={selectedComponentId === id}
                isTabStop={selectedComponentId === id || (!selectedComponentId && visibleEntries[0]?.component.id === id)}
                isMultiSelected={selectedIdSet.has(id)}
                isExpanded={Boolean(normalisedQuery) || !collapsedIds.has(id)}
                isRenaming={renamingId === id}
                renameValue={renamingId === id ? renameValue : ""}
                onSelect={handleSelect}
                onToggleExpand={toggleExpand}
                onStartRename={startRename}
                onRenameChange={setRenameValue}
                onRenameCommit={commitRename}
                onRenameCancel={cancelRename}
                onDuplicate={duplicateComponent}
                onDelete={deleteComponent}
                onToggleHidden={hideComponent}
                onToggleLock={toggleLock}
                onUngroup={ungroupComponent}
                canUngroup={canvasMode === "flow"}
                onMoveUp={moveUp}
                onMoveDown={moveDown}
                onRowKeyDown={handleTreeKeyDown}
                registerRowRef={registerRowRef}
              />
            );
          })}
        </div>
      )}

      <p className="border-t border-[#edf1f6] px-3 py-2 text-[10px] leading-4 text-[#94a3b8]">
        <kbd className="rounded border border-[#dbe3ef] bg-[#f8fafc] px-1 font-medium text-[#566583]">↑↓</kbd> navigate · <kbd className="rounded border border-[#dbe3ef] bg-[#f8fafc] px-1 font-medium text-[#566583]">Space</kbd> multi-select · <kbd className="rounded border border-[#dbe3ef] bg-[#f8fafc] px-1 font-medium text-[#566583]">F2</kbd> rename
      </p>
    </section>
  );
}

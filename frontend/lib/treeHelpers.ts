/**
 * Recursive tree helpers for the BuilderComponent tree.
 *
 * Extracted from builderStore.ts for reuse across the codebase
 * (import/export validation, drag-and-drop logic, etc.) and to
 * keep the store file focused on state management.
 */

import { v4 as uuidv4 } from "uuid";
import type { BuilderComponent } from "@/types/builder";

/* ─── Lookup ──────────────────────────────────────────────────────────── */

/** Find a component anywhere in the tree by id. */
export const findComponentById = (
  components: BuilderComponent[],
  id: string,
): BuilderComponent | null => {
  for (const c of components) {
    if (c.id === id) return c;
    const found = findComponentById(c.children, id);
    if (found) return found;
  }
  return null;
};

/** Find the parent component of a given child id. Returns null if root-level. */
export const findParentOf = (
  components: BuilderComponent[],
  childId: string,
): BuilderComponent | null => {
  for (const c of components) {
    if (c.children.some((ch) => ch.id === childId)) return c;
    const found = findParentOf(c.children, childId);
    if (found) return found;
  }
  return null;
};

/* ─── Immutable tree transforms ───────────────────────────────────────── */

/** Apply an updater function to the component with the given id. */
export const updateNodeById = (
  components: BuilderComponent[],
  id: string,
  updater: (c: BuilderComponent) => BuilderComponent,
): BuilderComponent[] => {
  let mutated = false;
  const result = components.map((c) => {
    if (c.id === id) {
      mutated = true;
      return updater(c);
    }
    if (c.children.length === 0) return c;
    const newChildren = updateNodeById(c.children, id, updater);
    if (newChildren === c.children) return c;
    mutated = true;
    return { ...c, children: newChildren };
  });
  return mutated ? result : components;
};

/** Remove a component from the tree by id. */
export const deleteNodeById = (
  components: BuilderComponent[],
  id: string,
): BuilderComponent[] => {
  const topIdx = components.findIndex((c) => c.id === id);

  if (topIdx >= 0) {
    return [...components.slice(0, topIdx), ...components.slice(topIdx + 1)];
  }

  let mutated = false;
  const result = components.map((c) => {
    if (c.children.length === 0) return c;
    const newChildren = deleteNodeById(c.children, id);
    if (newChildren === c.children) return c;
    mutated = true;
    return { ...c, children: newChildren };
  });
  return mutated ? result : components;
};

/** Insert a new node after the node with the given id. Returns null if id not found. */
export const insertAfterNodeById = (
  components: BuilderComponent[],
  id: string,
  newNode: BuilderComponent,
): BuilderComponent[] | null => {
  const index = components.findIndex((c) => c.id === id);

  if (index >= 0) {
    return [...components.slice(0, index + 1), newNode, ...components.slice(index + 1)];
  }

  for (let i = 0; i < components.length; i++) {
    const newChildren = insertAfterNodeById(components[i].children, id, newNode);

    if (newChildren !== null) {
      return [
        ...components.slice(0, i),
        { ...components[i], children: newChildren },
        ...components.slice(i + 1),
      ];
    }
  }

  return null;
};

/** Insert a new node before the node with the given id. Returns null if id not found. */
export const insertBeforeNodeById = (
  components: BuilderComponent[],
  id: string,
  newNode: BuilderComponent,
): BuilderComponent[] | null => {
  const index = components.findIndex((c) => c.id === id);

  if (index >= 0) {
    return [...components.slice(0, index), newNode, ...components.slice(index)];
  }

  for (let i = 0; i < components.length; i++) {
    const newChildren = insertBeforeNodeById(components[i].children, id, newNode);

    if (newChildren !== null) {
      return [
        ...components.slice(0, i),
        { ...components[i], children: newChildren },
        ...components.slice(i + 1),
      ];
    }
  }

  return null;
};

/* ─── Clone helpers ───────────────────────────────────────────────────── */

/** Deep clone a component, assigning new ids to the clone and all its descendants. */
export const deepCloneComponent = (component: BuilderComponent): BuilderComponent => ({
  ...component,
  id: uuidv4(),
  styles: { ...component.styles },
  textStyles: component.textStyles ? { ...component.textStyles } : undefined,
  props: component.props ? { ...component.props } : undefined,
  responsiveStyles: component.responsiveStyles
    ? {
        tablet: component.responsiveStyles.tablet ? { ...component.responsiveStyles.tablet } : undefined,
        mobile: component.responsiveStyles.mobile ? { ...component.responsiveStyles.mobile } : undefined,
      }
    : undefined,
  children: component.children.map(deepCloneComponent),
});

/** Shallow-clone an entire component tree (preserves ids). */
export const cloneComponentTree = (components: BuilderComponent[]): BuilderComponent[] =>
  components.map((component) => ({
    ...component,
    styles: { ...component.styles },
    textStyles: component.textStyles ? { ...component.textStyles } : undefined,
    props: component.props ? { ...component.props } : undefined,
    responsiveStyles: component.responsiveStyles
      ? {
          tablet: component.responsiveStyles.tablet ? { ...component.responsiveStyles.tablet } : undefined,
          mobile: component.responsiveStyles.mobile ? { ...component.responsiveStyles.mobile } : undefined,
        }
      : undefined,
    children: cloneComponentTree(component.children ?? []),
  }));

/* ─── Ordering helpers ────────────────────────────────────────────────── */

/** Re-assign `order` properties to match array index. */
export const orderComponents = (components: BuilderComponent[]) =>
  components.map((component, index) => ({ ...component, order: index }));

/**
 * Move a component one position up or down among its siblings.
 * Returns null if the component is already at the boundary.
 */
export const moveInSiblings = (
  components: BuilderComponent[],
  id: string,
  direction: "up" | "down",
): BuilderComponent[] | null => {
  // Try at root level first
  const rootIdx = components.findIndex((c) => c.id === id);
  if (rootIdx >= 0) {
    const newIdx = direction === "up" ? rootIdx - 1 : rootIdx + 1;
    if (newIdx < 0 || newIdx >= components.length) return null;
    const result = [...components];
    [result[rootIdx], result[newIdx]] = [result[newIdx], result[rootIdx]];
    return result;
  }

  // Try in children
  for (let i = 0; i < components.length; i++) {
    const childIdx = components[i].children.findIndex((c) => c.id === id);
    if (childIdx >= 0) {
      const newIdx = direction === "up" ? childIdx - 1 : childIdx + 1;
      if (newIdx < 0 || newIdx >= components[i].children.length) return null;
      const newChildren = [...components[i].children];
      [newChildren[childIdx], newChildren[newIdx]] = [newChildren[newIdx], newChildren[childIdx]];
      return [
        ...components.slice(0, i),
        { ...components[i], children: newChildren },
        ...components.slice(i + 1),
      ];
    }
    // Recurse into deeper children
    const result = moveInSiblings(components[i].children, id, direction);
    if (result !== null) {
      return [
        ...components.slice(0, i),
        { ...components[i], children: result },
        ...components.slice(i + 1),
      ];
    }
  }

  return null;
};

/* ─── Validation helpers ──────────────────────────────────────────────── */

/** Check if `ancestorId` is an ancestor of `descendantId` in the tree. */
export const isAncestorOf = (
  components: BuilderComponent[],
  ancestorId: string,
  descendantId: string,
): boolean => {
  const ancestor = findComponentById(components, ancestorId);
  if (!ancestor) return false;
  return findComponentById(ancestor.children, descendantId) !== null;
};

/**
 * Collect all component ids in a tree (including nested children).
 */
export const collectAllIds = (components: BuilderComponent[]): Set<string> => {
  const ids = new Set<string>();
  const visit = (comps: BuilderComponent[]) => {
    for (const c of comps) {
      ids.add(c.id);
      visit(c.children);
    }
  };
  visit(components);
  return ids;
};

/**
 * Regenerate duplicate ids in a component tree.
 * Ensures every component has a unique id.
 */
export const deduplicateIds = (components: BuilderComponent[]): BuilderComponent[] => {
  const seen = new Set<string>();
  const fix = (comp: BuilderComponent): BuilderComponent => {
    let id = comp.id;
    if (seen.has(id)) {
      id = uuidv4();
    }
    seen.add(id);
    return {
      ...comp,
      id,
      children: comp.children.map(fix),
    };
  };
  return components.map(fix);
};

/**
 * Get the sibling list and index of a component within its parent.
 * Returns null if not found.
 */
export const getSiblingContext = (
  components: BuilderComponent[],
  id: string,
): { siblings: BuilderComponent[]; index: number; parentId: string | null } | null => {
  const rootIdx = components.findIndex((c) => c.id === id);
  if (rootIdx >= 0) {
    return { siblings: components, index: rootIdx, parentId: null };
  }

  const parent = findParentOf(components, id);
  if (!parent) return null;
  const idx = parent.children.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  return { siblings: parent.children, index: idx, parentId: parent.id };
};

/**
 * Reorder component tree: moves activeId adjacent to overId or inside it if overId is a container.
 * Returns the modified tree, or the original tree if invalid or noop.
 */
export const reorderTreeComponents = (
  components: BuilderComponent[],
  activeId: string,
  overId: string,
): BuilderComponent[] => {
  if (activeId === overId) return components;

  // 1. Check for invalid ancestry: dragging container inside itself
  if (isAncestorOf(components, activeId, overId)) {
    return components;
  }

  // 2. Find active component
  const activeNode = findComponentById(components, activeId);
  if (!activeNode) return components;

  // 3. Remove activeId from current place
  const treeWithoutActive = deleteNodeById(components, activeId);

  // 4. Handle canvas root drop
  if (overId === "builder-canvas") {
    return [...treeWithoutActive, activeNode];
  }

  // 5. Find over component
  const overNode = findComponentById(treeWithoutActive, overId);
  if (!overNode) return components;

  // 6. Check if overNode is a container where we can drop inside
  const isContainer = overNode.type === "container" || overNode.type === "columns" || overNode.type === "row";

  if (isContainer) {
    return updateNodeById(treeWithoutActive, overId, (c) => ({
      ...c,
      children: [...c.children, activeNode],
    }));
  }

  // 7. Insert adjacent as sibling of overNode
  const parent = findParentOf(treeWithoutActive, overId);
  if (parent) {
    const idx = parent.children.findIndex((c) => c.id === overId);
    if (idx >= 0) {
      const nextChildren = [...parent.children];
      nextChildren.splice(idx, 0, activeNode);
      return updateNodeById(treeWithoutActive, parent.id, (p) => ({
        ...p,
        children: nextChildren,
      }));
    }
  } else {
    // Both are at root level
    const idx = treeWithoutActive.findIndex((c) => c.id === overId);
    if (idx >= 0) {
      const nextRoot = [...treeWithoutActive];
      nextRoot.splice(idx, 0, activeNode);
      return nextRoot;
    }
  }

  return components;
};


"use client";

import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import {
  getProjects,
  getProject as apiGetProject,
  createProject as apiCreateProject,
  updateProject as apiUpdateProject,
  deleteProject as apiDeleteProject,
  autosaveProject,
  isProjectConnectionError,
  type ProjectApiProject,
} from "@/lib/projectApi";
import type { Project, ProjectSort, ProjectSortKey, ProjectSortOrder } from "@/types/project";
import { useBuilderStore } from "@/store/builderStore";

type EditableProjectUpdates = Partial<Pick<
  Project,
  "name" | "description" | "category" | "style" | "sections" | "status"
>>;

function sortProjects(projects: Project[], sort: ProjectSort): Project[] {
  const sorted = [...projects];
  sorted.sort((a, b) => {
    let cmp = 0;
    if (sort.key === "name") {
      cmp = a.name.localeCompare(b.name);
    } else if (sort.key === "createdAt") {
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else {
      cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }
    return sort.order === "desc" ? -cmp : cmp;
  });
  return sorted;
}

function mapApiProject(project: ProjectApiProject): Project {
  const now = new Date().toISOString();
  const builderData = project.builderData ?? {};

  return {
    id: project._id,
    name: project.projectName || builderData.projectName || "Untitled Project",
    description: project.description,
    category: project.category || "Business",
    style: project.style || "Modern",
    sections: project.sections ?? [],
    components: builderData.components ?? builderData.sections ?? [],
    designTokens: builderData.designTokens,
    status: project.status || "draft",
    createdAt: project.createdAt || project.updatedAt || now,
    updatedAt: project.updatedAt || project.createdAt || now,
  };
}

function toProjectUpdatePayload(updates: EditableProjectUpdates) {
  const payload: Parameters<typeof apiUpdateProject>[1] = {};
  if (typeof updates.name !== "undefined") payload.projectName = updates.name;
  if (typeof updates.description !== "undefined") payload.description = updates.description;
  if (typeof updates.category !== "undefined") payload.category = updates.category;
  if (typeof updates.style !== "undefined") payload.style = updates.style;
  if (typeof updates.sections !== "undefined") payload.sections = updates.sections;
  if (typeof updates.status !== "undefined") payload.status = updates.status;
  return payload;
}

function getProjectUpdateError(error: unknown): string {
  if (isProjectConnectionError(error)) {
    return "Unable to reach the project service. Your settings have not been saved.";
  }
  return error instanceof Error ? error.message : "Unable to save project settings.";
}

interface ProjectState {
  projects: Project[];
  searchQuery: string;
  sort: ProjectSort;
  isLoading: boolean;
  updatingProjectId: string | null;
  error: string | null;

  loadProjects: (signal?: AbortSignal) => Promise<void>;
  createProject: (data: Pick<Project, "name" | "category" | "style" | "sections">) => Project;
  /** Persists only changed editable fields, then replaces local data with the server record. */
  updateProject: (id: string, updates: EditableProjectUpdates) => Promise<Project>;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;
  setSearchQuery: (query: string) => void;
  setSort: (key: ProjectSortKey, order?: ProjectSortOrder) => void;
  resetProjects: () => void;
  clearError: () => void;

  getFilteredProjects: () => Project[];
  getProjectById: (id: string) => Project | undefined;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  searchQuery: "",
  sort: { key: "updatedAt", order: "desc" },
  isLoading: false,
  updatingProjectId: null,
  error: null,

  loadProjects: async (signal) => {
    set({ isLoading: true, error: null });

    try {
      const projects = (await getProjects(signal)).map(mapApiProject);
      set({ projects, isLoading: false, error: null });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        set({ isLoading: false });
        return;
      }

      set({
        isLoading: false,
        error: isProjectConnectionError(error)
          ? "Unable to reach the project service. Check your connection and retry."
          : error instanceof Error
            ? error.message
            : "Unable to load projects.",
      });
    }
  },

  createProject: (data) => {
    const now = new Date().toISOString();
    const project: Project = {
      id: uuidv4(),
      name: data.name,
      category: data.category,
      style: data.style,
      sections: data.sections,
      components: [],
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };
    set({ projects: [project, ...get().projects] });
    return project;
  },

  updateProject: async (id, updates) => {
    const existing = get().projects.find((project) => project.id === id);
    if (!existing) {
      throw new Error("This project could not be found. Refresh the dashboard and try again.");
    }

    const payload = toProjectUpdatePayload(updates);
    if (Object.keys(payload).length === 0) return existing;

    set({ updatingProjectId: id, error: null });
    try {
      const updated = mapApiProject(await apiUpdateProject(id, payload));
      set((state) => ({
        projects: state.projects.map((project) => project.id === id ? updated : project),
        updatingProjectId: null,
        error: null,
      }));

      // Keep an open builder's title in sync without marking its canvas dirty.
      if (useBuilderStore.getState().currentProjectId === id) {
        useBuilderStore.setState({ currentProjectName: updated.name });
      }
      return updated;
    } catch (error) {
      const message = getProjectUpdateError(error);
      set((state) => ({
        updatingProjectId: state.updatingProjectId === id ? null : state.updatingProjectId,
        error: message,
      }));
      throw new Error(message);
    }
  },

  deleteProject: (id) => {
    // Optimistic removal; restore the snapshot if the backend rejects it.
    const snapshot = get().projects;
    set({ projects: snapshot.filter((p) => p.id !== id), error: null });

    void apiDeleteProject(id).catch((error) => {
      set({
        projects: snapshot,
        error: isProjectConnectionError(error)
          ? "Unable to reach the project service. The project was not deleted."
          : error instanceof Error
            ? error.message
            : "Unable to delete this project.",
      });
    });
  },

  duplicateProject: (id) => {
    set({ error: null });

    void (async () => {
      try {
        // Pull the full source (list view omits the large builderData blob).
        const source = await apiGetProject(id);
        const created = await apiCreateProject({
          projectName: `${source.projectName || "Untitled Project"} (Copy)`,
          category: source.category,
          style: source.style,
          sections: source.sections,
          description: source.description,
        });

        // Copy the actual builder content + rendered HTML into the new project.
        if (source.builderData || source.htmlContent) {
          await autosaveProject(created._id, {
            builderData: source.builderData ?? {},
            htmlContent: source.htmlContent ?? "",
          });
        }

        await get().loadProjects();
      } catch (error) {
        set({
          error: isProjectConnectionError(error)
            ? "Unable to reach the project service. The project was not duplicated."
            : error instanceof Error
              ? error.message
              : "Unable to duplicate this project.",
        });
      }
    })();
  },

  renameProject: (id, name) => {
    void get().updateProject(id, { name }).catch(() => {
      // The store holds a user-safe error for dashboard surfaces. Rename is a
      // fire-and-forget card action, so it deliberately does not duplicate UI.
    });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSort: (key, order) => {
    const currentSort = get().sort;
    const newOrder = order ?? (currentSort.key === key && currentSort.order === "desc" ? "asc" : "desc");
    set({ sort: { key, order: newOrder } });
  },

  resetProjects: () => {
    set({
      projects: [],
      searchQuery: "",
      sort: { key: "updatedAt", order: "desc" },
      isLoading: false,
      updatingProjectId: null,
      error: null,
    });
  },

  clearError: () => set({ error: null }),

  getFilteredProjects: () => {
    const { projects, searchQuery, sort } = get();
    const query = searchQuery.trim().toLowerCase();
    const filtered = query
      ? projects.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query) ||
            (p.description ?? "").toLowerCase().includes(query),
        )
      : projects;
    return sortProjects(filtered, sort);
  },

  getProjectById: (id) => get().projects.find((p) => p.id === id),
}));

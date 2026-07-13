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

interface ProjectState {
  projects: Project[];
  searchQuery: string;
  sort: ProjectSort;
  isLoading: boolean;
  error: string | null;

  loadProjects: (signal?: AbortSignal) => Promise<void>;
  createProject: (data: Pick<Project, "name" | "category" | "style" | "sections">) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
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

  updateProject: (id, updates) => {
    set({
      projects: get().projects.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p,
      ),
    });
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
    // Optimistic rename; restore the snapshot if the backend rejects it.
    const snapshot = get().projects;
    set({
      projects: snapshot.map((p) =>
        p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p,
      ),
      error: null,
    });

    void apiUpdateProject(id, { projectName: name }).catch((error) => {
      set({
        projects: snapshot,
        error: isProjectConnectionError(error)
          ? "Unable to reach the project service. The name was not changed."
          : error instanceof Error
            ? error.message
            : "Unable to rename this project.",
      });
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

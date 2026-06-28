"use client";

import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { getProjects, isProjectConnectionError, type ProjectApiProject } from "@/lib/projectApi";
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
  duplicateProject: (id: string) => Project | null;
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
    set({ projects: get().projects.filter((p) => p.id !== id) });
  },

  duplicateProject: (id) => {
    const source = get().projects.find((p) => p.id === id);
    if (!source) return null;

    const now = new Date().toISOString();
    const copy: Project = {
      ...source,
      id: uuidv4(),
      name: `${source.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };
    set({ projects: [copy, ...get().projects] });
    return copy;
  },

  renameProject: (id, name) => {
    set({
      projects: get().projects.map((p) =>
        p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p,
      ),
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

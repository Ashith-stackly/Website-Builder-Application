"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Blocks,
  Compass,
  LayoutTemplate,
  MousePointerClick,
  Plus,
  Rocket,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { staggerContainer, staggerChild } from "@/lib/motion";
import { useProjectStore } from "@/store/projectStore";
import { trackPageView, trackVisitor } from "@/lib/analytics";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsCards from "@/components/dashboard/StatsCards";
import ProjectGrid from "@/components/dashboard/ProjectGrid";
import EmptyProjects from "@/components/dashboard/EmptyProjects";
import CreateProjectModal from "@/components/dashboard/CreateProjectModal";

function DashboardContent() {
  const {
    projects,
    searchQuery,
    sort,
    isLoading,
    error,
    loadProjects,
    setSort,
    renameProject,
    deleteProject,
    duplicateProject,
    getFilteredProjects,
  } = useProjectStore();

  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void loadProjects(controller.signal);
    trackVisitor();
    trackPageView("/dashboard");
    return () => controller.abort();
  }, [loadProjects]);

  const filteredProjects = getFilteredProjects();
  const hasProjects = projects.length > 0;
  const quickActions = [
    {
      title: "Template Studio",
      description: "Start faster with page layouts tuned for your website type.",
      icon: LayoutTemplate,
      tone: "from-sky-500 to-blue-600",
    },
    {
      title: "Drag Builder",
      description: "Open a flexible canvas with sections, blocks, and style tools.",
      icon: MousePointerClick,
      tone: "from-emerald-500 to-teal-600",
    },
    {
      title: "Smart Blocks",
      description: "Assemble hero, features, gallery, and contact sections quickly.",
      icon: Blocks,
      tone: "from-violet-500 to-fuchsia-600",
    },
  ];

  return (
    <main className="dashboard-page min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_45%,#ecfeff_100%)]">
      <DashboardHeader />

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6 sm:space-y-8">
          <motion.section
            variants={staggerChild}
            className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/70 bg-white/85 px-5 py-6 shadow-sm backdrop-blur sm:px-7 sm:py-8"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500" />
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, duration: 0.25 }}
                  className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-blue-700"
                >
                  <Rocket className="h-3.5 w-3.5" />
                  Website workspace
                </motion.div>
                <h1 className="text-2xl font-black text-[#06224C] sm:text-3xl">
                  Welcome back to your dashboard
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {hasProjects
                    ? `You have ${projects.length} project${projects.length === 1 ? "" : "s"} ready to refine, publish, or remix.`
                    : "Create your first project and start building with guided sections, templates, and animations."}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <motion.button
                  onClick={() => setCreateModalOpen(true)}
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#06224C] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#06224C]/20 transition-all hover:bg-blue-900 hover:shadow-xl"
                >
                  <Plus className="h-4 w-4" />
                  New Project
                </motion.button>
                <motion.a
                  href="/dashboard/analytics"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-[#06224C] shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50"
                >
                  <Compass className="h-4 w-4" />
                  Analytics
                </motion.a>
              </div>
            </div>
          </motion.section>

          {hasProjects && (
            <motion.div variants={staggerChild}>
              <StatsCards projects={projects} />
            </motion.div>
          )}

          <motion.div variants={staggerChild}>
            {isLoading ? (
              <div className="rounded-3xl border border-slate-200 bg-white/80 px-6 py-16 text-center text-sm font-bold text-slate-500 shadow-sm">
                Loading projects...
              </div>
            ) : error ? (
              <div className="rounded-3xl border border-red-100 bg-white/80 px-6 py-16 text-center shadow-sm">
                <p className="text-sm font-bold text-red-600">{error}</p>
                <button
                  type="button"
                  onClick={() => { void loadProjects(); }}
                  className="mt-4 rounded-xl border border-red-100 bg-red-50 px-5 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100"
                >
                  Retry
                </button>
              </div>
            ) : hasProjects ? (
              filteredProjects.length > 0 ? (
                <ProjectGrid
                  projects={filteredProjects}
                  sort={sort}
                  onSortChange={setSort}
                  onRename={renameProject}
                  onDelete={deleteProject}
                  onDuplicate={duplicateProject}
                />
              ) : (
                <EmptyProjects onCreateProject={() => setCreateModalOpen(true)} searchQuery={searchQuery} />
              )
            ) : (
              <EmptyProjects onCreateProject={() => setCreateModalOpen(true)} />
            )}
          </motion.div>

          {hasProjects && (
            <motion.div variants={staggerChild}>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-black text-[#06224C] sm:text-lg">Quick Actions</h2>
                    <p className="mt-1 text-sm text-slate-500">Jump into the workflows you use most.</p>
                  </div>
                  <motion.button
                    onClick={() => setCreateModalOpen(true)}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.97 }}
                    className="hidden items-center gap-2 rounded-xl border border-[#06224C] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#06224C] transition-all hover:bg-[#06224C] hover:text-white sm:inline-flex"
                  >
                    Create
                    <ArrowRight className="h-3.5 w-3.5" />
                  </motion.button>
                </div>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                  className="grid gap-4 md:grid-cols-3"
                >
                  {quickActions.map((action) => (
                    <motion.button
                      key={action.title}
                      variants={staggerChild}
                      whileHover={{ y: -4, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCreateModalOpen(true)}
                      className="group flex min-h-36 flex-col items-start justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-blue-200 hover:shadow-lg"
                    >
                      <span className={`inline-flex rounded-xl bg-gradient-to-br ${action.tone} p-3 text-white shadow-lg shadow-slate-900/10`}>
                        <action.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                      </span>
                      <span>
                        <span className="block text-sm font-black text-[#06224C]">{action.title}</span>
                        <span className="mt-1 block text-xs leading-5 text-slate-500">{action.description}</span>
                      </span>
                    </motion.button>
                  ))}
                </motion.div>
                <motion.div
                  whileHover={{ y: -2 }}
                  className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-[#06224C] p-5 text-center shadow-lg shadow-[#06224C]/10 sm:flex-row sm:text-left"
                >
                  <div className="rounded-2xl bg-white/10 p-3 text-cyan-200 ring-1 ring-white/15">
                    <WandSparkles className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-white">Need inspiration?</h3>
                    <p className="mt-0.5 text-sm text-blue-100">
                      Create a new project and let the setup flow suggest the right sections.
                    </p>
                  </div>
                  <Sparkles className="hidden h-5 w-5 text-cyan-200 sm:block" />
                </motion.div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      <CreateProjectModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} />
    </main>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}

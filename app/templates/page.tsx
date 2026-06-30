"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaMagnifyingGlass,
  FaCrown,
  FaEye,
  FaRocket,
  FaArrowRight,
  FaFire,
  FaRotateRight,
  FaXmark,
  FaBoxOpen,
} from "react-icons/fa6";
import Footer from "@/components/Footer";
import { fadeUp, staggerContainer, scaleIn } from "@/lib/motion";
import { assetPath } from "@/lib/paths";
import { getTemplates, cloneTemplate, isTemplateConnectionError } from "@/lib/templateApi";
import { TEMPLATE_CATEGORIES } from "@/types/template";
import type { TemplateListItem, TemplateCategory } from "@/types/template";

// ── Animation Variants ─────────────────────────────────────────────────

const cardHover = { y: -6, boxShadow: "0 20px 50px rgba(6,34,76,0.15)" };

// ── Fallback Templates (used while backend is unavailable) ─────────

const FALLBACK_TEMPLATES: TemplateListItem[] = [
  {
    _id: "tpl_portfolio_1",
    name: "Creative Portfolio",
    slug: "creative-portfolio",
    category: "Portfolio",
    style: "Modern",
    description: "A stunning portfolio template with hero, features, gallery, and contact sections. Perfect for creatives and agencies.",
    thumbnail: "/landing-optimized/port.webp",
    isPremium: false,
    tags: ["portfolio", "agency", "creative", "modern"],
    usageCount: 2400,
    createdAt: "2026-01-15T00:00:00.000Z",
  },
  {
    _id: "tpl_blog_1",
    name: "Modern Blog",
    slug: "modern-blog",
    category: "Blog",
    style: "Minimal",
    description: "A clean and readable blog template with navigation, hero banner, features grid, and newsletter signup.",
    thumbnail: "/landing-optimized/bloggg.webp",
    isPremium: false,
    tags: ["blog", "articles", "minimal", "reading"],
    usageCount: 1850,
    createdAt: "2026-02-10T00:00:00.000Z",
  },
  {
    _id: "tpl_ecommerce_1",
    name: "E-Commerce Store",
    slug: "ecommerce-store",
    category: "E-Commerce",
    style: "Bold",
    description: "A fully featured e-commerce template with product showcases, pricing tables, testimonials, and checkout-ready sections.",
    thumbnail: "/landing-optimized/ecommerce.webp",
    isPremium: false,
    tags: ["ecommerce", "store", "shop", "products"],
    usageCount: 3100,
    createdAt: "2026-01-20T00:00:00.000Z",
  },
  {
    _id: "tpl_restaurant_1",
    name: "Restaurant & Café",
    slug: "restaurant-cafe",
    category: "Restaurant",
    style: "Modern",
    description: "An appetizing restaurant template with menu showcases, gallery, reservation prompts, and location details.",
    thumbnail: "/landing-optimized/foodd03.webp",
    isPremium: false,
    tags: ["restaurant", "food", "cafe", "dining"],
    usageCount: 1600,
    createdAt: "2026-03-05T00:00:00.000Z",
  },
  {
    _id: "tpl_construction_1",
    name: "Construction Co.",
    slug: "construction-co",
    category: "Construction",
    style: "Bold",
    description: "A robust construction company template with project showcases, service features, testimonials, and contact forms.",
    thumbnail: "/landing-optimized/construction02.webp",
    isPremium: false,
    tags: ["construction", "building", "contractor", "services"],
    usageCount: 980,
    createdAt: "2026-04-12T00:00:00.000Z",
  },
];

// ── Helper ──────────────────────────────────────────────────────────────

function formatUsageCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}

// ── Component ──────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [cloneSuccess, setCloneSuccess] = useState<string | null>(null);

  // ── Fetch Templates ────────────────────────────────────────────────
  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getTemplates({
        category: activeCategory,
        search: searchQuery || undefined,
      });
      setTemplates(data);
    } catch (err: unknown) {
      // Fall back to static templates when backend is unreachable
      if (isTemplateConnectionError(err)) {
        const filtered = FALLBACK_TEMPLATES.filter((t) => {
          const matchesCategory = activeCategory === "All" || t.category === activeCategory;
          const matchesSearch =
            !searchQuery ||
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
          return matchesCategory && matchesSearch;
        });
        setTemplates(filtered);
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to load templates."
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    const controller = new AbortController();
    fetchTemplates();
    return () => controller.abort();
  }, [fetchTemplates]);

  // ── Clone Handler ──────────────────────────────────────────────────
  const handleClone = async (templateId: string, templateName: string) => {
    // Auth check — if no token, redirect to login
    const token = typeof window !== "undefined"
      ? window.localStorage.getItem("stackly-auth-token")
      : null;

    if (!token) {
      router.push("/login?redirect=/templates");
      return;
    }

    if (cloningId) return; // Prevent double-clicks

    setCloningId(templateId);
    setCloneSuccess(null);

    try {
      const result = await cloneTemplate(templateId);
      setCloneSuccess(`"${templateName}" cloned successfully!`);
      // Navigate to the builder with the new project
      setTimeout(() => {
        router.push(`/builder?projectId=${result.projectId}`);
      }, 1200);
    } catch (err: unknown) {
      if (isTemplateConnectionError(err)) {
        // Fallback: navigate to builder with template query params
        const template = templates.find((t) => t._id === templateId);
        if (template) {
          router.push(
            `/builder?projectName=${encodeURIComponent(template.name)}&category=${encodeURIComponent(template.category)}&style=${encodeURIComponent(template.style)}&sections=navigation,hero,features,contact,footer`
          );
        }
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to clone template. Please try again."
        );
      }
    } finally {
      setCloningId(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <main className="site-page flex min-h-screen flex-col bg-[#FFF1F2]">

      {/* ── Hero Section ──────────────────────────────────────────── */}
      <motion.section
        className="relative overflow-hidden px-4 pb-4 pt-10 md:px-8 md:pt-16"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Background blobs */}
        <motion.div
          className="pointer-events-none absolute -right-20 top-10 h-64 w-64 rounded-full bg-blue-300/15 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-pink-300/15 blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative mx-auto max-w-6xl text-center">
          <motion.div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#06224C] shadow-sm backdrop-blur-sm" variants={fadeUp}>
            <FaRocket className="text-blue-500" /> Template Library
          </motion.div>

          <motion.h1
            className="mb-4 text-3xl font-black leading-tight tracking-tight text-[#06224C] sm:text-4xl md:text-5xl lg:text-6xl"
            variants={fadeUp}
          >
            Start With a Beautiful{" "}
            <span className="bg-gradient-to-r from-blue-600 to-sky-400 bg-clip-text text-transparent">
              Template
            </span>
          </motion.h1>

          <motion.p
            className="mx-auto mb-8 max-w-2xl text-sm font-medium text-gray-500 md:text-base"
            variants={fadeUp}
          >
            Browse our professionally designed templates. Preview, customize, and launch your website in minutes.
          </motion.p>

          {/* ── Search Bar ──────────────────────────────────────────── */}
          <motion.div
            className="mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-lg transition focus-within:border-blue-400 focus-within:shadow-blue-100"
            variants={fadeUp}
          >
            <FaMagnifyingGlass className="text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm font-medium text-[#06224C] outline-none placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-xs font-bold text-gray-400 transition hover:text-gray-600"
              >
                Clear
              </button>
            )}
          </motion.div>
        </div>
      </motion.section>

      {/* ── Category Filter Tabs ──────────────────────────────────── */}
      <section className="sticky top-0 z-30 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 py-3 md:justify-center md:gap-3 md:px-8">
          {TEMPLATE_CATEGORIES.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                  isActive
                    ? "bg-[#06224C] text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-[#06224C]"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Template Grid / States ────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8 md:py-12">

        {/* Success Toast */}
        <AnimatePresence>
          {cloneSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-sm font-bold text-green-700 shadow-sm"
              role="status"
            >
              {cloneSuccess}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-5 py-3 shadow-sm"
              role="alert"
            >
              <div className="flex items-center gap-3">
                <FaXmark className="text-red-400" />
                <span className="text-sm font-bold text-red-600">{error}</span>
              </div>
              <button
                type="button"
                onClick={() => { setError(null); fetchTemplates(); }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-200"
              >
                <FaRotateRight className="text-[10px]" /> Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="animate-pulse rounded-[2rem] border border-gray-100 bg-white p-5"
              >
                <div className="mb-5 h-48 rounded-[1.5rem] bg-gray-100" />
                <div className="space-y-3 px-2">
                  <div className="h-5 w-3/4 rounded-lg bg-gray-100" />
                  <div className="h-3 w-full rounded-lg bg-gray-50" />
                  <div className="h-3 w-2/3 rounded-lg bg-gray-50" />
                  <div className="flex gap-2 pt-2">
                    <div className="h-8 flex-1 rounded-xl bg-gray-100" />
                    <div className="h-8 flex-1 rounded-xl bg-gray-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && templates.length === 0 && (
          <motion.div
            className="flex flex-col items-center justify-center py-20 text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <FaBoxOpen className="text-3xl text-gray-400" />
            </div>
            <h3 className="mb-2 text-xl font-black text-[#06224C]">
              No Templates Found
            </h3>
            <p className="mb-6 max-w-sm text-sm text-gray-500">
              {searchQuery
                ? `No templates match "${searchQuery}". Try a different search term.`
                : `No templates available in the "${activeCategory}" category yet.`}
            </p>
            <button
              type="button"
              onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#06224C] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-blue-900"
            >
              View All Templates
            </button>
          </motion.div>
        )}

        {/* Template Cards Grid */}
        {!isLoading && !error && templates.length > 0 && (
          <motion.div
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {templates.map((template) => (
              <motion.article
                key={template._id}
                className="group flex flex-col rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm transition"
                variants={scaleIn}
                whileHover={cardHover}
              >
                {/* Thumbnail */}
                <div className="relative mb-5 h-48 overflow-hidden rounded-[1.5rem] bg-gray-50">
                  <img
                    src={assetPath(template.thumbnail)}
                    alt={template.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Premium badge */}
                  {template.isPremium && (
                    <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[9px] font-black uppercase text-white shadow-md">
                      <FaCrown className="text-[8px]" /> Premium
                    </div>
                  )}
                  {/* Category badge */}
                  <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-[#06224C] shadow-sm backdrop-blur-sm">
                    {template.category}
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col px-2">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h3 className="text-lg font-black text-[#06224C]">{template.name}</h3>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                      <FaFire className="text-orange-400" />
                      {formatUsageCount(template.usageCount)} uses
                    </div>
                  </div>

                  <p className="mb-4 text-xs leading-relaxed text-gray-500">
                    {template.description}
                  </p>

                  {/* Tags */}
                  <div className="mb-5 mt-auto flex flex-wrap gap-1.5">
                    {template.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-blue-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/templates/${template._id}/preview`}
                      className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-400 text-sm font-bold text-blue-500 transition hover:scale-[1.02] hover:bg-blue-50"
                    >
                      <FaEye className="text-xs" /> Preview
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleClone(template._id, template.name)}
                      disabled={cloningId === template._id}
                      className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition hover:scale-[1.02] ${
                        cloningId === template._id
                          ? "cursor-not-allowed bg-gray-400"
                          : "bg-[#06224C] hover:bg-blue-900"
                      }`}
                    >
                      {cloningId === template._id ? (
                        "Cloning..."
                      ) : (
                        <>
                          Use Template <FaArrowRight className="text-[10px]" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}
      </section>

      <Footer />
    </main>
  );
}

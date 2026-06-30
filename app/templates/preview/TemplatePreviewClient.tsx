"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaDesktop,
  FaTabletScreenButton,
  FaMobileScreenButton,
  FaRocket,
  FaCrown,
  FaFire,
  FaTag,
  FaLayerGroup,
  FaRotateRight,
} from "react-icons/fa6";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { getTemplate, cloneTemplate, isTemplateConnectionError } from "@/lib/templateApi";
import { generateHtml } from "@/lib/exportHtml";
import type { Template } from "@/types/template";
import type { Viewport } from "@/types/builder";
import { VIEWPORT_WIDTHS } from "@/types/builder";

// ── Viewport Options ───────────────────────────────────────────────────

const viewportOptions: { key: Viewport; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { key: "desktop", icon: FaDesktop, label: "Desktop" },
  { key: "tablet", icon: FaTabletScreenButton, label: "Tablet" },
  { key: "mobile", icon: FaMobileScreenButton, label: "Mobile" },
];

// ── Fallback Template Data ─────────────────────────────────────────────

const FALLBACK_TEMPLATES: Record<string, Omit<Template, "builderData">> = {
  tpl_portfolio_1: {
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
    sections: ["navigation", "hero", "features", "gallery", "contact", "footer"],
  },
  tpl_blog_1: {
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
    sections: ["navigation", "hero", "features", "contact", "footer"],
  },
  tpl_ecommerce_1: {
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
    sections: ["navigation", "hero", "features", "pricing-table", "testimonial", "contact", "footer"],
  },
  tpl_restaurant_1: {
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
    sections: ["navigation", "hero", "features", "gallery", "contact", "footer"],
  },
  tpl_construction_1: {
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
    sections: ["navigation", "hero", "features", "testimonial", "contact", "footer"],
  },
};

function formatUsageCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}

// ── Component ──────────────────────────────────────────────────────────

export default function TemplatePreviewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";

  // ── State ──────────────────────────────────────────────────────────
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [cloningId, setCloningId] = useState<string | null>(null);

  // ── Fetch Template ─────────────────────────────────────────────────
  useEffect(() => {
    if (!id) {
      setError("Template ID is missing.");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    async function fetchTemplate() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getTemplate(id, controller.signal);
        setTemplate(data);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;

        // Fallback: use static data if backend is unavailable
        if (isTemplateConnectionError(err)) {
          const fallback = FALLBACK_TEMPLATES[id];
          if (fallback) {
            // Create a template with empty components (iframe will show placeholder)
            setTemplate({
              ...fallback,
              builderData: { schemaVersion: 1, components: [] },
            });
          } else {
            setError("Template not found.");
          }
        } else {
          setError(
            err instanceof Error ? err.message : "Failed to load template."
          );
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchTemplate();
    return () => controller.abort();
  }, [id]);

  // ── Generate Preview HTML ──────────────────────────────────────────
  const previewHtml = useMemo(() => {
    if (!template?.builderData?.components?.length) return null;
    try {
      return generateHtml(template.builderData.components, template.builderData.seo);
    } catch {
      return null;
    }
  }, [template]);

  // ── Clone Handler ──────────────────────────────────────────────────
  const handleClone = async () => {
    if (!template || cloningId) return;

    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("stackly-auth-token")
        : null;

    if (!token) {
      router.push(`/login?redirect=/templates/preview?id=${id}`);
      return;
    }

    setCloningId(template._id);

    try {
      const result = await cloneTemplate(template._id);
      router.push(`/builder?projectId=${result.projectId}`);
    } catch (err: unknown) {
      if (isTemplateConnectionError(err)) {
        // Fallback: open builder with query params
        router.push(
          `/builder?projectName=${encodeURIComponent(template.name)}&category=${encodeURIComponent(template.category)}&style=${encodeURIComponent(template.style)}&sections=${template.sections.join(",")}`
        );
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to clone template."
        );
      }
    } finally {
      setCloningId(null);
    }
  };

  // ── Loading State ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FFF1F2]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#06224C]" />
          <p className="text-sm font-bold text-gray-500">Loading template...</p>
        </div>
      </main>
    );
  }

  // ── Error State ────────────────────────────────────────────────────
  if (error || !template) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#FFF1F2] px-4">
        <div className="text-center">
          <h2 className="mb-3 text-2xl font-black text-[#06224C]">
            {error || "Template Not Found"}
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            The template you&apos;re looking for could not be loaded.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-200 px-5 py-2.5 text-xs font-bold text-gray-700 transition hover:bg-gray-300"
            >
              <FaArrowLeft /> Go Back
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#06224C] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-900"
            >
              <FaRotateRight /> Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Main Preview Layout ────────────────────────────────────────────
  return (
    <main className="flex min-h-screen flex-col bg-gray-100">

      {/* ── Top Bar ──────────────────────────────────────────────── */}
      <motion.header
        className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm md:px-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/templates")}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-200"
          >
            <FaArrowLeft /> Back
          </button>
          <div className="hidden sm:block">
            <h1 className="text-sm font-black text-[#06224C]">{template.name}</h1>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{template.category} • {template.style}</p>
          </div>
        </div>

        {/* Viewport Switcher */}
        <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
          {viewportOptions.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setViewport(key)}
              title={label}
              className={`rounded-lg px-3 py-2 text-xs transition ${
                viewport === key
                  ? "bg-[#06224C] text-white shadow-sm"
                  : "text-gray-500 hover:text-[#06224C]"
              }`}
            >
              <Icon />
            </button>
          ))}
        </div>

        {/* Use Template CTA */}
        <button
          type="button"
          onClick={handleClone}
          disabled={!!cloningId}
          className={`hidden items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition sm:inline-flex ${
            cloningId
              ? "cursor-not-allowed bg-gray-400"
              : "bg-[#06224C] hover:bg-blue-900 hover:scale-[1.02]"
          }`}
        >
          {cloningId ? "Cloning..." : (<><FaRocket /> Use This Template</>)}
        </button>
      </motion.header>

      {/* ── Preview Content ──────────────────────────────────────── */}
      <div className="flex flex-1 flex-col lg:flex-row">

        {/* Iframe Preview Area */}
        <div className="flex flex-1 items-start justify-center overflow-auto bg-gray-200/50 p-4 md:p-8">
          <motion.div
            className="overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-2xl transition-all duration-500"
            style={{ width: VIEWPORT_WIDTHS[viewport] }}
            layout
          >
            {previewHtml ? (
              <iframe
                srcDoc={previewHtml}
                title={`${template.name} preview`}
                className="h-[600px] w-full border-0 lg:h-[700px]"
                sandbox="allow-scripts"
              />
            ) : (
              /* Fallback: show thumbnail when no builder components available */
              <div className="relative flex flex-col items-center justify-center bg-gray-50 p-8">
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className="w-full rounded-xl object-cover shadow-lg"
                />
                <div className="mt-6 rounded-xl bg-blue-50 px-5 py-3 text-center">
                  <p className="text-xs font-bold text-blue-600">
                    Live preview will be available when the template backend is connected.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Side Panel — Template Details */}
        <motion.aside
          className="w-full border-t border-gray-200 bg-white p-6 lg:w-80 lg:border-l lg:border-t-0 xl:w-96"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="space-y-6" variants={fadeUp}>
            {/* Name & Premium Badge */}
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h2 className="text-xl font-black text-[#06224C]">{template.name}</h2>
                {template.isPremium && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black uppercase text-amber-600">
                    <FaCrown className="text-[8px]" /> Premium
                  </span>
                )}
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                {template.category} • {template.style}
              </p>
            </div>

            {/* Description */}
            <p className="text-sm leading-relaxed text-gray-600">{template.description}</p>

            {/* Usage Count */}
            <div className="flex items-center gap-2 rounded-xl bg-orange-50 px-4 py-2.5">
              <FaFire className="text-orange-400" />
              <span className="text-xs font-bold text-orange-600">
                {formatUsageCount(template.usageCount)} websites built with this template
              </span>
            </div>

            {/* Tags */}
            {template.tags.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <FaTag className="text-[8px]" /> Tags
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Sections Breakdown */}
            {template.sections.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <FaLayerGroup className="text-[8px]" /> Included Sections
                </div>
                <div className="space-y-1.5">
                  {template.sections.map((section) => (
                    <div
                      key={section}
                      className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs font-bold capitalize text-[#06224C]"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                      {section.replace("-", " ")}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Button */}
            <button
              type="button"
              onClick={handleClone}
              disabled={!!cloningId}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition ${
                cloningId
                  ? "cursor-not-allowed bg-gray-400"
                  : "bg-[#06224C] shadow-lg hover:bg-blue-900 hover:scale-[1.01]"
              }`}
            >
              {cloningId ? "Creating Project..." : (<><FaRocket /> Use This Template</>)}
            </button>
          </motion.div>
        </motion.aside>
      </div>
    </main>
  );
}

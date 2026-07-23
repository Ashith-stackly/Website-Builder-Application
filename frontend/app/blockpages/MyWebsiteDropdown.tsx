"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ChevronDown, Check, Search, Utensils, HardHat, Briefcase,
  Newspaper, Megaphone, ShoppingBag, LayoutGrid, Sparkles
} from "lucide-react";
import {
  parseBlockpagesTemplate,
  getBlockpagesTemplateLabel,
  type BlockpagesTemplateId,
} from "@/lib/blockpagesTemplates";
import StandardModal from "@/components/StandardModal";

const TEMPLATE_CARDS: {
  id: BlockpagesTemplateId;
  label: string;
  category: string;
  description: string;
  icon: any;
  accent: string;
  tagColor: string;
}[] = [
  {
    id: "portfolio",
    label: "Portfolio",
    category: "Personal / Agency",
    description: "Showcase creative work, skills, testimonials, and personal projects.",
    icon: Briefcase,
    accent: "bg-blue-50 text-blue-600 border-blue-200 group-hover:bg-blue-600 group-hover:text-white",
    tagColor: "bg-blue-100 text-blue-700",
  },
  {
    id: "ecommerce",
    label: "E-Commerce",
    category: "Online Store",
    description: "Modern storefront with product grid, wishlist, and checkout flow.",
    icon: ShoppingBag,
    accent: "bg-emerald-50 text-emerald-600 border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white",
    tagColor: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "blog",
    label: "Blog",
    category: "Publishing",
    description: "Clean editorial layout for articles, news, and content series.",
    icon: Newspaper,
    accent: "bg-purple-50 text-purple-600 border-purple-200 group-hover:bg-purple-600 group-hover:text-white",
    tagColor: "bg-purple-100 text-purple-700",
  },
  {
    id: "construction",
    label: "Construction",
    category: "Industrial & Trades",
    description: "Heavy machinery, project showcases, 2-column FAQs, and services.",
    icon: HardHat,
    accent: "bg-amber-50 text-amber-600 border-amber-200 group-hover:bg-amber-600 group-hover:text-white",
    tagColor: "bg-amber-100 text-amber-700",
  },
  {
    id: "restaurant",
    label: "Restaurant",
    category: "Food & Hospitality",
    description: "Mouth-watering menus, reservations, FAQ, and dining features.",
    icon: Utensils,
    accent: "bg-rose-50 text-rose-600 border-rose-200 group-hover:bg-rose-600 group-hover:text-white",
    tagColor: "bg-rose-100 text-rose-700",
  },
  {
    id: "digital-marketing",
    label: "Digital Marketing",
    category: "Business Growth",
    description: "High-converting landing page with stats, strategy cards, and reviews.",
    icon: Megaphone,
    accent: "bg-indigo-50 text-indigo-600 border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white",
    tagColor: "bg-indigo-100 text-indigo-700",
  },
];

type MyWebsiteDropdownProps = {
  currentTemplate?: BlockpagesTemplateId;
};

export default function MyWebsiteDropdown({ currentTemplate }: MyWebsiteDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTemplate = currentTemplate ?? parseBlockpagesTemplate(searchParams.get("template"));
  const projectId = searchParams.get("projectId");
  const activeLabel = getBlockpagesTemplateLabel(activeTemplate);

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return TEMPLATE_CARDS;
    const q = searchQuery.toLowerCase();
    return TEMPLATE_CARDS.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleSelectTemplate = (templateId: BlockpagesTemplateId) => {
    if (templateId === activeTemplate) {
      setIsOpen(false);
      return;
    }
    setIsOpen(false);
    setSearchQuery("");
    const params = new URLSearchParams();
    params.set("template", templateId);
    if (projectId) {
      params.set("projectId", projectId);
    }
    const targetUrl = `/blockpages?${params.toString()}`;
    window.location.href = targetUrl;
  };

  return (
    <>
      {/* Trigger Button in Header */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-slate-100 px-3.5 py-2 text-sm font-bold text-[#0B1D40] transition-all hover:bg-slate-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#517AA5]/50 border border-slate-200 cursor-pointer"
        aria-label="Select Template"
      >
        <LayoutGrid className="h-4 w-4 text-[#517AA5]" />
        <span className="truncate max-w-[120px] sm:max-w-[160px]">{activeLabel}</span>
        <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
      </button>

      {/* Modern Template Selector Modal */}
      <StandardModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setSearchQuery("");
        }}
        title="Switch Template"
        icon={<LayoutGrid size={20} />}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-6">
          {/* Header Description & Search Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-600">
                Select a block template to switch your active editing layout. All changes and drafts are saved automatically.
              </p>
            </div>
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#517AA5] focus:bg-white focus:ring-2 focus:ring-[#517AA5]/20"
              />
            </div>
          </div>

          {/* 6 Template Cards Grid - All Visible simultaneously */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((t) => {
              const isSelected = t.id === activeTemplate;
              const IconComp = t.icon;

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectTemplate(t.id)}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-5 text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-[#517AA5] bg-slate-50/80 shadow-md ring-2 ring-[#517AA5]/30"
                      : "border-slate-200 bg-white hover:border-[#517AA5]/50 hover:shadow-lg hover:-translate-y-0.5"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className={`p-2.5 rounded-xl border transition-colors ${t.accent}`}>
                        <IconComp size={22} />
                      </div>
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#517AA5] bg-[#517AA5]/10 px-2.5 py-1 rounded-full border border-[#517AA5]/20">
                          <Check size={14} /> Active
                        </span>
                      ) : (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${t.tagColor}`}>
                          {t.category}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-[#0B1D40] group-hover:text-[#517AA5] transition-colors">
                      {t.label}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      {t.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#517AA5]">
                    <span>{isSelected ? "Currently editing" : "Switch to layout"}</span>
                    <Sparkles className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              );
            })}
          </div>

          {!filteredTemplates.length && (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
              <p className="text-sm font-semibold text-slate-600">No templates found for &quot;{searchQuery}&quot;</p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-2 text-xs font-bold text-[#517AA5] hover:underline"
              >
                Clear Search Filter
              </button>
            </div>
          )}
        </div>
      </StandardModal>
    </>
  );
}

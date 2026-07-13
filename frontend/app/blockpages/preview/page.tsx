"use client";
 
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FaLaptop, FaMobileAlt, FaTabletAlt } from "react-icons/fa";
import Footer from "@/components/Footer";
import { bindPortfolioProjectsSliderNavDelegation } from "@/lib/portfolioProjectsSlider";
import { animateStatCounterElement } from "@/lib/blockpagesStatCounter";
import { sanitizeBlockpagesPreviewHtml } from "@/lib/blockpagesPreviewSanitize";
import { TEXTBLOCK_PREVIEW_STORAGE_KEY } from "@/lib/blockpagesEditorPersistence";
import { routePath } from "@/lib/paths";
import { loadBlockPagesDraft, type BlockPagesDraftPayload } from "@/lib/blockPagesDraftApi";

const PREVIEW_IFRAME_SRC = routePath("/blockpages/preview?mode=iframe");

/**
 * Render a simple HTML summary for a saved draft.
 * Since saved drafts store structured JSON (not rendered HTML),
 * we generate a basic readable preview showing what was saved.
 */
function renderDraftPreviewHtml(draft: BlockPagesDraftPayload): string {
  const sections: string[] = [];

  sections.push(`
    <div style="max-width:720px;margin:48px auto;font-family:system-ui,-apple-system,sans-serif;color:#0B1D40">
      <div style="text-align:center;margin-bottom:32px">
        <h1 style="font-size:28px;font-weight:800;margin:0 0 8px">Saved Draft Preview</h1>
        <p style="color:#64748b;font-size:14px">Template: <strong>${draft.template}</strong></p>
      </div>
  `);

  // Text block section info
  if (draft.textBlockState?.section) {
    const s = draft.textBlockState.section;
    sections.push(`
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:16px">
        <h2 style="font-size:16px;font-weight:700;margin:0 0 12px;color:#334155">Text Block</h2>
        <p style="margin:4px 0;font-size:13px;color:#64748b">Header: ${s.headerText || '(empty)'}</p>
        <p style="margin:4px 0;font-size:13px;color:#64748b">Footer: ${s.footerText || '(empty)'}</p>
        <p style="margin:4px 0;font-size:13px;color:#64748b">Alignment: ${s.alignment}</p>
      </div>
    `);
  }

  // Button blocks
  if (draft.buttonBlocks?.length) {
    sections.push(`
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:16px">
        <h2 style="font-size:16px;font-weight:700;margin:0 0 12px;color:#334155">Button Blocks (${draft.buttonBlocks.length})</h2>
        ${draft.buttonBlocks.map(b => `<p style="margin:4px 0;font-size:13px;color:#64748b">• ${b.props.content || b.type} (${b.id})</p>`).join("")}
      </div>
    `);
  }

  // Video blocks
  if (draft.videoBlocks?.length) {
    sections.push(`
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:16px">
        <h2 style="font-size:16px;font-weight:700;margin:0 0 12px;color:#334155">Video Blocks (${draft.videoBlocks.length})</h2>
        ${draft.videoBlocks.map(b => `<p style="margin:4px 0;font-size:13px;color:#64748b">• ${b.props.sourceType} (${b.id})</p>`).join("")}
      </div>
    `);
  }

  // Divider blocks
  if (draft.dividerBlocks?.length) {
    sections.push(`
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:16px">
        <h2 style="font-size:16px;font-weight:700;margin:0 0 12px;color:#334155">Divider Blocks (${draft.dividerBlocks.length})</h2>
        ${draft.dividerBlocks.map(b => `<p style="margin:4px 0;font-size:13px;color:#64748b">• ${b.props.variant} — ${b.props.lineStyle} (${b.props.color})</p>`).join("")}
      </div>
    `);
  }

  // Icon blocks
  if (draft.iconBlocks?.length) {
    sections.push(`
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:16px">
        <h2 style="font-size:16px;font-weight:700;margin:0 0 12px;color:#334155">Icon Blocks (${draft.iconBlocks.length})</h2>
        ${draft.iconBlocks.map(b => `<p style="margin:4px 0;font-size:13px;color:#64748b">• ${b.props.iconType} — ${b.props.color} (${b.props.size}px)</p>`).join("")}
      </div>
    `);
  }

  sections.push(`</div>`);
  return sections.join("\n");
}
 
export default function BlockPreviewPage() {
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get("projectId");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [draftError, setDraftError] = useState<string | null>(null);
 
  const isIframeMode = typeof window !== "undefined" && window.location.search.includes("mode=iframe");
 
  useEffect(() => bindPortfolioProjectsSliderNavDelegation(), []);
 
  // Load preview from backend if projectId is present, otherwise from localStorage
  useEffect(() => {
    if (projectIdParam) {
      // MODE 2: Saved draft preview
      let cancelled = false;
      const controller = new AbortController();

      (async () => {
        try {
          const { project, draft } = await loadBlockPagesDraft(projectIdParam, controller.signal);
          if (cancelled) return;
          if (project.htmlContent?.trim()) {
            setPreviewHtml(project.htmlContent);
            return;
          }

          if (draft) {
            // For saved draft preview, we render a JSON-based summary
            // since we only have structured data, not HTML
            const summaryHtml = renderDraftPreviewHtml(draft);
            setPreviewHtml(summaryHtml);
          } else {
            setDraftError("No saved content found for this draft.");
            setPreviewHtml("");
          }
        } catch (err) {
          if (!cancelled) {
            console.error("Failed to load draft preview:", err);
            setDraftError("Failed to load saved draft.");
            setPreviewHtml("");
          }
        }
      })();

      return () => {
        cancelled = true;
        controller.abort();
      };
    }

    // MODE 1: Current editor state preview (localStorage)
    const loadPreview = () => {
      const rawHtml = window.localStorage.getItem(TEXTBLOCK_PREVIEW_STORAGE_KEY) ?? "";
      setPreviewHtml(sanitizeBlockpagesPreviewHtml(rawHtml));
    };
 
    const frameId = window.requestAnimationFrame(() => {
      loadPreview();
    });
 
    const handleStorage = (event: StorageEvent) => {
      if (event.key === TEXTBLOCK_PREVIEW_STORAGE_KEY) {
        setPreviewHtml(sanitizeBlockpagesPreviewHtml(event.newValue ?? ""));
      }
    };
 
    window.addEventListener("storage", handleStorage);
 
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("storage", handleStorage);
    };
  }, [projectIdParam]);
 
  useEffect(() => {
    if (!previewHtml) return;
 
    const timeoutId = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
 
              if (entry.target.classList.contains("skill-progress-bar")) {
                const targetWidth = (entry.target as HTMLElement).dataset.targetWidth;
                if (targetWidth) {
                  (entry.target as HTMLElement).style.width = targetWidth;
                }
              }
 
              if (entry.target.classList.contains("stat-animate-count")) {
                animateStatCounterElement(entry.target as HTMLElement);
              }
 
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
 
      document.querySelectorAll(".portfolio-reveal").forEach((el) => {
        el.classList.remove("is-visible");
        observer.observe(el);
      });
 
      document.querySelectorAll(".skill-progress-bar").forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.width = "0%";
        // Force a reflow so the transition from 0% is registered
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        htmlEl.offsetHeight;
        observer.observe(el);
      });
 
      document.querySelectorAll(".stat-animate-count").forEach((el) => {
        el.textContent = "0";
        observer.observe(el);
      });
 
      // Hook up mobile menu button in preview mode using event delegation
      // This ensures it works even if React recreates the DOM elements
      const handleMenuClick = (e: MouseEvent) => {
        const btn = (e.target as HTMLElement).closest(".portfolio-mobile-menu-btn");
        if (btn) {
          const menu = document.querySelector(".portfolio-mobile-menu");
          if (menu) {
            if (menu.classList.contains("max-h-0")) {
              menu.classList.remove("max-h-0", "opacity-0");
              menu.classList.add("max-h-40", "opacity-100");
            } else {
              menu.classList.remove("max-h-40", "opacity-100");
              menu.classList.add("max-h-0", "opacity-0");
            }
          }
        }
      };
 
      document.addEventListener("click", handleMenuClick);
      (window as any)._currentPortfolioMenuListener = handleMenuClick;
 
    }, 50);
 
    return () => {
      clearTimeout(timeoutId);
      if ((window as any)._currentPortfolioMenuListener) {
        document.removeEventListener("click", (window as any)._currentPortfolioMenuListener);
      }
    };
  }, [previewHtml]);
 
  if (previewHtml === null) {
    return <main className="min-h-screen bg-[#f5f7fb]" />;
  }
 
  if (!previewHtml) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#f5f7fb] px-4 text-center text-[#0B1D40]">
        <h1 className="text-2xl font-black">No preview available</h1>
        <p className="mt-3 max-w-md text-sm text-slate-500">Open the editor, make your changes, and click Preview again.</p>
        {!isIframeMode && (
          <Link href="/blockpages" className="mt-6 rounded-md bg-[#0B1D40] px-5 py-2.5 text-sm font-bold text-white">
            Back to editor
          </Link>
        )}
      </main>
    );
  }
 
  if (isIframeMode) {
    return (
      <>
        <main className="min-h-screen bg-[#f5f7fb]" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        <Footer />
      </>
    );
  }
 
  return (
    <>
      <div
        className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2"
      >
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <button
            type="button"
            onClick={() => setPreviewDevice("desktop")}
            className={`flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition sm:h-9 sm:w-9 ${previewDevice === "desktop" ? "border-[#06224C] bg-gray-50 text-[#06224C] ring-2 ring-[#06224C]" : "border-gray-100 text-[#06224C]/70 hover:bg-gray-50"}`}
            title="Desktop View"
          >
            <FaLaptop size={14} />
          </button>
          <button
            type="button"
            onClick={() => setPreviewDevice("tablet")}
            className={`flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition sm:h-9 sm:w-9 ${previewDevice === "tablet" ? "border-[#06224C] bg-gray-50 text-[#06224C] ring-2 ring-[#06224C]" : "border-gray-100 text-[#06224C]/70 hover:bg-gray-50"}`}
            title="Tablet View"
          >
            <FaTabletAlt size={14} />
          </button>
          <button
            type="button"
            onClick={() => setPreviewDevice("mobile")}
            className={`flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition sm:h-9 sm:w-9 ${previewDevice === "mobile" ? "border-[#06224C] bg-gray-50 text-[#06224C] ring-2 ring-[#06224C]" : "border-gray-100 text-[#06224C]/70 hover:bg-gray-50"}`}
            title="Mobile View"
          >
            <FaMobileAlt size={14} />
          </button>
        </div>
      </div>
      <div className={`min-h-screen transition-colors duration-500 ${previewDevice !== "desktop" ? "bg-slate-200 py-8 flex justify-center items-start overflow-y-auto" : "bg-[#f5f7fb]"}`}>
        <div
          className={`mx-auto w-full min-w-0 transition-all duration-500 ease-in-out ${previewDevice === "mobile"
              ? "max-w-[375px] shadow-2xl h-[812px] flex flex-col shrink-0"
              : previewDevice === "tablet"
                ? "max-w-[768px] shadow-2xl h-[1024px] flex flex-col shrink-0"
                : "max-w-full"
            } ${previewDevice !== "desktop" ? "rounded-[2.5rem] border-[12px] border-slate-800 bg-white overflow-hidden relative" : ""}`}
        >
          {previewDevice === "desktop" ? (
            <>
              <main className="min-h-screen bg-[#f5f7fb]" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              <Footer />
            </>
          ) : (
            <iframe
              src={PREVIEW_IFRAME_SRC}
              className="w-full h-full border-none bg-[#f5f7fb]"
              title="Responsive Preview"
            />
          )}
        </div>
      </div>
    </>
  );
}
 
 
 

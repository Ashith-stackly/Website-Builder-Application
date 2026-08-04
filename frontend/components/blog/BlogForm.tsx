"use client";
 
import { useState, useCallback, useRef, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Globe,
  Sparkles,
  AlertCircle,
  Loader2,
  Eye,
  Send,
} from "lucide-react";
import type { Blog, BlogFormData } from "@/types/blog";
import FeaturedImagePicker from "./FeaturedImagePicker";
 
interface BlogFormProps {
  /** Pre-filled data for edit mode. Omit for create mode. */
  initialData?: Blog;
  /** Called with validated form data when submitted. */
  onSubmit: (data: BlogFormData) => Promise<void>;
  /** True while the parent is processing the submission. */
  isSubmitting: boolean;
  /** Label for the submit button (e.g. "Create Blog" / "Save Changes"). */
  submitLabel: string;
}
 
interface FormErrors {
  title?: string;
  content?: string;
  form?: string;
}
 
/**
 * Reusable blog form shared by Create and Edit pages.
 * Enhanced with Framer Motion micro-interactions, live Google SEO preview,
 * status segmented control, and Dark/Light theme support.
 */
export default function BlogForm({
  initialData,
  onSubmit,
  isSubmitting,
  submitLabel,
}: BlogFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [seoTitle, setSeoTitle] = useState(initialData?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(
    initialData?.seoDescription ?? ""
  );
  const [seoKeywords, setSeoKeywords] = useState(
    initialData?.seoKeywords?.join(", ") ?? ""
  );
  const [featuredImage, setFeaturedImage] = useState(
    initialData?.featuredImage ?? ""
  );
  const [status, setStatus] = useState<"draft" | "published">(
    initialData?.status === "published" ? "published" : "draft"
  );
  const [showSeoPreview, setShowSeoPreview] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const submitGuardRef = useRef(false);
 
  const validate = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};
 
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
 
    if (!trimmedTitle) {
      newErrors.title = "Blog title is required.";
    }
    if (!trimmedContent) {
      newErrors.content = "Blog content is required.";
    }
 
    return newErrors;
  }, [title, content]);
 
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
 
      if (submitGuardRef.current || isSubmitting) return;
 
      const validationErrors = validate();
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
 
      setErrors({});
      submitGuardRef.current = true;
 
      try {
        await onSubmit({
          title: title.trim(),
          content: content.trim(),
          seoTitle: seoTitle.trim() || undefined,
          seoDescription: seoDescription.trim() || undefined,
          seoKeywords: seoKeywords
            .split(",")
            .map((keyword) => keyword.trim())
            .filter(Boolean),
          featuredImage: featuredImage.trim() || undefined,
          status,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred.";
        setErrors({ form: message });
      } finally {
        submitGuardRef.current = false;
      }
    },
    [
      title,
      content,
      seoTitle,
      seoDescription,
      seoKeywords,
      featuredImage,
      status,
      isSubmitting,
      validate,
      onSubmit,
    ]
  );
 
  const inputClass =
    "w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all duration-200 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 shadow-2xs autofill:shadow-[0_0_0_1000px_white_inset] dark:autofill:shadow-[0_0_0_1000px_#0f172a_inset]";
  const labelClass = "block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5";
  const errorTextClass = "mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1";
 
  const effectiveSeoTitle = seoTitle.trim() || title.trim() || "Your Blog Title Preview";
  const effectiveSeoDesc =
    seoDescription.trim() ||
    (content.trim()
      ? content.trim().slice(0, 155) + "..."
      : "Provide a description or content to preview how this blog post will appear on Google search results.");
 
  return (
    <form onSubmit={handleSubmit} className="space-y-7" noValidate>
      {/* Form-level error */}
      <AnimatePresence>
        {errors.form && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/90 dark:bg-rose-950/60 p-4 text-xs text-rose-700 dark:text-rose-300 font-medium shadow-2xs"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{errors.form}</span>
          </motion.div>
        )}
      </AnimatePresence>
 
      {/* Main Content Card */}
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="blog-title" className={labelClass}>
            <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            Blog Title <span className="text-rose-500">*</span>
          </label>
          <input
            id="blog-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((p) => ({ ...p, title: undefined }));
            }}
            placeholder="Enter an engaging title for your blog post"
            className={`${inputClass} font-semibold text-base ${errors.title ? "border-rose-400 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-500/10" : ""
              }`}
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? "blog-title-error" : undefined}
            maxLength={200}
            autoFocus
          />
          {errors.title && (
            <p id="blog-title-error" className={errorTextClass}>
              <AlertCircle className="h-3.5 w-3.5" />
              {errors.title}
            </p>
          )}
        </div>
 
        {/* Content */}
        <div>
          <label htmlFor="blog-content" className={labelClass}>
            <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            Blog Content <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="blog-content"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (errors.content)
                setErrors((p) => ({ ...p, content: undefined }));
            }}
            placeholder="Write your story, thoughts, or guide here..."
            rows={12}
            className={`${inputClass} resize-y min-h-[12rem] leading-relaxed ${errors.content ? "border-rose-400 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-500/10" : ""
              }`}
            aria-invalid={!!errors.content}
            aria-describedby={errors.content ? "blog-content-error" : undefined}
          />
          {errors.content && (
            <p id="blog-content-error" className={errorTextClass}>
              <AlertCircle className="h-3.5 w-3.5" />
              {errors.content}
            </p>
          )}
        </div>
      </div>
 
      {/* Featured Image Picker */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-3 sm:p-5 backdrop-blur-xs">
        <FeaturedImagePicker
          value={featuredImage}
          onChange={setFeaturedImage}
          disabled={isSubmitting}
        />
      </div>
 
      {/* SEO Section */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 m-0">SEO & Meta Settings</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 m-0">Optimize search engine visibility</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowSeoPreview((p) => !p)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" />
            {showSeoPreview ? "Hide Preview" : "Preview Snippet"}
          </button>
        </div>
 
        {/* Live Google Search Preview Box */}
        <AnimatePresence>
          {showSeoPreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-5"
            >
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 dark:bg-slate-950 p-4 text-left font-sans shadow-inner">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                  <span>https://yourdomain.com › blog</span>
                </div>
                <h4 className="text-base font-medium text-blue-400 hover:underline m-0 cursor-pointer truncate">
                  {effectiveSeoTitle}
                </h4>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                  {effectiveSeoDesc}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
 
        <div className="space-y-4">
          <div>
            <label htmlFor="blog-seo-title" className={labelClass}>
              SEO Title
            </label>
            <input
              id="blog-seo-title"
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="Custom title for search engines (optional)"
              className={inputClass}
              maxLength={120}
            />
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Defaults to Blog Title if left blank.
            </p>
          </div>
 
          <div>
            <label htmlFor="blog-seo-desc" className={labelClass}>
              SEO Description
            </label>
            <textarea
              id="blog-seo-desc"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Brief summary for search engine results snippets"
              rows={3}
              className={`${inputClass} resize-y`}
              maxLength={320}
            />
          </div>
 
          <div>
            <label htmlFor="blog-seo-keywords" className={labelClass}>
              SEO Keywords
            </label>
            <input
              id="blog-seo-keywords"
              type="text"
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
              placeholder="e.g. design, nextjs, react, tutorial"
              className={inputClass}
              maxLength={200}
            />
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Comma separated key terms.
            </p>
          </div>
        </div>
      </div>
 
      {/* Status Segmented Switch */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-5 shadow-2xs">
        <label htmlFor="blog-status" className={labelClass}>
          Publish Status
        </label>
        <div className="mt-2 flex flex-col sm:flex-row rounded-xl bg-slate-100/80 dark:bg-slate-800/80 p-1 border border-slate-200/60 dark:border-slate-700/60 max-w-md gap-1 sm:gap-0">
          <button
            type="button"
            onClick={() => setStatus("draft")}
            className={`relative flex-1 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${status === "draft"
                ? "text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
          >
            {status === "draft" && (
              <motion.div
                layoutId="status-indicator"
                className="absolute inset-0 rounded-lg bg-white dark:bg-slate-900 shadow-xs border border-slate-200/50 dark:border-slate-700/60"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Draft
            </span>
          </button>
 
          <button
            type="button"
            onClick={() => setStatus("published")}
            className={`relative flex-1 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${status === "published"
                ? "text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
          >
            {status === "published" && (
              <motion.div
                layoutId="status-indicator"
                className="absolute inset-0 rounded-lg bg-white dark:bg-slate-900 shadow-xs border border-slate-200/50 dark:border-slate-700/60"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Published
            </span>
          </button>
        </div>
        <select
          id="blog-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as "draft" | "published")}
          className="sr-only"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>
 
      {/* Submit Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 dark:bg-blue-500 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 dark:shadow-blue-500/20 transition-all hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              <span>Saving Changes…</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>{submitLabel}</span>
            </>
          )}
        </motion.button>
      </div>
    </form>
  );
}
 
 
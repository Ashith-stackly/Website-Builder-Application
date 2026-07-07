"use client";

import { useState, useCallback, useRef, type FormEvent } from "react";
import type { Blog, CreateBlogBody } from "@/types/blog";

interface BlogFormProps {
  /** Pre-filled data for edit mode. Omit for create mode. */
  initialData?: Blog;
  /** Called with validated form data when submitted. */
  onSubmit: (data: CreateBlogBody) => Promise<void>;
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
 * Handles client-side validation, field state, and error display.
 * Does NOT modify any existing UI — this is a new component.
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
    initialData?.status ?? "draft"
  );
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

      // Prevent duplicate submits
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
    "w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
  const labelClass = "block text-sm font-semibold text-slate-700 mb-1.5";
  const errorTextClass = "mt-1 text-xs text-red-600 font-medium";

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Form-level error (backend validation) */}
      {errors.form && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
          {errors.form}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="blog-title" className={labelClass}>
          Blog Title <span className="text-red-500">*</span>
        </label>
        <input
          id="blog-title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors((p) => ({ ...p, title: undefined }));
          }}
          placeholder="Enter your blog title"
          className={`${inputClass} ${errors.title ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""}`}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "blog-title-error" : undefined}
          maxLength={200}
          autoFocus
        />
        {errors.title && (
          <p id="blog-title-error" className={errorTextClass}>
            {errors.title}
          </p>
        )}
      </div>

      {/* Content */}
      <div>
        <label htmlFor="blog-content" className={labelClass}>
          Blog Content <span className="text-red-500">*</span>
        </label>
        <textarea
          id="blog-content"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (errors.content)
              setErrors((p) => ({ ...p, content: undefined }));
          }}
          placeholder="Write your blog content here..."
          rows={12}
          className={`${inputClass} resize-y min-h-[10rem] ${errors.content ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""}`}
          aria-invalid={!!errors.content}
          aria-describedby={errors.content ? "blog-content-error" : undefined}
        />
        {errors.content && (
          <p id="blog-content-error" className={errorTextClass}>
            {errors.content}
          </p>
        )}
      </div>

      {/* SEO Section */}
      <fieldset className="border border-slate-200 rounded-xl p-5 space-y-4">
        <legend className="text-sm font-bold text-slate-600 px-2">
          SEO Settings (optional)
        </legend>

        <div>
          <label htmlFor="blog-seo-title" className={labelClass}>
            SEO Title
          </label>
          <input
            id="blog-seo-title"
            type="text"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            placeholder="Custom title for search engines"
            className={inputClass}
            maxLength={120}
          />
          <p className="mt-1 text-xs text-slate-400">
            Falls back to Blog Title if empty.
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
            placeholder="Brief description for search results"
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
            placeholder="keyword1, keyword2, keyword3"
            className={inputClass}
            maxLength={200}
          />
        </div>
      </fieldset>

      {/* Featured Image */}
      <div>
        <label htmlFor="blog-featured-image" className={labelClass}>
          Featured Image URL
        </label>
        <input
          id="blog-featured-image"
          type="url"
          value={featuredImage}
          onChange={(e) => setFeaturedImage(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className={inputClass}
        />
      </div>

      {/* Status */}
      <div>
        <label htmlFor="blog-status" className={labelClass}>
          Status
        </label>
        <select
          id="blog-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as "draft" | "published")}
          className={`${inputClass} cursor-pointer`}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useEffect } from "react";

interface BlogSeoHeadProps {
  title: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  featuredImage?: string;
}

/**
 * Client-side SEO meta tag updater.
 * Since the project uses `output: "export"` (static export),
 * we cannot use Next.js `generateMetadata()` at runtime.
 * Instead, this component dynamically sets document.title and
 * relevant <meta> tags via useEffect.
 */
export default function BlogSeoHead({
  title,
  seoTitle,
  seoDescription,
  seoKeywords,
  featuredImage,
}: BlogSeoHeadProps) {
  useEffect(() => {
    const pageTitle = seoTitle?.trim() || title;
    const fullTitle = `${pageTitle} | Stackly Blog`;
    const description = seoDescription?.trim() || "";
    const keywords = seoKeywords?.join(", ") || "";

    // Set document title
    document.title = fullTitle;

    // Helper to set or create a meta tag
    const setMeta = (
      attr: "name" | "property",
      key: string,
      content: string
    ) => {
      if (!content) return;
      let el = document.querySelector<HTMLMetaElement>(
        `meta[${attr}="${key}"]`
      );
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    // Standard meta
    if (description) setMeta("name", "description", description);
    if (keywords) setMeta("name", "keywords", keywords);

    // Open Graph
    setMeta("property", "og:title", pageTitle);
    if (description) setMeta("property", "og:description", description);
    setMeta("property", "og:type", "article");
    if (featuredImage) setMeta("property", "og:image", featuredImage);

    // Twitter Card
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", pageTitle);
    if (description) setMeta("name", "twitter:description", description);
    if (featuredImage) setMeta("name", "twitter:image", featuredImage);

    // Cleanup: restore default title on unmount
    return () => {
      document.title = "Stackly | Drag and Drop Website Builder";
    };
  }, [title, seoTitle, seoDescription, seoKeywords, featuredImage]);

  return null;
}

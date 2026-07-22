"use client";

import { useEffect } from "react";

interface BlogSeoHeadProps {
  title: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  featuredImage?: string;
  canonicalUrl?: string;
  publishedAt?: string;
  updatedAt?: string;
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
  canonicalUrl,
  publishedAt,
  updatedAt,
}: BlogSeoHeadProps) {
  useEffect(() => {
    const previousTitle = document.title;
    const pageTitle = seoTitle?.trim() || title;
    const fullTitle = `${pageTitle} | Stackly Blog`;
    const description = seoDescription?.trim() || "";
    const keywords = seoKeywords?.join(", ") || "";

    document.title = fullTitle;

    const setMeta = (
      attr: "name" | "property",
      key: string,
      content?: string
    ) => {
      let el = document.querySelector<HTMLMetaElement>(
        `meta[${attr}="${key}"]`
      );
      if (!content) {
        if (el?.dataset.stacklyBlogSeo === "true") el.remove();
        return;
      }
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.dataset.stacklyBlogSeo = "true";
      el.setAttribute("content", content);
    };

    const setCanonical = (href?: string) => {
      let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!href) {
        if (el?.dataset.stacklyBlogSeo === "true") el.remove();
        return;
      }
      if (!el) {
        el = document.createElement("link");
        el.rel = "canonical";
        document.head.appendChild(el);
      }
      el.dataset.stacklyBlogSeo = "true";
      el.href = href;
    };

    setCanonical(canonicalUrl);

    setMeta("name", "description", description);
    setMeta("name", "keywords", keywords);
    setMeta("property", "og:title", pageTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", "article");
    setMeta("property", "og:image", featuredImage);
    setMeta("property", "og:url", canonicalUrl);
    setMeta("property", "article:published_time", publishedAt);
    setMeta("property", "article:modified_time", updatedAt);

    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", pageTitle);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", featuredImage);

    return () => {
      document.title = previousTitle;
      document
        .querySelectorAll('[data-stackly-blog-seo="true"]')
        .forEach((element) => element.remove());
    };
  }, [title, seoTitle, seoDescription, seoKeywords, featuredImage, canonicalUrl, publishedAt, updatedAt]);

  return null;
}

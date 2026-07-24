"use client";

import { useEffect } from "react";
import "@/lib/reactDomPatch";

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
 * Safely updates document.title and meta tags without imperatively
 * removing nodes from document.head during React component unmounting,
 * avoiding React Fiber null removeChild DOM errors.
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
    if (typeof document === "undefined") return;

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
      if (!content) return;
      let el = document.querySelector<HTMLMetaElement>(
        `meta[${attr}="${key}"]`
      );
      if (!el && document.head) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      if (el) {
        el.setAttribute("content", content);
      }
    };

    const setCanonical = (href?: string) => {
      if (!href) return;
      let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!el && document.head) {
        el = document.createElement("link");
        el.rel = "canonical";
        document.head.appendChild(el);
      }
      if (el) {
        el.href = href;
      }
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
  }, [title, seoTitle, seoDescription, seoKeywords, featuredImage, canonicalUrl, publishedAt, updatedAt]);

  return null;
}

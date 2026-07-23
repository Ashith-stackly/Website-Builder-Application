import type { ReactNode } from "react";

export const dynamicParams = false;
const BUILD_FALLBACK_SLUG = "__build-fallback__";

export async function generateStaticParams() {
  const slugs: string[] = [BUILD_FALLBACK_SLUG];

  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
    const res = await fetch(`${apiBase}/blog/all-slugs`, { cache: "no-store" }).catch(() => null);
    if (res && res.ok) {
      const data = (await res.json().catch(() => ({}))) as { slugs?: string[] };
      if (Array.isArray(data?.slugs)) {
        for (const s of data.slugs) {
          if (s && typeof s === "string") slugs.push(s);
        }
      }
    }
  } catch {
    /* ignore fetch error during static param generation */
  }

  const unique = Array.from(new Set(slugs));
  return unique.map((slug) => ({ slug }));
}

export default function EditBlogLayout({ children }: { children: ReactNode }) {
  return children;
}

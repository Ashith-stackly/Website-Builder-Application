import type { ReactNode } from "react";
import { getBlogs } from "@/lib/blogApi";
import "../blog.css";

export const dynamicParams = false;
const BUILD_FALLBACK_SLUG = "__build-fallback__";

export async function generateStaticParams() {
  try {
    const blogs = await getBlogs();
    const params = blogs
      .filter((blog) => blog.status === "published")
      .map((blog) => ({ slug: blog.slug }));

    return params.length > 0 ? params : [{ slug: BUILD_FALLBACK_SLUG }];
  } catch (error) {
    console.warn("Unable to load blog slugs during static export:", error);
    return [{ slug: BUILD_FALLBACK_SLUG }];
  }
}

/**
 * Layout for public blog view (/blog/[slug]).
 * Inherits the blog CSS for consistent styling.
 */
export default function BlogSlugLayout({ children }: { children: ReactNode }) {
  return children;
}

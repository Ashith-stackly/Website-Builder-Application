import type { ReactNode } from "react";
import "../blog.css";

export const dynamicParams = false;
const BUILD_FALLBACK_SLUG = "__build-fallback__";

export async function generateStaticParams() {
  // Public posts are workspace-scoped and load client-side in the static export.
  return [{ slug: BUILD_FALLBACK_SLUG }];
}

/**
 * Layout for public blog view (/blog/[slug]).
 * Inherits the blog CSS for consistent styling.
 */
export default function BlogSlugLayout({ children }: { children: ReactNode }) {
  return children;
}

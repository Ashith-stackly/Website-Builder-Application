import type { ReactNode } from "react";
import "../blog.css";

/**
 * Layout for public blog view (/blog/[slug]).
 * Inherits the blog CSS for consistent styling.
 */
export default function BlogSlugLayout({ children }: { children: ReactNode }) {
  return children;
}

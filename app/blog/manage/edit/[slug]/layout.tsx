import type { ReactNode } from "react";
import { getBlogs } from "@/lib/blogApi";

export const dynamicParams = false;
const BUILD_FALLBACK_SLUG = "__build-fallback__";

export async function generateStaticParams() {
  try {
    const blogs = await getBlogs();
    const params = blogs.map((blog) => ({ slug: blog.slug }));
    return params.length > 0 ? params : [{ slug: BUILD_FALLBACK_SLUG }];
  } catch (error) {
    console.warn("Unable to load editable blog slugs during static export:", error);
    return [{ slug: BUILD_FALLBACK_SLUG }];
  }
}

export default function EditBlogLayout({ children }: { children: ReactNode }) {
  return children;
}

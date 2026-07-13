import type { ReactNode } from "react";

export const dynamicParams = false;
const BUILD_FALLBACK_SLUG = "__build-fallback__";

export async function generateStaticParams() {
  return [{ slug: BUILD_FALLBACK_SLUG }];
}

export default function EditBlogLayout({ children }: { children: ReactNode }) {
  return children;
}

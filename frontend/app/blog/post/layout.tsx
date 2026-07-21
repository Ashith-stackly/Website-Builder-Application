import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog Post | Stackly Blog",
  description: "Read a published Stackly website blog post.",
  openGraph: {
    title: "Blog Post | Stackly Blog",
    description: "Read a published Stackly website blog post.",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog Post | Stackly Blog",
    description: "Read a published Stackly website blog post.",
  },
};

export default function BlogPostLayout({ children }: { children: ReactNode }) {
  return children;
}

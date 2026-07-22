import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./blog.css";

export const metadata: Metadata = {
  title: "Stackly Blog",
  description: "Published articles for Stackly websites.",
  openGraph: {
    title: "Stackly Blog",
    description: "Published articles for Stackly websites.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stackly Blog",
    description: "Published articles for Stackly websites.",
  },
};

export default function BlogLayout({ children }: { children: ReactNode }) {
  return children;
}

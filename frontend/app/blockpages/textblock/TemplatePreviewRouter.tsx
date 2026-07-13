"use client";

import dynamic from "next/dynamic";
import { BlockpagesEditorProvider } from "@/lib/blockpagesEditorContext";
import type { TextTemplateType } from "./types";

const RestaurantPage = dynamic(() => import("@/app/restaurant/page"), { ssr: false });
const ConstructionPage = dynamic(() => import("@/app/construction/page"), { ssr: false });
const BlogPage = dynamic(() => import("@/app/blog/page"), { ssr: false });
const DigitalMarketingPage = dynamic(() => import("@/app/digital-marketing/page"), { ssr: false });

const INLINE_TEMPLATE_PAGES: Partial<
  Record<TextTemplateType, React.ComponentType<object>>
> = {
  restaurant: RestaurantPage,
  construction: ConstructionPage,
  blog: BlogPage,
  "digital-marketing": DigitalMarketingPage,
  business: DigitalMarketingPage,
};

type TemplatePreviewRouterProps = {
  template: TextTemplateType;
  onPreview?: () => void;
};

export default function TemplatePreviewRouter({ template, onPreview }: TemplatePreviewRouterProps) {
  const PageComponent = INLINE_TEMPLATE_PAGES[template];

  if (!PageComponent) {
    return null;
  }

  return (
    <BlockpagesEditorProvider template={template} onPreview={onPreview}>
      <PageComponent />
    </BlockpagesEditorProvider>
  );
}

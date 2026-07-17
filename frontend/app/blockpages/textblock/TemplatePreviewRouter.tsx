"use client";

import { memo } from "react";
import dynamic from "next/dynamic";
import type { TextTemplateType } from "./types";

function TemplatePageLoader() {
  return (
    <div className="flex min-h-[560px] w-full items-center justify-center bg-white text-sm font-medium text-slate-500">
      Loading template…
    </div>
  );
}

const RestaurantPage = dynamic(() => import("@/app/restaurant/page"), { ssr: false, loading: TemplatePageLoader });
const ConstructionPage = dynamic(() => import("@/app/construction/page"), { ssr: false, loading: TemplatePageLoader });
const BlogPage = dynamic(() => import("@/app/blog/page"), { ssr: false, loading: TemplatePageLoader });
const DigitalMarketingPage = dynamic(() => import("@/app/digital-marketing/page"), { ssr: false, loading: TemplatePageLoader });

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
};

function TemplatePreviewRouter({ template }: TemplatePreviewRouterProps) {
  const PageComponent = INLINE_TEMPLATE_PAGES[template];

  if (!PageComponent) {
    return null;
  }

  return <PageComponent />;
}

export default memo(TemplatePreviewRouter);

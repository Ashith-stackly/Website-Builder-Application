/** Shared blog category data for /blog page + header dropdown */
export const blogCategories = [
  {
    id: "blog-cat-personal",
    label: "Personal Blog",
    description:
      "Clean layouts for storytellers, journals, and creative portfolios.",
    image: "/landing-optimized/blog1.webp",
  },
  {
    id: "blog-cat-tech",
    label: "Tech & News",
    description:
      "Professional templates for tutorials, reviews, and industry news.",
    image: "/landing-optimized/blog2.webp",
  },
  {
    id: "blog-cat-restaurant",
    label: "Restaurant Blog",
    description: "Recipe cards, menu sections, and rich restaurant photography blocks.",
    image: "/blog/template-food.webp",
  },
  {
    id: "blog-cat-travel",
    label: "Travel Blog",
    description: "Photo-first layouts built for guides, itineraries, and adventures.",
    image: "/blog/template-travel.webp",
  },
  {
    id: "blog-cat-lifestyle",
    label: "Lifestyle",
    description: "Minimal designs for wellness, fashion, and everyday inspiration.",
    image: "/blog/template-personal.webp",
  },
  {
    id: "blog-cat-business",
    label: "Business Blog",
    description:
      "Credibility-focused layouts for company updates and thought leadership.",
    image: "/landing-optimized/business09.webp",
  },
] as const;

export type BlogCategory = (typeof blogCategories)[number];

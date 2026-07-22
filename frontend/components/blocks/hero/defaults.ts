import type { HeroProps } from "@/types/builder";

export const HERO_SCHEMA_VERSION = 1;

export const heroDefaults: HeroProps = {
  schemaVersion: HERO_SCHEMA_VERSION,
  title: "Create a website in minutes",
  description: "Design, edit, and export a clean landing page without leaving the builder.",
  cta: { label: "Start Building" },
  layout: "split",
  align: "left",
  media: { type: "placeholder" },
};

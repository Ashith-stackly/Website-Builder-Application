import type { ComponentType } from "@/types/builder";

/** Shared geometry defaults for the opt-in Freeform canvas and static export. */
export const FREEFORM_DESIGN_WIDTH = 1280;
export const FREEFORM_MIN_WIDTH = 120;
export const FREEFORM_MIN_HEIGHT = 40;
export const FREEFORM_DEFAULT_WIDTH = 720;

export const FREEFORM_DEFAULT_HEIGHT_BY_TYPE: Partial<Record<ComponentType, number>> = {
  navigation: 88,
  hero: 420,
  features: 300,
  gallery: 330,
  contact: 300,
  footer: 180,
  "pricing-table": 360,
  "product-collection": 360,
  testimonial: 280,
  columns: 220,
  container: 220,
  row: 180,
  image: 280,
  video: 260,
  map: 300,
  spacer: 80,
};

export const getFreeformDefaultHeight = (type: ComponentType) =>
  FREEFORM_DEFAULT_HEIGHT_BY_TYPE[type] ?? 180;

/** Keep a readable canvas frame while allowing narrow responsive artboards. */
export const getFreeformDefaultWidth = (canvasWidth: number) =>
  Math.min(FREEFORM_DEFAULT_WIDTH, Math.max(280, canvasWidth - 96));

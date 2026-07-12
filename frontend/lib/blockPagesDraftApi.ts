/**
 * Block Pages Draft API
 *
 * Thin wrapper around the existing projectApi to handle Block Pages–specific
 * draft persistence.  No new backend endpoints are required — we reuse:
 *
 *   POST   /api/projects              → createProject
 *   PUT    /api/projects/:id/autosave  → autosaveProject
 *   GET    /api/projects/:id           → getProject
 */

import {
  createProject,
  autosaveProject,
  getProject,
  isProjectConnectionError,
  type ProjectApiProject,
} from "@/lib/projectApi";

import type { TextBlockState, TextTemplateType } from "@/app/blockpages/textblock/types";
import type { BlockData } from "@/app/blockpages/buttonblock/types";
import type { VideoBlockData } from "@/app/blockpages/videoblock/types";
import type { DividerBlockData } from "@/app/blockpages/dividerblock/types";
import type { DividerBlockProps } from "@/app/blockpages/dividerblock/types";
import type { IconBlockData } from "@/app/blockpages/iconsblock/types";
import type { IconBlockProps } from "@/app/blockpages/iconsblock/types";

// ── Payload Types ────────────────────────────────────────────────────────

export interface AppliedDivider {
  id: string;
  props: DividerBlockProps;
  position?: { x: number; y: number };
  scale?: number;
}

export interface AppliedIcon {
  id: string;
  props: IconBlockProps;
  position?: { x: number; y: number };
  scale?: number;
}

/** Complete serialisable snapshot of the Block Pages editor state. */
export interface BlockPagesDraftPayload {
  template: TextTemplateType;
  textBlockState: TextBlockState;
  buttonBlocks: BlockData[];
  videoBlocks: VideoBlockData[];
  dividerBlocks: DividerBlockData[];
  iconBlocks: IconBlockData[];
  customImages: Record<string, string>;
  customButtons: Record<string, BlockData["props"]>;
  customIcons: Record<string, IconBlockProps>;
  appliedDividers: AppliedDivider[];
  appliedIcons: AppliedIcon[];
}

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Strip blob: URLs from a customImages map.  Blob URLs are
 * browser-session-local and cannot be persisted to MongoDB.
 */
function sanitiseImages(images: Record<string, string>): Record<string, string> {
  const clean: Record<string, string> = {};
  for (const [key, value] of Object.entries(images)) {
    clean[key] = typeof value === "string" && value.startsWith("blob:") ? "" : value;
  }
  return clean;
}

// ── API Functions ────────────────────────────────────────────────────────

/**
 * Create a new backend project to hold a Block Pages draft.
 * Returns the created project (including `_id`).
 */
export async function createBlockPagesDraft(
  template: TextTemplateType,
  signal?: AbortSignal,
): Promise<ProjectApiProject> {
  const templateLabel = template.charAt(0).toUpperCase() + template.slice(1);
  return createProject(
    {
      projectName: `Block Pages — ${templateLabel}`,
      category: "blockpages",
      description: `Block Pages draft (${template} template)`,
    },
    signal,
  );
}

/**
 * Persist the current Block Pages editor state to the backend.
 * Uses the existing autosave endpoint.
 */
export async function saveBlockPagesDraft(
  projectId: string,
  payload: BlockPagesDraftPayload,
  signal?: AbortSignal,
  htmlContent?: string,
): Promise<{ success: boolean; savedAt?: string }> {
  const sanitisedPayload: BlockPagesDraftPayload = {
    ...payload,
    customImages: sanitiseImages(payload.customImages),
  };

  const autosavePayload: {
    builderData: Record<string, unknown>;
    htmlContent?: string;
  } = {
    builderData: {
      schemaVersion: 1,
      blockPagesData: sanitisedPayload,
    } as Record<string, unknown>,
  };

  if (typeof htmlContent === "string") {
    autosavePayload.htmlContent = htmlContent;
  }

  return autosaveProject(
    projectId,
    autosavePayload,
    signal,
  );
}

/**
 * Load a saved Block Pages draft from the backend.
 * Returns null if the project has no blockPagesData.
 */
export async function loadBlockPagesDraft(
  projectId: string,
  signal?: AbortSignal,
): Promise<{ project: ProjectApiProject; draft: BlockPagesDraftPayload | null }> {
  const project = await getProject(projectId, signal);
  const builderData = project.builderData as Record<string, unknown> | null | undefined;
  const blockPagesData = (builderData?.blockPagesData ?? null) as BlockPagesDraftPayload | null;
  return { project, draft: blockPagesData };
}

export { isProjectConnectionError };

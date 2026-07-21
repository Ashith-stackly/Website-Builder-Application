/**
 * Client for the authenticated AI assistant endpoints.
 *
 * Deliberately keep provider credentials on the server. The browser only sends
 * the user's requested content context and its existing session token.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

const CACHE_TTL_MS = 45_000;

export type AITextTone =
  | "professional"
  | "friendly"
  | "creative"
  | "corporate"
  | "minimal"
  | "luxury"
  | "startup"
  | "playful"
  | "bold"
  | "concise";
export type AITextLength = "short" | "medium" | "long";

export interface GenerateAITextInput {
  blockType: string;
  field: string;
  tone: AITextTone;
  length: AITextLength;
  businessType?: string;
  keywords?: string;
  websiteName?: string;
  additionalInstructions?: string;
  /** Existing content gives the provider useful continuity without exposing credentials. */
  currentText?: string;
  /** Requests a coherent set of fields for the selected block, when supported by the provider. */
  wholeSection?: boolean;
  /** Exact editable field keys currently rendered in a whole-section request. */
  sectionFields?: string[];
}

export interface GenerateAITextResult {
  generatedText: string;
  generatedFields?: Record<string, unknown>;
  provider?: string;
}

type ApiErrorBody = {
  message?: string;
  errors?: string[];
  generatedText?: string;
  generatedFields?: Record<string, unknown>;
  provider?: string;
  data?: {
    generatedText?: string;
    generatedFields?: Record<string, unknown>;
    provider?: string;
  };
  imageUrl?: string;
  mimeType?: string;
  alt?: string;
  source?: string;
  suggestion?: LayoutSuggestion;
};

type CacheEntry = {
  expiresAt: number;
  result: GenerateAITextResult;
};

const textCache = new Map<string, CacheEntry>();

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("stackly-auth-token");
}

function toCacheKey(input: GenerateAITextInput): string {
  return JSON.stringify({
    blockType: input.blockType,
    field: input.field,
    tone: input.tone,
    length: input.length,
    businessType: input.businessType?.trim() || "",
    keywords: input.keywords?.trim() || "",
    websiteName: input.websiteName?.trim() || "",
    additionalInstructions: input.additionalInstructions?.trim() || "",
    currentText: input.currentText || "",
    wholeSection: Boolean(input.wholeSection),
    sectionFields: input.sectionFields ?? [],
  });
}

function readResult(body: ApiErrorBody): GenerateAITextResult | null {
  const data = body.data ?? body;
  if (typeof data.generatedText !== "string" || !data.generatedText.trim()) return null;

  const generatedFields =
    data.generatedFields && typeof data.generatedFields === "object"
      ? data.generatedFields
      : undefined;

  return {
    generatedText: data.generatedText.trim(),
    ...(generatedFields && Object.keys(generatedFields).length > 0 ? { generatedFields } : {}),
    ...(typeof data.provider === "string" ? { provider: data.provider } : {}),
  };
}

/**
 * Generate copy through the backend. `forceRefresh` is used by Regenerate;
 * ordinary repeat requests use a short in-memory cache to avoid needless calls
 * while a user is adjusting the dialog.
 */
export async function generateAIText(
  input: GenerateAITextInput,
  options: { signal?: AbortSignal; forceRefresh?: boolean } = {},
): Promise<GenerateAITextResult> {
  const cacheKey = toCacheKey(input);
  const cached = textCache.get(cacheKey);

  if (!options.forceRefresh && cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  if (cached) textCache.delete(cacheKey);

  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/ai/generate-text`, {
    method: "POST",
    signal: options.signal,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  });

  const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
  if (!response.ok) {
    const message = body.message || body.errors?.join(", ") || "AI generation failed. Please try again.";
    throw new Error(message);
  }

  const result = readResult(body);
  if (!result) {
    throw new Error("The AI service returned no usable text. Please try again.");
  }

  textCache.set(cacheKey, { result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}

export function clearAITextCache(): void {
  textCache.clear();
}

export interface GenerateAIImageInput {
  prompt: string;
  style?: string;
  aspectRatio?: string;
  size?: string;
  /** Uses the server-side deterministic placeholder generator instead of a paid image provider. */
  mode?: "generate" | "placeholder";
}

export interface GenerateAIImageResult {
  imageUrl: string;
  mimeType?: string;
  alt?: string;
  source?: string;
}

export interface LayoutSuggestionSection {
  type: string;
  label: string;
  purpose: string;
  contentHint?: string;
  props?: Record<string, unknown>;
}

export interface LayoutSuggestion {
  title: string;
  rationale?: string;
  sections: LayoutSuggestionSection[];
  colorPalette?: Record<string, string>;
}

export interface SuggestAILayoutInput {
  businessType?: string;
  industry?: string;
  goal?: string;
  services?: string[] | string;
  contentLength?: "short" | "medium" | "long";
}

async function authenticatedAIRequest(path: string, body: unknown, signal?: AbortSignal): Promise<ApiErrorBody> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as ApiErrorBody;
  if (!response.ok) {
    throw new Error(payload.message || payload.errors?.join(", ") || "AI request failed. Please try again.");
  }
  return payload.data ? { ...payload, ...payload.data } : payload;
}

/** POST /api/ai/generate-image — credentials remain exclusively on the server. */
export async function generateAIImage(
  input: GenerateAIImageInput,
  signal?: AbortSignal,
): Promise<GenerateAIImageResult> {
  const data = await authenticatedAIRequest("/ai/generate-image", input, signal);
  if (typeof data.imageUrl !== "string" || !data.imageUrl) {
    throw new Error("The AI image service returned no usable image.");
  }
  return {
    imageUrl: data.imageUrl,
    ...(typeof data.mimeType === "string" ? { mimeType: data.mimeType } : {}),
    ...(typeof data.alt === "string" ? { alt: data.alt } : {}),
    ...(typeof data.source === "string" ? { source: data.source } : {}),
  };
}

/** POST /api/ai/suggest-layout — returns a proposal; callers decide whether to apply it. */
export async function suggestAILayout(
  input: SuggestAILayoutInput,
  signal?: AbortSignal,
): Promise<LayoutSuggestion> {
  const data = await authenticatedAIRequest("/ai/suggest-layout", input, signal);
  const suggestion = data.suggestion;
  if (!suggestion || !Array.isArray(suggestion.sections)) {
    throw new Error("The AI layout service returned no usable suggestion.");
  }
  return suggestion;
}

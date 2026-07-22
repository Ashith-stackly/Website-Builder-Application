import type { Asset } from "@/types/assets";
import type { BuilderComponent, SEOMetadata } from "@/types/builder";
import type { ProjectBuilderData } from "@/lib/projectApi";
import type { DesignTokens } from "@/store/designStore";
import { blobToDataUrl } from "@/lib/assetUtils";
import { generateHtml } from "@/lib/exportHtml";

/**
 * A deployment package is deliberately separate from the editable project.
 *
 * The builder keeps friendly data URLs and IndexedDB asset ids so editing can
 * continue offline. This module creates a throw-away, publish-only copy where
 * every resolved local asset is addressed by a stable relative file path. The
 * resulting package is ready for a future upload/deployment worker without
 * introducing any hosting infrastructure in the browser.
 */

export const DEPLOYMENT_PACKAGE_VERSION = 1;

export type DeploymentAssetKind = "image" | "video" | "font" | "other";
export type DeploymentIssueCode =
  | "external-asset"
  | "invalid-asset"
  | "missing-asset"
  | "temporary-url"
  | "unsupported-asset";

export interface DeploymentIssue {
  code: DeploymentIssueCode;
  severity: "warning" | "error";
  fieldPath: string;
  message: string;
  source?: string;
}

export interface DeploymentAssetManifestEntry {
  /** Browser-local id when the asset originated in the Stackly library. */
  sourceAssetId?: string;
  /** Original filename when known; useful for deployment worker diagnostics. */
  name: string;
  /** A concise, serializable description of the original reference. */
  originalSource: string;
  /** `assets/...` for a bundled file, or the approved external URL. */
  generatedPath: string;
  contentType: string;
  size: number;
  width?: number;
  height?: number;
  hash?: string;
  hashAlgorithm?: "sha-256" | "fnv1a-32";
  kind: DeploymentAssetKind;
  status: "ready" | "external";
  references: string[];
}

export interface DeploymentAssetManifest {
  schemaVersion: number;
  generatedAt: string;
  workspaceId?: string;
  assets: DeploymentAssetManifestEntry[];
  unresolved: DeploymentIssue[];
}

export interface DeploymentAssetFile {
  path: string;
  contentType: string;
  size: number;
  /** Kept in memory only. It is intentionally omitted from publish JSON. */
  blob: Blob;
}

export interface DeploymentPackageMetadata {
  schemaVersion: number;
  generatedAt: string;
  workspaceId?: string;
  projectName?: string;
  files: string[];
  assetCount: number;
  imageCount: number;
  totalBytes: number;
  fontFamilies: string[];
}

export interface DeploymentPackage {
  schemaVersion: number;
  indexHtml: string;
  stylesCss: string;
  scriptsJs: string;
  /** A deployment-only copy with asset references rewritten to `assets/...`. */
  builderData: ProjectBuilderData;
  builderJson: string;
  assetManifest: DeploymentAssetManifest;
  assetManifestJson: string;
  metadata: DeploymentPackageMetadata;
  metadataJson: string;
  assetFiles: DeploymentAssetFile[];
  warnings: DeploymentIssue[];
  errors: DeploymentIssue[];
  totalBytes: number;
  fileCount: number;
  imageCount: number;
}

/** JSON-safe package metadata stored with WorkspaceState / sent to publish. */
export interface SerializedDeploymentPackage {
  schemaVersion: number;
  indexHtml: string;
  stylesCss: string;
  scriptsJs: string;
  builderJson: string;
  builderData: ProjectBuilderData;
  assetManifest: DeploymentAssetManifest;
  referencedAssets: DeploymentAssetManifestEntry[];
  metadata: DeploymentPackageMetadata;
  validation: {
    warnings: DeploymentIssue[];
    errors: DeploymentIssue[];
  };
}

export interface DeploymentPackageSummary {
  filesPrepared: string[];
  assetCount: number;
  imageCount: number;
  totalBytes: number;
  warnings: DeploymentIssue[];
  errors: DeploymentIssue[];
}

export interface DeploymentAssetResolver {
  /** Current IndexedDB-backed asset metadata, used for friendly manifest data. */
  assets: Asset[];
  /** Returns a data URL for a local asset id, or null if its bytes no longer exist. */
  getDataUrl: (id: string) => Promise<string | null>;
}

export interface CreateDeploymentPackageInput {
  builderData: ProjectBuilderData;
  workspaceId?: string | null;
  projectName?: string | null;
  assetResolver: DeploymentAssetResolver;
}

type Hash = { value: string; algorithm: "sha-256" | "fnv1a-32" };

type AssetResolution = {
  value: string;
  entry?: DeploymentAssetManifestEntry;
};

type PackageBuildContext = {
  assetsById: Map<string, Asset>;
  resolver: DeploymentAssetResolver;
  entriesByKey: Map<string, DeploymentAssetManifestEntry>;
  filesByPath: Map<string, DeploymentAssetFile>;
  resolutions: Map<string, AssetResolution>;
  warnings: DeploymentIssue[];
  errors: DeploymentIssue[];
};

const ASSET_VALUE_KEYS = new Set([
  "src",
  "image",
  "imageUrl",
  "logo",
  "logoUrl",
  "backgroundImage",
  "backgroundUrl",
  "poster",
  "thumbnail",
  "cover",
  "coverImage",
  "ogImage",
  "fontUrl",
  "fontSource",
]);

const ASSET_COLLECTION_KEYS = new Set([
  "images",
  "imageUrls",
  "backgroundImages",
  "posters",
  "thumbnails",
  "fontUrls",
]);

const ASSET_ID_KEYS = [
  "assetId",
  "imageAssetId",
  "logoAssetId",
  "mediaAssetId",
  "backgroundAssetId",
  "posterAssetId",
];

const MIME_EXTENSIONS: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/svg+xml": "svg",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/ogg": "ogv",
  "video/webm": "webm",
  "font/woff": "woff",
  "font/woff2": "woff2",
  "application/font-woff": "woff",
};

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function byteLength(value: string): number {
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(value).byteLength;
  return value.length;
}

function conciseSource(source: string): string {
  if (source.startsWith("data:")) {
    const mime = source.match(/^data:([^;,]+)/i)?.[1] || "application/octet-stream";
    return `data:${mime};…`;
  }
  return source.length > 500 ? `${source.slice(0, 497)}…` : source;
}

function isDataUrl(value: string): boolean {
  return /^data:/i.test(value);
}

function isBlobUrl(value: string): boolean {
  return /^blob:/i.test(value);
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value) || /^\/\//.test(value);
}

function isLocalhostUrl(value: string): boolean {
  return /^(?:https?:)?\/\/(?:localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0)(?::\d+)?(?:\/|$)/i.test(value);
}

function isLikelyAssetUrl(value: string): boolean {
  const source = value.trim();
  return isDataUrl(source)
    || isBlobUrl(source)
    || isHttpUrl(source)
    || /^(?:\/|\.\/|\.\.\/)/.test(source)
    || /\.(?:avif|gif|jpe?g|png|svg|webp|mp4|webm|og[gv]|woff2?|ttf|otf)(?:[?#].*)?$/i.test(source);
}

function isVideoEmbedUrl(value: string): boolean {
  return /(?:youtube\.com|youtu\.be|vimeo\.com)/i.test(value);
}

function getAssociatedAssetId(value: Record<string, unknown>): string | undefined {
  for (const key of ASSET_ID_KEYS) {
    if (typeof value[key] === "string" && value[key].trim()) return value[key].trim();
  }
  return undefined;
}

function guessContentType(source: string): string {
  const normalized = source.split("?")[0].split("#")[0].toLowerCase();
  if (/\.avif$/.test(normalized)) return "image/avif";
  if (/\.gif$/.test(normalized)) return "image/gif";
  if (/\.jpe?g$/.test(normalized)) return "image/jpeg";
  if (/\.png$/.test(normalized)) return "image/png";
  if (/\.svg$/.test(normalized)) return "image/svg+xml";
  if (/\.webp$/.test(normalized)) return "image/webp";
  if (/\.mp4$/.test(normalized)) return "video/mp4";
  if (/\.webm$/.test(normalized)) return "video/webm";
  if (/\.og[gv]$/.test(normalized)) return "video/ogg";
  if (/\.woff2$/.test(normalized)) return "font/woff2";
  if (/\.woff$/.test(normalized)) return "font/woff";
  return "application/octet-stream";
}

function extensionFor(contentType: string, source: string): string {
  const normalizedType = contentType.split(";")[0].toLowerCase();
  if (MIME_EXTENSIONS[normalizedType]) return MIME_EXTENSIONS[normalizedType];
  const match = source.split("?")[0].split("#")[0].match(/\.([a-z0-9]{2,8})$/i);
  return match?.[1].toLowerCase() || "bin";
}

function kindFor(contentType: string): DeploymentAssetKind {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("font/") || /(?:woff|ttf|otf)/.test(contentType)) return "font";
  return "other";
}

function fileStem(source: string, fallback = "asset"): string {
  if (isDataUrl(source) || isBlobUrl(source)) return fallback;
  const sourceName = source.split("/").pop()?.split("?")[0]?.split("#")[0] || fallback;
  const withoutExtension = sourceName.replace(/\.[a-z0-9]{2,8}$/i, "");
  const safe = withoutExtension
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return (safe || fallback).toLowerCase();
}

function makeIssue(
  code: DeploymentIssueCode,
  severity: DeploymentIssue["severity"],
  fieldPath: string,
  message: string,
  source?: string,
): DeploymentIssue {
  return { code, severity, fieldPath, message, ...(source ? { source: conciseSource(source) } : {}) };
}

async function hashBlob(blob: Blob): Promise<Hash> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return {
      value: Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, "0")).join(""),
      algorithm: "sha-256",
    };
  }

  // A non-cryptographic, deterministic fallback for older browsers. The
  // manifest labels it accurately; deployment services can re-hash bytes.
  let hash = 0x811c9dc5;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193);
  }
  return { value: (hash >>> 0).toString(16).padStart(8, "0"), algorithm: "fnv1a-32" };
}

async function loadBlob(source: string, assetId: string | undefined, context: PackageBuildContext): Promise<{
  blob: Blob;
  originalSource: string;
  asset?: Asset;
} | null> {
  const asset = assetId ? context.assetsById.get(assetId) : undefined;

  if (assetId) {
    const dataUrl = await context.resolver.getDataUrl(assetId);
    if (dataUrl) {
      try {
        const response = await fetch(dataUrl);
        if (response.ok) return { blob: await response.blob(), originalSource: `asset:${assetId}`, asset };
      } catch {
        // Fall through to the source value. A user may still have a valid data URL.
      }
    }
  }

  try {
    const response = await fetch(source);
    if (!response.ok) return null;
    return { blob: await response.blob(), originalSource: source, asset };
  } catch {
    return null;
  }
}

function resolutionKey(source: string, assetId?: string): string {
  return `${assetId || ""}\u0000${source}`;
}

async function resolveAssetReference(
  rawSource: string,
  fieldPath: string,
  context: PackageBuildContext,
  assetId?: string,
): Promise<AssetResolution> {
  const source = rawSource.trim();
  if (!source && !assetId) return { value: rawSource };

  const cacheKey = resolutionKey(source, assetId);
  const cached = context.resolutions.get(cacheKey);
  if (cached) {
    if (cached.entry && !cached.entry.references.includes(fieldPath)) cached.entry.references.push(fieldPath);
    return cached;
  }

  const isExternalVideo = isVideoEmbedUrl(source);
  if (isExternalVideo) {
    const externalKey = `external:${source}`;
    const existing = context.entriesByKey.get(externalKey);
    if (existing) {
      if (!existing.references.includes(fieldPath)) existing.references.push(fieldPath);
      const result = { value: source, entry: existing };
      context.resolutions.set(cacheKey, result);
      return result;
    }
    const entry: DeploymentAssetManifestEntry = {
      name: "embedded-video",
      originalSource: conciseSource(source),
      generatedPath: source,
      contentType: "text/uri-list",
      size: 0,
      kind: "video",
      status: "external",
      references: [fieldPath],
    };
    context.entriesByKey.set(externalKey, entry);
    const result = { value: source, entry };
    context.resolutions.set(cacheKey, result);
    return result;
  }

  const loaded = await loadBlob(source, assetId, context);
  if (!loaded) {
    if (isHttpUrl(source) && !isLocalhostUrl(source)) {
      const issue = makeIssue(
        "external-asset",
        "warning",
        fieldPath,
        "This external asset could not be copied because its host did not allow browser access. It will remain an external URL in the deployment.",
        source,
      );
      context.warnings.push(issue);
      const externalKey = `external:${source}`;
      const existing = context.entriesByKey.get(externalKey);
      if (existing) {
        if (!existing.references.includes(fieldPath)) existing.references.push(fieldPath);
        const result = { value: source, entry: existing };
        context.resolutions.set(cacheKey, result);
        return result;
      }
      const entry: DeploymentAssetManifestEntry = {
        ...(assetId ? { sourceAssetId: assetId } : {}),
        name: fileStem(source),
        originalSource: conciseSource(source),
        generatedPath: source,
        contentType: guessContentType(source),
        size: 0,
        kind: kindFor(guessContentType(source)),
        status: "external",
        references: [fieldPath],
      };
      context.entriesByKey.set(externalKey, entry);
      const result = { value: source, entry };
      context.resolutions.set(cacheKey, result);
      return result;
    }

    const issue = makeIssue(
      isBlobUrl(source) ? "temporary-url" : "missing-asset",
      "error",
      fieldPath,
      isBlobUrl(source)
        ? "This temporary blob URL cannot be published. Select the image from Assets again so Stackly can include its bytes."
        : assetId
          ? "The local asset bytes are no longer available in this browser. Re-upload or reselect the asset before publishing."
          : "This asset could not be resolved into the deployment package. Replace it with an uploaded asset or a reachable URL.",
      source || (assetId ? `asset:${assetId}` : undefined),
    );
    context.errors.push(issue);
    const result = { value: source };
    context.resolutions.set(cacheKey, result);
    return result;
  }

  const contentType = (loaded.blob.type || loaded.asset?.mimeType || guessContentType(source)).split(";")[0].toLowerCase();
  if (!/^(?:image|video|font)\//.test(contentType) && contentType !== "application/font-woff") {
    context.warnings.push(makeIssue(
      "unsupported-asset",
      "warning",
      fieldPath,
      `The asset uses ${contentType || "an unknown content type"}. It will be included, but a deployment service should validate it before serving.`,
      source,
    ));
  }

  const hash = await hashBlob(loaded.blob);
  const entryKey = `${hash.algorithm}:${hash.value}:${contentType}`;
  const existing = context.entriesByKey.get(entryKey);
  if (existing) {
    // Parallel traversal can encounter a data URL before the equivalent
    // IndexedDB-backed reference. Preserve the richer local metadata even
    // though both references intentionally reuse one bundled file.
    if (!existing.sourceAssetId && assetId) existing.sourceAssetId = assetId;
    if (loaded.asset) {
      if (existing.name === "asset" || existing.name.startsWith("asset.")) existing.name = loaded.asset.name;
      if (!existing.width && loaded.asset.width) existing.width = loaded.asset.width;
      if (!existing.height && loaded.asset.height) existing.height = loaded.asset.height;
    }
    if (!existing.references.includes(fieldPath)) existing.references.push(fieldPath);
    const result = { value: existing.generatedPath, entry: existing };
    context.resolutions.set(cacheKey, result);
    return result;
  }

  const extension = extensionFor(contentType, source || loaded.asset?.name || "asset");
  const kind = kindFor(contentType);
  const generatedPath = `assets/${kind}-${hash.value.slice(0, 16)}.${extension}`;
  const entry: DeploymentAssetManifestEntry = {
    ...(assetId ? { sourceAssetId: assetId } : {}),
    name: loaded.asset?.name || `${fileStem(source)}.${extension}`,
    originalSource: conciseSource(loaded.originalSource),
    generatedPath,
    contentType,
    size: loaded.blob.size,
    ...(loaded.asset?.width ? { width: loaded.asset.width } : {}),
    ...(loaded.asset?.height ? { height: loaded.asset.height } : {}),
    hash: hash.value,
    hashAlgorithm: hash.algorithm,
    kind,
    status: "ready",
    references: [fieldPath],
  };

  context.entriesByKey.set(entryKey, entry);
  context.filesByPath.set(generatedPath, {
    path: generatedPath,
    contentType,
    size: loaded.blob.size,
    blob: loaded.blob,
  });

  const result = { value: generatedPath, entry };
  context.resolutions.set(cacheKey, result);
  return result;
}

async function rewriteCssUrls(value: string, fieldPath: string, context: PackageBuildContext): Promise<string> {
  const matches = Array.from(value.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi));
  if (!matches.length) return value;

  let rewritten = value;
  for (const match of matches) {
    const source = match[2]?.trim();
    if (!source || !isLikelyAssetUrl(source)) continue;
    const resolved = await resolveAssetReference(source, fieldPath, context);
    if (resolved.value !== source) rewritten = rewritten.replace(match[0], `url("${resolved.value}")`);
  }
  return rewritten;
}

async function rewriteProps(
  value: unknown,
  fieldPath: string,
  context: PackageBuildContext,
  componentType?: string,
): Promise<unknown> {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return Promise.all(value.map((item, index) => rewriteProps(item, `${fieldPath}[${index}]`, context, componentType)));
  }
  if (!value || typeof value !== "object") return value;

  const source = value as Record<string, unknown>;
  const assetId = getAssociatedAssetId(source);
  const next: Record<string, unknown> = {};

  for (const [key, item] of Object.entries(source)) {
    const itemPath = `${fieldPath}.${key}`;
    if (typeof item === "string" && key === "backgroundImage" && /url\(/i.test(item)) {
      next[key] = await rewriteCssUrls(item, itemPath, context);
      continue;
    }

    if (typeof item === "string" && key === "url" && componentType === "video" && isLikelyAssetUrl(item)) {
      next[key] = (await resolveAssetReference(item, itemPath, context, assetId)).value;
      continue;
    }

    if (typeof item === "string" && ASSET_VALUE_KEYS.has(key) && (assetId || isLikelyAssetUrl(item))) {
      next[key] = (await resolveAssetReference(item, itemPath, context, assetId)).value;
      continue;
    }

    if (Array.isArray(item) && ASSET_COLLECTION_KEYS.has(key)) {
      next[key] = await Promise.all(item.map(async (entry, index) => {
        if (typeof entry === "string" && isLikelyAssetUrl(entry)) {
          return (await resolveAssetReference(entry, `${itemPath}[${index}]`, context, assetId)).value;
        }
        return rewriteProps(entry, `${itemPath}[${index}]`, context, componentType);
      }));
      continue;
    }

    next[key] = await rewriteProps(item, itemPath, context, componentType);
  }
  return next;
}

async function rewriteLegacyGallery(
  content: string,
  fieldPath: string,
  context: PackageBuildContext,
): Promise<string> {
  const lines = content.split("\n");
  const rewritten = await Promise.all(lines.map(async (line, index) => {
    const [rawSource = "", ...rest] = line.split("|");
    const source = rawSource.trim();
    if (!source || !isLikelyAssetUrl(source)) return line;
    const nextSource = (await resolveAssetReference(source, `${fieldPath}[${index}].src`, context)).value;
    return [nextSource, ...rest].join("|");
  }));
  return rewritten.join("\n");
}

async function rewriteComponent(
  component: BuilderComponent,
  indexPath: string,
  context: PackageBuildContext,
): Promise<BuilderComponent> {
  const next = cloneJson(component);
  const props = next.props && typeof next.props === "object" ? next.props as Record<string, unknown> : undefined;
  const componentAssetId = props ? getAssociatedAssetId(props) : undefined;

  if (next.type === "image" && (componentAssetId || isLikelyAssetUrl(next.content || ""))) {
    next.content = (await resolveAssetReference(next.content, `${indexPath}.content`, context, componentAssetId)).value;
  }
  if (next.type === "gallery") {
    next.content = await rewriteLegacyGallery(next.content || "", `${indexPath}.content`, context);
  }

  if (next.props) {
    next.props = await rewriteProps(next.props, `${indexPath}.props`, context, next.type) as BuilderComponent["props"];
  }
  if (next.styles) {
    next.styles = await rewriteProps(next.styles, `${indexPath}.styles`, context, next.type) as BuilderComponent["styles"];
  }
  if (next.responsiveStyles) {
    next.responsiveStyles = await rewriteProps(next.responsiveStyles, `${indexPath}.responsiveStyles`, context, next.type) as BuilderComponent["responsiveStyles"];
  }
  next.children = await Promise.all(next.children.map((child, index) => rewriteComponent(child, `${indexPath}.children[${index}]`, context)));
  return next;
}

function splitDocument(html: string): { indexHtml: string; stylesCss: string; scriptsJs: string } {
  let stylesCss = "";
  const withoutStyles = html.replace(/<style\b[^>]*>([\s\S]*?)<\/style>\s*/i, (_match, css: string) => {
    stylesCss = css.trim();
    return '    <link rel="stylesheet" href="styles.css" />\n';
  });

  const scripts: string[] = [];
  const withoutScripts = withoutStyles.replace(/<script\b[^>]*>([\s\S]*?)<\/script>\s*/gi, (_match, source: string) => {
    const script = source.trim();
    if (script) scripts.push(script);
    return "";
  });
  const scriptsJs = scripts.join("\n\n");
  const scriptTag = scriptsJs ? '    <script src="scripts.js" defer></script>\n' : "";
  const indexHtml = withoutScripts.replace(/<\/body>/i, `${scriptTag}</body>`);

  return { indexHtml, stylesCss, scriptsJs };
}

function collectFontFamilies(tokens?: DesignTokens): string[] {
  const family = tokens?.typography?.fontFamily?.trim();
  return family ? [family] : [];
}

export async function createDeploymentPackage(
  input: CreateDeploymentPackageInput,
): Promise<DeploymentPackage> {
  const builderData = cloneJson(input.builderData);
  const context: PackageBuildContext = {
    assetsById: new Map(input.assetResolver.assets.map((asset) => [asset.id, asset])),
    resolver: input.assetResolver,
    entriesByKey: new Map(),
    filesByPath: new Map(),
    resolutions: new Map(),
    warnings: [],
    errors: [],
  };

  const components = builderData.components || builderData.sections || [];
  const rewrittenComponents = await Promise.all(
    components.map((component, index) => rewriteComponent(component, `components[${index}]`, context)),
  );
  builderData.components = rewrittenComponents;
  builderData.sections = rewrittenComponents;

  const rewrittenSeo = cloneJson(builderData.seo || {} as SEOMetadata);
  if (typeof rewrittenSeo.ogImage === "string" && isLikelyAssetUrl(rewrittenSeo.ogImage)) {
    rewrittenSeo.ogImage = (await resolveAssetReference(rewrittenSeo.ogImage, "seo.ogImage", context)).value;
  }
  builderData.seo = rewrittenSeo;

  const html = generateHtml(
    rewrittenComponents,
    rewrittenSeo,
    input.workspaceId || undefined,
    builderData.designTokens,
    { canvasMode: builderData.canvasMode },
  );
  const { indexHtml, stylesCss, scriptsJs } = splitDocument(html);
  const entries = Array.from(context.entriesByKey.values()).sort((left, right) => left.generatedPath.localeCompare(right.generatedPath));
  const assetFiles = Array.from(context.filesByPath.values()).sort((left, right) => left.path.localeCompare(right.path));
  const generatedAt = new Date().toISOString();
  const assetManifest: DeploymentAssetManifest = {
    schemaVersion: DEPLOYMENT_PACKAGE_VERSION,
    generatedAt,
    ...(input.workspaceId ? { workspaceId: input.workspaceId } : {}),
    assets: entries,
    unresolved: [...context.errors],
  };
  const builderJson = JSON.stringify(builderData, null, 2);
  const assetManifestJson = JSON.stringify(assetManifest, null, 2);
  const files = [
    "index.html",
    "styles.css",
    ...(scriptsJs ? ["scripts.js"] : []),
    "builder.json",
    "metadata.json",
    "assets/manifest.json",
    ...assetFiles.map((file) => file.path),
  ];
  const imageCount = entries.filter((entry) => entry.status === "ready" && entry.kind === "image").length;
  const preliminaryTotal = byteLength(indexHtml)
    + byteLength(stylesCss)
    + byteLength(scriptsJs)
    + byteLength(builderJson)
    + byteLength(assetManifestJson)
    + assetFiles.reduce((total, file) => total + file.size, 0);
  const metadata: DeploymentPackageMetadata = {
    schemaVersion: DEPLOYMENT_PACKAGE_VERSION,
    generatedAt,
    ...(input.workspaceId ? { workspaceId: input.workspaceId } : {}),
    ...(input.projectName?.trim() ? { projectName: input.projectName.trim() } : {}),
    files,
    assetCount: assetFiles.length,
    imageCount,
    totalBytes: preliminaryTotal,
    fontFamilies: collectFontFamilies(builderData.designTokens),
  };
  let metadataJson = JSON.stringify(metadata, null, 2);
  let totalBytes = preliminaryTotal + byteLength(metadataJson);
  metadata.totalBytes = totalBytes;
  metadataJson = JSON.stringify(metadata, null, 2);
  totalBytes = preliminaryTotal + byteLength(metadataJson);
  metadata.totalBytes = totalBytes;
  metadataJson = JSON.stringify(metadata, null, 2);

  return {
    schemaVersion: DEPLOYMENT_PACKAGE_VERSION,
    indexHtml,
    stylesCss,
    scriptsJs,
    builderData,
    builderJson,
    assetManifest,
    assetManifestJson,
    metadata,
    metadataJson,
    assetFiles,
    warnings: context.warnings,
    errors: context.errors,
    totalBytes,
    fileCount: files.length,
    imageCount,
  };
}

export function serializeDeploymentPackage(packageData: DeploymentPackage): SerializedDeploymentPackage {
  return {
    schemaVersion: packageData.schemaVersion,
    indexHtml: packageData.indexHtml,
    stylesCss: packageData.stylesCss,
    scriptsJs: packageData.scriptsJs,
    builderJson: packageData.builderJson,
    builderData: packageData.builderData,
    assetManifest: packageData.assetManifest,
    referencedAssets: packageData.assetManifest.assets,
    metadata: packageData.metadata,
    validation: {
      warnings: packageData.warnings,
      errors: packageData.errors,
    },
  };
}

export function summarizeDeploymentPackage(packageData: DeploymentPackage): DeploymentPackageSummary {
  return {
    filesPrepared: packageData.metadata.files,
    assetCount: packageData.assetFiles.length,
    imageCount: packageData.imageCount,
    totalBytes: packageData.totalBytes,
    warnings: packageData.warnings,
    errors: packageData.errors,
  };
}

/**
 * The existing toolbar keeps offering a single-file download. This derives a
 * self-contained preview/export from the same deployable package, while the
 * package itself preserves reusable `assets/` paths for publishing.
 */
export async function createStandaloneHtml(packageData: DeploymentPackage): Promise<string> {
  let html = packageData.indexHtml
    .replace('    <link rel="stylesheet" href="styles.css" />', `    <style>\n${packageData.stylesCss}\n    </style>`)
    .replace('    <script src="scripts.js" defer></script>', `    <script>\n${packageData.scriptsJs}\n    </script>`);

  for (const asset of packageData.assetFiles) {
    const dataUrl = await blobToDataUrl(asset.blob);
    html = html.split(asset.path).join(dataUrl);
  }
  return html;
}

export function formatDeploymentBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * assetStore — Zustand store for the asset management system.
 *
 * Responsibilities:
 *   - Keep an in-memory list of Asset metadata (loaded from IndexedDB).
 *   - Cache object-URLs (regenerated per session; revoked on cleanup).
 *   - Expose uploadFiles / deleteAsset / getUrl as the only mutation API.
 *
 * Migration path to S3/cloud:
 *   Replace `dbPutAsset` / `dbGetBlob` / `dbDeleteAsset` with API calls.
 *   `getUrl` becomes a signed-URL fetch. No component code changes needed.
 */

import { create } from "zustand";
import { v4 as uuid } from "uuid";
import type { Asset } from "@/types/assets";
import { dbGetAllAssets, dbPutAsset, dbGetBlob, dbDeleteAsset, dbClearAssets } from "@/lib/assetDb";
import { generateThumbnail, getImageDimensions, compressImage, isImageFile, blobToDataUrl } from "@/lib/assetUtils";

interface AssetState {
  assets: Asset[];
  objectUrls: Record<string, string>;
  isLoading: boolean;
  uploadProgress: number;          // 0-100, -1 = idle
  error: string | null;
}

interface AssetActions {
  /** Load all asset metadata from IndexedDB into memory. */
  loadAssets: () => Promise<void>;

  /** Upload one or more File objects, returning the created Asset records. */
  uploadFiles: (files: File[]) => Promise<Asset[]>;

  /**
   * Persist a generated image URL (including data URLs) into the same local
   * asset library used by uploads. This means generated visuals remain
   * reusable in the builder, JSON export, preview, and published HTML.
   */
  saveGeneratedImage: (input: {
    imageUrl: string;
    name?: string;
    mimeType?: string;
    tags?: string[];
  }, signal?: AbortSignal) => Promise<Asset>;

  /** Delete an asset from IndexedDB and in-memory state. */
  deleteAsset: (id: string) => Promise<void>;

  /** Rename an asset without changing its stored blob or stable asset id. */
  renameAsset: (id: string, name: string) => Promise<Asset | null>;

  /**
   * Resolve an asset id → object URL.
   * Creates and caches a new object URL from the stored Blob on first call.
   * Returns null when the asset is not found.
   */
  getUrl: (id: string) => Promise<string | null>;

  /**
   * Resolve an asset id → base64 data URL.
   * Safe for use inside sandboxed iframes and HTML export.
   * Returns null when the asset is not found.
   */
  getDataUrl: (id: string) => Promise<string | null>;

  /** Revoke all cached object URLs (call on page unload / store teardown). */
  cleanup: () => void;

  /** Clear local asset records and reset in-memory state after logout. */
  resetAssets: () => Promise<void>;

  clearError: () => void;
}

export const useAssetStore = create<AssetState & AssetActions>((set, get) => ({
  assets:         [],
  objectUrls:     {},
  isLoading:      false,
  uploadProgress: -1,
  error:          null,

  /* ── loadAssets ─────────────────────────────────────────────────────── */
  async loadAssets() {
    set({ isLoading: true, error: null });
    try {
      const raw = await dbGetAllAssets();
      const sorted = raw.sort((a, b) => b.uploadedAt - a.uploadedAt);
      set({ assets: sorted, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: String(err) });
    }
  },

  /* ── uploadFiles ─────────────────────────────────────────────────────── */
  async uploadFiles(files: File[]) {
    const images = files.filter(isImageFile);
    if (!images.length) return [];

    const uploaded: Asset[] = [];
    set({ uploadProgress: 0 });

    for (let i = 0; i < images.length; i++) {
      const file = images[i];

      const [compressed, thumbnail, dims] = await Promise.all([
        compressImage(file),
        generateThumbnail(file),
        getImageDimensions(file),
      ]);

      const asset: Asset = {
        id:         uuid(),
        name:       file.name,
        mimeType:   file.type,
        size:       compressed.size,
        width:      dims.width  || undefined,
        height:     dims.height || undefined,
        thumbnail,
        uploadedAt: Date.now(),
        tags:       [],
      };

      await dbPutAsset(asset, compressed as Blob);
      uploaded.push(asset);

      set({ uploadProgress: Math.round(((i + 1) / images.length) * 100) });
    }

    set((s) => ({
      assets:         [...uploaded, ...s.assets],
      uploadProgress: -1,
    }));

    return uploaded;
  },

  async saveGeneratedImage(input, signal) {
    const imageUrl = input.imageUrl.trim();
    if (!imageUrl) throw new Error("The generated image did not include a URL.");

    // The API returns a data URL by default. HTTPS is also supported for a
    // future CDN-backed provider; other schemes are deliberately rejected.
    if (!/^data:image\//i.test(imageUrl) && !/^https:\/\//i.test(imageUrl)) {
      throw new Error("The generated image URL is not supported.");
    }

    const response = await fetch(imageUrl, { signal });
    if (!response.ok) throw new Error("Unable to download the generated image.");

    const blob = await response.blob();
    const mimeType = input.mimeType || blob.type || "image/png";
    if (!mimeType.startsWith("image/")) {
      throw new Error("The AI response was not an image.");
    }

    const safeName = (input.name || "ai-generated-image")
      .replace(/[^a-z0-9._-]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "ai-generated-image";
    const extension = mimeType === "image/svg+xml"
      ? "svg"
      : mimeType.split("/")[1]?.replace("jpeg", "jpg") || "png";
    const file = new File([blob], safeName.includes(".") ? safeName : `${safeName}.${extension}`, { type: mimeType });
    const [asset] = await get().uploadFiles([file]);

    if (!asset) throw new Error("The generated image could not be added to your library.");

    const tags = Array.from(new Set(["ai-generated", ...(input.tags ?? [])]));
    const storedBlob = await dbGetBlob(asset.id);
    const taggedAsset: Asset = { ...asset, tags };
    if (storedBlob) await dbPutAsset(taggedAsset, storedBlob);
    set((state) => ({
      assets: state.assets.map((existing) => existing.id === taggedAsset.id ? taggedAsset : existing),
    }));

    return taggedAsset;
  },

  /* ── deleteAsset ─────────────────────────────────────────────────────── */
  async deleteAsset(id: string) {
    await dbDeleteAsset(id);

    const existing = get().objectUrls[id];
    if (existing) URL.revokeObjectURL(existing);

    set((s) => ({
      assets:     s.assets.filter((a) => a.id !== id),
      objectUrls: Object.fromEntries(
        Object.entries(s.objectUrls).filter(([k]) => k !== id),
      ),
    }));
  },

  async renameAsset(id, name) {
    const trimmed = name.replace(/[\u0000-\u001F]/g, "").trim().slice(0, 120);
    if (!trimmed) throw new Error("Give the asset a name before saving it.");

    const existing = get().assets.find((asset) => asset.id === id);
    if (!existing) return null;

    const blob = await dbGetBlob(id);
    if (!blob) return null;

    const renamed: Asset = { ...existing, name: trimmed };
    await dbPutAsset(renamed, blob);
    set((state) => ({
      assets: state.assets.map((asset) => asset.id === id ? renamed : asset),
    }));
    return renamed;
  },

  /* ── getUrl ──────────────────────────────────────────────────────────── */
  async getUrl(id: string) {
    const cached = get().objectUrls[id];
    if (cached) return cached;

    const blob = await dbGetBlob(id);
    if (!blob) return null;

    const url = URL.createObjectURL(blob);
    set((s) => ({ objectUrls: { ...s.objectUrls, [id]: url } }));
    return url;
  },

  /* ── getDataUrl ──────────────────────────────────────────────────────── */
  async getDataUrl(id: string) {
    const blob = await dbGetBlob(id);
    if (!blob) return null;
    return blobToDataUrl(blob);
  },

  /* ── cleanup ─────────────────────────────────────────────────────────── */
  cleanup() {
    Object.values(get().objectUrls).forEach((u) => URL.revokeObjectURL(u));
    set({ objectUrls: {} });
  },

  async resetAssets() {
    Object.values(get().objectUrls).forEach((u) => URL.revokeObjectURL(u));
    try {
      await dbClearAssets();
    } catch (err) {
      set({ error: String(err) });
    }

    set({
      assets: [],
      objectUrls: {},
      isLoading: false,
      uploadProgress: -1,
      error: null,
    });
  },

  clearError() { set({ error: null }); },
}));

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

  /** Delete an asset from IndexedDB and in-memory state. */
  deleteAsset: (id: string) => Promise<void>;

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

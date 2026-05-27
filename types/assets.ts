/**
 * Asset system — type definitions.
 *
 * Metadata is stored in Zustand + IndexedDB "assets" store.
 * Raw blobs are stored separately in IndexedDB "blobs" store.
 * Object-URLs are created on-demand and cached in the Zustand store.
 *
 * Future migration: replace `dbPutAsset` / `dbGetBlob` with S3 API calls
 * without touching any component code — all URL resolution goes through
 * `useAssetStore.getUrl(id)`.
 */

export type AssetMimeType =
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "image/gif"
  | "image/svg+xml"
  | "image/avif"
  | string;

export interface Asset {
  id: string;
  name: string;
  mimeType: AssetMimeType;
  size: number;          // bytes
  width?: number;
  height?: number;
  thumbnail: string;     // 160×160 WebP data-URL, fast grid rendering
  uploadedAt: number;    // Date.now()
  tags: string[];
}

/** Shape stored in the "blobs" IndexedDB object store. */
export interface AssetBlob {
  id: string;
  blob: Blob;
}

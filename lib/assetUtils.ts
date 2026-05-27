/**
 * assetUtils — pure browser utilities for image processing.
 *
 * generateThumbnail  – Canvas-based 160px thumbnail → WebP data URL
 * getImageDimensions – Read natural width/height without re-rendering
 * compressImage      – Optionally down-scale large images before storage
 * formatBytes        – Human-readable file size
 * isImageFile        – MIME-type guard
 */

const THUMB_SIZE = 160;

/** Generate a square-cropped thumbnail as a WebP data URL. */
export function generateThumbnail(file: File, size = THUMB_SIZE): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas  = document.createElement("canvas");
      const ratio   = Math.min(size / img.width, size / img.height);
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/webp", 0.72));
    };

    img.onerror = () => { URL.revokeObjectURL(url); resolve(""); };
    img.src = url;
  });
}

/** Return natural pixel dimensions of an image File. */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => { URL.revokeObjectURL(url); resolve({ width: 0, height: 0 }); };
    img.src = url;
  });
}

/**
 * Compress an image File to a Blob if it exceeds `maxBytes`.
 * Uses Canvas → Blob pipeline; returns the original file if small enough.
 */
export async function compressImage(
  file: File,
  maxBytes = 2 * 1024 * 1024,
  quality  = 0.82,
): Promise<Blob> {
  if (file.size <= maxBytes) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const scale  = Math.sqrt(maxBytes / file.size);
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.naturalWidth  * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => resolve(blob ?? file),
        "image/webp",
        quality,
      );
    };

    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

/** Human-readable bytes string (B / KB / MB). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024)           return `${bytes} B`;
  if (bytes < 1024 * 1024)    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Returns true for any supported image MIME type. */
export const isImageFile = (f: File) => f.type.startsWith("image/");

/** Convert a Blob to a base64 data URL using FileReader. */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

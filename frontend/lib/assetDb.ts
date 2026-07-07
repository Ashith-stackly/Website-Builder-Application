/**
 * assetDb — thin IndexedDB wrapper.
 *
 * Two object stores:
 *   "assets"  – Asset metadata (id, name, size, thumbnail, …)
 *   "blobs"   – Raw Blob keyed by asset id
 *
 * No external library; keeps bundle lean and swap-friendly.
 * Future: replace these functions with fetch() calls to an S3/CDN API.
 */

import type { Asset, AssetBlob } from "@/types/assets";

const DB_NAME    = "stackly-assets";
const DB_VERSION = 1;
const STORE_META = "assets";
const STORE_BLOB = "blobs";

let _db: IDBDatabase | null = null;

function openDb(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_BLOB)) {
        db.createObjectStore(STORE_BLOB, { keyPath: "id" });
      }
    };

    req.onsuccess = () => { _db = req.result; resolve(req.result); };
    req.onerror   = () => reject(req.error);
  });
}

function reqPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/** Load all asset metadata records (no blobs). */
export async function dbGetAllAssets(): Promise<Asset[]> {
  const db = await openDb();
  const tx = db.transaction(STORE_META, "readonly");
  return reqPromise<Asset[]>(tx.objectStore(STORE_META).getAll());
}

/** Persist metadata + blob atomically. */
export async function dbPutAsset(meta: Asset, blob: Blob): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_META, STORE_BLOB], "readwrite");
    tx.objectStore(STORE_META).put(meta);
    tx.objectStore(STORE_BLOB).put({ id: meta.id, blob } satisfies AssetBlob);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

/** Retrieve raw Blob by asset id. Returns null when not found. */
export async function dbGetBlob(id: string): Promise<Blob | null> {
  const db = await openDb();
  const tx  = db.transaction(STORE_BLOB, "readonly");
  const row = await reqPromise<AssetBlob | undefined>(tx.objectStore(STORE_BLOB).get(id));
  return row?.blob ?? null;
}

/** Remove metadata + blob in one transaction. */
export async function dbDeleteAsset(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_META, STORE_BLOB], "readwrite");
    tx.objectStore(STORE_META).delete(id);
    tx.objectStore(STORE_BLOB).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

/** Remove all local asset metadata and blobs. */
export async function dbClearAssets(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_META, STORE_BLOB], "readwrite");
    tx.objectStore(STORE_META).clear();
    tx.objectStore(STORE_BLOB).clear();
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

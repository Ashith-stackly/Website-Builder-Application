import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== "production";
const allowBasePathInDev = process.env.STACKLY_DEV_WITH_BASE_PATH === "1";
const basePath =
  isDev && !allowBasePathInDev ? "" : process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    unoptimized: true,
  },
  // Use this repo as Turbopack root (avoids picking C:\Users\admin when multiple lockfiles exist).
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;

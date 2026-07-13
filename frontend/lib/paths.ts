export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function assetPath(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${normalizedPath}`;
}

/**
 * Prefix basePath for plain <a> tags or window.location (not Next.js Link).
 * Next.js Link already applies basePath from next.config — do not use routePath there.
 */
export function routePath(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") {
    return basePath ? `${basePath}/` : "/";
  }

  const hashIndex = normalized.indexOf("#");
  const queryIndex = normalized.indexOf("?");
  const splitIndex =
    hashIndex === -1
      ? queryIndex
      : queryIndex === -1
        ? hashIndex
        : Math.min(hashIndex, queryIndex);

  const pathname =
    splitIndex === -1 ? normalized : normalized.slice(0, splitIndex);
  const suffix = splitIndex === -1 ? "" : normalized.slice(splitIndex);
  const pathnameWithSlash = pathname.endsWith("/") ? pathname : `${pathname}/`;

  return `${basePath}${pathnameWithSlash}${suffix}`;
}

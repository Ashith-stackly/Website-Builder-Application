import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL("..", import.meta.url)));

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function assertContains(path, text, label) {
  const source = read(path);
  if (!source.includes(text)) {
    throw new Error(`${label} missing in ${path}`);
  }
}

assertContains("lib/blogApi.ts", "getPublishedBlogs", "public blog list API helper");
assertContains("lib/blogApi.ts", "getPublicBlogPath", "static-safe blog URL helper");
assertContains("components/blog/PublicBlogListing.tsx", "getPublishedBlogs", "public listing data load");
assertContains("components/blog/PublicBlogListing.tsx", "onBlogChanged", "blog change refresh subscription");
assertContains("app/blog/page.tsx", "BlogMarketingTemplate", "builder template preservation");
assertContains("app/blog/page.tsx", "PublicBlogListing", "live public blog route");
assertContains("app/blog/[slug]/page.tsx", "getPublicBlogPath", "workspace-aware post navigation");
assertContains("components/blog/BlogSeoHead.tsx", "canonical", "canonical SEO metadata");

console.log("Blog workflow checks passed.");

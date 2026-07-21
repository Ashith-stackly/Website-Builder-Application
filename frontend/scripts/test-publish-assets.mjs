import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const typescript = require("typescript");

const sourceUrl = new URL("../lib/deploymentPackage.ts", import.meta.url);
const source = readFileSync(sourceUrl, "utf8");
const compiled = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.CommonJS,
    target: typescript.ScriptTarget.ES2020,
  },
}).outputText;

const packageModule = { exports: {} };
new Function("exports", "require", "module", compiled)(
  packageModule.exports,
  (id) => {
    if (id === "@/lib/assetUtils") {
      return { blobToDataUrl: async () => "data:image/png;base64,c3RhbmRhbG9uZQ==" };
    }
    if (id === "@/lib/exportHtml") {
      return {
        generateHtml: (components, seo) => `<!doctype html>
<html><head><style>.hero { background-image:url(${components[0]?.content || ""}); }</style></head>
<body><script>window.stacklyPackageTest = true;</script><main data-og="${seo?.ogImage || ""}">${components.map((component) => component.content).join("|")}</main></body></html>`,
      };
    }
    return require(id);
  },
  packageModule,
);

const {
  createDeploymentPackage,
  createStandaloneHtml,
  serializeDeploymentPackage,
  summarizeDeploymentPackage,
} = packageModule.exports;

const pixelDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL8WQAAAABJRU5ErkJggg==";

function component(overrides = {}) {
  return {
    id: "component",
    type: "image",
    content: pixelDataUrl,
    props: {},
    styles: {},
    children: [],
    order: 0,
    ...overrides,
  };
}

const assets = [
  {
    id: "local-image",
    name: "Hero Image.png",
    mimeType: "image/png",
    size: 68,
    width: 1,
    height: 1,
    thumbnail: pixelDataUrl,
    uploadedAt: 1,
    tags: [],
  },
  {
    id: "local-logo",
    name: "Brand Logo.png",
    mimeType: "image/png",
    size: 68,
    width: 1,
    height: 1,
    thumbnail: pixelDataUrl,
    uploadedAt: 1,
    tags: [],
  },
];

const resolver = {
  assets,
  getDataUrl: async (id) => (id === "local-image" || id === "local-logo" ? pixelDataUrl : null),
};

const packageInput = {
  workspaceId: "507f1f77bcf86cd799439011",
  projectName: "Asset package test",
  assetResolver: resolver,
  builderData: {
    schemaVersion: 1,
    components: [
      component({ content: "blob:editor-only-image", props: { assetId: "local-image" } }),
      component({
        id: "navigation",
        type: "navigation",
        content: "",
        order: 1,
        props: { logoUrl: "blob:editor-only-logo", logoAssetId: "local-logo" },
      }),
      component({
        id: "gallery",
        type: "gallery",
        content: `${pixelDataUrl}|Legacy caption`,
        order: 2,
        props: {
          items: [
            { src: "blob:editor-only-gallery", assetId: "local-image", caption: "Structured caption" },
          ],
        },
      }),
      component({
        id: "hero",
        type: "hero",
        content: "",
        order: 3,
        props: { media: { src: pixelDataUrl, type: "image" } },
        children: [component({ id: "nested", content: pixelDataUrl, props: { assetId: "local-image" } })],
      }),
      component({
        id: "products",
        type: "product-collection",
        content: "",
        order: 4,
        props: { products: [{ image: pixelDataUrl }], images: [pixelDataUrl] },
      }),
    ],
    designTokens: {
      colors: { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", text: "#111" },
      typography: { fontFamily: "Inter, sans-serif", baseFontSize: "16px", headingScale: 1.25 },
      buttons: { borderRadius: "8px", fontWeight: "700" },
      spacing: { base: 8 },
    },
    seo: { title: "Asset test", ogImage: pixelDataUrl },
    canvasMode: "flow",
  },
};

const packageData = await createDeploymentPackage(packageInput);
assert.equal(packageData.errors.length, 0, "asset-id-backed blob URLs should resolve before packaging");
assert.equal(packageData.assetFiles.length, 1, "identical bytes should be deduplicated");
assert.equal(packageData.assetManifest.assets.length, 1, "one manifest entry should describe reused bytes");
assert.equal(packageData.imageCount, 1);
assert.match(packageData.assetFiles[0].path, /^assets\/image-[a-f0-9]{16}\.png$/);
assert.ok(packageData.assetManifest.assets[0].references.length >= 6, "all image/logo/gallery/SEO references should be tracked");
assert.equal(packageData.assetManifest.assets[0].contentType, "image/png");
assert.equal(packageData.assetManifest.assets[0].width, 1);
assert.equal(packageData.assetManifest.assets[0].height, 1);

const outputJson = JSON.stringify(serializeDeploymentPackage(packageData));
assert.doesNotMatch(outputJson, /blob:/, "serialized publish payload must never contain temporary object URLs");
assert.doesNotMatch(outputJson, /"blob"\s*:/, "publish payload must not contain Blob objects");
assert.match(packageData.indexHtml, /href="styles\.css"/);
assert.match(packageData.indexHtml, /src="scripts\.js" defer/);
assert.match(packageData.stylesCss, /background-image/);
assert.match(packageData.scriptsJs, /stacklyPackageTest/);
assert.ok(packageData.metadata.files.includes("assets/manifest.json"));
assert.ok(packageData.metadata.files.includes(packageData.assetFiles[0].path));

const standalone = await createStandaloneHtml(packageData);
assert.doesNotMatch(standalone, new RegExp(packageData.assetFiles[0].path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
assert.match(standalone, /data:image\/png;base64,c3RhbmRhbG9uZQ==/);

const repeat = await createDeploymentPackage(packageInput);
assert.equal(repeat.assetFiles[0].path, packageData.assetFiles[0].path, "stable hash paths must be deterministic");
assert.deepEqual(summarizeDeploymentPackage(packageData).errors, []);

const nativeFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  if (String(input).includes("cdn.example.invalid")) throw new TypeError("CORS blocked");
  return nativeFetch(input, init);
};
const externalPackage = await createDeploymentPackage({
  ...packageInput,
  builderData: { ...packageInput.builderData, components: [component({ content: "https://cdn.example.invalid/hero.png" })] },
});
globalThis.fetch = nativeFetch;
assert.equal(externalPackage.errors.length, 0, "approved HTTPS URLs should remain usable when copying is blocked");
assert.equal(externalPackage.warnings.length, 1);
assert.equal(externalPackage.assetManifest.assets.find((asset) => asset.originalSource.includes("cdn.example.invalid"))?.status, "external");
assert.equal(externalPackage.builderData.components[0].content, "https://cdn.example.invalid/hero.png");

const videoPackage = await createDeploymentPackage({
  ...packageInput,
  builderData: { ...packageInput.builderData, components: [component({ type: "video", content: "", props: { url: "https://www.youtube.com/watch?v=asset-test" } })] },
});
const videoEntry = videoPackage.assetManifest.assets.find((asset) => asset.kind === "video");
assert.equal(videoEntry?.status, "external", "video embeds should be tracked without trying to bundle a provider iframe");
assert.equal(videoPackage.builderData.components[0].props.url, "https://www.youtube.com/watch?v=asset-test");

const brokenBlobPackage = await createDeploymentPackage({
  ...packageInput,
  builderData: { ...packageInput.builderData, components: [component({ content: "blob:missing-without-asset" })] },
});
assert.equal(brokenBlobPackage.errors[0].code, "temporary-url", "unresolved blob URLs must block publishing");

console.log("Publish asset package checks passed.");

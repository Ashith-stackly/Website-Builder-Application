import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const typescript = require("typescript");

const sourceUrl = new URL("../lib/storefrontRuntime.ts", import.meta.url);
const source = readFileSync(sourceUrl, "utf8");
const compiled = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.CommonJS,
    target: typescript.ScriptTarget.ES2020,
  },
}).outputText;

const runtimeModule = { exports: {} };
new Function("exports", "require", "module", compiled)(
  runtimeModule.exports,
  require,
  runtimeModule,
);

const {
  buildStorefrontRuntimeScript,
  getStorefrontApiBaseUrl,
  isStorefrontWorkspaceId,
} = runtimeModule.exports;

const workspaceId = "507f1f77bcf86cd799439011";
const apiBaseUrl = "https://api.stackly.test/api/";

assert.equal(isStorefrontWorkspaceId(workspaceId), true);
assert.equal(isStorefrontWorkspaceId("not-a-workspace"), false);
assert.equal(getStorefrontApiBaseUrl(apiBaseUrl), "https://api.stackly.test/api");
assert.equal(getStorefrontApiBaseUrl("javascript:alert(1)"), "");
assert.equal(buildStorefrontRuntimeScript({ workspaceId: "wrong", apiBaseUrl }), "");
assert.equal(buildStorefrontRuntimeScript({ workspaceId, apiBaseUrl: "" }), "");

const markup = buildStorefrontRuntimeScript({ workspaceId, apiBaseUrl });
assert.match(markup, /data-stackly-storefront="product-collection"/);
assert.match(markup, /\/ecommerce\/store\//);
assert.match(markup, /\/cart\//);
assert.match(markup, /__stackly_preview/);
assert.match(markup, /credentials: "omit"/);
assert.match(markup, /textContent/);
assert.match(markup, /loading = "lazy"/);
assert.match(markup, /URLSearchParams/);
assert.match(markup, /ids/);
assert.doesNotMatch(markup, /\/ecommerce\/order/);
assert.doesNotMatch(markup, /localStorage\.setItem\(/);

const exportSource = readFileSync(new URL("../lib/exportHtml.ts", import.meta.url), "utf8");
assert.match(exportSource, /buildStorefrontRuntimeScript/);
assert.match(exportSource, /hasProductCollection/);

const blockSpec = readFileSync(new URL("../components/blocks/product-collection/spec.ts", import.meta.url), "utf8");
assert.match(blockSpec, /data-stackly-product-collection/);
assert.match(blockSpec, /data-stackly-product-grid/);
assert.match(blockSpec, /data-stackly-product-config/);
assert.match(blockSpec, /showFilters/);

console.log("Storefront runtime regression tests passed");

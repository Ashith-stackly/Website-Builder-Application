import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(scriptsDirectory, "..");
const backendRoot = resolve(frontendRoot, "..", "backend");
const read = (root, file) => readFileSync(resolve(root, file), "utf8");

const api = read(frontendRoot, "lib/templateApi.ts");
const types = read(frontendRoot, "types/template.ts");
const catalog = read(frontendRoot, "app/templates/page.tsx");
const preview = read(frontendRoot, "app/templates/preview/TemplatePreviewClient.tsx");
const builderStore = read(frontendRoot, "store/builderStore.ts");
const controller = read(backendRoot, "src/controllers/templateController.js");
const service = read(backendRoot, "src/services/templateService.js");

// One existing route family is used end-to-end; no plural clone alias remains.
assert.match(api, /\/template\/list/);
assert.match(api, /\/template\/\$\{encodeURIComponent\(id\)\}/);
assert.match(api, /\/template\/\$\{encodeURIComponent\(id\)\}\/use/);
assert.doesNotMatch(api, /\/templates(?:\/|\x60|\?)/);
assert.doesNotMatch(api, /\/clone/);

// API categories are persisted values; labels are a presentation concern.
assert.match(types, /TemplateCategoryFilter = "all" \| TemplateCategory/);
assert.match(types, /\{ value: "store", label: "Store" \}/);
assert.match(types, /workspaceId: string/);
assert.match(types, /builderData: TemplateBuilderData/);

// The catalog aborts stale requests and never opens an unsaved pseudo-clone.
assert.match(catalog, /useDeferredValue\(searchQuery\.trim\(\)\)/);
assert.match(catalog, /void fetchTemplates\(controller\.signal\)/);
assert.match(catalog, /private copy was not created/);
assert.doesNotMatch(catalog, /Fallback: navigate to builder/);

// Preview renders the same complete Builder JSON that a clone receives.
assert.match(preview, /template\.builderData\.designTokens/);
assert.match(preview, /\{ canvasMode: template\.builderData\.canvasMode \}/);
assert.match(preview, /assetPath\(template\.thumbnail\)/);
assert.match(preview, /template\.pages\.map/);
assert.match(preview, /template\.componentCount/);
assert.match(preview, /cloneError/);
assert.doesNotMatch(preview, /Fallback: open builder with query params/);

// Legacy "store" data opens the existing e-commerce starter when necessary.
assert.match(builderStore, /\["store", "ecommerce", "e-commerce"\]/);

// Backend returns one normalized payload and persists full Builder JSON.
assert.match(controller, /success: true/);
assert.match(controller, /projectId: result\.project\._id/);
assert.match(controller, /workspaceId: result\.workspaceId/);
assert.match(service, /builderData,/);
assert.match(service, /WorkspaceState\.create/);
assert.match(service, /assertProjectCapacity\(userId, user\)/);
assert.match(service, /isPremium: Boolean\(source\.premium\)/);

console.log("Template workflow contract checks passed.");

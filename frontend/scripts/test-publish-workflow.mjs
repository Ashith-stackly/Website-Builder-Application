import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const api = read("../lib/publishApi.ts");
const store = read("../store/builderStore.ts");
const canvas = read("../components/builder/Canvas.tsx");
const dialog = read("../components/builder/PublishDialog.tsx");

// API contract: publish stays authenticated and uses the existing backend routes.
assert.match(api, /Authorization: `Bearer \$\{token\}`/);
assert.match(api, /`\/workspace\/\$\{encodeURIComponent\(workspaceId\)\}\/state`/);
assert.match(api, /`\/publish\/\$\{encodeURIComponent\(workspaceId\)\}`/);
assert.match(api, /\/deployments\?limit=10/);
assert.match(api, /\/active/);

// Publishing must save fresh JSON + HTML before the publish request is made.
assert.match(store, /prepareForPublish: async/);
assert.match(store, /await get\(\)\.saveDraft\(\)/);
assert.match(store, /await autosaveProject\(workspaceId/);
assert.match(store, /await saveWorkspaceState\(workspaceId/);
assert.match(store, /latest\.exportHtml\(\)/);

// Builder integration and all key UI states remain present.
assert.match(canvas, /<PublishDialog/);
assert.match(canvas, /prepareForPublish/);
assert.match(canvas, /Publish<\/span>/);
assert.match(dialog, /phase === "saving"/);
assert.match(dialog, /phase === "publishing"/);
assert.match(dialog, /phase === "success"/);
assert.match(dialog, /phase === "error"/);
assert.match(dialog, /Open Website/);
assert.match(dialog, /Copy URL/);
assert.match(dialog, /Publish history/);

console.log("Publish workflow checks passed.");

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const api = read("../lib/publishApi.ts");
const store = read("../store/builderStore.ts");
const canvas = read("../components/builder/Canvas.tsx");
const dialog = read("../components/builder/PublishDialog.tsx");
const deploymentPackage = read("../lib/deploymentPackage.ts");

// API contract: publish stays authenticated and uses the existing backend routes.
assert.match(api, /Authorization: `Bearer \$\{token\}`/);
assert.match(api, /`\/workspace\/\$\{encodeURIComponent\(workspaceId\)\}\/state`/);
assert.match(api, /`\/publish\/\$\{encodeURIComponent\(workspaceId\)\}`/);
assert.match(api, /\/deployments\?limit=10/);
assert.match(api, /\/active/);
assert.match(api, /rollbackDeployment/);
assert.match(api, /assetManifest: deploymentPackage\.assetManifest/);
assert.match(api, /referencedAssets: deploymentPackage\.referencedAssets/);

// Publishing must save fresh JSON + HTML before the publish request is made.
assert.match(store, /prepareForPublish: async/);
assert.match(store, /await get\(\)\.saveDraft\(\)/);
assert.match(store, /await autosaveProject\(workspaceId/);
assert.match(store, /await saveWorkspaceState\(workspaceId/);
assert.match(store, /latest\.exportHtml\(\)/);
assert.match(store, /buildDeploymentPackageForState/);
assert.match(store, /serializeDeploymentPackage\(deploymentPackage\)/);
assert.match(store, /deploymentPackage: serializedPackage/);
assert.match(store, /builderData: serializedPackage\.builderData/);

// Builder integration and all key UI states remain present.
assert.match(canvas, /<PublishDialog/);
assert.match(canvas, /prepareForPublish/);
assert.match(canvas, /onInspectPackage/);
assert.match(canvas, /Publish<\/span>/);
assert.match(dialog, /phase === "preparing"/);
assert.match(dialog, /phase === "publishing"/);
assert.match(dialog, /phase === "monitoring"/);
assert.match(dialog, /phase === "success"/);
assert.match(dialog, /phase === "error"/);
assert.match(dialog, /onInspectPackage/);
assert.match(dialog, /Deployment package/);
assert.match(dialog, /Fix before publishing/);
assert.match(dialog, /rollbackDeployment/);
assert.match(dialog, /Open Website/);
assert.match(dialog, /Copy URL/);
assert.match(dialog, /Publish history/);

// Package generation owns reusable paths and does not serialize browser blobs.
assert.match(deploymentPackage, /DEPLOYMENT_PACKAGE_VERSION/);
assert.match(deploymentPackage, /assets\/\$\{kind\}-\$\{hash\.value\.slice\(0, 16\)\}/);
assert.match(deploymentPackage, /assetManifest/);
assert.match(deploymentPackage, /serializeDeploymentPackage/);
assert.match(deploymentPackage, /createStandaloneHtml/);
assert.match(deploymentPackage, /temporary blob URL cannot be published/);

console.log("Publish workflow checks passed.");

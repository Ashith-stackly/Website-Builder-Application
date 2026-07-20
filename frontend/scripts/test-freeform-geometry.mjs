import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const typescript = require("typescript");
const layoutSource = readFileSync(new URL("../lib/freeformLayout.ts", import.meta.url), "utf8");
const compiledLayout = typescript.transpileModule(layoutSource, {
  compilerOptions: {
    module: typescript.ModuleKind.CommonJS,
    target: typescript.ScriptTarget.ES2020,
  },
}).outputText;
const layoutModule = { exports: {} };
new Function("exports", "require", "module", compiledLayout)(
  layoutModule.exports,
  require,
  layoutModule,
);
const sourceUrl = new URL("../components/builder/freeformGeometry.ts", import.meta.url);
const source = readFileSync(sourceUrl, "utf8");
const compiled = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.CommonJS,
    target: typescript.ScriptTarget.ES2020,
  },
}).outputText;

const geometryModule = { exports: {} };
new Function("exports", "require", "module", compiled)(
  geometryModule.exports,
  (id) => {
    if (id === "@/lib/freeformLayout") return layoutModule.exports;
    return require(id);
  },
  geometryModule,
);

const {
  alignFreeformFrame,
  clampFrameToBounds,
  framesIntersect,
  getFreeformFrame,
  snapToGrid,
} = geometryModule.exports;

assert.equal(snapToGrid(13, 8), 16);
assert.equal(snapToGrid(11, 6), 12);

assert.deepEqual(
  clampFrameToBounds({ x: -30, y: -5, width: 900, height: 10 }, { width: 400, height: 300 }),
  { x: 0, y: 0, width: 400, height: 40 },
  "frames stay inside the horizontal artboard and keep their minimum size",
);

const legacyHeading = {
  id: "legacy-heading",
  type: "heading",
  content: "Hello",
  styles: {},
  children: [],
  order: 0,
};
assert.deepEqual(
  getFreeformFrame(legacyHeading, 0, 1280),
  { x: 40, y: 40, width: 720, height: 180 },
  "legacy flow blocks receive a stable visual frame without persisted geometry",
);
assert.equal(
  getFreeformFrame({ ...legacyHeading, id: "legacy-hero", type: "hero" }, 0, 1280).height,
  420,
  "the editor uses the same component-height estimate as Freeform placement and export",
);

const aligned = alignFreeformFrame(
  { x: 95, y: 20, width: 100, height: 50 },
  [{ x: 196, y: 0, width: 80, height: 8 }],
  { width: 400, height: 500 },
);
assert.equal(aligned.frame.x, 96, "the right edge snaps to the sibling's left edge");
assert.ok(aligned.guides.some((guide) => guide.axis === "x" && guide.position === 196));
assert.ok(
  aligned.guides.some((guide) => guide.axis === "y" && guide.distance === 12),
  "vertical spacing is measured while positioning",
);

assert.equal(framesIntersect(
  { x: 10, y: 10, width: 50, height: 50 },
  { x: 59, y: 59, width: 30, height: 30 },
), true);
assert.equal(framesIntersect(
  { x: 10, y: 10, width: 50, height: 50 },
  { x: 60, y: 10, width: 30, height: 30 },
), false);

console.log("Freeform geometry regression tests passed");

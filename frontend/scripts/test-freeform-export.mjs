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

const sourceUrl = new URL("../lib/freeformExport.ts", import.meta.url);
const source = readFileSync(sourceUrl, "utf8");
const compiled = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.CommonJS,
    target: typescript.ScriptTarget.ES2020,
  },
}).outputText;

const freeformModule = { exports: {} };
new Function("exports", "require", "module", compiled)(
  freeformModule.exports,
  (id) => {
    if (id === "@/lib/freeformLayout") return layoutModule.exports;
    return require(id);
  },
  freeformModule,
);

const {
  buildFreeformResponsiveCss,
  freeformItemClassName,
  getFreeformCanvasMinHeight,
  isFreeformHtmlExport,
  resolveFreeformExportGeometry,
  wrapFreeformExportComponent,
} = freeformModule.exports;

const exportHtmlSourceUrl = new URL("../lib/exportHtml.ts", import.meta.url);
const exportHtmlSource = readFileSync(exportHtmlSourceUrl, "utf8");
const compiledExportHtml = typescript.transpileModule(exportHtmlSource, {
  compilerOptions: {
    module: typescript.ModuleKind.CommonJS,
    target: typescript.ScriptTarget.ES2020,
  },
}).outputText;

const escapeHtml = (value) => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

const exportModule = { exports: {} };
new Function("exports", "require", "module", compiledExportHtml)(
  exportModule.exports,
  (id) => {
    if (id === "@/lib/blockRegistry") return { blockRegistry: {} };
    if (id === "lucide-react") return { Star: () => null };
    if (id === "react") return { createElement: () => null };
    if (id === "react-dom/server") return { renderToStaticMarkup: () => "" };
    if (id === "@/lib/htmlUtils") return { escapeHtml };
    if (id === "@/lib/analyticsTracking") return { buildAnalyticsTrackingScript: () => "" };
    if (id === "@/lib/storefrontRuntime") return { buildStorefrontRuntimeScript: () => "" };
    if (id === "@/lib/freeformExport") return freeformModule.exports;
    throw new Error(`Unexpected exportHtml dependency: ${id}`);
  },
  exportModule,
);

const { generateHtml } = exportModule.exports;

function component(overrides = {}) {
  return {
    id: "hero one",
    type: "heading",
    content: "Hello",
    styles: {},
    children: [],
    order: 0,
    ...overrides,
  };
}

assert.equal(isFreeformHtmlExport(), false);
assert.equal(isFreeformHtmlExport({ canvasMode: "flow" }), false);
assert.equal(isFreeformHtmlExport({ canvasMode: "freeform" }), true);

const positioned = component({
  position: { x: 640, y: 400 },
  freeformSize: { width: 640, height: 320 },
  zIndex: 24,
});
assert.deepEqual(resolveFreeformExportGeometry(positioned), {
  x: 640,
  y: 400,
  width: 640,
  height: 320,
  zIndex: 24,
});

const styleLayerOnly = component({ styles: { zIndex: "18" } });
assert.equal(resolveFreeformExportGeometry(styleLayerOnly).zIndex, 18);
assert.equal(
  resolveFreeformExportGeometry(component({ styles: { zIndex: "18" }, zIndex: 6 })).zIndex,
  18,
  "the current layer control uses styles.zIndex and must win over legacy metadata",
);

const malformed = component({
  id: "<unsafe id>",
  position: { x: Number.POSITIVE_INFINITY, y: -120 },
  freeformSize: { width: Number.NaN, height: Number.POSITIVE_INFINITY },
  styles: { zIndex: "3; color:red" },
});
assert.deepEqual(resolveFreeformExportGeometry(malformed), {
  x: 40,
  y: 0,
  width: 720,
  height: undefined,
  zIndex: 1,
});
assert.deepEqual(
  resolveFreeformExportGeometry(component({ id: "legacy" }), 2),
  { x: 88, y: 112, width: 720, height: undefined, zIndex: 1 },
  "manual/imported Freeform JSON without coordinates should stay non-overlapping",
);
assert.equal(freeformItemClassName(malformed.id), "stackly-freeform--unsafe-id-");

const wrapped = wrapFreeformExportComponent(positioned, "<h1>Safe content</h1>");
assert.match(wrapped, /data-stackly-freeform="true"/);
assert.match(wrapped, /--stackly-freeform-x:640px/);
assert.match(wrapped, /--stackly-freeform-y:400px/);
assert.match(wrapped, /--stackly-freeform-width:640px/);
assert.match(wrapped, /--stackly-freeform-height:320px/);
assert.match(wrapped, /z-index:24/);
assert.doesNotMatch(wrapFreeformExportComponent(malformed, "<p>safe</p>"), /color:red|<unsafe/);

const responsiveCss = buildFreeformResponsiveCss([positioned]);
assert.match(responsiveCss, /main\.stackly-freeform-canvas/);
assert.match(responsiveCss, /width:min\(1280px,calc\(100% - 32px\)\)/);
assert.match(responsiveCss, /@media \(max-width: 768px\)/);
assert.match(responsiveCss, /left:clamp\(0px,384px/);
assert.match(responsiveCss, /top:240px/);
assert.match(responsiveCss, /width:min\(384px,100%\)/);
assert.match(responsiveCss, /@media \(max-width: 390px\)/);
assert.match(responsiveCss, /left:clamp\(0px,195px/);
assert.match(responsiveCss, /top:121\.88px/);

assert.equal(getFreeformCanvasMinHeight([positioned]), 900);
assert.equal(
  getFreeformCanvasMinHeight([
    positioned,
    component({ id: "lower", position: { x: 0, y: 1000 }, freeformSize: { width: 120, height: 300 }, order: 1 }),
  ]),
  1380,
);
assert.equal(
  getFreeformCanvasMinHeight([
    component({ id: "hidden", hidden: true, position: { x: 0, y: 5000 }, freeformSize: { width: 120, height: 300 }, order: 1 }),
  ]),
  900,
);
assert.equal(
  getFreeformCanvasMinHeight([
    component({ id: "legacy-hero", type: "hero", position: { x: 0, y: 500 }, order: 1 }),
  ]),
  1000,
  "unresized exports use the same hero-height estimate as Freeform placement",
);

const flowHtml = generateHtml([positioned]);
assert.doesNotMatch(flowHtml, /data-stackly-freeform="true"/);
assert.doesNotMatch(flowHtml, /stackly-freeform-canvas/);

const freeformHtml = generateHtml([positioned], undefined, undefined, undefined, { canvasMode: "freeform" });
assert.match(freeformHtml, /<main class="stackly-freeform-canvas"/);
assert.match(freeformHtml, /data-stackly-freeform="true"/);
assert.match(freeformHtml, /--stackly-freeform-x:640px/);
assert.match(freeformHtml, /@media \(max-width: 768px\)/);

const floatingButton = component({
  id: "floating",
  type: "button",
  content: "Call us",
  props: { floating: true },
  position: { x: 80, y: 120 },
});
assert.match(generateHtml([floatingButton]), /class="stackly-floating"/);
assert.doesNotMatch(
  generateHtml([floatingButton], undefined, undefined, undefined, { canvasMode: "freeform" }),
  /class="stackly-floating"/,
);

assert.match(exportHtmlSource, /HtmlExportLayoutOptions/);
assert.match(exportHtmlSource, /isFreeformHtmlExport\(layout\)/);
assert.match(exportHtmlSource, /wrapFreeformExportComponent\(component, rendered, index\)/);
assert.match(exportHtmlSource, /freeformRoot: isFreeformLayout/);
assert.match(exportHtmlSource, /main\$\{freeformMainAttr\}/);
assert.match(exportHtmlSource, /generateHtml\(components, seo, workspaceId, tokens, layout\)/);

const previewSource = readFileSync(new URL("../components/builder/PreviewModal.tsx", import.meta.url), "utf8");
assert.match(previewSource, /window\.__stackly_preview = true/);
assert.match(previewSource, /srcDoc\.replace\("<head>", "<head>" \+ PREVIEW_INJECTIONS\)/);
assert.match(previewSource, /sandbox="allow-scripts"/);

const jsonSource = readFileSync(new URL("../lib/jsonExportImport.ts", import.meta.url), "utf8");
assert.match(jsonSource, /position: isPosition\(comp\.position\)/);
assert.match(jsonSource, /zIndex: typeof comp\.zIndex === "number"/);
assert.match(jsonSource, /freeformSize: isFreeformSize\(comp\.freeformSize\)/);

console.log("Freeform export regression tests passed");

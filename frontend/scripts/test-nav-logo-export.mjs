import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const typescript = require("typescript");

// Transpile htmlUtils
const htmlUtilsSource = readFileSync(new URL("../lib/htmlUtils.ts", import.meta.url), "utf8");
const compiledHtmlUtils = typescript.transpileModule(htmlUtilsSource, {
  compilerOptions: { module: typescript.ModuleKind.CommonJS, target: typescript.ScriptTarget.ES2020 },
}).outputText;
const htmlUtilsModule = { exports: {} };
new Function("exports", "require", "module", compiledHtmlUtils)(htmlUtilsModule.exports, require, htmlUtilsModule);

// Transpile navigation spec
const specSource = readFileSync(new URL("../components/blocks/navigation/spec.ts", import.meta.url), "utf8");
const compiledSpec = typescript.transpileModule(specSource, {
  compilerOptions: { module: typescript.ModuleKind.CommonJS, target: typescript.ScriptTarget.ES2020 },
}).outputText;
const specModule = { exports: {} };
new Function("exports", "require", "module", compiledSpec)(
  specModule.exports,
  (id) => {
    if (id === "@/lib/htmlUtils") return htmlUtilsModule.exports;
    if (id === "@/components/draggable/NavigationComponent") return () => null;
    if (id === "./NavigationPanel") return { NavigationPanel: () => null };
    if (id === "lucide-react") return { Menu: () => null };
    return require(id);
  },
  specModule
);

const { navigationSpec, readNavigation, navigationDefaults, NAV_SCHEMA_VERSION } = specModule.exports;

console.log("=== NAV LOGO EXPORT & PARITY TESTS ===");

// TEST 1: Default / Text Mode Export
{
  const comp = {
    id: "nav-1",
    type: "navigation",
    content: null,
    props: {
      ...navigationDefaults,
      brand: "Acme Corp",
      logo: { type: "text" },
    },
  };
  const data = readNavigation(comp);
  assert.equal(data.logo.type, "text");
  const html = navigationSpec.exportHtml(data, "");
  console.log("Text Mode HTML:", html);
  assert.ok(html.includes("<strong>Acme Corp</strong>"), "Must contain brand text");
  assert.ok(!html.includes('class="nav-logo"'), "Must NOT contain logo img");
  console.log("✓ TEST 1: Text Mode Export PASSED");
}

// TEST 2: Image Only Mode Export
{
  const comp = {
    id: "nav-2",
    type: "navigation",
    content: null,
    props: {
      ...navigationDefaults,
      brand: "Acme Corp",
      logo: {
        type: "image",
        src: "https://example.com/logo.png",
        width: 150,
        alt: "Acme Logo Image",
        href: "/dashboard",
        openInNewTab: true,
      },
    },
  };
  const data = readNavigation(comp);
  assert.equal(data.logo.type, "image");
  assert.equal(data.logo.width, 150);
  assert.equal(data.logo.href, "/dashboard");
  assert.equal(data.logo.openInNewTab, true);

  const html = navigationSpec.exportHtml(data, "");
  console.log("Image Only Mode HTML:", html);
  assert.ok(html.includes('<a href="/dashboard" target="_blank" rel="noopener noreferrer" class="nav-logo-link">'), "Must have link with target _blank");
  assert.ok(html.includes('<img class="nav-logo" src="https://example.com/logo.png" alt="Acme Logo Image" style="width:150px;height:auto;object-fit:contain" />'), "Must have img with width and alt");
  assert.ok(!html.includes("<strong>Acme Corp</strong>"), "Must NOT contain brand text in image-only mode");
  console.log("✓ TEST 2: Image Only Mode Export PASSED");
}

// TEST 3: Image + Text Mode Export
{
  const comp = {
    id: "nav-3",
    type: "navigation",
    content: null,
    props: {
      ...navigationDefaults,
      brand: "Acme Global",
      logo: {
        type: "image-text",
        src: "https://example.com/badge.svg",
        width: 90,
        alt: "Badge Icon",
        href: "/",
        openInNewTab: false,
      },
    },
  };
  const data = readNavigation(comp);
  assert.equal(data.logo.type, "image-text");
  const html = navigationSpec.exportHtml(data, "");
  console.log("Image + Text Mode HTML:", html);
  assert.ok(html.includes('<img class="nav-logo" src="https://example.com/badge.svg" alt="Badge Icon" style="width:90px;height:auto;object-fit:contain" />'), "Must have logo img");
  assert.ok(html.includes("<strong>Acme Global</strong>"), "Must have brand text");
  assert.ok(!html.includes('target="_blank"'), "Must NOT have target _blank when openInNewTab is false");
  console.log("✓ TEST 3: Image + Text Mode Export PASSED");
}

// TEST 4: Legacy Migration (Backward Compatibility)
{
  const legacyComp = {
    id: "nav-legacy",
    type: "navigation",
    content: null,
    props: {
      schemaVersion: 1,
      brand: "Old Brand",
      logoUrl: "https://example.com/legacy-logo.png",
      logoAssetId: "old-asset-123",
      links: [{ label: "Home", href: "#" }],
      cta: { label: "Contact" },
    },
  };
  const data = readNavigation(legacyComp);
  assert.equal(data.logo.type, "image-text", "Legacy logoUrl auto-migrates to image-text");
  assert.equal(data.logo.src, "https://example.com/legacy-logo.png");
  assert.equal(data.logo.assetId, "old-asset-123");
  assert.equal(data.logo.width, 120);

  const html = navigationSpec.exportHtml(data, "");
  assert.ok(html.includes('src="https://example.com/legacy-logo.png"'), "Export includes legacy image");
  assert.ok(html.includes("<strong>Old Brand</strong>"), "Export includes legacy brand text");
  console.log("✓ TEST 4: Legacy Migration PASSED");
}

console.log("=== ALL 4 EXPORT TESTS PASSED SUCCESSFULLY ===");

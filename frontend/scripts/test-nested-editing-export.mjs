import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const typescript = require("typescript");

function transpileAndEval(filePath, mockRequires = {}) {
  const source = readFileSync(new URL(filePath, import.meta.url), "utf8");
  const compiled = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.CommonJS,
      target: typescript.ScriptTarget.ES2020,
      jsx: typescript.JsxEmit.React,
    },
  }).outputText;
  const mod = { exports: {} };
  new Function("exports", "require", "module", compiled)(
    mod.exports,
    (id) => {
      if (mockRequires[id]) return mockRequires[id];
      if (id === "react") return { createElement: () => null, useState: () => [null, () => {}], useCallback: (fn) => fn, useMemo: (fn) => fn() };
      if (id.includes("PricingTableComponent")) return { default: () => null, pricingTableDefaults: { heading: "Pricing", tiers: [] } };
      if (id.includes("TestimonialComponent")) return { default: () => null, testimonialDefaults: { heading: "Reviews", items: [] } };
      if (id.includes("FooterComponent")) return { default: () => null, footerDefaults: { brand: "Stackly", columns: [], socials: [] } };
      if (id.includes("AccordionComponent")) return { default: () => null, accordionDefaults: { items: [] } };
      if (id.includes("TabsComponent")) return { default: () => null, tabsDefaults: { items: [] } };
      if (id.startsWith("@/components/draggable/")) return () => null;
      if (id.startsWith("@/")) return () => null;
      return require(id);
    },
    mod,
  );
  return mod.exports;
}

// 1. Test htmlUtils
const htmlUtils = transpileAndEval("../lib/htmlUtils.ts");
assert.equal(typeof htmlUtils.styleToString, "function", "styleToString must be exported");

const testStyle = { backgroundColor: "#ef4444", borderRadius: "12px", padding: "20px" };
const cssString = htmlUtils.styleToString(testStyle);
console.log("styleToString output:", cssString);
assert.ok(cssString.includes("background-color:#ef4444"), "Should serialize background-color");
assert.ok(cssString.includes("border-radius:12px"), "Should serialize border-radius");
assert.ok(cssString.includes("padding:20px"), "Should serialize padding");

// 2. Test Features Spec exportHtml
const featuresSpecModule = transpileAndEval("../components/blocks/features/spec.ts", {
  "@/lib/htmlUtils": htmlUtils,
  "lucide-react": { LayoutGrid: () => null },
  "@/components/draggable/FeaturesComponent": () => null,
  "./FeaturesPanel": { FeaturesPanel: () => null },
});

const featuresSpec = featuresSpecModule.featuresSpec;
assert.ok(featuresSpec, "featuresSpec must exist");

const sampleFeaturesComponent = {
  id: "feat-1",
  type: "features",
  content: "",
  order: 0,
  styles: { backgroundColor: "#7c3aed" },
  props: {
    columns: 3,
    items: [
      { title: "Fast setup", description: "Card 1", style: { backgroundColor: "#ef4444" } },
      { title: "Responsive", description: "Card 2", style: { backgroundColor: "#22c55e" } },
      { title: "Easy editing", description: "Card 3", style: { backgroundColor: "#3b82f6" } },
    ],
  },
};

const featuresData = featuresSpec.read(sampleFeaturesComponent);
const featuresHtml = featuresSpec.exportHtml(featuresData, "");
console.log("featuresHtml snippet:", featuresHtml.slice(0, 300));
assert.ok(featuresHtml.includes("background-color:#ef4444"), "Card 1 red style must be in export");
assert.ok(featuresHtml.includes("background-color:#22c55e"), "Card 2 green style must be in export");
assert.ok(featuresHtml.includes("background-color:#3b82f6"), "Card 3 blue style must be in export");

// 3. Test Migrated Specs (pricing-table, testimonial, accordion, tabs, footer)
const migratedSpecs = transpileAndEval("../components/blocks/_shared/migratedSpecs.tsx", {
  "@/lib/htmlUtils": htmlUtils,
  "lucide-react": {},
});

// 3a. Pricing Table
const pricingSpec = migratedSpecs.pricingTableSpec;
const samplePricing = {
  id: "price-1",
  type: "pricing-table",
  content: "",
  order: 0,
  styles: {},
  props: {
    tiers: [
      { name: "Basic", price: "$9", period: "mo", cta: "Start", style: { backgroundColor: "#fef2f2", borderColor: "#ef4444" }, features: ["Feature 1"] },
      { name: "Pro", price: "$29", period: "mo", cta: "Go Pro", popular: true, style: { backgroundColor: "#eff6ff" }, features: ["All features"] },
    ],
  },
};
const pricingHtml = pricingSpec.exportHtml(pricingSpec.read(samplePricing), "");
assert.ok(pricingHtml.includes("background-color:#fef2f2"), "Pricing tier 1 style must be in export");
assert.ok(pricingHtml.includes("border-color:#ef4444"), "Pricing tier 1 border must be in export");
assert.ok(pricingHtml.includes("background-color:#eff6ff"), "Pricing tier 2 style must be in export");

// 3b. Testimonial
const testimonialSpec = migratedSpecs.testimonialSpec;
const sampleTestimonial = {
  id: "test-1",
  type: "testimonial",
  content: "",
  order: 0,
  styles: {},
  props: {
    items: [
      { quote: "Amazing builder!", name: "Alice", role: "Founder", style: { backgroundColor: "#fdf4ff" } },
    ],
  },
};
const testHtml = testimonialSpec.exportHtml(testimonialSpec.read(sampleTestimonial), "");
assert.ok(testHtml.includes("background-color:#fdf4ff"), "Testimonial item style must be in export");

// 3c. Accordion
const accordionSpec = migratedSpecs.accordionSpec;
const sampleAccordion = {
  id: "acc-1",
  type: "accordion",
  content: "",
  order: 0,
  styles: {},
  props: {
    items: [
      { title: "What is Stackly?", content: "A website builder", style: { backgroundColor: "#f8fafc" } },
    ],
  },
};
const accHtml = accordionSpec.exportHtml(accordionSpec.read(sampleAccordion), "");
assert.ok(accHtml.includes("background-color:#f8fafc"), "Accordion item style must be in export");

// 3d. Tabs
const tabsSpec = migratedSpecs.tabsSpec;
const sampleTabs = {
  id: "tabs-1",
  type: "tabs",
  content: "",
  order: 0,
  styles: {},
  props: {
    items: [
      { label: "Tab 1", content: "Tab 1 content", style: { backgroundColor: "#f1f5f9" } },
    ],
  },
};
const tabsHtml = tabsSpec.exportHtml(tabsSpec.read(sampleTabs), "");
assert.ok(tabsHtml.includes("background-color:#f1f5f9"), "Tabs item style must be in export");

// 3e. Footer
const footerSpec = migratedSpecs.footerSpec;
const sampleFooter = {
  id: "foot-1",
  type: "footer",
  content: "",
  order: 0,
  styles: {},
  props: {
    columns: [
      { title: "Product", links: [{ label: "Features", href: "#" }], style: { backgroundColor: "#0f172a" } },
    ],
  },
};
const footHtml = footerSpec.exportHtml(footerSpec.read(sampleFooter), "");
assert.ok(footHtml.includes("background-color:#0f172a"), "Footer column style must be in export");

// 4. Test Hero Spec
const heroSpecModule = transpileAndEval("../components/blocks/hero/spec.ts", {
  "@/lib/htmlUtils": htmlUtils,
  "lucide-react": {},
  "./defaults": {
    HERO_SCHEMA_VERSION: 1,
    heroDefaults: {
      schemaVersion: 1,
      title: "Hero",
      description: "Desc",
      cta: { label: "CTA" },
      layout: "split",
      align: "left",
      media: { type: "placeholder" },
    },
  },
  "@/components/draggable/HeroComponent": () => null,
  "./HeroPanel": { HeroPanel: () => null },
});
const heroSpec = heroSpecModule.heroSpec;
const sampleHero = {
  id: "hero-1",
  type: "hero",
  content: "Build Faster",
  order: 0,
  styles: {},
  props: {
    title: "Build Faster",
    description: "Launch in minutes",
    cta: "Get Started",
    media: {
      type: "image",
      src: "https://example.com/hero.png",
      alt: "Hero Banner",
      style: { borderRadius: "24px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" },
    },
  },
};
const heroHtml = heroSpec.exportHtml(heroSpec.read(sampleHero), "");
assert.ok(heroHtml.includes("border-radius:24px"), "Hero media style must be in export");
assert.ok(heroHtml.includes("https://example.com/hero.png"), "Hero image src must be in export");

console.log("==================================================");
console.log("ALL NESTED EDITING EXPORT TESTS PASSED!");
console.log("==================================================");

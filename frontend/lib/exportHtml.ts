import { blockRegistry } from "@/lib/blockRegistry";
import * as LucideIcons from "lucide-react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { LucideIcon } from "lucide-react";
import type { BuilderComponent, ComponentStyles, SEOMetadata } from "@/types/builder";
import type { DesignTokens } from "@/store/designStore";
import { escapeHtml } from "@/lib/htmlUtils";
import { buildAnalyticsTrackingScript } from "@/lib/analyticsTracking";
import { buildStorefrontRuntimeScript } from "@/lib/storefrontRuntime";
import {
  buildFreeformResponsiveCss,
  getFreeformCanvasMinHeight,
  isFreeformHtmlExport,
  wrapFreeformExportComponent,
} from "@/lib/freeformExport";
import type { HtmlExportLayoutOptions } from "@/lib/freeformExport";

const styleToString = (styles: ComponentStyles) =>
  Object.entries(styles)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}:${value}`)
    .join(";");

const textStyleAttr = (component: BuilderComponent, key: string) => {
  const styles = component.textStyles?.[key];
  if (!styles) return "";
  const style = styleToString(styles as ComponentStyles);
  return style ? ` style="${escapeHtml(style)}"` : "";
};

const addStyleToTag = (tag: string, attr: string) =>
  attr ? tag.replace(/>$/, `${attr}>`) : tag;

const componentClassName = (id: string) => `stackly-component-${id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

const componentAttr = (component: BuilderComponent, styles: ComponentStyles = component.styles) => {
  const style = styleToString(styles);
  const classAttr = ` class="${componentClassName(component.id)}"`;
  return style ? `${classAttr} style="${escapeHtml(style)}"` : classAttr;
};

const applyTextStyleOverrides = (component: BuilderComponent, html: string) => {
  let result = html;

  if (component.type === "hero") {
    result = result.replace(/<h1>/, (tag) => addStyleToTag(tag, textStyleAttr(component, "hero.title")));
    result = result.replace(/<p>/, (tag) => addStyleToTag(tag, textStyleAttr(component, "hero.description")));
    result = result.replace(/<a href="[^"]*" role="button">/, (tag) => addStyleToTag(tag, textStyleAttr(component, "hero.cta")));
  }

  if (component.type === "contact") {
    result = result.replace(/<h2>/, (tag) => addStyleToTag(tag, textStyleAttr(component, "contact.title")));
    result = result.replace(/<p>/, (tag) => addStyleToTag(tag, textStyleAttr(component, "contact.description")));
    result = result.replace(/<button type="submit">/, (tag) => addStyleToTag(tag, textStyleAttr(component, "contact.cta")));
  }

  if (component.type === "features") {
    let index = 0;
    result = result.replace(/<h3>/g, (tag) => addStyleToTag(tag, textStyleAttr(component, `features.${index++}.title`)));
    index = 0;
    result = result.replace(/<p>/g, (tag) => addStyleToTag(tag, textStyleAttr(component, `features.${index++}.description`)));
  }

  if (component.type === "navigation") {
    result = result.replace(/<strong>/, (tag) => addStyleToTag(tag, textStyleAttr(component, "navigation.brand")));
    let linkIndex = 0;
    result = result.replace(/<a [^>]*>/g, (tag) => {
      if (tag.includes("nav-cta")) {
        return addStyleToTag(tag, textStyleAttr(component, "navigation.cta"));
      }
      return addStyleToTag(tag, textStyleAttr(component, `navigation.link.${linkIndex++}`));
    });
  }

  return result;
};

const isFloatingComponent = (component: BuilderComponent) =>
  (component.type === "icon" || component.type === "button") && component.props?.floating === true;

const floatingWrapper = (component: BuilderComponent, inner: string) => {
  const x = Math.max(0, Math.round(component.position?.x ?? 32));
  const y = Math.max(0, Math.round(component.position?.y ?? 32));
  const zIndex = escapeHtml(String(component.styles.zIndex || component.zIndex || 60));

  return `<div class="stackly-floating" style="left:clamp(0px,${x}px,calc(100% - 44px));top:${y}px;z-index:${zIndex};">${inner}</div>`;
};

const renderIconSvg = (name: string, styles: ComponentStyles) => {
  const Icon = (LucideIcons as unknown as Record<string, LucideIcon | undefined>)[name] ?? LucideIcons.Star;
  const size = parseInt(styles.fontSize || "32", 10) || 32;
  const color = styles.color || "#0B1D40";

  return renderToStaticMarkup(createElement(Icon, {
    size,
    color,
    strokeWidth: 1.8,
    "aria-hidden": true,
    focusable: false,
  }));
};

type ComponentRenderOptions = {
  /** A root freeform item owns its position, so it must not also use the legacy floating wrapper. */
  freeformRoot?: boolean;
};

const renderComponent = (component: BuilderComponent, options: ComponentRenderOptions = {}): string => {
  // Skip hidden components in export
  if (component.hidden) return "";
  const styleAttr = componentAttr(component);
  const content = escapeHtml(component.content);
  const children = component.children.map((child) => renderComponent(child)).join("\n");

  // ── Registry path ────────────────────────────────────────────────────────────
  // All migrated blocks delegate export to spec.exportHtml(data, styleAttr, children).
  const spec = blockRegistry[component.type];
  if (spec) {
    const data = spec.read(component);
    return applyTextStyleOverrides(component, spec.exportHtml(data, styleAttr, children));
  }

  switch (component.type) {
    case "heading":
      return `<h1${styleAttr}>${content}</h1>`;
    case "text":
      return `<p${styleAttr}>${content}</p>`;
    case "button":
      if (isFloatingComponent(component) && !options.freeformRoot) {
        return floatingWrapper(component, `<button${styleAttr}>${content}</button>`);
      }
      return `<button${styleAttr}>${content}</button>`;
    case "image":
      return `<img${styleAttr} src="${escapeHtml(component.content)}" alt="Builder image" />`;
    case "input":
      return `<input${styleAttr} placeholder="${content}" />`;
    case "divider":
      return `<hr${styleAttr} />`;
    case "gallery": {
      const gallery = component.content
        .split("\n")
        .map((item) => item.split("|"))
        .filter(([src]) => src?.trim())
        .map(([src, caption], index) => `<figure><img src="${escapeHtml(src.trim())}" alt="${escapeHtml(caption || "Website image")}" /><figcaption${textStyleAttr(component, `gallery.${index}.caption`)}>${escapeHtml(caption || "")}</figcaption></figure>`)
        .join("");

      return `<section${styleAttr}>${gallery}</section>`;
    }
    case "spacer":
      return `<div${componentAttr(component, { ...component.styles, height: String(component.props?.height || component.content || "60px") })}></div>`;
    case "icon":
      if (isFloatingComponent(component) && !options.freeformRoot) {
        return floatingWrapper(component, `<span${styleAttr}>${renderIconSvg(component.content || "Star", component.styles)}</span>`);
      }
      return `<span${styleAttr}>${renderIconSvg(component.content || "Star", component.styles)}</span>`;
    case "map": {
      const addr = component.props?.address || "New York";
      const z = component.props?.zoom || 12;
      const h = component.props?.height || "300px";
      return `<div${styleAttr}><iframe src="https://www.google.com/maps?q=${encodeURIComponent(String(addr))}&z=${z}&output=embed" style="width:100%;height:${h};border:0" loading="lazy" allowfullscreen></iframe></div>`;
    }
    case "accordion": {
      const items = (component.props as unknown as { items?: Array<{ title: string; content: string }> })?.items || [];
      const inner = items.map((it, i) => `<details${i === 0 ? " open" : ""}><summary style="padding:12px 16px;font-weight:700;cursor:pointer">${escapeHtml(it.title)}</summary><div style="padding:12px 16px;color:#566583">${escapeHtml(it.content)}</div></details>`).join("");
      return `<div${styleAttr}>${inner}</div>`;
    }
    case "tabs": {
      const items = (component.props as unknown as { items?: Array<{ label: string; content: string }> })?.items || [];
      const inner = items.map((it) => `<div style="margin-bottom:12px"><h4 style="font-weight:700">${escapeHtml(it.label)}</h4><p style="color:#566583">${escapeHtml(it.content)}</p></div>`).join("");
      return `<div${styleAttr}>${inner}</div>`;
    }
    case "social-links": {
      const links = (component.props as unknown as { links?: Array<{ platform: string; url: string }> })?.links || [];
      const inner = links.map((l) => `<a href="${escapeHtml(l.url)}" target="_blank" rel="noopener" style="display:inline-block;margin:0 4px;font-weight:700">${escapeHtml(l.platform)}</a>`).join("");
      return `<div${componentAttr(component, { ...component.styles, textAlign: "center" })}>${inner}</div>`;
    }
    case "countdown": {
      const label = (component.props as unknown as { label?: string })?.label || "Coming Soon";
      return `<div${componentAttr(component, { ...component.styles, textAlign: "center" })}><h3>${escapeHtml(label)}</h3><p>Countdown timer (requires JavaScript)</p></div>`;
    }
    case "pricing-table": {
      const tiers = (component.props as unknown as { heading?: string; tiers?: Array<{ name: string; price: string; period: string; features: string[]; cta: string; highlighted?: boolean }> })?.tiers || [];
      const heading = (component.props as unknown as { heading?: string })?.heading || "";
      const inner = tiers.map((t) => `<div style="flex:1;border:1px solid #dbe3ef;border-radius:12px;padding:24px;text-align:center"><h3>${escapeHtml(t.name)}</h3><div style="font-size:2em;font-weight:800">${escapeHtml(t.price)}<small>${escapeHtml(t.period)}</small></div><ul style="list-style:none;padding:0">${t.features.map((f) => `<li style="padding:4px 0">${escapeHtml(f)}</li>`).join("")}</ul><button>${escapeHtml(t.cta)}</button></div>`).join("");
      return `<section${styleAttr}>${heading ? `<h2 style="text-align:center">${escapeHtml(heading)}</h2>` : ""}<div style="display:flex;gap:16px">${inner}</div></section>`;
    }
    case "testimonial": {
      const items = (component.props as unknown as { heading?: string; items?: Array<{ quote: string; name: string; role: string }> })?.items || [];
      const heading = (component.props as unknown as { heading?: string })?.heading || "";
      const inner = items.map((it) => `<article><blockquote style="font-style:italic">"${escapeHtml(it.quote)}"</blockquote><p style="font-weight:700">${escapeHtml(it.name)}</p><p style="color:#94a3b8">${escapeHtml(it.role)}</p></article>`).join("");
      return `<section${styleAttr}>${heading ? `<h2 style="text-align:center">${escapeHtml(heading)}</h2>` : ""}<div style="display:flex;gap:16px">${inner}</div></section>`;
    }
    case "footer": {
      const fp = component.props as unknown as { brand?: string; tagline?: string; copyright?: string; columns?: Array<{ title: string; links: Array<{ label: string; href: string }> }> } || {};
      const cols = fp?.columns || [];
      const colHtml = cols.map((c) => `<div style="flex:1"><h4>${escapeHtml(c.title)}</h4>${c.links.map((l) => `<a href="${escapeHtml(l.href)}" style="display:block;padding:4px 0;color:rgba(255,255,255,.6)">${escapeHtml(l.label)}</a>`).join("")}</div>`).join("");
      return `<footer${componentAttr(component, { backgroundColor: "#0B1D40", color: "#fff", padding: "40px", ...component.styles })}><div style="display:flex;gap:32px"><div style="flex:1"><strong>${escapeHtml(fp?.brand || "")}</strong><p style="color:rgba(255,255,255,.5)">${escapeHtml(fp?.tagline || "")}</p></div>${colHtml}</div><hr style="border-color:rgba(255,255,255,.1)"/><p style="text-align:center;color:rgba(255,255,255,.4)">${escapeHtml(fp?.copyright || "")}</p></footer>`;
    }
    case "form": {
      const fields = (component.props as unknown as { heading?: string; fields?: Array<{ name: string; type: string; label: string; placeholder?: string }> })?.fields || [];
      const heading = (component.props as unknown as { heading?: string; submitLabel?: string })?.heading || "";
      const submitLabel = (component.props as unknown as { submitLabel?: string })?.submitLabel || "Submit";
      const fieldHtml = fields.map((f) => {
        if (f.type === "textarea") return `<label style="display:block;margin-bottom:12px"><span style="font-weight:700;font-size:12px">${escapeHtml(f.label)}</span><textarea placeholder="${escapeHtml(f.placeholder || "")}" rows="4" style="display:block;width:100%;padding:12px;border:1px solid #dbe3ef;border-radius:8px;margin-top:4px"></textarea></label>`;
        return `<label style="display:block;margin-bottom:12px"><span style="font-weight:700;font-size:12px">${escapeHtml(f.label)}</span><input type="${f.type}" placeholder="${escapeHtml(f.placeholder || "")}" style="display:block;width:100%;padding:12px;border:1px solid #dbe3ef;border-radius:8px;margin-top:4px"/></label>`;
      }).join("");
      return `<section${styleAttr}>${heading ? `<h2 style="text-align:center">${escapeHtml(heading)}</h2>` : ""}<form>${fieldHtml}<button type="submit">${escapeHtml(submitLabel)}</button></form></section>`;
    }
    default:
      return "";
  }
};

const collectResponsiveCss = (components: BuilderComponent[]): string => {
  const tabletRules: string[] = [];
  const mobileRules: string[] = [];

  const visit = (component: BuilderComponent) => {
    const tabletStyle = component.responsiveStyles?.tablet
      ? styleToString(component.responsiveStyles.tablet as ComponentStyles)
      : "";
    const mobileStyle = component.responsiveStyles?.mobile
      ? styleToString(component.responsiveStyles.mobile as ComponentStyles)
      : "";

    if (tabletStyle) {
      tabletRules.push(`        .${componentClassName(component.id)} { ${tabletStyle}; }`);
    }
    if (mobileStyle) {
      mobileRules.push(`        .${componentClassName(component.id)} { ${mobileStyle}; }`);
    }

    component.children.forEach(visit);
  };

  components.forEach(visit);

  return [
    tabletRules.length ? `      @media (max-width: 768px) {\n${tabletRules.join("\n")}\n      }` : "",
    mobileRules.length ? `      @media (max-width: 390px) {\n${mobileRules.join("\n")}\n      }` : "",
  ].filter(Boolean).join("\n");
};

const hasProductCollection = (components: BuilderComponent[]): boolean =>
  components.some((component) =>
    component.type === "product-collection" || hasProductCollection(component.children || []),
  );

export const generateHtml = (
  components: BuilderComponent[],
  seo?: SEOMetadata,
  workspaceId?: string,
  tokens?: DesignTokens,
  layout?: HtmlExportLayoutOptions,
) => {
  const isFreeformLayout = isFreeformHtmlExport(layout);
  const orderedComponents = components
    .slice()
    .sort((a, b) => a.order - b.order);
  const body = orderedComponents
    .map((component, index) => {
      const rendered = renderComponent(component, { freeformRoot: isFreeformLayout });
      return isFreeformLayout ? wrapFreeformExportComponent(component, rendered, index) : rendered;
    })
    .join("\n");

  /* ── SEO meta tags ───────────────────────────────────────────────── */
  const pageTitle = escapeHtml(seo?.title || "Exported Stackly Page");
  const metaDesc = seo?.description
    ? `\n    <meta name="description" content="${escapeHtml(seo.description)}" />`
    : "";

  const ogTitle = seo?.ogTitle || seo?.title;
  const ogDesc = seo?.ogDescription || seo?.description;

  const ogTags = [
    ogTitle   ? `<meta property="og:title" content="${escapeHtml(ogTitle)}" />`       : "",
    ogDesc    ? `<meta property="og:description" content="${escapeHtml(ogDesc)}" />` : "",
    seo?.ogImage ? `<meta property="og:image" content="${escapeHtml(seo.ogImage)}" />` : "",
    ogTitle   ? `<meta property="og:type" content="website" />`                       : "",
  ].filter(Boolean);

  const ogBlock = ogTags.length > 0
    ? "\n    " + ogTags.join("\n    ")
    : "";
  const responsiveCss = collectResponsiveCss(components);
  const freeformCss = isFreeformLayout ? buildFreeformResponsiveCss(orderedComponents) : "";
  const freeformMainAttr = isFreeformLayout
    ? ` class="stackly-freeform-canvas" style="--stackly-freeform-min-height:${getFreeformCanvasMinHeight(orderedComponents)}px"`
    : "";

  const trackingScript = buildAnalyticsTrackingScript({
    workspaceId,
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api",
  });
  const includesProductCollection = hasProductCollection(components);
  const productCollectionCss = includesProductCollection
    ? `
      /* Product Collection: sample fallback and live catalog hydration */
      .stackly-product-collection { width: 100%; }
      .stackly-product-header { margin-bottom: 16px; }
      .stackly-product-heading { margin: 0; }
      .stackly-product-subheading { margin: 8px 0 0; color: #566583; line-height: 1.55; }
      .stackly-product-grid { display: grid; grid-template-columns: repeat(var(--stackly-product-columns, 3), minmax(0, 1fr)); gap: 18px; }
      .stackly-product-grid--carousel { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 6px; }
      .stackly-product-grid--carousel .stackly-product-card { min-width: min(280px, 82vw); scroll-snap-align: start; }
      .stackly-product-card { display: flex; min-width: 0; flex-direction: column; overflow: hidden; border: 1px solid #dbe3ef; border-radius: 12px; background: #fff; box-shadow: 0 1px 2px rgba(15,35,75,.04); }
      .stackly-product-image-wrap { position: relative; background: #f4f7fb; }
      .stackly-product-image-wrap img, .stackly-product-card > img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; background: #f4f7fb; }
      .stackly-product-copy, .stackly-product-card-body { display: flex; flex: 1; flex-direction: column; gap: 10px; padding: 16px; }
      .stackly-product-card h3 { margin: 0; font-size: 1.05rem; }
      .stackly-product-description { margin: 0; color: #566583; line-height: 1.5; }
      .stackly-product-price { margin: 0; font-size: 1.05rem; font-weight: 800; }
      .stackly-product-price s, .stackly-product-compare { margin-left: 8px; color: #7c8799; font-size: .85rem; font-weight: 500; }
      .stackly-product-badge { position: relative; align-self: flex-start; display: inline-flex; border-radius: 999px; background: #eaf1ff; color: #174ea6; padding: 4px 8px; font-size: .75rem; font-weight: 700; }
      .stackly-product-image-wrap .stackly-product-badge { position: absolute; left: 12px; top: 12px; z-index: 1; }
      .stackly-product-card button { margin-top: auto; }
      .stackly-product-filters { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 16px; }
      .stackly-product-status { min-height: 1.2em; margin: 10px 0; color: #566583; font-size: .9rem; }
      .stackly-product-pagination { display: flex; justify-content: center; gap: 8px; margin-top: 16px; }
      @media (max-width: 640px) { .stackly-product-grid { grid-template-columns: 1fr; } }
    `
    : "";
  const storefrontRuntimeScript = includesProductCollection
    ? buildStorefrontRuntimeScript({
      workspaceId,
      apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api",
    })
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${pageTitle}</title>${metaDesc}${ogBlock}${trackingScript}${storefrontRuntimeScript}
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; font-family: ${escapeHtml(tokens?.typography?.fontFamily || 'Arial, Helvetica, sans-serif')}; background: ${escapeHtml(tokens?.colors?.background || '#ffffff')}; color: ${escapeHtml(tokens?.colors?.text || '#0B1D40')}; }
      main { width: min(960px, calc(100% - 32px)); margin: 0 auto; padding: 32px 0; }
      main { position: relative; min-height: 680px; display: flex; flex-direction: column; gap: 12px; }
${freeformCss}
      .stackly-floating { position: absolute; margin: 0 !important; width: max-content; max-width: calc(100% - 8px); }
      .stackly-floating > * { margin: 0 !important; }
      .stackly-floating svg { display: block; }
      /* Hero: CSS Grid layout matching the canvas renderer (1.15fr 0.85fr) */
      .hero-split { display: grid; grid-template-columns: 1.15fr 0.85fr; align-items: center; gap: 24px; }
      .hero-text { min-width: 0; }
      .hero-media { min-width: 0; }
      .hero-media img { width: 100%; border-radius: 12px; }
      /* Hero placeholder wireframe — mirrors the canvas HeroComponent's right-column placeholder */
      .hero-placeholder { min-height: 180px; border-radius: 8px; border: 1px solid #dbe3ef; background: #ffffff; padding: 16px; box-shadow: 0 1px 3px rgba(15,35,75,0.05); display: flex; flex-direction: column; gap: 12px; }
      .hero-placeholder-bar { height: 12px; width: 96px; border-radius: 9999px; background: #dbe3ef; margin-bottom: 4px; }
      .hero-placeholder-block { border-radius: 4px; background: #f7f9fc; }
      @media (max-width: 768px) { .hero-split { grid-template-columns: 1fr; text-align: center; } }
      nav { display: flex; align-items: center; justify-content: space-between; gap: 16px; position: relative; }
      .nav-brand-group { display: flex; align-items: center; gap: 12px; flex-wrap: nowrap; min-width: max-content; }
      .nav-logo { display: block; height: 36px; width: auto; max-width: 120px; object-fit: contain; flex-shrink: 0; }
      .nav-links { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
      .nav-cta { white-space: nowrap; }
      .mobile-only { display: none !important; }
      .desktop-only { display: inline-flex !important; }
      .nav-hamburger { display: none; flex-direction: column; justify-content: center; gap: 5px; background: transparent !important; border: none; cursor: pointer; padding: 6px; color: #0B1D40; }
      .nav-hamburger span { display: block; width: 22px; height: 2px; background: currentColor; border-radius: 2px; transition: transform .2s, opacity .2s; }
      .nav-hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
      .nav-hamburger.open span:nth-child(2) { opacity: 0; }
      .nav-hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
      @media (max-width: 768px) {
        .nav-hamburger { display: flex; }
        .mobile-only { display: inline-flex !important; width: 100%; justify-content: center; margin-top: 12px; }
        .desktop-only { display: none !important; }
        .nav-links { display: none; position: absolute; top: 100%; left: 0; right: 0; flex-direction: column; align-items: flex-start; background: #fff; border-top: 1px solid rgba(0,0,0,.08); box-shadow: 0 8px 24px rgba(0,0,0,.12); padding: 12px 16px; z-index: 200; }
        .nav-links.open { display: flex; }
        .nav-links a { padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,.06); width: 100%; }
        .nav-links a:last-child { border-bottom: none; }
      }
      nav div:not(.nav-links), form { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
      a { color: inherit; text-decoration: none; font-weight: 600; }
      button, input { font: inherit; }
      button, [role="button"] { border: 0; cursor: pointer; border-radius: 6px; background: #0B1D40; color: #ffffff; padding: 12px 18px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
      a[role="button"]:hover { opacity: .88; }
      input { border: 1px solid #dbe3ef; border-radius: 6px; padding: 12px 14px; }
      img { display: block; max-width: 100%; object-fit: cover; }
      article { border: 1px solid #dbe3ef; border-radius: 8px; padding: 18px; margin: 12px 0; }
      figure { margin: 12px 0; overflow: hidden; border: 1px solid #dbe3ef; border-radius: 8px; }
      figcaption { padding: 10px 12px; font-weight: 700; }

      /* Columns Layout */
      .stackly-columns { display: grid; gap: 16px; width: 100%; }
      .stackly-columns[data-columns="1"] { grid-template-columns: 1fr; }
      .stackly-columns[data-columns="2"] { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .stackly-columns[data-columns="3"] { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .stackly-columns[data-columns="4"] { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      @media (max-width: 1024px) {
        .stackly-columns[data-columns="3"] { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .stackly-columns[data-columns="4"] { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      @media (max-width: 640px) {
        .stackly-columns { grid-template-columns: 1fr !important; }
      }

      /* Row Layout */
      .stackly-row-grid { display: grid; grid-template-columns: var(--grid-template-columns, 1fr 1fr); gap: 16px; width: 100%; }
      @media (max-width: 768px) {
        .stackly-row-grid { grid-template-columns: 1fr !important; }
      }

      /* Gallery Layout */
      .stackly-gallery-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; width: 100%; }
      @media (max-width: 768px) {
        .stackly-gallery-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      @media (max-width: 480px) {
        .stackly-gallery-grid { grid-template-columns: 1fr !important; }
      }
      .stackly-gallery figure { margin: 0; overflow: hidden; border: 1px solid #dbe3ef; border-radius: 8px; background: #f7f9fc; }
      .stackly-gallery figcaption { padding: 10px 12px; font-weight: 700; font-size: 14px; }
      .stackly-gallery img { width: 100%; height: 170px; object-fit: cover; }

      /* Features Layout */
      .stackly-features-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; width: 100%; }
      @media (max-width: 768px) {
        .stackly-features-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      @media (max-width: 480px) {
        .stackly-features-grid { grid-template-columns: 1fr !important; }
      }
      .stackly-features article { border: 1px solid #dbe3ef; border-radius: 8px; padding: 20px; background: #f7f9fc; transition: transform .2s, background-color .2s; margin: 0; }
      .stackly-features article:hover { transform: translateY(-4px); background: #ffffff; box-shadow: 0 8px 24px rgba(15,35,75,0.1); }
      .stackly-features .features-num { margin-bottom: 16px; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: #0B1D40; color: #fff; border-radius: 6px; font-weight: 700; }
      .stackly-features h3 { margin: 0 0 8px; font-size: 16px; font-weight: 700; }
      .stackly-features p { margin: 0; font-size: 14px; color: #566583; line-height: 1.6; }

      /* Pricing Table Layout */
      .pricing-grid { display: flex; gap: 16px; width: 100%; }
      @media (max-width: 768px) {
        .pricing-grid { flex-direction: column; }
      }
      .pricing-tier { flex: 1; border: 1px solid #dbe3ef; border-radius: 12px; padding: 24px; text-align: center; background: #ffffff; }
      .pricing-price { font-size: 2em; font-weight: 800; margin: 12px 0; }
      .pricing-features { list-style: none; padding: 0; margin: 16px 0; }
      .pricing-features li { padding: 6px 0; color: #566583; }
      .pricing-cta { width: 100%; }

      /* Testimonial Layout */
      .testimonial-grid { display: flex; gap: 16px; width: 100%; }
      @media (max-width: 768px) {
        .testimonial-grid { flex-direction: column; }
      }
      .testimonial-card { flex: 1; border: 1px solid #dbe3ef; border-radius: 8px; padding: 18px; background: #ffffff; margin: 0; }
      .testimonial-card blockquote { font-style: italic; margin: 0 0 12px; }
      .testimonial-name { font-weight: 700; margin: 0; }
      .testimonial-role { color: #94a3b8; margin: 4px 0 0; font-size: 12px; }

      /* Footer Layout */
      .footer-grid { display: flex; gap: 32px; width: 100%; }
      @media (max-width: 768px) {
        .footer-grid { flex-direction: column; gap: 24px; }
      }
      .footer-brand { flex: 1; }
      .footer-col { flex: 1; }
      .footer-col h4 { margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #ffffff; }
      .footer-col a { display: block; padding: 6px 0; color: rgba(255,255,255,.6); font-size: 13px; }
      .footer-divider { border: 0; border-top: 1px solid rgba(255,255,255,.1); margin: 24px 0; width: 100%; }
      .footer-copyright { text-align: center; color: rgba(255,255,255,.4); font-size: 12px; margin: 0; }

${productCollectionCss}

      @media (max-width: 768px) {
        main { width: min(100%, calc(100% - 24px)); padding: 24px 0; }
        h1 { font-size: min(32px, 7vw); line-height: 1.15; }
        h2 { font-size: min(28px, 6vw); line-height: 1.2; }
        h3 { font-size: min(22px, 5vw); line-height: 1.25; }
        p, li, input, textarea, select { font-size: min(16px, 4vw); }
        button, [role="button"] { font-size: min(15px, 3.8vw); padding: 10px 14px; }
      }
      @media (max-width: 480px) {
        main { width: min(100%, calc(100% - 20px)); padding: 20px 0; }
        h1 { font-size: min(28px, 7.5vw); }
        h2 { font-size: min(24px, 6.5vw); }
        h3 { font-size: min(20px, 5.5vw); }
        p, li, input, textarea, select { font-size: min(15px, 4.2vw); line-height: 1.6; }
        button, [role="button"] { font-size: min(14px, 4vw); }
      }
${responsiveCss ? `${responsiveCss}\n` : ""}    </style>
  </head>
  <body>
    <script>
      function _navToggle(btn) {
        var nav = btn.closest('nav') || btn.parentElement;
        var menu = nav && nav.querySelector('.nav-links');
        if (menu) menu.classList.toggle('open');
        btn.classList.toggle('open');
        btn.setAttribute('aria-expanded', menu && menu.classList.contains('open') ? 'true' : 'false');
      }
    </script>
    <main${freeformMainAttr}>
${body}
    </main>
  </body>
</html>`;
};

/**
 * Download an exported page. A saved builder project is backed by a Workspace,
 * so carrying its id into `generateHtml` retains the same public analytics
 * tracker used by saved HTML and any deployment serving that generated document.
 * Unsaved exports intentionally omit it.
 */
export const downloadHtml = (
  components: BuilderComponent[],
  seo?: SEOMetadata,
  filename = "stackly-page.html",
  tokens?: DesignTokens,
  workspaceId?: string,
  layout?: HtmlExportLayoutOptions,
) => {
  const html = generateHtml(components, seo, workspaceId, tokens, layout);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

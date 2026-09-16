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

const getSectionVariantClass = (component: BuilderComponent): string => {
  switch (component.type) {
    case "hero":
      return "section-immersive";
    case "navigation":
      return "section-nav";
    case "features": {
      const cols = Number(component.props?.columns);
      return cols >= 4 ? "section-band" : "section-surface";
    }
    case "testimonial":
    case "pricing-table":
      return "section-cards";
    case "accordion":
      return "section-plain";
    case "contact":
    case "form":
      return "section-surface";
    case "footer":
      return "section-immersive";
    case "gallery":
      return "section-surface";
    default:
      return "";
  }
};

const componentAttr = (component: BuilderComponent, styles: ComponentStyles = component.styles) => {
  const style = styleToString(styles);
  const variantClass = getSectionVariantClass(component);
  const baseClass = componentClassName(component.id);
  const classNames = variantClass ? `${baseClass} ${variantClass}` : baseClass;
  const classAttr = ` class="${classNames}"`;
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
      *, *::before, *::after { box-sizing: border-box; }
      html { scroll-behavior: smooth; }
      body { margin: 0; font-family: ${escapeHtml(tokens?.typography?.fontFamily || 'Inter, system-ui, -apple-system, sans-serif')}; background: ${escapeHtml(tokens?.colors?.background || '#ffffff')}; color: ${escapeHtml(tokens?.colors?.text || '#0B1D40')}; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; line-height: 1.6; }
      main { width: min(1200px, calc(100% - 48px)); margin: 0 auto; padding: 32px 0; }
      main { position: relative; min-height: 680px; display: flex; flex-direction: column; gap: 0; }
${freeformCss}
      .stackly-floating { position: absolute; margin: 0 !important; width: max-content; max-width: calc(100% - 8px); }
      .stackly-floating > * { margin: 0 !important; }
      .stackly-floating svg { display: block; }

      /* ── Typography Scale ──────────────────────────────────────── */
      h1 { font-size: clamp(2.25rem, 4vw, 3.5rem); font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; margin: 0 0 16px; }
      h2 { font-size: clamp(1.5rem, 3vw, 2.25rem); font-weight: 700; letter-spacing: -0.01em; line-height: 1.2; margin: 0 0 12px; }
      h3 { font-size: clamp(1.0625rem, 1.5vw, 1.25rem); font-weight: 600; line-height: 1.3; margin: 0 0 8px; }
      h4, h5, h6 { line-height: 1.3; }
      p { margin: 0 0 8px; }

      /* ── Base Elements ─────────────────────────────────────────── */
      a { color: inherit; text-decoration: none; font-weight: 600; transition: opacity 0.2s; }
      a:hover { opacity: 0.8; }
      button, input { font: inherit; }
      button, [role="button"] { border: 0; cursor: pointer; border-radius: 8px; background: #0B1D40; color: #ffffff; padding: 12px 24px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s ease; }
      button:hover, [role="button"]:hover { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(11,29,64,0.15); }
      button:active, [role="button"]:active { transform: translateY(0); }
      input { border: 1px solid #dbe3ef; border-radius: 8px; padding: 12px 14px; transition: border-color 0.2s, box-shadow 0.2s; }
      input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
      img { display: block; max-width: 100%; object-fit: cover; }
      /* article base — NO border/radius by default; block-specific classes add their own */
      article { margin: 0; transition: transform 0.2s, box-shadow 0.2s; }
      figure { margin: 0; overflow: hidden; }
      figcaption { padding: 10px 12px; font-weight: 700; }

      /* ── Section Treatment Variants ────────────────────────────── */
      /* .section-immersive: Hero, CTA — full visual impact, generous padding */
      .section-immersive:not(.section-bold) { border-radius: 0 !important; border: none !important; }

      /* .section-surface: Features, About — subtle background, clean edges */
      .section-surface:not(.section-bold) { border-radius: 0 !important; border-left: none !important; border-right: none !important; }

      /* .section-cards: Pricing, Testimonials — neutral bg, cards do the work */
      .section-cards:not(.section-bold) { border-radius: 0 !important; border: none !important; box-shadow: none !important; }

      /* .section-band: Stats, Trust strip — compact, full-width feel */
      .section-band:not(.section-bold) { border-radius: 0 !important; border: none !important; box-shadow: none !important; }

      /* .section-plain: FAQ, default — clean, no decoration */
      .section-plain:not(.section-bold) { border-radius: 0 !important; border: none !important; box-shadow: none !important; background: transparent !important; }

      /* Bold style gets to keep section radius for character */
      .section-bold { border-radius: 20px !important; }

      /* ── Hero ─────────────────────────────────────────────────── */
      .hero-split { display: grid; grid-template-columns: 1.15fr 0.85fr; align-items: center; gap: 40px; }
      .hero-text { min-width: 0; }
      .hero-text h1 { margin: 0 0 20px; line-height: 1.08; }
      .hero-text p { margin: 0 0 28px; opacity: 0.85; line-height: 1.7; font-size: 1.125rem; }
      .hero-media { min-width: 0; }
      .hero-media img { width: 100%; border-radius: 12px; }
      /* Hero abstract visual — clean gradient panel for exports without an image */
      .hero-abstract-visual { position: relative; min-height: 260px; border-radius: 16px; background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%); border: 1px solid rgba(255,255,255,0.12); overflow: hidden; display: flex; align-items: center; justify-content: center; }
      .hero-abstract-ring { width: 140px; height: 140px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.15); position: relative; }
      .hero-abstract-ring::before { content: ''; position: absolute; inset: 16px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.1); }
      .hero-abstract-ring::after { content: ''; position: absolute; inset: 36px; border-radius: 50%; background: linear-gradient(135deg, rgba(59,130,246,0.3), rgba(168,85,247,0.2)); }
      .hero-abstract-dots { position: absolute; bottom: 24px; right: 24px; display: flex; gap: 6px; }
      .hero-abstract-dots span { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.2); }
      .hero-abstract-dots span:first-child { background: rgba(59,130,246,0.5); }
      /* Hero placeholder wireframe — kept for backward compat but hidden in new exports */
      .hero-placeholder { min-height: 180px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); padding: 16px; display: flex; flex-direction: column; gap: 12px; }
      .hero-placeholder-bar { height: 12px; width: 96px; border-radius: 9999px; background: rgba(255,255,255,0.1); margin-bottom: 4px; }
      .hero-placeholder-block { border-radius: 4px; background: rgba(255,255,255,0.06); }
      @media (max-width: 768px) { .hero-split { grid-template-columns: 1fr; text-align: center; } .hero-abstract-visual { min-height: 180px; } }

      /* ── Navigation ───────────────────────────────────────────── */
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
        .nav-links { display: none; position: absolute; top: 100%; left: 0; right: 0; flex-direction: column; align-items: flex-start; background: #fff; border-top: 1px solid rgba(0,0,0,.08); box-shadow: 0 8px 24px rgba(0,0,0,.12); padding: 12px 16px; z-index: 200; border-radius: 0 0 12px 12px; }
        .nav-links.open { display: flex; }
        .nav-links a { padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,.06); width: 100%; }
        .nav-links a:last-child { border-bottom: none; }
      }
      nav div:not(.nav-links), form { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }

      /* ── Columns Layout ──────────────────────────────────────── */
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

      /* ── Row Layout ──────────────────────────────────────────── */
      .stackly-row-grid { display: grid; grid-template-columns: var(--grid-template-columns, 1fr 1fr); gap: 16px; width: 100%; }
      @media (max-width: 768px) {
        .stackly-row-grid { grid-template-columns: 1fr !important; }
      }

      /* ── Gallery Layout ──────────────────────────────────────── */
      .stackly-gallery-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; width: 100%; }
      @media (max-width: 768px) {
        .stackly-gallery-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      @media (max-width: 480px) {
        .stackly-gallery-grid { grid-template-columns: 1fr !important; }
      }
      .stackly-gallery figure { margin: 0; overflow: hidden; border: 1px solid #dbe3ef; border-radius: 12px; background: #f7f9fc; }
      .stackly-gallery figcaption { padding: 10px 12px; font-weight: 700; font-size: 14px; }
      .stackly-gallery img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }

      /* ── Features Layout ─────────────────────────────────────── */
      .stackly-features-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; width: 100%; }
      .stackly-features-grid[data-columns="2"] { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .stackly-features-grid[data-columns="3"] { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .stackly-features-grid[data-columns="4"] { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      @media (max-width: 768px) {
        .stackly-features-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .stackly-features-grid[data-columns="4"] { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      @media (max-width: 480px) {
        .stackly-features-grid { grid-template-columns: 1fr !important; }
      }
      .stackly-features article { border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 28px 24px; background: rgba(255,255,255,0.06); transition: transform .25s ease, box-shadow .25s ease, background-color .25s ease; margin: 0; }
      .stackly-features article:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(15,35,75,0.1); }
      /* Light-background features override */
      .stackly-features[style*="background-color:#f"] article,
      .stackly-features[style*="background-color: #f"] article,
      .stackly-features[style*="background-color:#e"] article,
      .stackly-features[style*="background-color:#fff"] article { border-color: #e2e8f0; background: #f8fafc; }
      .stackly-features[style*="background-color:#f"] article:hover,
      .stackly-features[style*="background-color: #f"] article:hover,
      .stackly-features[style*="background-color:#e"] article:hover,
      .stackly-features[style*="background-color:#fff"] article:hover { background: #ffffff; box-shadow: 0 8px 24px rgba(15,35,75,0.06); }
      .stackly-features .features-num { margin-bottom: 16px; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: currentColor; color: #fff; border-radius: 8px; font-weight: 700; font-size: 14px; }
      /* For dark-background sections, make the num badge stand out */
      .stackly-features[style*="color:#fff"] .features-num,
      .stackly-features[style*="color: #fff"] .features-num { background: rgba(255,255,255,0.15); color: #fff; }
      .stackly-features h3 { margin: 0 0 8px; font-size: 1rem; font-weight: 700; color: inherit; }
      .stackly-features p { margin: 0; font-size: 0.875rem; color: inherit; opacity: 0.75; line-height: 1.65; }

      /* ── Pricing Table ───────────────────────────────────────── */
      .pricing-grid { display: flex; gap: 20px; width: 100%; align-items: stretch; }
      @media (max-width: 768px) {
        .pricing-grid { flex-direction: column; }
      }
      .pricing-tier { position: relative; flex: 1; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px 24px; text-align: center; background: #ffffff; display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s; }
      .pricing-tier:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(15,35,75,0.08); }
      .pricing-tier--highlighted { border: 2px solid #0B1D40; box-shadow: 0 12px 40px rgba(11,29,64,0.12); transform: scale(1.03); z-index: 1; background: #f8faff; }
      .pricing-tier--highlighted:hover { transform: scale(1.03) translateY(-2px); }
      .pricing-badge { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #0B1D40, #3b82f6); color: #fff; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; padding: 5px 16px; border-radius: 999px; white-space: nowrap; box-shadow: 0 4px 12px rgba(11,29,64,0.25); }
      .pricing-tier-name { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #566583; margin: 0 0 8px; }
      .pricing-price { font-size: 2.2em; font-weight: 800; margin: 8px 0 20px; color: #0B1D40; }
      .pricing-price small { font-size: 0.35em; font-weight: 600; color: #94a3b8; margin-left: 4px; }
      .pricing-features { list-style: none; padding: 0; margin: 0 0 20px; text-align: left; flex: 1; }
      .pricing-features li { display: flex; align-items: center; gap: 10px; padding: 7px 0; color: #566583; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
      .pricing-features li:last-child { border-bottom: none; }
      .pricing-check { flex-shrink: 0; }
      .pricing-cta { width: 100%; margin-top: auto; padding: 14px 20px; border-radius: 10px; }

      /* ── Testimonials ────────────────────────────────────────── */
      .testimonial-grid { display: flex; gap: 20px; width: 100%; }
      @media (max-width: 768px) {
        .testimonial-grid { flex-direction: column; }
      }
      .testimonial-card { flex: 1; border: 1px solid #e6edf5; border-radius: 16px; padding: 28px; background: #ffffff; margin: 0; display: flex; flex-direction: column; transition: transform 0.25s ease, box-shadow 0.25s ease; }
      .testimonial-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(15,35,75,0.08); }
      .testimonial-stars { display: flex; gap: 2px; margin-bottom: 14px; }
      .testimonial-card blockquote { font-style: italic; margin: 0 0 16px; font-size: 0.9375rem; line-height: 1.7; color: #566583; flex: 1; }
      .testimonial-author { display: flex; align-items: center; gap: 12px; padding-top: 14px; border-top: 1px solid #f0f3f8; }
      .testimonial-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #0B1D40, #3b82f6); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; flex-shrink: 0; box-shadow: 0 2px 8px rgba(11,29,64,0.2); }
      .testimonial-name { font-weight: 700; margin: 0; font-size: 14px; color: #0B1D40; }
      .testimonial-role { color: #94a3b8; margin: 2px 0 0; font-size: 12px; }

      /* ── Accordion / FAQ ─────────────────────────────────────── */
      .accordion-list { display: flex; flex-direction: column; gap: 8px; max-width: 800px; margin: 0 auto; }
      .accordion-item { border: 1px solid #e6edf5; border-radius: 12px; overflow: hidden; background: #fff; transition: border-color 0.2s, box-shadow 0.2s; }
      .accordion-item--open, .accordion-item:has(details[open]) { border-color: rgba(11,29,64,0.15); background: #f8faff; box-shadow: 0 4px 16px rgba(11,29,64,0.05); }
      .accordion-summary { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; cursor: pointer; list-style: none; font-weight: 700; font-size: 15px; color: #0B1D40; transition: background 0.15s; }
      .accordion-summary:hover { background: rgba(248,250,252,0.6); }
      .accordion-summary::-webkit-details-marker { display: none; }
      .accordion-summary::marker { display: none; content: ''; }
      .accordion-title { flex: 1; }
      .accordion-chevron { flex-shrink: 0; color: #566583; transition: transform 0.3s ease; }
      details[open] .accordion-chevron { transform: rotate(180deg); }
      .accordion-content { padding: 0 20px 18px; font-size: 14px; line-height: 1.7; color: #566583; border-top: 1px solid #e6edf5; padding-top: 14px; }

      /* ── Footer ───────────────────────────────────────────────── */
      .footer-grid { display: flex; gap: 32px; width: 100%; }
      @media (max-width: 768px) {
        .footer-grid { flex-direction: column; gap: 24px; }
      }
      .footer-brand { flex: 1; }
      .footer-col { flex: 1; }
      .footer-col h4 { margin: 0 0 12px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.4); }
      .footer-col a { display: block; padding: 5px 0; color: rgba(255,255,255,.6); font-size: 13px; transition: color 0.2s; }
      .footer-col a:hover { color: rgba(255,255,255,0.9); }
      .footer-divider { border: 0; border-top: 1px solid rgba(255,255,255,.1); margin: 20px 0; width: 100%; }
      .footer-copyright { text-align: center; color: rgba(255,255,255,.4); font-size: 12px; margin: 0; }

${productCollectionCss}

      /* ── Responsive ────────────────────────────────────────────── */
      @media (max-width: 1024px) {
        main { width: min(100%, calc(100% - 32px)); }
        section, [class*="stackly-component-"] { padding-left: 32px; padding-right: 32px; }
      }
      @media (max-width: 768px) {
        main { width: min(100%, calc(100% - 24px)); padding: 20px 0; }
        h1 { font-size: clamp(1.75rem, 5vw, 2.5rem); }
        h2 { font-size: clamp(1.25rem, 4vw, 1.75rem); }
        p, li, input, textarea, select { font-size: 1rem; }
        button, [role="button"] { font-size: 0.9375rem; padding: 10px 16px; }
        section, [class*="stackly-component-"] { padding-left: 20px !important; padding-right: 20px !important; }
        /* Scale section radius on mobile for cleaner stacking */
        .section-bold { border-radius: 12px !important; }
      }
      @media (max-width: 480px) {
        main { width: min(100%, calc(100% - 20px)); padding: 16px 0; }
        h1 { font-size: clamp(1.5rem, 6vw, 2rem); }
        h2 { font-size: clamp(1.125rem, 5vw, 1.5rem); }
        p, li, input, textarea, select { font-size: 0.9375rem; line-height: 1.6; }
        button, [role="button"] { font-size: 0.875rem; }
        section, [class*="stackly-component-"] { padding-left: 16px !important; padding-right: 16px !important; }
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

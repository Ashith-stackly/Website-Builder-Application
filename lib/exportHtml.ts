import { blockRegistry } from "@/lib/blockRegistry";
import type { BuilderComponent, ComponentStyles } from "@/types/builder";
import { escapeHtml } from "@/lib/htmlUtils";

const styleToString = (styles: ComponentStyles) =>
  Object.entries(styles)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}:${value}`)
    .join(";");

const renderComponent = (component: BuilderComponent): string => {
  const style = styleToString(component.styles);
  const styleAttr = style ? ` style="${escapeHtml(style)}"` : "";
  const content = escapeHtml(component.content);
  const children = component.children.map(renderComponent).join("\n");

  // ── Registry path ────────────────────────────────────────────────────────────
  // Migrated blocks delegate export to spec.exportHtml(data, styleAttr).
  const spec = blockRegistry[component.type];
  if (spec) {
    const data = spec.read(component);
    return spec.exportHtml(data, styleAttr);
  }

  switch (component.type) {
    case "heading":
      return `<h1${styleAttr}>${content}</h1>`;
    case "text":
      return `<p${styleAttr}>${content}</p>`;
    case "button":
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
        .map(([src, caption]) => `<figure><img src="${escapeHtml(src.trim())}" alt="${escapeHtml(caption || "Website image")}" /><figcaption>${escapeHtml(caption || "")}</figcaption></figure>`)
        .join("");

      return `<section${styleAttr}>${gallery}</section>`;
    }
    case "container":
      return `<section${styleAttr}>${children || content}</section>`;
    default:
      return "";
  }
};

export const generateHtml = (components: BuilderComponent[]) => {
  const body = components
    .slice()
    .sort((a, b) => a.order - b.order)
    .map(renderComponent)
    .join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Exported Stackly Page</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; font-family: Arial, Helvetica, sans-serif; background: #ffffff; color: #0B1D40; }
      main { width: min(960px, calc(100% - 32px)); margin: 0 auto; padding: 32px 0; }
      main > * + * { margin-top: 16px; }
      .hero-split { display: flex; align-items: center; gap: 40px; }
      .hero-text { flex: 1; }
      .hero-media { flex: 1; }
      .hero-media img { width: 100%; border-radius: 12px; }
      @media (max-width: 640px) { .hero-split { flex-direction: column; } }
      nav { display: flex; align-items: center; justify-content: space-between; gap: 16px; position: relative; }
      .nav-links { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
      .nav-cta { white-space: nowrap; }
      .nav-hamburger { display: none; flex-direction: column; justify-content: center; gap: 5px; background: transparent !important; border: none; cursor: pointer; padding: 6px; color: #0B1D40; }
      .nav-hamburger span { display: block; width: 22px; height: 2px; background: currentColor; border-radius: 2px; transition: transform .2s, opacity .2s; }
      .nav-hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
      .nav-hamburger.open span:nth-child(2) { opacity: 0; }
      .nav-hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
      @media (max-width: 640px) {
        .nav-hamburger { display: flex; }
        .nav-cta { display: none; }
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
    </style>
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
    <main>
${body}
    </main>
  </body>
</html>`;
};

export const downloadHtml = (components: BuilderComponent[], filename = "stackly-page.html") => {
  const html = generateHtml(components);
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

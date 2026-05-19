import type { BuilderComponent, ComponentStyles } from "@/types/builder";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

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

  switch (component.type) {
    case "navigation": {
      const [brand = "Stackly Studio", links = "Home,About,Services,Contact", action = "Get Started"] = component.content.split("|");
      const navLinks = links
        .split(",")
        .map((link) => `<a href="#">${escapeHtml(link.trim())}</a>`)
        .join("");

      return `<nav${styleAttr}><strong>${escapeHtml(brand)}</strong><div>${navLinks}</div><button>${escapeHtml(action)}</button></nav>`;
    }
    case "hero": {
      const [title = "Create a website in minutes", description = "Design and export a clean page.", action = "Start Building"] = component.content.split("|");

      return `<section${styleAttr}><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p><button>${escapeHtml(action)}</button></section>`;
    }
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
    case "features": {
      const features = component.content
        .split("\n")
        .map((item) => item.split("|"))
        .filter(([title]) => title?.trim())
        .map(([title, description]) => `<article><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description || "")}</p></article>`)
        .join("");

      return `<section${styleAttr}>${features}</section>`;
    }
    case "gallery": {
      const gallery = component.content
        .split("\n")
        .map((item) => item.split("|"))
        .filter(([src]) => src?.trim())
        .map(([src, caption]) => `<figure><img src="${escapeHtml(src.trim())}" alt="${escapeHtml(caption || "Website image")}" /><figcaption>${escapeHtml(caption || "")}</figcaption></figure>`)
        .join("");

      return `<section${styleAttr}>${gallery}</section>`;
    }
    case "contact": {
      const [title = "Ready to launch?", description = "Leave your email and we will help you go live.", placeholder = "Email address", action = "Contact Us"] = component.content.split("|");

      return `<section${styleAttr}><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p><form><input placeholder="${escapeHtml(placeholder)}" /><button>${escapeHtml(action)}</button></form></section>`;
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
      nav { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
      nav div, form { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
      a { color: inherit; text-decoration: none; font-weight: 600; }
      button, input { font: inherit; }
      button { border: 0; cursor: pointer; border-radius: 6px; background: #0B1D40; color: #ffffff; padding: 12px 18px; font-weight: 700; }
      input { border: 1px solid #dbe3ef; border-radius: 6px; padding: 12px 14px; }
      img { display: block; max-width: 100%; object-fit: cover; }
      article { border: 1px solid #dbe3ef; border-radius: 8px; padding: 18px; margin: 12px 0; }
      figure { margin: 12px 0; overflow: hidden; border: 1px solid #dbe3ef; border-radius: 8px; }
      figcaption { padding: 10px 12px; font-weight: 700; }
    </style>
  </head>
  <body>
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

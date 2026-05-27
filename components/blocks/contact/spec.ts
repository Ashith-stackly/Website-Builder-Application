/**
 * Contact — block spec.
 *
 * Single source of truth for the `contact` block. Mirrors the
 * `navigation` and `hero` patterns.
 *
 * Legacy fallback: `readContact` handles the old
 *   "title|description|inputPlaceholder|ctaLabel"
 * pipe format transparently so existing saved documents keep rendering.
 *
 * Extension: the `form` sub-object reserves all future validation,
 * multi-field, and submission concerns without touching the core fields.
 */

import type { BlockSpec } from "@/lib/blockRegistry";
import type { BuilderComponent, ContactProps } from "@/types/builder";
import ContactComponent from "@/components/draggable/ContactComponent";
import { ContactPanel } from "./ContactPanel";
import { escapeHtml } from "@/lib/htmlUtils";
import { Mail } from "lucide-react";

export const CONTACT_SCHEMA_VERSION = 1;

export const contactDefaults: ContactProps = {
  schemaVersion: CONTACT_SCHEMA_VERSION,
  title: "Ready to launch?",
  description: "Leave your email and we will help you go live.",
  inputPlaceholder: "Email address",
  cta: { label: "Contact Us" },
  form: {
    method: "POST",
    successMessage: "Thanks! We'll be in touch soon.",
  },
};

/* ─── narrow validators ─────────────────────────────────────────────── */

const isString = (v: unknown): v is string => typeof v === "string";
const asString = (v: unknown, fb: string): string => (isString(v) ? v : fb);

function readCta(v: unknown): ContactProps["cta"] {
  if (v && typeof v === "object") {
    const obj = v as Record<string, unknown>;
    return {
      label: asString(obj.label, contactDefaults.cta.label),
      href: isString(obj.href) ? obj.href : undefined,
    };
  }
  if (isString(v)) return { label: v };
  return { ...contactDefaults.cta };
}

function readForm(v: unknown): NonNullable<ContactProps["form"]> {
  const base = { ...contactDefaults.form } as NonNullable<ContactProps["form"]>;
  if (!v || typeof v !== "object") return base;
  const obj = v as Record<string, unknown>;
  return {
    ...base,
    action: isString(obj.action) ? obj.action : undefined,
    method:
      isString(obj.method) && (["POST", "GET"] as string[]).includes(obj.method)
        ? (obj.method as "POST" | "GET")
        : base.method,
    successMessage: isString(obj.successMessage) ? obj.successMessage : base.successMessage,
  };
}

/* ─── reader ────────────────────────────────────────────────────────── */

/**
 * Returns fully-typed ContactProps from a `BuilderComponent`.
 *
 * Resolution order:
 *   1. `component.props` (typed, current format)
 *   2. legacy pipe-delimited `content` ("title|description|placeholder|cta")
 *   3. spec defaults
 *
 * The reader is **total**: always returns a valid `ContactProps`,
 * never throws, never returns `undefined`.
 */
export function readContact(
  component: BuilderComponent,
): Required<Pick<ContactProps, "schemaVersion" | "title" | "description" | "inputPlaceholder" | "cta">> & {
  form: NonNullable<ContactProps["form"]>;
} {
  const p = component.props;

  if (p && typeof p === "object") {
    return {
      schemaVersion: typeof p.schemaVersion === "number" ? p.schemaVersion : CONTACT_SCHEMA_VERSION,
      title: asString(p.title, contactDefaults.title),
      description: asString(p.description, contactDefaults.description),
      inputPlaceholder: asString(p.inputPlaceholder, contactDefaults.inputPlaceholder),
      cta: readCta(p.cta),
      form: readForm(p.form),
    };
  }

  // Legacy fallback: "title|description|inputPlaceholder|ctaLabel"
  const [t, d, ip, c] = (component.content || "").split("|");
  return {
    schemaVersion: CONTACT_SCHEMA_VERSION,
    title: t?.trim() || contactDefaults.title,
    description: d?.trim() || contactDefaults.description,
    inputPlaceholder: ip?.trim() || contactDefaults.inputPlaceholder,
    cta: { label: c?.trim() || contactDefaults.cta.label },
    form: { ...contactDefaults.form } as NonNullable<ContactProps["form"]>,
  };
}

/* ─── BlockSpec ──────────────────────────────────────────────────────── */

export const contactSpec: BlockSpec<ContactProps> = {
  type: "contact",
  label: "Contact",
  group: "form",
  icon: Mail,
  defaults: contactDefaults,
  read: readContact,
  Renderer: ContactComponent,
  Panel: ContactPanel,
  exportHtml: (data, styleAttr) => {
    const ctaHref = data.cta.href ?? "";
    return `<section${styleAttr}><h2>${escapeHtml(data.title)}</h2><p>${escapeHtml(data.description)}</p><form action="${escapeHtml(ctaHref)}"><input type="email" placeholder="${escapeHtml(data.inputPlaceholder)}" /><button type="submit">${escapeHtml(data.cta.label)}</button></form></section>`;
  },
  ai: {
    description: "An email capture section with a title, subtitle, email input, and a submit button.",
    exampleOutput: contactDefaults,
  },
};

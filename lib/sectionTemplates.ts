"use client";

/**
 * Section Templates Library
 *
 * Pre-designed, ready-to-use section configurations that users
 * can insert into their website with a single click.
 * Inspired by Zoho Sites' 150+ pre-built sections.
 */

import type { BuilderComponent, ComponentType } from "@/types/builder";
import { v4 as uuidv4 } from "uuid";

export interface SectionTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  /** Creates fresh components with new UUIDs each time. */
  create: () => BuilderComponent[];
}

function mkComp(
  type: ComponentType,
  order: number,
  overrides: Partial<BuilderComponent> = {},
): BuilderComponent {
  return {
    id: uuidv4(),
    type,
    content: "",
    styles: {},
    children: [],
    order,
    ...overrides,
  };
}

export const TEMPLATE_CATEGORIES = [
  "All",
  "Hero",
  "Features",
  "Pricing",
  "Testimonials",
  "FAQ",
  "CTA",
  "Footer",
  "Contact",
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export const sectionTemplates: SectionTemplate[] = [
  /* ─── Hero Templates ───────────────────────────────────────────── */
  {
    id: "hero-centered",
    name: "Centered Hero",
    category: "Hero",
    description: "A bold centered hero with headline, subtext, and CTA button.",
    create: () => [
      mkComp("hero", 0, {
        props: {
          title: "Build Something Amazing Today",
          description: "The fastest way to create stunning websites. No coding required. Just drag, drop, and publish.",
          cta: { label: "Get Started Free" },
          layout: "centered",
          align: "center",
        },
        styles: {
          color: "#0B1D40",
          backgroundColor: "#f0f4ff",
          padding: "80px 40px",
          borderRadius: "12px",
          width: "100%",
          textAlign: "center",
        },
      }),
    ],
  },
  {
    id: "hero-gradient",
    name: "Gradient Hero",
    category: "Hero",
    description: "A modern hero with a gradient background and bold typography.",
    create: () => [
      mkComp("hero", 0, {
        props: {
          title: "Your Vision, Our Platform",
          description: "From idea to live website in minutes. Professional templates, powerful customization, zero complexity.",
          cta: { label: "Start Building" },
          layout: "centered",
          align: "center",
        },
        styles: {
          color: "#ffffff",
          backgroundColor: "#0B1D40",
          padding: "100px 40px",
          borderRadius: "12px",
          width: "100%",
          textAlign: "center",
        },
      }),
    ],
  },

  /* ─── Features Templates ────────────────────────────────────────── */
  {
    id: "features-grid",
    name: "Feature Grid",
    category: "Features",
    description: "3-column feature cards with icons, titles, and descriptions.",
    create: () => [
      mkComp("features", 0, {
        props: {
          heading: "Why Choose Us",
          items: [
            { title: "Lightning Fast", description: "Blazing speed with optimized performance out of the box." },
            { title: "Fully Responsive", description: "Looks perfect on every device — desktop, tablet, and mobile." },
            { title: "SEO Optimized", description: "Built-in SEO tools to help you rank higher in search results." },
            { title: "Custom Domains", description: "Connect your own domain or use our free subdomain." },
            { title: "24/7 Support", description: "Our team is always here to help you succeed." },
            { title: "Analytics", description: "Track visitors, conversions, and engagement in real-time." },
          ],
        },
        styles: {
          color: "#0B1D40",
          backgroundColor: "#ffffff",
          padding: "60px 32px",
          borderRadius: "12px",
          width: "100%",
        },
      }),
    ],
  },

  /* ─── Pricing Templates ──────────────────────────────────────── */
  {
    id: "pricing-three-tier",
    name: "Three-Tier Pricing",
    category: "Pricing",
    description: "Classic 3-column pricing table with highlighted popular plan.",
    create: () => [
      mkComp("pricing-table", 0, {
        props: {
          heading: "Simple, Transparent Pricing",
          tiers: [
            {
              name: "Hobby",
              price: "Free",
              period: "",
              features: ["1 Website", "1GB Storage", "Community Support", "stackly.studio Subdomain"],
              cta: "Start Free",
              highlighted: false,
            },
            {
              name: "Pro",
              price: "$19",
              period: "/month",
              features: ["10 Websites", "100GB Storage", "Priority Support", "Custom Domains", "SSL Certificate", "Analytics Dashboard"],
              cta: "Go Pro",
              highlighted: true,
            },
            {
              name: "Business",
              price: "$49",
              period: "/month",
              features: ["Unlimited Websites", "1TB Storage", "Dedicated Support", "Custom Domains", "SSL Certificate", "Full Analytics", "Team Seats", "API Access"],
              cta: "Contact Sales",
              highlighted: false,
            },
          ],
        },
        styles: {
          color: "#0B1D40",
          backgroundColor: "#f8faff",
          padding: "60px 32px",
          borderRadius: "12px",
          width: "100%",
        },
      }),
    ],
  },

  /* ─── Testimonials Templates ────────────────────────────────── */
  {
    id: "testimonials-cards",
    name: "Testimonial Cards",
    category: "Testimonials",
    description: "Customer testimonials in a clean card grid layout.",
    create: () => [
      mkComp("testimonial", 0, {
        props: {
          heading: "Loved by Thousands",
          items: [
            { quote: "Stackly made building our startup website effortless. We launched in under 2 hours!", name: "Alex Rivera", role: "CTO, LaunchPad", rating: 5 },
            { quote: "The design quality is on par with custom development. Our clients can't tell the difference.", name: "Priya Sharma", role: "Agency Owner", rating: 5 },
            { quote: "Best investment for our small business. The ROI has been incredible.", name: "James Wilson", role: "Founder, EcoShop", rating: 4 },
          ],
          layout: "cards",
        },
        styles: {
          color: "#0B1D40",
          backgroundColor: "#ffffff",
          padding: "60px 32px",
          borderRadius: "12px",
          width: "100%",
        },
      }),
    ],
  },

  /* ─── FAQ Templates ─────────────────────────────────────────── */
  {
    id: "faq-accordion",
    name: "FAQ Accordion",
    category: "FAQ",
    description: "Expandable FAQ section with commonly asked questions.",
    create: () => [
      mkComp("heading", 0, {
        content: "Frequently Asked Questions",
        styles: {
          color: "#0B1D40",
          fontSize: "28px",
          padding: "8px 0",
          margin: "0 0 8px",
          textAlign: "center",
          width: "100%",
        },
      }),
      mkComp("accordion", 1, {
        props: {
          items: [
            { title: "How do I get started?", content: "Simply create a free account and start building. No credit card required. Choose a template or start from scratch." },
            { title: "Can I use my own domain?", content: "Yes! Connect your custom domain on any paid plan. We handle SSL certificates automatically." },
            { title: "Is there a free plan?", content: "Absolutely. Our free plan includes the full editor, basic templates, and a stackly.studio subdomain." },
            { title: "How do I publish my site?", content: "Click the 'Publish' button in the editor. Your site goes live instantly. You can update it anytime." },
            { title: "Do you offer refunds?", content: "Yes, we offer a 30-day money-back guarantee on all paid plans. No questions asked." },
          ],
          allowMultiple: false,
        },
        styles: {
          color: "#0B1D40",
          backgroundColor: "#ffffff",
          padding: "24px",
          margin: "0 0 16px",
          borderRadius: "12px",
          width: "100%",
        },
      }),
    ],
  },

  /* ─── CTA Templates ─────────────────────────────────────────── */
  {
    id: "cta-newsletter",
    name: "Newsletter CTA",
    category: "CTA",
    description: "Email signup section with compelling copy and input field.",
    create: () => [
      mkComp("contact", 0, {
        props: {
          title: "Stay in the Loop",
          description: "Get the latest updates, tips, and exclusive offers delivered straight to your inbox.",
          inputPlaceholder: "Enter your email",
          cta: { label: "Subscribe" },
        },
        styles: {
          color: "#ffffff",
          backgroundColor: "#0B1D40",
          padding: "48px 32px",
          borderRadius: "12px",
          width: "100%",
          textAlign: "center",
        },
      }),
    ],
  },
  {
    id: "cta-countdown",
    name: "Countdown CTA",
    category: "CTA",
    description: "Urgency-driven section with countdown timer and CTA.",
    create: () => [
      mkComp("countdown", 0, {
        props: {
          targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
          label: "🚀 Early Bird Offer Ends In",
          finishedText: "Offer has ended!",
        },
        styles: {
          color: "#0B1D40",
          backgroundColor: "#fff7e6",
          padding: "48px 24px",
          borderRadius: "12px",
          width: "100%",
        },
      }),
    ],
  },

  /* ─── Footer Templates ──────────────────────────────────────── */
  {
    id: "footer-full",
    name: "Full Footer",
    category: "Footer",
    description: "Complete footer with brand, link columns, socials, and copyright.",
    create: () => [
      mkComp("footer", 0, {
        props: {
          brand: "Stackly",
          tagline: "Build beautiful websites in minutes.",
          columns: [
            { title: "Product", links: [{ label: "Features", href: "#" }, { label: "Pricing", href: "#" }, { label: "Templates", href: "#" }, { label: "Changelog", href: "#" }] },
            { title: "Company", links: [{ label: "About", href: "#" }, { label: "Blog", href: "#" }, { label: "Careers", href: "#" }, { label: "Press", href: "#" }] },
            { title: "Legal", links: [{ label: "Privacy", href: "#" }, { label: "Terms", href: "#" }, { label: "Cookies", href: "#" }] },
          ],
          copyright: `© ${new Date().getFullYear()} Stackly. All rights reserved.`,
          socials: [
            { platform: "twitter", url: "#" },
            { platform: "linkedin", url: "#" },
            { platform: "github", url: "#" },
            { platform: "instagram", url: "#" },
          ],
        },
        styles: {
          color: "#ffffff",
          backgroundColor: "#0B1D40",
          padding: "0",
          borderRadius: "12px",
          width: "100%",
        },
      }),
    ],
  },

  /* ─── Contact Templates ─────────────────────────────────────── */
  {
    id: "contact-full-form",
    name: "Contact Form",
    category: "Contact",
    description: "Full contact form with name, email, phone, subject, and message.",
    create: () => [
      mkComp("form", 0, {
        props: {
          heading: "Contact Us",
          description: "Have a question? We'd love to hear from you.",
          fields: [
            { name: "name", type: "text", label: "Full Name", placeholder: "John Doe", required: true },
            { name: "email", type: "email", label: "Email", placeholder: "john@example.com", required: true },
            { name: "phone", type: "tel", label: "Phone", placeholder: "+1 (555) 000-0000" },
            { name: "subject", type: "select", label: "Subject", options: ["General", "Support", "Sales", "Partnership"] },
            { name: "message", type: "textarea", label: "Message", placeholder: "Tell us how we can help...", required: true },
          ],
          submitLabel: "Send Message",
          successMessage: "Thanks! We'll get back to you soon.",
        },
        styles: {
          color: "#0B1D40",
          backgroundColor: "#ffffff",
          padding: "48px 32px",
          borderRadius: "12px",
          width: "100%",
        },
      }),
    ],
  },
  {
    id: "contact-map",
    name: "Contact with Map",
    category: "Contact",
    description: "Contact section with a map and social links.",
    create: () => [
      mkComp("heading", 0, {
        content: "Find Us",
        styles: { color: "#0B1D40", fontSize: "28px", padding: "8px 0", margin: "0 0 4px", textAlign: "center", width: "100%" },
      }),
      mkComp("text", 1, {
        content: "Visit our office or reach out on social media.",
        styles: { color: "#566583", fontSize: "16px", padding: "4px", margin: "0 0 16px", textAlign: "center", width: "100%" },
      }),
      mkComp("map", 2, {
        props: { address: "San Francisco, CA, USA", zoom: 13, height: "280px" },
        styles: { margin: "0 0 16px", borderRadius: "12px", width: "100%", padding: "0" },
      }),
      mkComp("social-links", 3, {
        props: {
          links: [
            { platform: "twitter", url: "#" },
            { platform: "linkedin", url: "#" },
            { platform: "instagram", url: "#" },
            { platform: "facebook", url: "#" },
          ],
          size: "md",
          style: "filled",
        },
        styles: { padding: "12px", margin: "0", width: "100%" },
      }),
    ],
  },
];

/** Get templates filtered by category. */
export function getTemplatesByCategory(category: TemplateCategory): SectionTemplate[] {
  if (category === "All") return sectionTemplates;
  return sectionTemplates.filter((t) => t.category === category);
}

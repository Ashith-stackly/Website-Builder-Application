/** Printable / downloadable Stackly invoice (A4-style layout). */

import { assetPath } from "./paths";

export type PlanningInvoiceLine = {
  si: number;
  website: string;
  price: string;
  plan: string;
  total: string;
};

export type PaymentInfoRow = {
  label: string;
  value: string;
};

export type PlanningInvoicePayload = {
  invoiceId: string;
  invoiceDateDisplay: string;
  generatedAtDisplay: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  status: "Paid" | "Free";
  lines: PlanningInvoiceLine[];
  subtotal: string;
  taxPercent: number;
  total: string;
  /** Rows under “Payment Info :” — actual card / PayPal / UPI / bank details. */
  paymentInfoRows: PaymentInfoRow[];
  /** Data URL or absolute URL for Stackly logo image; null uses vector fallback. */
  logoSrc: string | null;
};

const BRAND = "#002147";
/** Cornflower-style blue — “INVOICE” in the gap of the header bar */
const INVOICE_TITLE = "#6495ed";
const MUTED = "#64748b";
const ROW_ALT = "#f2f2f2";
const SIGN_BLUE = "#6aacff";

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function parseUsdAmount(amount: string): number {
  const n = Number.parseFloat(amount.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export type BillingHistoryEntryLike = {
  date: string;
  invoiceId: string;
  amount: string;
  status: "Paid" | "Free";
  planName?: string;
  planTier?: string;
  websiteLabel?: string;
  paymentMethodLabel?: string;
  paymentDetail?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerAddress?: string;
  generatedAt?: string;
};

export type PlanningInvoiceContactDefaults = {
  displayName: string;
  email: string;
  phone: string;
  address: string;
};

/** Builds label/value lines for the Payment Info block from saved checkout data. */
export function buildPaymentInfoRows(entry: BillingHistoryEntryLike): PaymentInfoRow[] {
  if (entry.status === "Free" || entry.amount === "₹0" || entry.amount === "$0") {
    return [{ label: "Billing", value: "Complimentary plan — no payment collected." }];
  }

  const method = (entry.paymentMethodLabel ?? "").trim();
  const detail = (entry.paymentDetail ?? "").trim();

  const rows: PaymentInfoRow[] = [];
  rows.push({
    label: "Payment Method",
    value: method || "Card – Visa / MasterCard",
  });

  if (detail) {
    rows.push({
      label: "Transaction Details",
      value: detail,
    });
  }

  return rows;
}

export function billingHistoryEntryToInvoicePayload(
  entry: BillingHistoryEntryLike,
  defaults: PlanningInvoiceContactDefaults,
  logoSrc: string | null = null,
): PlanningInvoicePayload {
  const amountNum = parseUsdAmount(entry.amount);
  const website = entry.websiteLabel ?? "Stackly workspace subscription";
  const planCol = entry.planTier ?? entry.planName ?? (entry.status === "Free" ? "Free" : "Pro");
  const currencyLine = entry.amount && (entry.amount.includes("₹") || entry.amount.includes("$"))
    ? entry.amount
    : formatUsd(amountNum);
  const lines: PlanningInvoiceLine[] = [
    { si: 1, website, price: currencyLine, plan: planCol, total: currencyLine },
  ];

  let generatedAtDisplay: string;
  if (entry.generatedAt) {
    const d = new Date(entry.generatedAt);
    generatedAtDisplay = Number.isNaN(d.getTime())
      ? new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
      : d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  } else {
    generatedAtDisplay = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  }

  const dm = /^(\w+\s+\d+)\s+(\d{4})$/.exec(entry.date.trim());
  const invoiceDateDisplay = dm ? `${dm[1]}, ${dm[2]}` : entry.date;

  return {
    invoiceId: entry.invoiceId,
    invoiceDateDisplay,
    generatedAtDisplay,
    customerName: entry.buyerName || defaults.displayName || "User",
    customerEmail: entry.buyerEmail || defaults.email || "",
    customerPhone: entry.buyerPhone || defaults.phone || "",
    customerAddress: entry.buyerAddress || defaults.address || "",
    status: entry.status,
    lines,
    subtotal: currencyLine,
    taxPercent: 0,
    total: currencyLine,
    paymentInfoRows: buildPaymentInfoRows(entry),
    logoSrc,
  };
}

function renderLogoBlock(logoSrc: string | null): string {
  if (logoSrc) {
    return `<img class="logo-img" src="${escapeHtml(logoSrc)}" alt="Stackly" width="132" height="36" />`;
  }
  return `<div class="logo-fallback" aria-hidden="true">
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="8" fill="${BRAND}"/>
      <text x="20" y="27" text-anchor="middle" fill="#ffffff" font-family="Arial Black, Arial, sans-serif" font-size="19" font-weight="700">S</text>
    </svg>
    <span class="brand-name">STACKLY</span>
  </div>`;
}

function renderInvoiceBarHtml(): string {
  return `<div class="invoice-ribbon-bar" role="img" aria-label="INVOICE">
    <div class="ribbon-bar-left"></div>
    <div class="ribbon-text">INVOICE</div>
    <div class="ribbon-bar-right"></div>
  </div>`;
}

function buildPlanningInvoiceStyles(): string {
  return `
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    html, body.invoice-doc { margin: 0; padding: 0; background: #ffffff; width: 100%; color: #06224C; }
    body.invoice-doc {
      font-family: Inter, Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      font-size: 12.5px;
      line-height: 1.5;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 100%;
    }
    .invoice-shell {
      width: 800px;
      max-width: 100%;
      margin: 0 auto;
      display: flex;
      justify-content: center;
      box-sizing: border-box;
    }
    .invoice-page {
      width: 740px;
      min-height: 960px;
      max-width: 100%;
      margin: 0;
      padding: 48px 48px 40px;
      background: #ffffff;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
    }
    .doc-content-body {
      flex: 1 0 auto;
    }
    
    /* Header */
    .doc-head { margin-bottom: 24px; }
    .head-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand-box { flex: 1; }
    .logo-img { height: 38px; width: auto; max-width: 180px; object-fit: contain; display: block; }
    .logo-fallback { display: flex; align-items: center; gap: 10px; }
    .logo-fallback .brand-name { font-size: 22px; font-weight: 900; letter-spacing: 0.06em; color: ${BRAND}; }
    .tagline { font-size: 11px; color: #475569; margin: 6px 0 0; font-weight: 500; }
    
    .header-invoice-box {
      text-align: right;
    }
    .inv-main-title {
      font-size: 32px;
      font-weight: 900;
      letter-spacing: 0.1em;
      color: ${BRAND};
      margin: 0;
      line-height: 1;
    }
    
    .divider-line {
      height: 3px;
      background: linear-gradient(90deg, ${BRAND} 0%, #3b82f6 50%, ${BRAND} 100%);
      border-radius: 2px;
      margin-top: 20px;
    }
    
    /* Meta Grid (2 columns) */
    .meta-section {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      margin: 22px 0 26px;
    }
    .meta-card {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;
    }
    .meta-card-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #1e3a8a;
      margin: 0 0 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid #cbd5e1;
    }
    .customer-name { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
    .meta-line { font-size: 12px; color: #334155; margin-bottom: 4px; line-height: 1.45; }
    .meta-label { font-weight: 600; color: #64748b; margin-right: 4px; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 700; color: #0f172a; }
    .status-text { font-weight: 700; color: #16a34a; }
    
    /* Table */
    .inv-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 24px;
    }
    .inv-table thead th {
      background: ${BRAND};
      color: #ffffff;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 12px 14px;
      border: none;
    }
    .inv-table tbody td {
      padding: 12px 14px;
      border-top: 1px solid #e2e8f0;
      font-size: 12.5px;
      color: #1e293b;
    }
    .inv-table tbody tr:nth-child(even) { background: #f8fafc; }
    .inv-table td.num { text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; }
    
    /* Lower summary */
    .lower-section {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 24px;
      align-items: stretch;
    }
    .lower-left { flex: 1; display: flex; flex-direction: column; }
    .payment-info-box {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .payment-info-title { font-size: 12px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; margin: 0 0 10px; letter-spacing: 0.06em; }
    .pay-row { font-size: 12px; color: #334155; margin: 0 0 6px; line-height: 1.45; word-break: break-word; }
    .gen-timestamp { font-size: 11px; color: #64748b; margin-top: 10px; }
    
    .lower-right { width: 280px; display: flex; flex-direction: column; }
    .summary-box {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .sum-details { flex: 1; }
    .sum-row { display: flex; justify-content: space-between; font-size: 13px; color: #334155; margin-bottom: 8px; }
    .sum-lbl { font-weight: 600; color: #64748b; }
    .sum-val { font-weight: 700; color: #0f172a; }
    .total-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: ${BRAND};
      color: #ffffff;
      padding: 12px 18px;
      border-radius: 8px;
      margin-top: auto;
    }
    .tot-lbl { font-size: 13px; font-weight: 700; line-height: 1; }
    .tot-val { font-size: 19px; font-weight: 900; line-height: 1; }

    .thank-you-banner {
      margin: 8px 0 20px;
    }
    .thank-you-title { font-size: 16px; font-weight: 800; color: ${BRAND}; margin: 0; }
    
    /* Footer */
    .doc-footer {
      border-top: 1.5px solid #cbd5e1;
      padding-top: 20px;
      margin-top: auto;
    }
    .footer-grid { display: flex; justify-content: space-between; align-items: flex-end; }
    .terms-h { font-size: 12px; font-weight: 800; color: ${BRAND}; margin: 0 0 4px; }
    .terms-p { font-size: 11px; color: #64748b; margin: 0; max-width: 420px; }
    .footer-sign {
      display: flex;
      justify-content: flex-end;
    }
    .sign-box {
      width: 150px;
      text-align: center;
    }
    .sign-line {
      width: 100%;
      border-bottom: 1px dashed #94a3b8;
      margin-bottom: 6px;
    }
    .sign-text {
      font-size: 11px;
      font-weight: 700;
      color: #334155;
      white-space: nowrap;
      letter-spacing: 0.02em;
    }
    
    @media print {
      body.invoice-doc { display: block; }
      .invoice-shell { width: auto; margin: 0 auto; }
      .invoice-page { padding: 10mm; width: auto; margin: 0 auto; }
    }
  `;
}

export function buildPlanningInvoiceHtmlDocument(p: PlanningInvoicePayload): string {
  const rowsHtml = p.lines
    .map(
      (row, i) => `
      <tr class="${i % 2 === 1 ? "alt" : ""}">
        <td style="text-align: center;">${row.si}</td>
        <td>${escapeHtml(row.website)}</td>
        <td>${escapeHtml(row.plan)}</td>
        <td class="num">${escapeHtml(row.price)}</td>
        <td class="num">${escapeHtml(row.total)}</td>
      </tr>`,
    )
    .join("");

  const paymentInfoHtml = p.paymentInfoRows
    .map(
      (r) =>
        `<p class="pay-row"><span class="pay-label" style="font-weight:600;color:#64748b;">${escapeHtml(r.label)}:</span> <span class="pay-val" style="font-weight:700;color:#0f172a;">${escapeHtml(r.value)}</span></p>`,
    )
    .join("");

  const taxLine = `${p.taxPercent.toFixed(2)}%`;
  const logoBlock = renderLogoBlock(p.logoSrc);
  const styles = buildPlanningInvoiceStyles();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(p.invoiceId)} — Stackly Invoice</title>
  <style>${styles}</style>
</head>
<body class="invoice-doc">
  <div class="invoice-shell">
  <div class="invoice-page">
    <style data-invoice-css="1">${styles}</style>
    <div class="doc-content-body">
      <header class="doc-head">
        <div class="head-row">
          <div class="brand-box">
            ${logoBlock}
            <p class="tagline">Empowering businesses with cutting-edge solutions.</p>
          </div>
          <div class="header-invoice-box">
            <h1 class="inv-main-title">INVOICE</h1>
          </div>
        </div>
        <div class="divider-line"></div>
      </header>

      <div class="meta-section">
        <div class="meta-card customer-card">
          <h3 class="meta-card-title">Billed To</h3>
          <div class="customer-name">${escapeHtml(p.customerName)}</div>
          ${p.customerEmail ? `<div class="meta-line"><span class="meta-label">Email:</span> ${escapeHtml(p.customerEmail)}</div>` : ""}
          ${p.customerPhone ? `<div class="meta-line"><span class="meta-label">Contact:</span> ${escapeHtml(p.customerPhone)}</div>` : ""}
          ${p.customerAddress ? `<div class="meta-line"><span class="meta-label">Address:</span> ${escapeHtml(p.customerAddress)}</div>` : ""}
        </div>

        <div class="meta-card invoice-details-card">
          <h3 class="meta-card-title">Invoice Details</h3>
          <div class="meta-line"><span class="meta-label">Invoice ID:</span> <strong class="font-mono">${escapeHtml(p.invoiceId)}</strong></div>
          <div class="meta-line"><span class="meta-label">Invoice Date:</span> ${escapeHtml(p.invoiceDateDisplay)}</div>
          <div class="meta-line"><span class="meta-label">Payment Status:</span> <span class="status-text">${p.status === "Paid" ? "Paid in Full" : "Complimentary"}</span></div>
        </div>
      </div>

      <table class="inv-table" role="table">
        <thead>
          <tr>
            <th style="width: 50px; text-align: center;">S.I.</th>
            <th>Item Description</th>
            <th>Plan</th>
            <th style="text-align: right;">Price</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="lower-section">
        <div class="lower-left">
          <div class="payment-info-box">
            <div>
              <h4 class="payment-info-title">Payment Details</h4>
              ${paymentInfoHtml}
            </div>
            <p class="gen-timestamp">Generated: ${escapeHtml(p.generatedAtDisplay)}</p>
          </div>
        </div>
        <div class="lower-right">
          <div class="summary-box">
            <div class="sum-details">
              <div class="sum-row"><span class="sum-lbl">Sub Total:</span> <span class="sum-val">${escapeHtml(p.subtotal)}</span></div>
              <div class="sum-row"><span class="sum-lbl">Tax (0.00%):</span> <span class="sum-val">₹0</span></div>
            </div>
            <div class="total-box">
              <span class="tot-lbl">Total Paid:</span>
              <span class="tot-val">${escapeHtml(p.total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="thank-you-banner">
        <h3 class="thank-you-title">Thank you for your business!</h3>
      </div>
    </div>

    <footer class="doc-footer">
      <div class="footer-grid">
        <div class="footer-terms">
          <h5 class="terms-h">Terms &amp; Conditions</h5>
          <p class="terms-p">For billing inquiries or support, contact support@thestackly.com.</p>
        </div>
        <div class="footer-sign">
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-text">Authorized&nbsp;Signatory</div>
          </div>
        </div>
      </div>
    </footer>
  </div>
  </div>
</body>
</html>`;
}

/** Fetches stackly-logo.webp (with gh-pages base path) as a data URL for PDF/html2canvas. */
export async function resolveInvoiceLogoDataUrl(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const logoUrls = [
    new URL(assetPath("/stackly-logo.webp"), window.location.origin).href,
    new URL("/stackly-logo.webp", window.location.origin).href,
  ];
  try {
    let res: Response | null = null;
    for (const href of logoUrls) {
      const attempt = await fetch(href, { cache: "force-cache" });
      if (attempt.ok) {
        res = attempt;
        break;
      }
    }
    if (!res) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(typeof r.result === "string" ? r.result : null);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function safeInvoiceFilename(filenameBase: string): string {
  return filenameBase.replace(/[^a-zA-Z0-9-_]/g, "_");
}

type Html2PdfWorker = {
  set(options: Record<string, unknown>): Html2PdfWorker;
  from(element: HTMLElement): Html2PdfWorker;
  save(): Promise<void>;
};

type Html2PdfFactory = () => Html2PdfWorker;

declare const INVOICE_IIFE: boolean | undefined;

/** Next.js: dynamic import. index.html bundle: global from CDN (html2pdf.bundle.min.js). */
async function loadHtml2Pdf(): Promise<Html2PdfFactory> {
  const g = globalThis as unknown as { html2pdf?: Html2PdfFactory };
  if (typeof g.html2pdf === "function") return g.html2pdf;

  if (typeof INVOICE_IIFE !== "undefined" && INVOICE_IIFE) {
    throw new Error(
      "PDF library not loaded. Add html2pdf.bundle.min.js before planning-invoice-document.js in index.html.",
    );
  }

  const mod = await import("html2pdf.js");
  return mod.default;
}

type PageLayoutSnapshot = {
  scrollX: number;
  scrollY: number;
  htmlOverflow: string;
  htmlPaddingRight: string;
  bodyOverflow: string;
  bodyPaddingRight: string;
  bodyPosition: string;
};

function capturePageLayout(): PageLayoutSnapshot {
  const html = document.documentElement;
  const body = document.body;
  return {
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    htmlOverflow: html.style.overflow,
    htmlPaddingRight: html.style.paddingRight,
    bodyOverflow: body.style.overflow,
    bodyPaddingRight: body.style.paddingRight,
    bodyPosition: body.style.position,
  };
}

function restorePageLayout(snap: PageLayoutSnapshot) {
  const html = document.documentElement;
  const body = document.body;
  html.style.overflow = snap.htmlOverflow;
  html.style.paddingRight = snap.htmlPaddingRight;
  body.style.overflow = snap.bodyOverflow;
  body.style.paddingRight = snap.bodyPaddingRight;
  body.style.position = snap.bodyPosition;
  window.scrollTo(snap.scrollX, snap.scrollY);
}

/** html2pdf/html2canvas can toggle overflow on html/body — restore after export. */
async function withPreservedPageLayout<T>(fn: () => Promise<T>): Promise<T> {
  const snap = capturePageLayout();
  try {
    return await fn();
  } finally {
    restorePageLayout(snap);
    requestAnimationFrame(() => restorePageLayout(snap));
  }
}

/** Render invoice in an isolated iframe so the live page layout never shifts. */
function mountInvoiceHtmlInIframe(html: string): { root: HTMLElement; cleanup: () => void } {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("tabindex", "-1");
  iframe.title = "Invoice PDF render";
  iframe.style.cssText =
    "position:fixed!important;left:-10000px!important;top:0!important;" +
    "width:794px!important;height:1200px!important;border:0!important;margin:0!important;" +
    "padding:0!important;opacity:0!important;pointer-events:none!important;" +
    "visibility:hidden!important;overflow:visible!important;z-index:-1!important;";

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    throw new Error("Invoice PDF iframe unavailable");
  }

  doc.open();
  doc.write(html);
  doc.close();

  const root = doc.body;
  root.style.margin = "0";
  root.style.padding = "0";
  root.style.width = "794px";
  root.style.display = "flex";
  root.style.justifyContent = "center";
  root.style.background = "#ffffff";

  return {
    root,
    cleanup: () => {
      iframe.remove();
    },
  };
}

async function waitForInvoiceRender(root: HTMLElement): Promise<void> {
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  if (!win) return;

  const fontsReady =
    doc.fonts && typeof doc.fonts.ready?.then === "function"
      ? doc.fonts.ready.catch(() => undefined)
      : Promise.resolve();

  const images = Array.from(root.querySelectorAll("img"));
  const imagesReady = Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
        }),
    ),
  );

  await Promise.all([fontsReady, imagesReady]);
  await new Promise<void>((r) => win.requestAnimationFrame(() => win.requestAnimationFrame(() => r())));
}

/** Download invoice as PDF (client-side via html2canvas + jsPDF). */
export async function downloadPlanningInvoicePdf(filenameBase: string, html: string): Promise<void> {
  if (typeof window === "undefined") return;

  await withPreservedPageLayout(async () => {
    const html2pdf = await loadHtml2Pdf();

    const { root, cleanup } = mountInvoiceHtmlInIframe(html);

    try {
      await waitForInvoiceRender(root);
      const invoiceCss = buildPlanningInvoiceStyles();

      const captureEl =
        (root.querySelector(".invoice-shell") as HTMLElement | null) ??
        (root.querySelector(".invoice-page") as HTMLElement | null) ??
        root;
      await html2pdf()
        .set({
          margin: [8, 0, 8, 0],
          filename: `${safeInvoiceFilename(filenameBase)}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            scrollX: 0,
            scrollY: 0,
            width: 794,
            windowWidth: 794,
            onclone: (clonedDoc: Document) => {
              const clonedBody = clonedDoc.body;
              if (clonedBody) {
                clonedBody.style.margin = "0";
                clonedBody.style.padding = "0";
                clonedBody.style.width = "794px";
                clonedBody.style.display = "flex";
                clonedBody.style.justifyContent = "center";
                clonedBody.style.background = "#ffffff";
              }
              const clonedShell = clonedDoc.querySelector(".invoice-shell") as HTMLElement | null;
              if (clonedShell) {
                clonedShell.style.width = "794px";
                clonedShell.style.maxWidth = "794px";
                clonedShell.style.margin = "0 auto";
                clonedShell.style.display = "flex";
                clonedShell.style.justifyContent = "center";
              }
              const clonedPage = clonedDoc.querySelector(".invoice-page");
              if (clonedPage && !clonedPage.querySelector('style[data-invoice-css="1"]')) {
                const styleEl = clonedDoc.createElement("style");
                styleEl.setAttribute("data-invoice-css", "1");
                styleEl.textContent = invoiceCss;
                clonedPage.insertBefore(styleEl, clonedPage.firstChild);
              }
              clonedDoc.querySelectorAll(".invoice-ribbon").forEach((el) => {
                const svg = el as SVGElement;
                svg.style.display = "block";
                svg.style.width = "100%";
                svg.style.height = "46px";
                svg.style.overflow = "visible";
                const text = svg.querySelector("text");
                if (text) {
                  text.setAttribute("y", "36");
                  text.removeAttribute("dominant-baseline");
                }
              });
            },
          },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"] },
        })
        .from(captureEl)
        .save();
    } finally {
      cleanup();
    }
  });
}

/** @deprecated Prefer downloadPlanningInvoicePdf — kept for debugging. */
export function downloadPlanningInvoiceHtml(filenameBase: string, html: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeInvoiceFilename(filenameBase)}.html`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadPlanningInvoiceForEntry(
  entry: BillingHistoryEntryLike,
  defaults: PlanningInvoiceContactDefaults,
  filenameBase: string,
): Promise<void> {
  const logo = await resolveInvoiceLogoDataUrl();
  const payload = billingHistoryEntryToInvoicePayload(entry, defaults, logo);
  const html = buildPlanningInvoiceHtmlDocument(payload);
  await downloadPlanningInvoicePdf(filenameBase, html);
}

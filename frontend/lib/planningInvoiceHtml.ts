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
  const amountNum = parseUsdAmount(entry.amount);
  if (entry.status === "Free" || amountNum === 0) {
    return [{ label: "Billing", value: "Complimentary plan — no payment collected." }];
  }

  const method = (entry.paymentMethodLabel ?? "").trim();
  const detail = (entry.paymentDetail ?? "").trim();
  const methodL = method.toLowerCase();
  const detailL = detail.toLowerCase();

  if (methodL.includes("credit") || methodL.includes("debit") || detailL.includes("card payment")) {
    const rows: PaymentInfoRow[] = [
      { label: "Payment method", value: method || "Credit / Debit card" },
    ];
    const lastM = detail.match(/\*{4}(\d{4})/);
    const expM = detail.match(/exp\s+([\d/]+)/i);
    if (lastM) rows.push({ label: "Card (last digits)", value: `****${lastM[1]}` });
    if (expM) rows.push({ label: "Expiry (MM/YY)", value: expM[1] });
    if (!lastM && !expM && detail) rows.push({ label: "Card details", value: detail });
    return rows;
  }

  if (methodL.includes("paypal") || detailL.includes("paypal")) {
    const rows: PaymentInfoRow[] = [{ label: "Payment method", value: "PayPal" }];
    const m = detail.match(/PayPal\s*·\s*(.+)/i);
    rows.push({ label: "PayPal account", value: (m ? m[1] : detail.replace(/^PayPal\s*/i, "")).trim() || "—" });
    return rows;
  }

  if (methodL.includes("upi") || methodL.includes("wallet") || detailL.includes("upi")) {
    const rows: PaymentInfoRow[] = [
      { label: "Payment method", value: method || "UPI / Wallet" },
    ];
    if (detail.includes("Google Pay")) rows.push({ label: "Wallet", value: "Google Pay" });
    if (detail.includes("PhonePe")) rows.push({ label: "Wallet", value: "PhonePe" });
    const um = detail.match(/UPI\s+(\S+)/i);
    if (um) rows.push({ label: "UPI ID", value: um[1] });
    else if (detail) rows.push({ label: "Payment details", value: detail });
    return rows;
  }

  if (methodL.includes("net") || detailL.includes("net banking")) {
    const bank = detail.replace(/^Net banking\s*·\s*/i, "").trim() || detail;
    return [
      { label: "Payment method", value: "Net banking" },
      { label: "Bank / account", value: bank || "—" },
    ];
  }

  const rows: PaymentInfoRow[] = [];
  if (method) rows.push({ label: "Payment method", value: method });
  if (detail) rows.push({ label: "Transaction details", value: detail });
  return rows.length > 0 ? rows : [{ label: "Payment", value: "Paid — see your statement for the descriptor." }];
}

export function billingHistoryEntryToInvoicePayload(
  entry: BillingHistoryEntryLike,
  defaults: PlanningInvoiceContactDefaults,
  logoSrc: string | null = null,
): PlanningInvoicePayload {
  const amountNum = parseUsdAmount(entry.amount);
  const website = entry.websiteLabel ?? "Stackly workspace subscription";
  const planCol = entry.planTier ?? entry.planName ?? (entry.status === "Free" ? "Free" : "Pro");
  const currencyLine = formatUsd(amountNum);
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
    customerName: entry.buyerName ?? defaults.displayName,
    customerEmail: entry.buyerEmail ?? defaults.email,
    customerPhone: entry.buyerPhone ?? defaults.phone,
    customerAddress: entry.buyerAddress ?? defaults.address,
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

/** SVG ribbon — html2canvas uses alphabetic baseline for &lt;text y&gt;, not dominant-baseline middle. */
function renderInvoiceBarHtml(): string {
  const barY = 8;
  const barH = 30;
  const textBaselineY = barY + barH - 2;
  return `<svg class="invoice-ribbon" xmlns="http://www.w3.org/2000/svg" width="100%" height="46" viewBox="0 0 602 46" preserveAspectRatio="none" role="img" aria-label="INVOICE" style="display:block;width:100%;height:46px;margin:0;padding:0;overflow:visible;">
    <rect x="0" y="${barY}" width="248" height="${barH}" fill="${BRAND}"/>
    <rect x="500" y="${barY}" width="102" height="${barH}" fill="${BRAND}"/>
    <text x="374" y="${textBaselineY}" text-anchor="middle" fill="${INVOICE_TITLE}" font-family="Arial Black, Arial, sans-serif" font-size="38" font-weight="800" letter-spacing="5">INVOICE</text>
  </svg>`;
}


function buildPlanningInvoiceStyles(): string {
  return `
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    html, body.invoice-doc { margin: 0; padding: 0; background: #fff; }
    body.invoice-doc {
      font-family: Inter, Roboto, "Segoe UI", Arial, Helvetica, sans-serif;
      font-size: 13px;
      color: #1a1a1a;
      line-height: 1.5;
    }
    .invoice-page {
      width: 698px;
      max-width: 100%;
      margin: 0 auto;
      padding: 52px 48px 36px;
      background: #fff;
    }
    .doc-head { margin-bottom: 0; padding-top: 2px; }
    .brand-row { margin-bottom: 4px; }
    .logo-img {
      height: 34px;
      width: auto;
      max-width: 170px;
      object-fit: contain;
      display: block;
    }
    .logo-fallback {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-fallback .brand-name {
      font-size: 21px;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: ${BRAND};
    }
    .tagline {
      font-size: 10.5px;
      color: ${BRAND};
      margin: 0 0 16px;
      line-height: 1.4;
      letter-spacing: 0.02em;
    }
    .invoice-ribbon {
      display: block;
      width: 100%;
      height: 46px;
      margin: 4px 0 0;
      padding: 0;
      overflow: visible;
    }
    .meta {
      display: flex;
      display: -webkit-flex;
      justify-content: space-between;
      -webkit-justify-content: space-between;
      align-items: flex-start;
      -webkit-align-items: flex-start;
      gap: 32px;
      margin: 14px 0 28px;
      flex-wrap: wrap;
    }
    .meta-left h2 {
      font-size: 17px;
      color: ${BRAND};
      margin: 0 0 10px;
      font-weight: 800;
      letter-spacing: 0.01em;
    }
    .meta-left .name {
      font-size: 15px;
      font-weight: 400;
      color: ${BRAND};
      line-height: 1.35;
    }
    .meta-right { margin-left: auto; }
    .meta-table {
      border-collapse: collapse;
      margin-left: auto;
    }
    .meta-table td {
      padding: 0 0 8px;
      vertical-align: baseline;
      font-size: 13px;
      color: ${BRAND};
    }
    .meta-table tr:last-child td { padding-bottom: 0; }
    .meta-table .meta-lbl {
      text-align: right;
      font-weight: 700;
      white-space: nowrap;
      padding-right: 2px;
    }
    .meta-table .meta-col {
      text-align: center;
      font-weight: 700;
      padding: 0 8px 0 4px;
    }
    .meta-table .meta-val {
      text-align: left;
      font-weight: 500;
    }
    table.inv {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #d0d0d0;
      margin-bottom: 30px;
    }
    table.inv thead th {
      background: ${BRAND};
      color: #fff;
      font-weight: 700;
      font-size: 12px;
      padding: 13px 11px;
      text-align: left;
      border: 1px solid ${BRAND};
    }
    table.inv thead th:nth-child(1) { width: 44px; text-align: center; }
    table.inv thead th:nth-child(3),
    table.inv thead th:nth-child(5) { text-align: right; }
    table.inv td {
      padding: 12px 11px;
      border: 1px solid #e4e4e4;
      font-size: 13px;
      color: #222;
    }
    table.inv td:nth-child(1) { text-align: center; }
    table.inv tr.alt td { background: ${ROW_ALT}; }
    table.inv td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .lower {
      display: flex;
      display: -webkit-flex;
      justify-content: space-between;
      -webkit-justify-content: space-between;
      gap: 36px;
      align-items: flex-start;
      -webkit-align-items: flex-start;
      flex-wrap: wrap;
      margin-bottom: 26px;
    }
    .lower-left { flex: 1; min-width: 240px; max-width: 440px; }
    .lower-left h3 {
      color: ${BRAND};
      font-size: 19px;
      margin: 0 0 16px;
      font-weight: 700;
    }
    .lower-left h4 {
      color: ${BRAND};
      font-size: 16px;
      margin: 0 0 12px;
      font-weight: 700;
    }
    .pay-row { margin: 0 0 8px; font-size: 12.5px; line-height: 1.45; }
    .pay-label { font-weight: 600; color: ${BRAND}; }
    .pay-val { color: #222; }
    .gen-line {
      margin-top: 14px;
      font-size: 11px;
      color: ${BRAND};
    }
    .lower-right { min-width: 210px; text-align: right; }
    .lower-right .row { margin-bottom: 7px; font-size: 13px; color: #222; }
    .total-bar {
      margin-top: 12px;
      background: ${BRAND};
      color: #fff;
      font-weight: 800;
      font-size: 15px;
      padding: 13px 18px;
      text-align: right;
      border-radius: 1px;
    }
    .footer-wrap {
      border-top: 2px solid ${BRAND};
      border-bottom: 1px solid ${BRAND};
      padding: 16px 0 14px;
      margin-top: 4px;
    }
    .footer-table {
      width: 100%;
      border-collapse: collapse;
      border-spacing: 0;
    }
    .footer-table td {
      padding: 0;
      border: 0;
      vertical-align: bottom;
    }
    .footer-terms { padding-right: 24px; }
    .terms-h {
      margin: 0 0 9px;
      font-size: 17px;
      font-weight: 800;
      color: ${BRAND};
      letter-spacing: 0.01em;
    }
    .terms-p {
      margin: 0;
      font-size: 14px;
      line-height: 1.55;
      color: ${BRAND};
      font-weight: 400;
      max-width: 420px;
    }
    .footer-sign {
      text-align: right;
      white-space: nowrap;
      padding-left: 40px;
      padding-right: 12px;
      padding-bottom: 6px;
    }
    .sign {
      color: ${SIGN_BLUE};
      text-decoration: underline;
      font-weight: 600;
      font-size: 12px;
      display: inline-block;
    }
    .fineprint {
      text-align: center;
      font-size: 10px;
      color: ${BRAND};
      margin-top: 16px;
    }
    @media print { .invoice-page { padding: 12mm; width: auto; } }
  `;
}

export function buildPlanningInvoiceHtmlDocument(p: PlanningInvoicePayload): string {
  const rowsHtml = p.lines
    .map(
      (row, i) => `
      <tr class="${i % 2 === 1 ? "alt" : ""}">
        <td>${row.si}</td>
        <td>${escapeHtml(row.website)}</td>
        <td class="num">${escapeHtml(row.price)}</td>
        <td>${escapeHtml(row.plan)}</td>
        <td class="num">${escapeHtml(row.total)}</td>
      </tr>`,
    )
    .join("");

  const paymentInfoHtml = p.paymentInfoRows
    .map(
      (r) =>
        `<p class="pay-row"><span class="pay-label">${escapeHtml(r.label)} :</span> <span class="pay-val">${escapeHtml(r.value)}</span></p>`,
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
  <div class="invoice-page">
    <style data-invoice-css="1">${styles}</style>
    <header class="doc-head">
      <div class="brand-row">${logoBlock}</div>
      <p class="tagline">Empowering businesses with cutting-edge solutions.</p>
      ${renderInvoiceBarHtml()}
    </header>

    <div class="meta">
      <div class="meta-left">
        <h2>Invoice details :</h2>
        <div class="name">${escapeHtml(p.customerName)}</div>
      </div>
      <div class="meta-right">
        <table class="meta-table" role="presentation">
          <tr>
            <td class="meta-lbl">Invoice Id</td>
            <td class="meta-col">:</td>
            <td class="meta-val">${escapeHtml(p.invoiceId)}</td>
          </tr>
          <tr>
            <td class="meta-lbl">Date</td>
            <td class="meta-col">:</td>
            <td class="meta-val">${escapeHtml(p.invoiceDateDisplay)}</td>
          </tr>
        </table>
      </div>
    </div>

    <table class="inv" role="table">
      <thead>
        <tr>
          <th>S.I.</th>
          <th>Website</th>
          <th>Price</th>
          <th>Plan</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="lower">
      <div class="lower-left">
        <h3>Thank you for your business</h3>
        <h4>Payment Info :</h4>
        ${paymentInfoHtml}
        <p class="gen-line">Invoice generated: ${escapeHtml(p.generatedAtDisplay)}</p>
      </div>
      <div class="lower-right">
        <div class="row"><strong>Sub Total :</strong> ${escapeHtml(p.subtotal)}</div>
        <div class="row"><strong>Tax :</strong> ${escapeHtml(taxLine)}</div>
        <div class="total-bar">Total : ${escapeHtml(p.total)}</div>
      </div>
    </div>

    <div class="footer-wrap">
      <table class="footer-table" width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
        <tr valign="bottom">
          <td class="footer-terms" align="left" valign="bottom">
            <h5 class="terms-h">Terms &amp; Conditions</h5>
            <p class="terms-p">For billing-related issues, users can contact customer support through email, chat, or help center.</p>
          </td>
          <td class="footer-sign" align="right" valign="bottom">
            <span class="sign">Authorised Sign</span>
          </td>
        </tr>
      </table>
    </div>
    <p class="fineprint">Your invoice has been generated successfully.</p>
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

      const pageEl = (root.querySelector(".invoice-page") as HTMLElement | null) ?? root;
      await html2pdf()
        .set({
          margin: [8, 10, 8, 10],
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
        .from(pageEl)
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

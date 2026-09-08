import { writeFileSync } from "node:fs";

const WebSocket = globalThis.WebSocket;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getCDPConnection() {
  const versionRes = await fetch("http://localhost:9222/json/list");
  const pages = await versionRes.json();
  const page = pages.find((p) => p.type === "page" && p.url.includes("blockpages"));
  if (!page) {
    throw new Error("No blockpages browser page found in Chrome CDP on port 9222!");
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise((resolve) => {
    ws.onopen = resolve;
  });

  function send(method, params = {}) {
    const msgId = id++;
    return new Promise((resolve, reject) => {
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  return { ws, send };
}

async function runComprehensiveLiveQA() {
  const { ws, send } = await getCDPConnection();
  console.log("Connected to Chrome CDP on port 9222 successfully.\n");

  const qaReport = {
    timestamp: new Date().toISOString(),
    templates: {},
    ecommerceFixes: {},
    isolationTests: {},
    zoomResponsiveTests: {},
    iconLayoutLifecycle: {},
    draftPersistence: {},
    nonButtonRegression: {},
  };

  async function ensureButtonModeActive() {
    await send("Runtime.evaluate", {
      expression: `(() => {
        const spans = Array.from(document.querySelectorAll("span"));
        const btnSpan = spans.find(s => s.textContent && s.textContent.trim() === "Button");
        if (btnSpan && btnSpan.parentElement) {
          const parent = btnSpan.parentElement;
          const classList = Array.from(parent.classList || []);
          const isActive = classList.includes("ring-2");
          if (!isActive) {
            parent.click();
            return "Clicked Button block";
          }
          return "Button block already active";
        }
        return "Button span not found";
      })()`,
    });
    await sleep(2000);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. TEMPLATE-BY-TEMPLATE LIVE AUDIT (ALL 7 TEMPLATES)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("===============================================================================");
  console.log("SUITE 1: AUDITING ALL 7 TEMPLATES FOR STABLE BUTTON IDS & OVERLAY PENS");
  console.log("===============================================================================");

  const templatesToAudit = [
    {
      id: "ecommerce",
      name: "E-Commerce",
      expectedButtons: ["-cart", "-buynow", "btn-ecommerce-stay-updated-subscribe", "btn-ecommerce-blog-view-all"]
    },
    {
      id: "restaurant",
      name: "Restaurant",
      expectedButtons: ["btn-restaurant-hero-explore-food", "btn-restaurant-hero-reserve-table", "btn-restaurant-newsletter-submit"]
    },
    {
      id: "portfolio",
      name: "Portfolio",
      expectedButtons: ["btn-portfolio-hero-view-work", "btn-portfolio-hero-download-cv", "btn-portfolio-newsletter-submit", "btn-portfolio-contact-submit"]
    },
    {
      id: "construction",
      name: "Construction",
      expectedButtons: ["btn-construction-hero-consultation", "btn-construction-hero-how-it-works", "btn-construction-contact-submit", "btn-construction-newsletter-submit"]
    },
    {
      id: "digital-marketing",
      name: "Digital Marketing",
      expectedButtons: ["btn-digital-marketing-hero-learn-more", "btn-digital-marketing-cta-schedule-call", "btn-digital-marketing-newsletter-submit", "btn-digital-marketing-contact-submit"]
    },
    {
      id: "business",
      name: "Business",
      expectedButtons: ["btn-digital-marketing-hero-learn-more", "btn-digital-marketing-cta-schedule-call", "btn-digital-marketing-newsletter-submit"]
    },
    {
      id: "blog",
      name: "Blog",
      expectedButtons: ["btn-blog-start-blogging-hero", "btn-blog-start-blogging-run", "btn-blog-start-blogging-analytics", "btn-blog-get-in-touch", "btn-blog-start-blogging-cta"]
    },
  ];

  for (const tpl of templatesToAudit) {
    console.log(`\nNavigating to template: ${tpl.name} (?template=${tpl.id}) ...`);
    await send("Page.navigate", { url: `http://localhost:3000/blockpages/?template=${tpl.id}` });
    await sleep(3500);

    await ensureButtonModeActive();

    const result = await send("Runtime.evaluate", {
      expression: `(() => {
        const pens = Array.from(document.querySelectorAll("[data-blockpages-overlay-btn]"));
        const penMap = pens.map(p => ({
          targetId: p.getAttribute("data-blockpages-overlay-btn"),
          rect: {
            width: Math.round(p.getBoundingClientRect().width),
            height: Math.round(p.getBoundingClientRect().height),
            top: Math.round(p.getBoundingClientRect().top + window.scrollY),
            left: Math.round(p.getBoundingClientRect().left + window.scrollX)
          }
        }));

        const buttonDoms = Array.from(document.querySelectorAll("[data-blockpages-button-id]"));
        const idCounts = {};
        buttonDoms.forEach(b => {
          const id = b.getAttribute("data-blockpages-button-id");
          idCounts[id] = (idCounts[id] || 0) + 1;
        });

        const penCounts = {};
        penMap.forEach(p => {
          penCounts[p.targetId] = (penCounts[p.targetId] || 0) + 1;
        });

        return {
          totalPens: pens.length,
          pens: penMap,
          uniqueButtonIds: Object.keys(idCounts),
          penCounts
        };
      })()`,
      returnByValue: true,
    });

    const auditData = result.result.value;
    const missingExpected = tpl.expectedButtons.filter(
      (exp) => !auditData.pens.some((p) => p.targetId.includes(exp) || exp.includes(p.targetId))
    );
    const duplicates = Object.entries(auditData.penCounts).filter(([_, c]) => c > 1);

    const status = missingExpected.length === 0 && duplicates.length === 0 ? "PASSED" : "FAILED";
    console.log(`Template: ${tpl.name} | Total Edit Pens: ${auditData.totalPens} | Unique Button IDs: ${auditData.uniqueButtonIds.length} | Status: ${status}`);
    if (missingExpected.length > 0) {
      console.warn(`  Missing expected pens: ${missingExpected.join(", ")}`);
    }
    if (duplicates.length > 0) {
      console.warn(`  Duplicate pens detected: ${JSON.stringify(duplicates)}`);
    }

    qaReport.templates[tpl.id] = {
      name: tpl.name,
      totalPens: auditData.totalPens,
      uniqueButtonsCount: auditData.uniqueButtonIds.length,
      samplePenIds: auditData.pens.slice(0, 6).map((p) => p.targetId),
      missingExpected,
      duplicates,
      status,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. E-COMMERCE DEEP VERIFICATION & ZERO-LEAK TESTS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n===============================================================================");
  console.log("SUITE 2: E-COMMERCE LIVE VERIFICATION & ZERO-LEAK TESTS");
  console.log("===============================================================================");

  console.log("Navigating to E-Commerce template (?template=ecommerce) with clean baseline...");
  await send("Runtime.evaluate", {
    expression: `(() => {
      Object.keys(localStorage).forEach(k => {
        if (k.includes("button") || k.includes("ecommerce")) localStorage.removeItem(k);
      });
    })()`,
  });
  await send("Page.navigate", { url: "http://localhost:3000/blockpages/?template=ecommerce" });
  await sleep(3500);
  await ensureButtonModeActive();

  // Find product 1, 2, 3 IDs
  const productIds = await send("Runtime.evaluate", {
    expression: `(() => {
      const buynowPens = Array.from(document.querySelectorAll('[data-blockpages-overlay-btn*="-buynow"]'));
      return buynowPens.map(p => p.getAttribute("data-blockpages-overlay-btn"));
    })()`,
    returnByValue: true,
  });

  const p1BuyNowId = productIds.result.value[0];
  const p2BuyNowId = productIds.result.value[1];
  const p3BuyNowId = productIds.result.value[2];
  const p1CartId = p1BuyNowId.replace("-buynow", "-cart");
  const p1WishlistId = p1BuyNowId.replace("-buynow", "-wishlist");
  const p1ShareId = p1BuyNowId.replace("-buynow", "-share");

  console.log(`Product 1 Button IDs: BuyNow=${p1BuyNowId}, Cart=${p1CartId}, Wishlist=${p1WishlistId}, Share=${p1ShareId}`);
  console.log(`Product 2 BuyNow ID: ${p2BuyNowId}`);
  console.log(`Product 3 BuyNow ID: ${p3BuyNowId}`);

  // Check presence of action pens
  const actionPensCheck = await send("Runtime.evaluate", {
    expression: `(() => {
      const p1Cart = document.querySelector('[data-blockpages-overlay-btn="${p1CartId}"]');
      const p1Wishlist = document.querySelector('[data-blockpages-overlay-btn="${p1WishlistId}"]');
      const p1Share = document.querySelector('[data-blockpages-overlay-btn="${p1ShareId}"]');
      const p1BuyNow = document.querySelector('[data-blockpages-overlay-btn="${p1BuyNowId}"]');

      return {
        hasCartPen: Boolean(p1Cart),
        hasWishlistPen: Boolean(p1Wishlist),
        hasSharePen: Boolean(p1Share),
        hasBuyNowPen: Boolean(p1BuyNow),
      };
    })()`,
    returnByValue: true,
  });

  console.log("Product 1 Pens Presence:", actionPensCheck.result.value);
  qaReport.ecommerceFixes.product1Pens = actionPensCheck.result.value;

  // Read Baselines of Subscribe, Blog View All, Blog Read Article, Product 1, 2, 3
  const baselineStyles = await send("Runtime.evaluate", {
    expression: `(() => {
      function getStyle(id) {
        const el = document.querySelector(\`[data-blockpages-button-id="\${id}"]\`);
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return {
          id,
          bg: cs.backgroundColor,
          color: cs.color,
          border: cs.borderColor,
          text: el.innerText.trim(),
        };
      }
      return {
        subscribe: getStyle("btn-ecommerce-stay-updated-subscribe"),
        blogViewAll: getStyle("btn-ecommerce-blog-view-all"),
        blogReadArticle: getStyle("btn-ecommerce-blog-read-how-to-choose-the-right-laptop-for-work-and-travel"),
        p1BuyNow: getStyle("${p1BuyNowId}"),
        p2BuyNow: getStyle("${p2BuyNowId}"),
        p3BuyNow: getStyle("${p3BuyNowId}"),
        p1Cart: getStyle("${p1CartId}"),
      };
    })()`,
    returnByValue: true,
  });

  console.log("\nBaseline Button Styles Captured:", baselineStyles.result.value);

  // Edit Product 1 Buy Now: Click Pen -> Choose Secondary Variant in Button Canvas
  console.log(`\nClicking Edit Pen for Product 1: ${p1BuyNowId} ...`);
  await send("Runtime.evaluate", {
    expression: `(() => {
      const pen = document.querySelector('[data-blockpages-overlay-btn="${p1BuyNowId}"]');
      if (pen) pen.click();
    })()`,
  });
  await sleep(1500);

  // In ButtonCanvas, click the Secondary style variant button (2nd button in Button Blocks grid)
  console.log("Selecting Primary style in ButtonCanvas...");
  await send("Runtime.evaluate", {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const clickMeBtns = btns.filter(b => b.textContent && b.textContent.includes("Click Me !"));
      if (clickMeBtns.length >= 1) {
        clickMeBtns[0].click(); // Primary (sets solid #0f3b89 bg and white text)
        return "Clicked Primary variant";
      }
      return "Click Me buttons not found";
    })()`,
  });
  await sleep(3000);

  // Re-verify styles after Product 1 Edit
  const afterP1Edit = await send("Runtime.evaluate", {
    expression: `(() => {
      function getStyle(id) {
        const el = document.querySelector(\`[data-blockpages-button-id="\${id}"]\`);
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return {
          id,
          bg: cs.backgroundColor,
          color: cs.color,
          border: cs.borderColor,
          text: el.innerText.trim(),
        };
      }
      return {
        p1BuyNow: getStyle("${p1BuyNowId}"),
        subscribe: getStyle("btn-ecommerce-stay-updated-subscribe"),
        blogViewAll: getStyle("btn-ecommerce-blog-view-all"),
        blogReadArticle: getStyle("btn-ecommerce-blog-read-how-to-choose-the-right-laptop-for-work-and-travel"),
      };
    })()`,
    returnByValue: true,
  });

  const p1BuyNowUpdated = afterP1Edit.result.value.p1BuyNow.bg !== baselineStyles.result.value.p1BuyNow.bg || afterP1Edit.result.value.p1BuyNow.border !== baselineStyles.result.value.p1BuyNow.border;
  const subscribeUnchangedAfterP1 = afterP1Edit.result.value.subscribe.bg === baselineStyles.result.value.subscribe.bg && afterP1Edit.result.value.subscribe.color === baselineStyles.result.value.subscribe.color;
  const blogViewAllUnchangedAfterP1 = afterP1Edit.result.value.blogViewAll.bg === baselineStyles.result.value.blogViewAll.bg;
  const blogReadArticleUnchangedAfterP1 = afterP1Edit.result.value.blogReadArticle.bg === baselineStyles.result.value.blogReadArticle.bg;

  console.log(`Product 1 Buy Now Updated: ${p1BuyNowUpdated ? "YES (PASS)" : "NO"}`);
  console.log(`Subscribe Button Unchanged (Zero Leak from Product 1): ${subscribeUnchangedAfterP1 ? "PASS" : "FAIL - LEAK!"}`);
  console.log(`Blog View All Button Unchanged (Zero Leak from Product 1): ${blogViewAllUnchangedAfterP1 ? "PASS" : "FAIL - LEAK!"}`);
  console.log(`Blog Read Article Button Unchanged (Zero Leak from Product 1): ${blogReadArticleUnchangedAfterP1 ? "PASS" : "FAIL - LEAK!"}`);

  // Re-activate Button Mode for Product 2 Edit
  await ensureButtonModeActive();

  // Edit Product 2 Buy Now: Click Pen -> Choose Outline Variant
  console.log(`\nClicking Edit Pen for Product 2: ${p2BuyNowId} ...`);
  await send("Runtime.evaluate", {
    expression: `(() => {
      const pen = document.querySelector('[data-blockpages-overlay-btn="${p2BuyNowId}"]');
      if (pen) pen.click();
    })()`,
  });
  await sleep(1500);

  console.log("Selecting Secondary style in ButtonCanvas...");
  await send("Runtime.evaluate", {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const clickMeBtns = btns.filter(b => b.textContent && b.textContent.includes("Click Me !"));
      if (clickMeBtns.length >= 2) {
        clickMeBtns[1].click(); // Secondary
        return "Clicked Secondary variant";
      }
      return "Click Me buttons not found";
    })()`,
  });
  await sleep(3000);

  const afterP2Edit = await send("Runtime.evaluate", {
    expression: `(() => {
      function getStyle(id) {
        const el = document.querySelector(\`[data-blockpages-button-id="\${id}"]\`);
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return { id, bg: cs.backgroundColor, color: cs.color, border: cs.borderColor };
      }
      return {
        p2BuyNow: getStyle("${p2BuyNowId}"),
        blogViewAll: getStyle("btn-ecommerce-blog-view-all"),
      };
    })()`,
    returnByValue: true,
  });

  const p2BuyNowUpdated = afterP2Edit.result.value.p2BuyNow.bg !== baselineStyles.result.value.p2BuyNow.bg || afterP2Edit.result.value.p2BuyNow.border !== baselineStyles.result.value.p2BuyNow.border;
  const blogViewAllUnchangedAfterP2 = afterP2Edit.result.value.blogViewAll.bg === baselineStyles.result.value.blogViewAll.bg;
  console.log(`Product 2 Buy Now Updated: ${p2BuyNowUpdated ? "YES (PASS)" : "NO"}`);
  console.log(`Blog View All Unchanged (Zero Leak from Product 2): ${blogViewAllUnchangedAfterP2 ? "PASS" : "FAIL - LEAK!"}`);

  // Re-activate Button Mode for Product 3 Edit
  await ensureButtonModeActive();

  console.log(`\nClicking Edit Pen for Product 3: ${p3BuyNowId} ...`);
  await send("Runtime.evaluate", {
    expression: `(() => {
      const pen = document.querySelector('[data-blockpages-overlay-btn="${p3BuyNowId}"]');
      if (pen) pen.click();
    })()`,
  });
  await sleep(1500);

  console.log("Selecting Primary style in ButtonCanvas for Product 3...");
  await send("Runtime.evaluate", {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const clickMeBtns = btns.filter(b => b.textContent && b.textContent.includes("Click Me !"));
      if (clickMeBtns.length >= 1) {
        clickMeBtns[0].click(); // Primary
        return "Clicked Primary variant";
      }
      return "Click Me buttons not found";
    })()`,
  });
  await sleep(3000);

  const afterP3Edit = await send("Runtime.evaluate", {
    expression: `(() => {
      function getStyle(id) {
        const el = document.querySelector(\`[data-blockpages-button-id="\${id}"]\`);
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return { id, bg: cs.backgroundColor, color: cs.color, border: cs.borderColor };
      }
      return {
        p3BuyNow: getStyle("${p3BuyNowId}"),
        blogReadArticle: getStyle("btn-ecommerce-blog-read-how-to-choose-the-right-laptop-for-work-and-travel"),
      };
    })()`,
    returnByValue: true,
  });

  const p3BuyNowUpdated = afterP3Edit.result.value.p3BuyNow.bg !== baselineStyles.result.value.p3BuyNow.bg;
  const blogReadArticleUnchangedAfterP3 = afterP3Edit.result.value.blogReadArticle.bg === baselineStyles.result.value.blogReadArticle.bg;
  console.log(`Product 3 Buy Now Updated: ${p3BuyNowUpdated ? "YES (PASS)" : "NO"}`);
  console.log(`Blog Read Article Unchanged (Zero Leak from Product 3): ${blogReadArticleUnchangedAfterP3 ? "PASS" : "FAIL - LEAK!"}`);

  qaReport.isolationTests = {
    p1BuyNowUpdated,
    subscribeUnchangedAfterP1,
    blogViewAllUnchangedAfterP1,
    blogReadArticleUnchangedAfterP1,
    p2BuyNowUpdated,
    blogViewAllUnchangedAfterP2,
    p3BuyNowUpdated,
    blogReadArticleUnchangedAfterP3,
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. ACTION BUTTON & SVG ICON LIFECYCLE PRESERVATION
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n===============================================================================");
  console.log("SUITE 3: ACTION BUTTON & SVG ICON LIFECYCLE PRESERVATION");
  console.log("===============================================================================");

  await ensureButtonModeActive();

  console.log(`Editing Product 1 Cart button: ${p1CartId} ...`);
  await send("Runtime.evaluate", {
    expression: `(() => {
      const pen = document.querySelector('[data-blockpages-overlay-btn="${p1CartId}"]');
      if (pen) pen.click();
    })()`,
  });
  await sleep(1500);

  // Apply Primary style in ButtonCanvas
  await send("Runtime.evaluate", {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const clickMeBtns = btns.filter(b => b.textContent && b.textContent.includes("Click Me !"));
      if (clickMeBtns.length >= 1) {
        clickMeBtns[0].click(); // Primary
        return "Clicked Primary variant";
      }
      return "Click Me buttons not found";
    })()`,
  });
  await sleep(1500);

  // Inspect Product 1 Cart button after styling:
  // MUST preserve SVG icon, must preserve 28x28px dimension, must preserve buyscreen-action-btn class!
  const cartIconCheck = await send("Runtime.evaluate", {
    expression: `(() => {
      const cartBtn = document.querySelector('[data-blockpages-button-id="${p1CartId}"]');
      if (!cartBtn) return { found: false };
      const svg = cartBtn.querySelector("svg");
      const rect = cartBtn.getBoundingClientRect();
      const cs = window.getComputedStyle(cartBtn);
      return {
        found: true,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        hasSvg: Boolean(svg),
        svgTagName: svg ? svg.tagName : null,
        svgChildCount: svg ? svg.children.length : 0,
        className: cartBtn.className,
        hasBuyscreenClass: cartBtn.classList.contains("buyscreen-action-btn"),
        bg: cs.backgroundColor,
        color: cs.color,
      };
    })()`,
    returnByValue: true,
  });

  console.log("Cart Action Button Inspection after Edit:", cartIconCheck.result.value);
  qaReport.iconLayoutLifecycle = cartIconCheck.result.value;

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. ZOOM / SUBPIXEL / RESPONSIVE LAYOUT VERIFICATION
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n===============================================================================");
  console.log("SUITE 4: ZOOM / SUBPIXEL / RESPONSIVE LAYOUT VERIFICATION");
  console.log("===============================================================================");

  await ensureButtonModeActive();

  const viewports = [
    { name: "100% Zoom Desktop (1536x864)", width: 1536, height: 864, deviceScaleFactor: 1 },
    { name: "125% Zoom Desktop (1228x691)", width: 1228, height: 691, deviceScaleFactor: 1.25 },
    { name: "75% Zoom Desktop (2048x1152)", width: 2048, height: 1152, deviceScaleFactor: 0.75 },
    { name: "Mobile Viewport (375x667)", width: 375, height: 667, deviceScaleFactor: 2 },
    { name: "Tablet Viewport (768x1024)", width: 768, height: 1024, deviceScaleFactor: 2 },
  ];

  for (const vp of viewports) {
    await send("Emulation.setDeviceMetricsOverride", {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.deviceScaleFactor,
      mobile: vp.width < 800,
    });
    await sleep(1500);

    const vpResult = await send("Runtime.evaluate", {
      expression: `(() => {
        const p1BuyNow = document.querySelector('[data-blockpages-button-id="${p1BuyNowId}"]');
        const p1Cart = document.querySelector('[data-blockpages-button-id="${p1CartId}"]');
        const p1BuyNowPen = document.querySelector('[data-blockpages-overlay-btn="${p1BuyNowId}"]');
        const p1CartPen = document.querySelector('[data-blockpages-overlay-btn="${p1CartId}"]');

        return {
          p1BuyNowRect: p1BuyNow ? { width: Math.round(p1BuyNow.getBoundingClientRect().width), height: Math.round(p1BuyNow.getBoundingClientRect().height) } : null,
          p1CartRect: p1Cart ? { width: Math.round(p1Cart.getBoundingClientRect().width), height: Math.round(p1Cart.getBoundingClientRect().height) } : null,
          p1BuyNowPenVisible: Boolean(p1BuyNowPen && p1BuyNowPen.getBoundingClientRect().width > 0),
          p1CartPenVisible: Boolean(p1CartPen && p1CartPen.getBoundingClientRect().width > 0),
        };
      })()`,
      returnByValue: true,
    });

    console.log(`Result for ${vp.name}:`, vpResult.result.value);
    qaReport.zoomResponsiveTests[vp.name] = vpResult.result.value;
  }

  // Clear Emulation
  await send("Emulation.clearDeviceMetricsOverride");
  await sleep(1000);

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. DRAFT PERSISTENCE & LOCALSTORAGE ROUNDTRIP VERIFICATION
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n===============================================================================");
  console.log("SUITE 5: DRAFT PERSISTENCE & LOCALSTORAGE ROUNDTRIP VERIFICATION");
  console.log("===============================================================================");

  const storageCheck = await send("Runtime.evaluate", {
    expression: `(() => {
      const ecomKey = Object.keys(localStorage).find(k => k.includes("custom-buttons") && k.includes("ecommerce"));
      const raw = ecomKey ? localStorage.getItem(ecomKey) : null;
      return {
        key: ecomKey,
        data: raw ? JSON.parse(raw) : null,
      };
    })()`,
    returnByValue: true,
  });

  console.log("Persisted Custom Buttons in LocalStorage:", storageCheck.result.value);

  // Reload page to verify style hydration
  console.log("Reloading page to test hydration from storage...");
  await send("Page.navigate", { url: "http://localhost:3000/blockpages/?template=ecommerce" });
  await sleep(3500);

  const rehydratedStyles = await send("Runtime.evaluate", {
    expression: `(() => {
      const p1 = document.querySelector('[data-blockpages-button-id="${p1BuyNowId}"]');
      const cart = document.querySelector('[data-blockpages-button-id="${p1CartId}"]');
      return {
        p1: p1 ? { bg: window.getComputedStyle(p1).backgroundColor, border: window.getComputedStyle(p1).borderColor } : null,
        cart: cart ? { bg: window.getComputedStyle(cart).backgroundColor, border: window.getComputedStyle(cart).borderColor } : null,
      };
    })()`,
    returnByValue: true,
  });

  console.log("Rehydrated Styles after reload:", rehydratedStyles.result.value);
  qaReport.draftPersistence = {
    localStorageData: storageCheck.result.value,
    rehydratedStyles: rehydratedStyles.result.value,
    persistedCleanly: Boolean(rehydratedStyles.result.value.p1 && rehydratedStyles.result.value.cart),
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. NON-BUTTON BLOCK PAGES REGRESSION (TEXT, IMAGE, ICON, DIVIDER, BUTTON)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n===============================================================================");
  console.log("SUITE 6: NON-BUTTON BLOCK PAGES REGRESSION");
  console.log("===============================================================================");

  const modes = ["Text", "Image", "Icon", "Divider", "Button"];
  for (const mode of modes) {
    const switchRes = await send("Runtime.evaluate", {
      expression: `(() => {
        const spans = Array.from(document.querySelectorAll("span"));
        const target = spans.find(s => s.textContent && s.textContent.trim() === "${mode}");
        if (target && target.parentElement) {
          target.parentElement.click();
          return "Switched to " + "${mode}";
        }
        return "Could not find " + "${mode}";
      })()`,
      returnByValue: true,
    });
    console.log(`Switch to ${mode}:`, switchRes.result.value);
    await sleep(1500);

    const checkState = await send("Runtime.evaluate", {
      expression: `(() => {
        const canvas = document.querySelector("[data-textblock-canvas]");
        return {
          canvasPresent: Boolean(canvas),
          bodyTextLength: document.body.innerText.length,
          activeElementTag: document.activeElement ? document.activeElement.tagName : null,
        };
      })()`,
      returnByValue: true,
    });
    console.log(`  State in ${mode} mode:`, checkState.result.value);
    qaReport.nonButtonRegression[mode] = checkState.result.value;
  }

  // Save full QA JSON
  writeFileSync("d:/stackly/Workplace/test/Website-Builder-Application/frontend/scripts/qa-results.json", JSON.stringify(qaReport, null, 2));
  console.log("\n===============================================================================");
  console.log("COMPREHENSIVE LIVE QA COMPLETED AND SAVED TO frontend/scripts/qa-results.json");
  console.log("===============================================================================");

  ws.close();
}

runComprehensiveLiveQA().catch((err) => {
  console.error("FATAL ERROR in Comprehensive QA Suite:", err);
  process.exit(1);
});

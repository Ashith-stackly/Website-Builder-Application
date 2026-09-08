const WebSocket = globalThis.WebSocket;

async function runQATests() {
  const versionRes = await fetch("http://localhost:9222/json/list");
  const pages = await versionRes.json();
  const page = pages.find(p => p.type === "page" && p.url.includes("blockpages"));
  if (!page) {
    console.error("No blockpages target found!");
    process.exit(1);
  }

  const ws = new globalThis.WebSocket(page.webSocketDebuggerUrl);
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

  await new Promise((resolve) => { ws.onopen = resolve; });

  function send(method, params = {}) {
    const msgId = id++;
    return new Promise((resolve, reject) => {
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  console.log("===============================================================================");
  console.log("PHASE 1: LIVE TESTING E-COMMERCE BUTTON EDITING");
  console.log("===============================================================================");

  // Reload page
  console.log("Reloading http://localhost:3000/blockpages/?template=ecommerce ...");
  await send("Page.navigate", { url: "http://localhost:3000/blockpages/?template=ecommerce" });
  await new Promise(r => setTimeout(r, 3000));

  // Activate Button mode
  const activateBtn = await send("Runtime.evaluate", {
    expression: `(() => {
      const spans = Array.from(document.querySelectorAll("span"));
      const btnSpan = spans.find(s => s.textContent && s.textContent.trim() === "Button");
      if (btnSpan && btnSpan.parentElement) {
        btnSpan.parentElement.click();
        return "Clicked Button Block Item";
      }
      return "Button Block item NOT found";
    })()`,
    returnByValue: true,
  });
  console.log("Activate Button Mode:", activateBtn.result.value);
  await new Promise(r => setTimeout(r, 1500));

  // Inspect Pens and Overlay Targets
  const penInspection = await send("Runtime.evaluate", {
    expression: `(() => {
      const pens = Array.from(document.querySelectorAll("[data-blockpages-overlay-btn]"));
      return pens.map(p => ({
        targetId: p.getAttribute("data-blockpages-overlay-btn"),
        title: p.getAttribute("title"),
        ariaLabel: p.getAttribute("aria-label"),
        rect: {
          width: p.getBoundingClientRect().width,
          height: p.getBoundingClientRect().height,
          top: p.getBoundingClientRect().top + window.scrollY,
          left: p.getBoundingClientRect().left + window.scrollX
        }
      }));
    })()`,
    returnByValue: true,
  });

  const pens = penInspection.result.value;
  console.log(`Found ${pens.length} button overlay edit pens total on live canvas:`);
  pens.forEach((p, i) => console.log(`  [${i + 1}] ID: ${p.targetId} | ariaLabel: ${p.ariaLabel} | pos: (${Math.round(p.rect.left)}, ${Math.round(p.rect.top)})`));

  // Verify Cart, Wishlist, Share, and Buy Now on product cards
  const productCartPens = pens.filter(p => p.targetId.includes("-cart"));
  const productWishlistPens = pens.filter(p => p.targetId.includes("-wishlist"));
  const productSharePens = pens.filter(p => p.targetId.includes("-share"));
  const productBuyNowPens = pens.filter(p => p.targetId.includes("-buynow"));
  const subscribePens = pens.filter(p => p.targetId.includes("subscribe"));
  const viewAllPostsPens = pens.filter(p => p.targetId.includes("view-all"));
  const readArticlePens = pens.filter(p => p.targetId.includes("read-"));

  console.log("\n--- Category Breakdown of Pens ---");
  console.log("Cart Pens Count:", productCartPens.length);
  console.log("Wishlist Pens Count:", productWishlistPens.length);
  console.log("Share Pens Count:", productSharePens.length);
  console.log("Buy Now Pens Count:", productBuyNowPens.length);
  console.log("Subscribe Pens Count:", subscribePens.length);
  console.log("View All Posts Pens Count:", viewAllPostsPens.length);
  console.log("Read Article Pens Count:", readArticlePens.length);

  // Capture baseline styles before edits
  const baselineStyles = await send("Runtime.evaluate", {
    expression: `(() => {
      function getStyle(id) {
        const el = document.querySelector(\`[data-blockpages-button-id="\${id}"]\`);
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return {
          id,
          tag: el.tagName,
          className: el.className,
          bg: cs.backgroundColor,
          color: cs.color,
          border: cs.borderColor,
        };
      }
      return {
        subscribe: getStyle("btn-ecommerce-stay-updated-subscribe"),
        blogViewAll: getStyle("btn-ecommerce-blog-view-all"),
        phoneBuyNow: getStyle(document.querySelector('[data-blockpages-button-id*="buynow"]')?.getAttribute("data-blockpages-button-id")),
      };
    })()`,
    returnByValue: true,
  });
  console.log("\nBaseline styles before edits:");
  console.log("  Subscribe Button:", baselineStyles.result.value.subscribe);
  console.log("  Blog View All Button:", baselineStyles.result.value.blogViewAll);
  console.log("  First Product Buy Now:", baselineStyles.result.value.phoneBuyNow);

  // STEP 6: Click Phone Buy Now edit pen and apply style
  const phoneBuyNowId = baselineStyles.result.value.phoneBuyNow.id;
  console.log(`\nTesting Edit Pen on: ${phoneBuyNowId} ...`);

  const clickPenResult = await send("Runtime.evaluate", {
    expression: `(() => {
      const pen = document.querySelector('[data-blockpages-overlay-btn="${phoneBuyNowId}"]');
      if (!pen) return "Pen not found for " + "${phoneBuyNowId}";
      pen.click();
      return "Clicked pen for " + "${phoneBuyNowId}";
    })()`,
    returnByValue: true,
  });
  console.log("Click Phone Buy Now Pen Result:", clickPenResult.result.value);
  await new Promise(r => setTimeout(r, 1000));

  // Inspect Modal
  const modalInspection = await send("Runtime.evaluate", {
    expression: `(() => {
      const modal = document.querySelector('[role="dialog"], .fixed, div[class*="z-50"]');
      const buttonsInModal = Array.from(document.querySelectorAll("button")).filter(b => {
        const rect = b.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && (b.textContent.includes("Primary") || b.textContent.includes("Secondary") || b.textContent.includes("Outline"));
      });
      return {
        modalFound: Boolean(modal),
        styleButtons: buttonsInModal.map(b => b.textContent.trim())
      };
    })()`,
    returnByValue: true,
  });
  console.log("Modal Inspection:", modalInspection.result.value);

  // Click a style variant (Secondary or Primary variant)
  const selectStyleResult = await send("Runtime.evaluate", {
    expression: `(() => {
      const styleButtons = Array.from(document.querySelectorAll("button")).filter(b => {
        return b.textContent && (b.textContent.includes("Secondary") || b.textContent.includes("Primary"));
      });
      if (styleButtons.length > 0) {
        styleButtons[0].click();
        return "Selected style: " + styleButtons[0].textContent.trim();
      }
      return "No style buttons found";
    })()`,
    returnByValue: true,
  });
  console.log("Select Style Result:", selectStyleResult.result.value);
  await new Promise(r => setTimeout(r, 1000));

  // Check if modal has Close or Done button, or click outside to dismiss
  await send("Runtime.evaluate", {
    expression: `(() => {
      const closeBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent && (b.textContent.includes("Done") || b.textContent.includes("Apply") || b.textContent.includes("Save") || b.getAttribute("aria-label") === "Close modal"));
      if (closeBtn) closeBtn.click();
      else {
        // click backdrop or press Escape
        const event = new KeyboardEvent("keydown", { key: "Escape", code: "Escape", keyCode: 27, bubbles: true });
        document.dispatchEvent(event);
      }
    })()`,
    returnByValue: true,
  });
  await new Promise(r => setTimeout(r, 1000));

  // Check DOM styles after Phone button edit
  const afterPhoneEditStyles = await send("Runtime.evaluate", {
    expression: `(() => {
      function getStyle(id) {
        const el = document.querySelector(\`[data-blockpages-button-id="\${id}"]\`);
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return {
          id,
          tag: el.tagName,
          className: el.className,
          bg: cs.backgroundColor,
          color: cs.color,
          border: cs.borderColor,
        };
      }
      return {
        phoneBuyNow: getStyle("${phoneBuyNowId}"),
        subscribe: getStyle("btn-ecommerce-stay-updated-subscribe"),
        blogViewAll: getStyle("btn-ecommerce-blog-view-all"),
        blogReadArticle: getStyle("btn-ecommerce-blog-read-how-to-choose-the-right-laptop-for-work-and-travel"),
      };
    })()`,
    returnByValue: true,
  });

  console.log("\nStyles AFTER Phone Buy Now Edit:");
  console.log("  Phone Buy Now:", afterPhoneEditStyles.result.value.phoneBuyNow);
  console.log("  Subscribe Button:", afterPhoneEditStyles.result.value.subscribe);
  console.log("  Blog View All Button:", afterPhoneEditStyles.result.value.blogViewAll);
  console.log("  Blog Read Article Button:", afterPhoneEditStyles.result.value.blogReadArticle);

  // ZERO LEAK VERIFICATION
  const subscribeUnchanged = afterPhoneEditStyles.result.value.subscribe.bg === baselineStyles.result.value.subscribe.bg;
  const blogViewAllUnchanged = afterPhoneEditStyles.result.value.blogViewAll.bg === baselineStyles.result.value.blogViewAll.bg;
  console.log("\n===============================================================================");
  console.log("ZERO LEAK ASSERTION RESULTS:");
  console.log(`  1. Subscribe button unchanged: ${subscribeUnchanged ? "PASS (No Leak!)" : "FAIL (LEAK DETECTED!)"}`);
  console.log(`  2. Blog View All button unchanged: ${blogViewAllUnchanged ? "PASS (No Leak!)" : "FAIL (LEAK DETECTED!)"}`);
  console.log("===============================================================================");

  ws.close();
}

runQATests().catch(console.error);

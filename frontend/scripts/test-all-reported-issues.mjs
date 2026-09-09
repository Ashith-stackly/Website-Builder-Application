const WebSocket = globalThis.WebSocket;

async function runTests() {
  const versionRes = await fetch("http://localhost:9222/json/list");
  const pages = await versionRes.json();
  const page = pages.find((p) => p.type === "page" && p.url.includes("blockpages"));
  if (!page) {
    console.error("No blockpages page found on port 9222!");
    return;
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

  await new Promise((r) => { ws.onopen = r; });

  function send(method, params = {}) {
    const msgId = id++;
    return new Promise((resolve, reject) => {
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async function evaluate(fnOrStr) {
    const expr = typeof fnOrStr === "function" ? `(${fnOrStr})()` : fnOrStr;
    const res = await send("Runtime.evaluate", {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  }

  console.log("Navigating to ecommerce template...");
  await send("Page.navigate", { url: "http://localhost:3000/blockpages/?template=ecommerce" });
  await new Promise((r) => setTimeout(r, 2500));

  // Reset local storage custom buttons to test from clean slate
  await evaluate(() => {
    localStorage.removeItem("stackly-custom-buttons-ecommerce");
  });
  await send("Page.navigate", { url: "http://localhost:3000/blockpages/?template=ecommerce" });
  await new Promise((r) => setTimeout(r, 2500));

  // Switch to Button block
  await evaluate(() => {
    const spans = Array.from(document.querySelectorAll("span"));
    const btnSpan = spans.find((s) => s.textContent?.trim() === "Button");
    btnSpan?.parentElement?.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  // Helper to click pen and apply preset
  async function editButton(buttonId, presetIndex = 0, customLabel = null) {
    console.log(`\nEditing button "${buttonId}" (preset ${presetIndex})...`);
    // Click pen
    const clicked = await evaluate(`(() => {
      const pen = document.querySelector('[data-blockpages-overlay-btn="${buttonId}"]');
      if (!pen) return false;
      pen.click();
      return true;
    })()`);
    if (!clicked) {
      throw new Error(`Pen not found for buttonId: ${buttonId}`);
    }
    await new Promise((r) => setTimeout(r, 1500));

    // In Button Canvas, click preset button
    await evaluate(`(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const clickMe = btns.filter(b => b.textContent && b.textContent.includes("Click Me !"));
      if (clickMe[${presetIndex}]) {
        clickMe[${presetIndex}].click();
      }
    })()`);
    await new Promise((r) => setTimeout(r, 2000));

    // If customLabel is provided, update it in customButtons
    if (customLabel) {
      await evaluate(`(() => {
        // Dispatch synthetic event or update state via DOM
        const btn = document.querySelector('[data-blockpages-button-id="${buttonId}"]');
        const textNode = btn?.querySelector("span, p, .buyscreen-buynow-label") || btn;
        if (textNode) textNode.textContent = "${customLabel}";
      })()`);
    }

    // Return to Button editing mode if not already active
    await evaluate(() => {
      const spans = Array.from(document.querySelectorAll("span"));
      const btnSpan = spans.find((s) => s.textContent?.trim() === "Button");
      btnSpan?.parentElement?.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
  }

  function getButtonStyles(ids) {
    return evaluate(`(() => {
      const ids = ${JSON.stringify(ids)};
      const res = {};
      ids.forEach(id => {
        const el = document.querySelector('[data-blockpages-button-id="' + id + '"]');
        if (!el) {
          res[id] = null;
          return;
        }
        const cs = window.getComputedStyle(el);
        const textNode = el.querySelector(".buyscreen-buynow-label, span, p") || el;
        res[id] = {
          bg: cs.backgroundColor,
          color: cs.color,
          border: cs.borderColor,
          text: (textNode.textContent || "").trim(),
          customized: el.getAttribute("data-blockpages-customized-button"),
        };
      });
      return res;
    })()`);
  }

  // Discover product 1, 2, 3 IDs
  const buttonIds = await evaluate(() => {
    const p1Cart = document.querySelector('[data-blockpages-button-id*="cart"]')?.getAttribute("data-blockpages-button-id");
    const p1Wishlist = document.querySelector('[data-blockpages-button-id*="wishlist"]')?.getAttribute("data-blockpages-button-id");
    const p1Share = document.querySelector('[data-blockpages-button-id*="share"]')?.getAttribute("data-blockpages-button-id");
    const buynowBtns = Array.from(document.querySelectorAll('[data-blockpages-button-id*="buynow"]')).map(b => b.getAttribute("data-blockpages-button-id"));
    const subscribe = document.querySelector('[data-blockpages-button-id*="subscribe"]')?.getAttribute("data-blockpages-button-id");
    const blogViewAll = document.querySelector('[data-blockpages-button-id*="blog-view-all"]')?.getAttribute("data-blockpages-button-id");
    const blogRead = document.querySelector('[data-blockpages-button-id*="blog-read"]')?.getAttribute("data-blockpages-button-id");
    return {
      p1Cart,
      p1Wishlist,
      p1Share,
      p1BuyNow: buynowBtns[0],
      p2BuyNow: buynowBtns[1],
      p3BuyNow: buynowBtns[2],
      subscribe,
      blogViewAll,
      blogRead,
    };
  });

  console.log("Discovered target buttons:", buttonIds);

  // Baseline
  const base = await getButtonStyles(Object.values(buttonIds));
  console.log("Baseline captured.");

  const results = {};

  // =========================================================================
  // TEST 1: Cart edit -> ONLY Cart changes (Wishlist & Share unchanged)
  // =========================================================================
  console.log("\n--- TEST 1: Cart Edit Isolation ---");
  await editButton(buttonIds.p1Cart, 0); // Preset 0: Primary (dark blue #0f3b89, white text)
  const afterCart = await getButtonStyles([buttonIds.p1Cart, buttonIds.p1Wishlist, buttonIds.p1Share]);
  const cartChanged = afterCart[buttonIds.p1Cart]?.bg === "rgb(15, 59, 137)";
  const wishlistUnchanged = afterCart[buttonIds.p1Wishlist]?.bg === base[buttonIds.p1Wishlist]?.bg;
  const shareUnchanged = afterCart[buttonIds.p1Share]?.bg === base[buttonIds.p1Share]?.bg;
  results.test1_cart = {
    cartChanged,
    wishlistUnchanged,
    shareUnchanged,
    pass: cartChanged && wishlistUnchanged && shareUnchanged,
  };
  console.log("Test 1 Result:", results.test1_cart);

  // =========================================================================
  // TEST 2: Wishlist edit -> ONLY Wishlist changes (Cart & Share unchanged)
  // =========================================================================
  console.log("\n--- TEST 2: Wishlist Edit Isolation ---");
  await editButton(buttonIds.p1Wishlist, 0);
  const afterWishlist = await getButtonStyles([buttonIds.p1Cart, buttonIds.p1Wishlist, buttonIds.p1Share]);
  const wishlistChanged = afterWishlist[buttonIds.p1Wishlist]?.bg === "rgb(15, 59, 137)";
  const cartPreserved = afterWishlist[buttonIds.p1Cart]?.bg === afterCart[buttonIds.p1Cart]?.bg;
  const shareStillUnchanged = afterWishlist[buttonIds.p1Share]?.bg === base[buttonIds.p1Share]?.bg;
  results.test2_wishlist = {
    wishlistChanged,
    cartPreserved,
    shareStillUnchanged,
    pass: wishlistChanged && cartPreserved && shareStillUnchanged,
  };
  console.log("Test 2 Result:", results.test2_wishlist);

  // =========================================================================
  // TEST 3: Share edit -> ONLY Share changes
  // =========================================================================
  console.log("\n--- TEST 3: Share Edit Isolation ---");
  await editButton(buttonIds.p1Share, 1); // Preset 1: Secondary (transparent, border #0f3b89)
  const afterShare = await getButtonStyles([buttonIds.p1Cart, buttonIds.p1Wishlist, buttonIds.p1Share]);
  const shareChanged = afterShare[buttonIds.p1Share]?.border === "rgb(15, 59, 137)";
  results.test3_share = {
    shareChanged,
    pass: shareChanged,
  };
  console.log("Test 3 Result:", results.test3_share);

  // =========================================================================
  // TEST 4: Product 1 (Phone) edit -> Subscribe must remain UNCHANGED
  // =========================================================================
  console.log("\n--- TEST 4: Product 1 vs Subscribe Isolation ---");
  await editButton(buttonIds.p1BuyNow, 0);
  const afterP1 = await getButtonStyles([buttonIds.p1BuyNow, buttonIds.subscribe, buttonIds.p2BuyNow]);
  const p1Updated = afterP1[buttonIds.p1BuyNow]?.bg === "rgb(15, 59, 137)";
  const subscribeUnchanged = afterP1[buttonIds.subscribe]?.bg === base[buttonIds.subscribe]?.bg;
  const p2Unchanged = afterP1[buttonIds.p2BuyNow]?.bg === base[buttonIds.p2BuyNow]?.bg;
  results.test4_product1_subscribe = {
    p1Updated,
    subscribeUnchanged,
    p2Unchanged,
    pass: p1Updated && subscribeUnchanged && p2Unchanged,
  };
  console.log("Test 4 Result:", results.test4_product1_subscribe);

  // =========================================================================
  // TEST 5: Product 2 (Headphones) edit -> View All Posts must remain UNCHANGED
  // =========================================================================
  console.log("\n--- TEST 5: Product 2 vs View All Posts Isolation ---");
  await editButton(buttonIds.p2BuyNow, 1); // Secondary variant
  const afterP2 = await getButtonStyles([buttonIds.p2BuyNow, buttonIds.blogViewAll, buttonIds.p3BuyNow]);
  const p2Updated = afterP2[buttonIds.p2BuyNow]?.border === "rgb(15, 59, 137)";
  const blogViewAllUnchanged = afterP2[buttonIds.blogViewAll]?.bg === base[buttonIds.blogViewAll]?.bg;
  const p3Unchanged = afterP2[buttonIds.p3BuyNow]?.bg === base[buttonIds.p3BuyNow]?.bg;
  results.test5_product2_blogviewall = {
    p2Updated,
    blogViewAllUnchanged,
    p3Unchanged,
    pass: p2Updated && blogViewAllUnchanged && p3Unchanged,
  };
  console.log("Test 5 Result:", results.test5_product2_blogviewall);

  // =========================================================================
  // TEST 6: Product 3 (Camera) edit -> Read Article must remain UNCHANGED
  // =========================================================================
  console.log("\n--- TEST 6: Product 3 vs Read Article Isolation ---");
  await editButton(buttonIds.p3BuyNow, 0);
  const afterP3 = await getButtonStyles([buttonIds.p3BuyNow, buttonIds.blogRead, buttonIds.p1BuyNow]);
  const p3Updated = afterP3[buttonIds.p3BuyNow]?.bg === "rgb(15, 59, 137)";
  const blogReadUnchanged = afterP3[buttonIds.blogRead]?.bg === base[buttonIds.blogRead]?.bg;
  const p1StillPreserved = afterP3[buttonIds.p1BuyNow]?.bg === afterP1[buttonIds.p1BuyNow]?.bg;
  results.test6_product3_readarticle = {
    p3Updated,
    blogReadUnchanged,
    p1StillPreserved,
    pass: p3Updated && blogReadUnchanged && p1StillPreserved,
  };
  console.log("Test 6 Result:", results.test6_product3_readarticle);

  // =========================================================================
  // TEST 7: Buy Now Visibility & Dimensions Across Viewports
  // =========================================================================
  console.log("\n--- TEST 7: Buy Now Visibility & Responsiveness ---");
  const viewports = [
    { name: "100% Desktop", width: 1536, height: 864, scale: 1 },
    { name: "125% Desktop", width: 1228, height: 691, scale: 1.25 },
    { name: "150% Desktop", width: 1024, height: 576, scale: 1.5 },
    { name: "Tablet", width: 768, height: 1024, scale: 2 },
    { name: "Mobile", width: 375, height: 667, scale: 2 },
  ];
  const vpResults = [];
  for (const vp of viewports) {
    await send("Emulation.setDeviceMetricsOverride", {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.scale,
      mobile: vp.width < 800,
    });
    await new Promise((r) => setTimeout(r, 1000));
    const vpCheck = await evaluate(`(() => {
      const btn = document.querySelector('[data-blockpages-button-id="${buttonIds.p1BuyNow}"]');
      if (!btn) return { found: false };
      const rect = btn.getBoundingClientRect();
      const cs = window.getComputedStyle(btn);
      return {
        found: true,
        w: Math.round(rect.width),
        h: Math.round(rect.height),
        visible: rect.width >= 30 && rect.height >= 24,
        bg: cs.backgroundColor,
      };
    })()`);
    console.log(`Viewport ${vp.name}:`, vpCheck);
    vpResults.push({ vp: vp.name, ...vpCheck });
  }
  // Reset viewport
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1536,
    height: 864,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await new Promise((r) => setTimeout(r, 1000));
  results.test7_buynow_responsiveness = {
    allVisible: vpResults.every(v => v.visible),
    vpResults,
    pass: vpResults.every(v => v.visible),
  };

  console.log("\n===============================================================================");
  console.log("FINAL RESULTS SUMMARY:");
  console.log(JSON.stringify(results, null, 2));
  console.log("===============================================================================");

  ws.close();
}

runTests().catch(console.error);

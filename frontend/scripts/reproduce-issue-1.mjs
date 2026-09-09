const WebSocket = globalThis.WebSocket;

async function reproduceIssue1() {
  const versionRes = await fetch("http://localhost:9222/json/list");
  const pages = await versionRes.json();
  const page = pages.find((p) => p.type === "page" && p.url.includes("blockpages"));
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

  async function evaluate(fnStr) {
    const res = await send("Runtime.evaluate", {
      expression: `(${fnStr})()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  }

  await send("Page.navigate", { url: "http://localhost:3000/blockpages/?template=ecommerce" });
  await new Promise((r) => setTimeout(r, 2500));

  // Switch to Button block
  await evaluate(() => {
    const spans = Array.from(document.querySelectorAll("span"));
    const btnSpan = spans.find((s) => s.textContent?.trim() === "Button");
    btnSpan?.parentElement?.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  // Find the pens for Cart, Wishlist, Share
  const pensInfo = await evaluate(() => {
    const pens = Array.from(document.querySelectorAll('[data-blockpages-overlay-kind="button"]'));
    return pens.map(p => ({
      id: p.getAttribute("data-blockpages-overlay-btn"),
      top: p.style.top,
      left: p.style.left,
      rect: p.getBoundingClientRect(),
    })).filter(p => p.id?.includes("cart") || p.id?.includes("wishlist") || p.id?.includes("share"));
  });
  console.log("Pens for cart/wishlist/share:", pensInfo);

  // Let's test editing Cart:
  console.log("\nAttempting to edit Cart button...");
  const cartPenId = pensInfo.find(p => p.id?.includes("cart"))?.id;
  console.log("Cart Pen ID:", cartPenId);

  await evaluate(`() => {
    const pen = document.querySelector('[data-blockpages-overlay-btn="${cartPenId}"]');
    pen?.click();
  }`);
  await new Promise((r) => setTimeout(r, 1200));

  // In Button Editor, select a style (e.g. click first button style preset)
  const editorState = await evaluate(() => {
    const buttonOptions = Array.from(document.querySelectorAll('.flex-1.min-w-0 button, [data-button-block="true"] button'));
    const isEditorOpen = document.querySelector('[data-button-canvas="true"]') !== null;
    return { isEditorOpen, buttonOptionsCount: buttonOptions.length };
  });
  console.log("Button Editor State after clicking Cart pen:", editorState);

  // Select a preset button in ButtonCanvas
  console.log("Selecting a preset in ButtonCanvas...");
  await evaluate(() => {
    // Click the first button in ButtonCanvas to apply
    const presetBtn = document.querySelector('.bg-white.rounded-2xl button, [data-button-canvas="true"] button');
    presetBtn?.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  // Now check the styles on Cart, Wishlist, Share elements!
  const postEditStyles = await evaluate(() => {
    const cartEl = document.querySelector('[data-blockpages-button-id*="cart"]');
    const wishlistEl = document.querySelector('[data-blockpages-button-id*="wishlist"]');
    const shareEl = document.querySelector('[data-blockpages-button-id*="share"]');

    return {
      cart: {
        id: cartEl?.getAttribute("data-blockpages-button-id"),
        className: cartEl?.className,
        style: cartEl?.getAttribute("style"),
        customized: cartEl?.getAttribute("data-blockpages-customized-button"),
      },
      wishlist: {
        id: wishlistEl?.getAttribute("data-blockpages-button-id"),
        className: wishlistEl?.className,
        style: wishlistEl?.getAttribute("style"),
        customized: wishlistEl?.getAttribute("data-blockpages-customized-button"),
      },
      share: {
        id: shareEl?.getAttribute("data-blockpages-button-id"),
        className: shareEl?.className,
        style: shareEl?.getAttribute("style"),
        customized: shareEl?.getAttribute("data-blockpages-customized-button"),
      },
    };
  });

  console.log("Styles after applying Cart edit:", JSON.stringify(postEditStyles, null, 2));

  ws.close();
}

reproduceIssue1().catch(console.error);

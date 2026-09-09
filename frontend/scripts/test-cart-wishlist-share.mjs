const WebSocket = globalThis.WebSocket;

async function testCartWishlistShare() {
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
  await new Promise((r) => setTimeout(r, 3000));

  // Switch to Button block
  await evaluate(() => {
    const spans = Array.from(document.querySelectorAll("span"));
    const btnSpan = spans.find((s) => s.textContent?.trim() === "Button");
    btnSpan?.parentElement?.click();
  });
  await new Promise((r) => setTimeout(r, 2000));

  // Find product 1's cart, wishlist, share IDs
  const targetIds = await evaluate(() => {
    const cart = document.querySelector('[data-blockpages-button-id*="cart"]');
    const wishlist = document.querySelector('[data-blockpages-button-id*="wishlist"]');
    const share = document.querySelector('[data-blockpages-button-id*="share"]');
    return {
      cartId: cart?.getAttribute("data-blockpages-button-id"),
      wishlistId: wishlist?.getAttribute("data-blockpages-button-id"),
      shareId: share?.getAttribute("data-blockpages-button-id"),
    };
  });
  console.log("Target IDs:", targetIds);

  function getButtonState() {
    return evaluate(`(() => {
      function get(id) {
        const el = document.querySelector('[data-blockpages-button-id="' + id + '"]');
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        const svg = el.querySelector("svg");
        const svgCs = svg ? window.getComputedStyle(svg) : null;
        const paths = Array.from(el.querySelectorAll("path, circle, rect")).map(p => ({
          tag: p.tagName,
          fill: p.getAttribute("fill"),
          stroke: p.getAttribute("stroke"),
          inlineStroke: p.style.stroke,
          inlineFill: p.style.fill,
          computedStroke: window.getComputedStyle(p).stroke,
          computedFill: window.getComputedStyle(p).fill,
        }));
        return {
          id,
          styleAttr: el.getAttribute("style"),
          classAttr: el.className,
          bg: cs.backgroundColor,
          color: cs.color,
          border: cs.borderColor,
          svgStroke: svgCs?.stroke,
          svgFill: svgCs?.fill,
          paths,
        };
      }
      return {
        cart: get("${targetIds.cartId}"),
        wishlist: get("${targetIds.wishlistId}"),
        share: get("${targetIds.shareId}"),
      };
    })()`);
  }

  console.log("\n--- Baseline states ---");
  const baseline = await getButtonState();
  console.log("Cart base bg:", baseline.cart?.bg, "color:", baseline.cart?.color);
  console.log("Wishlist base bg:", baseline.wishlist?.bg, "color:", baseline.wishlist?.color);
  console.log("Share base bg:", baseline.share?.bg, "color:", baseline.share?.color);

  // 1. Click Cart Pen
  console.log("\n1. Clicking Cart Pen:", targetIds.cartId);
  await evaluate(`(() => {
    const pen = document.querySelector('[data-blockpages-overlay-btn="${targetIds.cartId}"]');
    pen?.click();
  })()`);
  await new Promise((r) => setTimeout(r, 1500));

  // In Button Canvas, click preset 1 (Primary: dark blue bg #0f3b89, text #fff)
  console.log("Selecting Primary preset in Button Canvas...");
  await evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const clickMe = btns.filter(b => b.textContent && b.textContent.includes("Click Me !"));
    clickMe[0]?.click();
  });
  await new Promise((r) => setTimeout(r, 2000));

  const afterCartEdit = await getButtonState();
  console.log("\n--- States after Cart Edit ---");
  console.log("Cart bg:", afterCartEdit.cart?.bg, "color:", afterCartEdit.cart?.color, "paths:", afterCartEdit.cart?.paths);
  console.log("Wishlist bg:", afterCartEdit.wishlist?.bg, "color:", afterCartEdit.wishlist?.color);
  console.log("Share bg:", afterCartEdit.share?.bg, "color:", afterCartEdit.share?.color);

  // Check if Cart changed:
  const cartBgChanged = afterCartEdit.cart?.bg !== baseline.cart?.bg;
  const wishlistChanged = afterCartEdit.wishlist?.bg !== baseline.wishlist?.bg;
  const shareChanged = afterCartEdit.share?.bg !== baseline.share?.bg;
  console.log(`Cart changed: ${cartBgChanged}`);
  console.log(`Wishlist changed: ${wishlistChanged} (Must be false!)`);
  console.log(`Share changed: ${shareChanged} (Must be false!)`);

  ws.close();
}

testCartWishlistShare().catch(console.error);

const WebSocket = globalThis.WebSocket;

async function diagnose() {
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

  // 1. Audit ALL buttons in DOM
  const domAudit = await evaluate(() => {
    const canvas = document.querySelector("[data-textblock-canvas]") || document.body;
    const elements = Array.from(canvas.querySelectorAll("button, a"));
    return elements.map((el, i) => {
      const section = el.closest("section[id], [data-blockpages-section-id], article, footer, [id]");
      const sectionId = section?.getAttribute("data-blockpages-section-id") || section?.id || section?.tagName.toLowerCase();
      const productCard = el.closest(".buyscreen-product-card, article");
      const productName = productCard?.querySelector("p.uppercase, [class*='product-meta'] p")?.textContent?.trim();
      return {
        index: i,
        tagName: el.tagName,
        text: el.textContent?.trim().slice(0, 30),
        ariaLabel: el.getAttribute("aria-label"),
        title: el.getAttribute("title"),
        existingButtonId: el.getAttribute("data-blockpages-button-id"),
        sectionId,
        productName,
        className: el.className.slice(0, 50),
        offsetParent: !!el.offsetParent,
        offsetWidth: el.offsetWidth,
        offsetHeight: el.offsetHeight,
      };
    });
  });

  console.log("=== ALL BUTTONS AUDIT IN ECOMMERCE CANVAS ===");
  console.table(domAudit);

  // 2. Switch to Button editing mode
  console.log("\nSwitching to Button editing mode...");
  await evaluate(() => {
    const spans = Array.from(document.querySelectorAll("span"));
    const btnSpan = spans.find((s) => s.textContent?.trim() === "Button");
    btnSpan?.parentElement?.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  // 3. Inspect Overlays Generated
  const overlays = await evaluate(() => {
    const pens = Array.from(document.querySelectorAll('[data-blockpages-overlay-kind="button"]'));
    return pens.map((pen) => {
      const id = pen.getAttribute("data-blockpages-overlay-id");
      const style = pen.getAttribute("style");
      return { id, style };
    });
  });
  console.log("\n=== GENERATED BUTTON OVERLAYS ===");
  console.table(overlays);

  ws.close();
}

diagnose().catch(console.error);

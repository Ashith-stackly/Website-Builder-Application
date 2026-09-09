const WebSocket = globalThis.WebSocket;

async function traceButtonMapping() {
  const versionRes = await fetch("http://localhost:9222/json/list");
  const pages = await versionRes.json();
  const page = pages.find((p) => p.type === "page" && p.url.includes("blockpages"));
  if (!page) {
    console.error("No blockpages target found!");
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

  // Switch to Button editing mode
  await evaluate(() => {
    const spans = Array.from(document.querySelectorAll("span"));
    const btnSpan = spans.find((s) => s.textContent?.trim() === "Button");
    btnSpan?.parentElement?.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  const mapping = await evaluate(() => {
    const container = document.querySelector("[data-textblock-canvas]");
    if (!container) return { error: "No container" };

    const pens = Array.from(document.querySelectorAll('[data-blockpages-overlay-kind="button"]'));
    return pens.map((pen, penIndex) => {
      const overlayBtnId = pen.getAttribute("data-blockpages-overlay-btn");
      const penTop = parseFloat(pen.style.top);
      const penLeft = parseFloat(pen.style.left);

      // Find which element in container matches this overlay position or id
      const matchingById = Array.from(container.querySelectorAll(`[data-blockpages-button-id="${overlayBtnId}"]`));
      
      return {
        penIndex,
        overlayBtnId,
        penPos: `${Math.round(penTop)}px, ${Math.round(penLeft)}px`,
        matchingElementsCount: matchingById.length,
        matchingElements: matchingById.map(el => {
          const productCard = el.closest(".buyscreen-product-card, article");
          const productName = productCard?.querySelector("p.uppercase, [class*='product-meta'] p")?.textContent?.trim();
          const section = el.closest("section[id], [data-blockpages-section-id], article, footer, [id]");
          const sectionId = section?.getAttribute("data-blockpages-section-id") || section?.id;
          const rect = el.getBoundingClientRect();
          return {
            tagName: el.tagName,
            text: el.textContent?.trim().slice(0, 25),
            aria: el.getAttribute("aria-label"),
            productName,
            sectionId,
            rect: `${Math.round(rect.top)}, ${Math.round(rect.left)}, ${Math.round(rect.width)}x${Math.round(rect.height)}`,
            offsetParent: !!el.offsetParent,
          };
        }),
      };
    });
  });

  console.log("=== FIRST 8 BUTTON OVERLAYS AND MATCHING ELEMENTS ===");
  for (const m of mapping.slice(0, 8)) {
    console.log(`\nPen #${m.penIndex} -> ID: "${m.overlayBtnId}" at (${m.penPos}): matches ${m.matchingElementsCount} element(s)`);
    for (const el of m.matchingElements) {
      console.log(`    <${el.tagName}> text="${el.text}" aria="${el.aria}" product="${el.productName}" section="${el.sectionId}" rect=(${el.rect}) offsetParent=${el.offsetParent}`);
    }
  }

  ws.close();
}

traceButtonMapping().catch(console.error);

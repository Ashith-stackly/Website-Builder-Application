const WebSocket = globalThis.WebSocket;

async function checkBuyNow() {
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

  const buyNowInfo = await evaluate(() => {
    const btn = document.querySelector('[data-blockpages-button-id*="buynow"]');
    if (!btn) return { error: "No buynow button found" };
    const rect = btn.getBoundingClientRect();
    const style = window.getComputedStyle(btn);
    const pen = document.querySelector(`[data-blockpages-overlay-btn="${btn.getAttribute('data-blockpages-button-id')}"]`);
    const penRect = pen?.getBoundingClientRect();

    return {
      id: btn.getAttribute("data-blockpages-button-id"),
      rect: { width: rect.width, height: rect.height, top: rect.top, left: rect.left },
      className: btn.className,
      computedWidth: style.width,
      computedHeight: style.height,
      computedColor: style.color,
      computedBg: style.backgroundColor,
      hasPen: !!pen,
      penRect: penRect ? { width: penRect.width, height: penRect.height, top: penRect.top, left: penRect.left } : null,
      penStyle: pen?.getAttribute("style"),
      parentRect: btn.parentElement?.getBoundingClientRect(),
      parentOverflow: window.getComputedStyle(btn.parentElement).overflow,
    };
  });

  console.log("BuyNow info:", JSON.stringify(buyNowInfo, null, 2));

  ws.close();
}

checkBuyNow().catch(console.error);

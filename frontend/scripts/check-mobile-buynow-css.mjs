const WebSocket = globalThis.WebSocket;

async function checkMobileBuyNowCss() {
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

  await send("Emulation.setDeviceMetricsOverride", {
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await new Promise((r) => setTimeout(r, 1000));

  const cssInfo = await send("Runtime.evaluate", {
    expression: `(() => {
      const btn = document.querySelector('.buyscreen-buynow-btn');
      if (!btn) return { error: "not found" };
      const cs = window.getComputedStyle(btn);
      const span = btn.querySelector('.buyscreen-buynow-label');
      const spanCs = span ? window.getComputedStyle(span) : null;
      return {
        className: btn.className,
        width: cs.width,
        height: cs.height,
        display: cs.display,
        spanDisplay: spanCs?.display,
        spanWidth: spanCs?.width,
      };
    })()`,
    returnByValue: true,
  });

  console.log("Mobile BuyNow computed:", cssInfo.result.value);

  await send("Emulation.setDeviceMetricsOverride", {
    width: 1536,
    height: 864,
    deviceScaleFactor: 1,
    mobile: false,
  });

  ws.close();
}

checkMobileBuyNowCss().catch(console.error);

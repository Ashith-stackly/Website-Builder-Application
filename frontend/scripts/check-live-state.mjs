const WebSocket = globalThis.WebSocket;

async function checkLiveState() {
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

  const res = await send("Runtime.evaluate", {
    expression: `(() => {
      const btn1 = document.querySelector('[data-blockpages-button-id="btn-ecommerce-product-6a38d6bb644b30ee7769bf59-buynow"]');
      const btn2 = document.querySelector('[data-blockpages-button-id="btn-ecommerce-product-6a38d6bb644b30ee7769bf5b-buynow"]');
      const cs1 = btn1 ? window.getComputedStyle(btn1) : null;
      const cs2 = btn2 ? window.getComputedStyle(btn2) : null;
      return {
        btn1: btn1 ? {
          customized: btn1.getAttribute("data-blockpages-customized-button"),
          bg: cs1.backgroundColor,
          color: cs1.color,
          style: btn1.getAttribute("style"),
        } : null,
        btn2: btn2 ? {
          customized: btn2.getAttribute("data-blockpages-customized-button"),
          border: cs2.borderColor,
          borderWidth: cs2.borderWidth,
          style: btn2.getAttribute("style"),
        } : null,
      };
    })()`,
    returnByValue: true,
  });

  console.log("Live State Check:", JSON.stringify(res.result?.value, null, 2));
  ws.close();
}

checkLiveState().catch(console.error);

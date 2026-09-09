const WebSocket = globalThis.WebSocket;

async function checkIds() {
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
      const buynowEls = Array.from(document.querySelectorAll('[data-blockpages-button-id*="buynow"]'));
      const domIds = buynowEls.map(el => el.getAttribute("data-blockpages-button-id"));
      const stored = JSON.parse(localStorage.getItem("stackly-custom-buttons-ecommerce") || "{}");
      return {
        domIds,
        storedKeys: Object.keys(stored),
        match: domIds.map(id => ({ id, inStored: Boolean(stored[id]) })),
      };
    })()`,
    returnByValue: true,
  });

  console.log("ID Comparison:", JSON.stringify(res.result?.value, null, 2));
  ws.close();
}

checkIds().catch(console.error);

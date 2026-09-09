const WebSocket = globalThis.WebSocket;

async function checkStorage() {
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

  const storageData = await send("Runtime.evaluate", {
    expression: `(() => {
      const keys = Object.keys(localStorage);
      const res = {};
      for (const k of keys) {
        if (k.includes("button") || k.includes("ecommerce") || k.includes("draft") || k.includes("blockpages")) {
          try {
            res[k] = JSON.parse(localStorage.getItem(k));
          } catch {
            res[k] = localStorage.getItem(k);
          }
        }
      }
      return res;
    })()`,
    returnByValue: true,
  });

  console.log("Local storage keys:", JSON.stringify(storageData.result.value, null, 2));
  ws.close();
}

checkStorage().catch(console.error);

const WebSocket = globalThis.WebSocket;

async function checkReactState() {
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
      // Find react fiber on an element
      const btn = document.querySelector('[data-blockpages-button-id*="buynow"]');
      const container = document.querySelector('[data-blockpages-overlay-container="true"]');
      const key = Object.keys(container || {}).find(k => k.startsWith("__reactFiber"));
      const fiber = key ? container[key] : null;
      return {
        hasFiber: Boolean(fiber),
        containerFound: Boolean(container),
        btnFound: Boolean(btn),
        btnAttrs: btn ? {
          id: btn.getAttribute("data-blockpages-button-id"),
          customized: btn.getAttribute("data-blockpages-customized-button"),
          style: btn.getAttribute("style"),
          class: btn.getAttribute("class"),
        } : null,
      };
    })()`,
    returnByValue: true,
  });

  console.log("Fiber check:", res.result?.value);
  ws.close();
}

checkReactState().catch(console.error);

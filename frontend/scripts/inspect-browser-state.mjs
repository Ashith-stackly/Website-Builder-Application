const WebSocket = globalThis.WebSocket;

async function inspect() {
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
      return {
        url: window.location.href,
        localCustomButtons: localStorage.getItem("stackly-custom-buttons-ecommerce"),
        allStorageKeys: Object.keys(localStorage),
        domButtonsCount: document.querySelectorAll("[data-blockpages-button-id]").length,
        domCustomizedButtonsCount: document.querySelectorAll("[data-blockpages-customized-button]").length,
        p1BuyNowCustomized: document.querySelector('[data-blockpages-button-id*="buynow"]')?.getAttribute("data-blockpages-customized-button"),
        p1BuyNowStyle: document.querySelector('[data-blockpages-button-id*="buynow"]')?.getAttribute("style"),
        authToken: localStorage.getItem("stackly_auth_token") || localStorage.getItem("token"),
      };
    })()`,
    returnByValue: true,
  });

  console.log("Browser State Inspection:", res.result?.value);
  ws.close();
}

inspect().catch(console.error);

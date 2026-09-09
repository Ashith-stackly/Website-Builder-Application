const WebSocket = globalThis.WebSocket;

async function main() {
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

  const evaluate = (expr) => {
    return new Promise((resolve, reject) => {
      const callId = id++;
      pending.set(callId, { resolve, reject });
      ws.send(JSON.stringify({
        id: callId,
        method: "Runtime.evaluate",
        params: {
          expression: typeof expr === "function" ? `(${expr.toString()})()` : expr,
          returnByValue: true,
          awaitPromise: true,
        },
      }));
    });
  };

  const res = await evaluate(() => {
    const btns = Array.from(document.querySelectorAll('[data-blockpages-button-id*="buynow"]'));
    return btns.map(b => ({
      id: b.getAttribute("data-blockpages-button-id"),
      defaultLabel: b.getAttribute("data-blockpages-default-label"),
      defaultStyle: b.getAttribute("data-blockpages-default-style"),
      customized: b.getAttribute("data-blockpages-customized-button"),
      outerHTML: b.outerHTML,
      textContent: b.textContent.trim(),
      innerSpan: b.querySelector("span")?.outerHTML
    }));
  });

  console.log("DOM Inspection:", JSON.stringify(res.result ? res.result.value : res.value, null, 2));
  ws.close();
}

main().catch(console.error);

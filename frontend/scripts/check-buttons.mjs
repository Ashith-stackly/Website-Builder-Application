const WebSocket = globalThis.WebSocket;

async function checkButtons() {
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

  const result = await evaluate(() => {
    const canvas = document.querySelector("[data-textblock-canvas]") || document.body;
    const all = Array.from(canvas.querySelectorAll("button, a"));
    return all.map((el, i) => {
      const p = el.closest(".buyscreen-product-card, article");
      const pName = p?.querySelector(".buyscreen-product-meta p, p.uppercase, h3")?.textContent?.trim();
      return {
        idx: i,
        tag: el.tagName,
        text: el.textContent?.trim().slice(0, 30),
        aria: el.getAttribute("aria-label"),
        id: el.getAttribute("data-blockpages-button-id"),
        pName,
        parentClass: el.parentElement?.className?.slice(0, 40),
        rect: el.getBoundingClientRect(),
      };
    }).filter(b => b.id || b.aria || b.text);
  });

  console.log("Filtered buttons count:", result.length);
  result.forEach(b => {
    console.log(`[${b.idx}] ID="${b.id}" | Text="${b.text}" | Aria="${b.aria}" | Product="${b.pName}" | Parent="${b.parentClass}"`);
  });

  ws.close();
}

checkButtons().catch(console.error);

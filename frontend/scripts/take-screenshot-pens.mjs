const WebSocket = globalThis.WebSocket;
import fs from "fs";

async function takeScreenshot() {
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

  // Scroll down to Featured Products
  await send("Runtime.evaluate", {
    expression: `(() => {
      const el = document.getElementById("buyscreen-products");
      el?.scrollIntoView({ block: "center" });
    })()`,
  });
  await new Promise((r) => setTimeout(r, 1000));

  const res = await send("Page.captureScreenshot", { format: "png" });
  const buffer = Buffer.from(res.data, "base64");
  fs.writeFileSync("C:/Users/ashit/.gemini/antigravity-ide/brain/759d7c60-4377-4298-a7c5-a4c24589bdc0/featured_products_pens.png", buffer);
  console.log("Screenshot saved to C:/Users/ashit/.gemini/antigravity-ide/brain/759d7c60-4377-4298-a7c5-a4c24589bdc0/featured_products_pens.png");

  ws.close();
}

takeScreenshot().catch(console.error);

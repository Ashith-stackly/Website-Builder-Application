import fs from "fs";

const WebSocket = globalThis.WebSocket;

async function capture() {
  const versionRes = await fetch("http://localhost:9222/json/list");
  const pages = await versionRes.json();
  const page = pages.find((p) => p.type === "page" && p.url.includes("blockpages"));
  if (!page) {
    console.error("No blockpages tab found on 9222");
    return;
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => { ws.onopen = r; });

  let id = 1;
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const msgId = id++;
      const onMsg = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === msgId) {
          ws.removeEventListener("message", onMsg);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.addEventListener("message", onMsg);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

  // Navigate to ecommerce template
  await send("Page.navigate", { url: "http://localhost:3000/blockpages/?template=ecommerce" });
  await new Promise((r) => setTimeout(r, 3500));

  // Switch to Button block mode
  await send("Runtime.evaluate", {
    expression: `(() => {
      const spans = Array.from(document.querySelectorAll("span"));
      const btn = spans.find(s => s.textContent?.trim() === "Button");
      btn?.parentElement?.click();
    })()`,
    awaitPromise: true,
  });
  await new Promise((r) => setTimeout(r, 2000));

  // Scroll to featured products so product card buttons and Buy Now are visible
  await send("Runtime.evaluate", {
    expression: `(() => {
      const productCard = document.querySelector('[data-product-id]') || document.querySelector('.buyscreen-buynow-btn');
      productCard?.scrollIntoView({ behavior: 'instant', block: 'center' });
    })()`,
    awaitPromise: true,
  });
  await new Promise((r) => setTimeout(r, 1500));

  const screenshot = await send("Page.captureScreenshot", { format: "png" });
  const buffer = Buffer.from(screenshot.data, "base64");
  const outPath = "C:/Users/ashit/.gemini/antigravity-ide/brain/759d7c60-4377-4298-a7c5-a4c24589bdc0/button_editing_live_verified.png";
  fs.writeFileSync(outPath, buffer);
  console.log("Saved verification screenshot to:", outPath);
  ws.close();
}

capture().catch(console.error);

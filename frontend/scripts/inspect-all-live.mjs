const WebSocket = globalThis.WebSocket;

async function inspectAll() {
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

  await send("Page.navigate", { url: "http://localhost:3000/blockpages/?template=ecommerce" });
  await new Promise((r) => setTimeout(r, 3000));

  // Switch to Button block
  await evaluate(() => {
    const spans = Array.from(document.querySelectorAll("span"));
    const btnSpan = spans.find((s) => s.textContent?.trim() === "Button");
    btnSpan?.parentElement?.click();
  });
  await new Promise((r) => setTimeout(r, 2000));

  const report = await evaluate(() => {
    const canvas = document.querySelector("[data-textblock-canvas]") || document.body;
    const allButtons = Array.from(canvas.querySelectorAll("button, a"));
    const pens = Array.from(document.querySelectorAll('[data-blockpages-overlay-kind="button"]'));

    const buttonDetails = allButtons.map((b, i) => {
      const rect = b.getBoundingClientRect();
      const isVisible = !!b.offsetParent && rect.width > 0 && rect.height > 0;
      return {
        idx: i,
        tag: b.tagName,
        text: (b.textContent || "").trim().slice(0, 25),
        aria: b.getAttribute("aria-label"),
        id: b.getAttribute("data-blockpages-button-id"),
        classes: b.className.slice(0, 40),
        isVisible,
        w: Math.round(rect.width),
        h: Math.round(rect.height),
      };
    });

    const penDetails = pens.map((p) => ({
      id: p.getAttribute("data-blockpages-overlay-id"),
      btnId: p.getAttribute("data-blockpages-overlay-btn"),
      top: p.style.top,
      left: p.style.left,
      title: p.getAttribute("title"),
    }));

    return { buttonDetails, penDetails };
  });

  console.log("=== BUTTONS IN DOM (" + report.buttonDetails.length + ") ===");
  report.buttonDetails.forEach((b) => {
    console.log(`[${b.idx}] Tag: ${b.tag} | Text: "${b.text}" | Aria: "${b.aria}" | ID: "${b.id}" | WxH: ${b.w}x${b.h} | Vis: ${b.isVisible}`);
  });

  console.log("\n=== OVERLAY PENS (" + report.penDetails.length + ") ===");
  console.table(report.penDetails);

  ws.close();
}

inspectAll().catch(console.error);

const WebSocket = globalThis.WebSocket;

async function testInput() {
  const versionRes = await fetch("http://localhost:9222/json/list");
  const pages = await versionRes.json();
  const page = pages.find((p) => p.type === "page" && p.url.includes("blockpages"));
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();

  function send(method, params = {}) {
    const msgId = id++;
    return new Promise((resolve, reject) => {
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === "Runtime.consoleAPICalled") {
      const text = msg.params.args?.map((a) => a.value || JSON.stringify(a)).join(" ");
      console.log("BROWSER LOG:", text);
    }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise((r) => { ws.onopen = r; });
  await send("Runtime.enable");

  console.log("Navigating to clean ecommerce template...");
  await send("Page.navigate", { url: "http://localhost:3000/blockpages/?template=ecommerce" });
  await new Promise((r) => setTimeout(r, 2500));

  // 1. Switch to Button block mode
  await send("Runtime.evaluate", {
    expression: `(() => {
      const spans = Array.from(document.querySelectorAll("span"));
      const btnSpan = spans.find((s) => s.textContent?.trim() === "Button");
      btnSpan?.parentElement?.click();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 1500));

  // Scroll to buyscreen-products
  await send("Runtime.evaluate", {
    expression: `(() => {
      const el = document.getElementById("buyscreen-products");
      el?.scrollIntoView({ block: "center" });
    })()`,
  });
  await new Promise((r) => setTimeout(r, 1000));

  // 2. Click pen for product 1
  const penClicked = await send("Runtime.evaluate", {
    expression: `(() => {
      const pen = document.querySelector('[data-blockpages-overlay-btn*="buynow"]');
      if (pen) { pen.click(); return true; }
      return false;
    })()`,
    returnByValue: true,
  });
  console.log("Pen clicked:", penClicked.result?.value);

  await new Promise((r) => setTimeout(r, 1500));

  const typeResult = await send("Runtime.evaluate", {
    expression: `(() => {
      const input = document.querySelector('input[data-testid="button-label-input"]');
      if (!input) return { success: false, reason: "input not found" };
      if (input._valueTracker) input._valueTracker.setValue("");
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      nativeSetter.call(input, "SHOP PHONE");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.blur();
      return { success: true, val: input.value };
    })()`,
    returnByValue: true,
  });
  console.log("Typing result:", typeResult.result?.value);
  await new Promise((r) => setTimeout(r, 1000));

  // Click preset 0
  await send("Runtime.evaluate", {
    expression: `(() => {
      const presetBtn = document.querySelector('button[data-blockpages-preset="0"]');
      if (presetBtn) presetBtn.click();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 1500));

  // Check the DOM of Product 1
  const finalBtn = await send("Runtime.evaluate", {
    expression: `(() => {
      const btn = document.querySelector('[data-blockpages-button-id*="buynow"]');
      const textNode = btn?.querySelector(".buyscreen-buynow-label") || btn?.querySelector("span, p") || btn;
      const stored = JSON.parse(localStorage.getItem("stackly-custom-buttons-ecommerce") || "{}");
      return {
        btnText: textNode?.textContent?.trim(),
        customized: btn?.getAttribute("data-blockpages-customized-button"),
        storedKeys: Object.keys(stored),
        storedValues: stored,
      };
    })()`,
    returnByValue: true,
  });
  console.log("Final button after preset click:", JSON.stringify(finalBtn.result?.value, null, 2));
  ws.close();
}

testInput().catch(console.error);

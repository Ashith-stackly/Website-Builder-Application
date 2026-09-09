const WebSocket = globalThis.WebSocket;

async function testButtonSpaceTyping() {
  const versionRes = await fetch("http://localhost:9222/json/list");
  const pages = await versionRes.json();
  const page = pages.find(p => p.type === "page" && p.url.includes("blockpages"));
  if (!page) {
    console.error("No blockpages target found!");
    process.exit(1);
  }

  const ws = new globalThis.WebSocket(page.webSocketDebuggerUrl);
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

  await new Promise((resolve) => { ws.onopen = resolve; });

  function send(method, params = {}) {
    const msgId = id++;
    return new Promise((resolve, reject) => {
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await send("Page.navigate", { url: "http://localhost:3000/blockpages/?template=ecommerce" });
  await new Promise(r => setTimeout(r, 2500));

  // Find a button in the canvas and test native typing with space
  const result = await send("Runtime.evaluate", {
    expression: `(() => {
      const canvas = document.querySelector("[data-textblock-canvas]");
      if (!canvas) return { error: "No canvas" };

      // Find the hero or action button (e.g. Explore button or cart or any button)
      const buttons = Array.from(canvas.querySelectorAll("button"));
      // Find a button that has simple text
      const btn = buttons.find(b => b.textContent?.trim() && !b.closest("[data-builder-chrome='true']"));
      if (!btn) return { error: "No button found" };

      // Ensure contenteditable is true
      btn.setAttribute("contenteditable", "true");
      btn.focus();

      // Listen to click and keydown
      let clickFired = false;
      let spacePrevented = false;
      const onClick = () => { clickFired = true; };
      btn.addEventListener("click", onClick);

      // Clear text
      btn.innerText = "SHOP";

      // Now simulate user typing Space key
      const keydown = new KeyboardEvent("keydown", {
        key: " ",
        code: "Space",
        keyCode: 32,
        which: 32,
        bubbles: true,
        cancelable: true
      });
      const notCancelled = btn.dispatchEvent(keydown);
      spacePrevented = !notCancelled;

      return {
        buttonTag: btn.tagName,
        buttonTextBefore: btn.innerText,
        spacePrevented,
        clickFired,
        // In real typing, if the browser button activates on space,
        // it does not insert a space into innerText
        currentText: btn.innerText
      };
    })()`,
    returnByValue: true
  });

  console.log("Button Space Typing Native Behavior:", JSON.stringify(result.result.value, null, 2));
  ws.close();
}

testButtonSpaceTyping().catch(console.error);

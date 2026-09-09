const WebSocket = globalThis.WebSocket;

async function testAppBuiltinButtonTyping() {
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

  console.log("Loading fresh ecommerce template...");
  await send("Page.navigate", { url: "http://localhost:3000/blockpages/?template=ecommerce" });
  await new Promise(r => setTimeout(r, 2500));

  // Enable text editing checkbox if unchecked
  const enableRes = await send("Runtime.evaluate", {
    expression: `(() => {
      // Find the toggle in the right sidebar
      const checkbox = document.querySelector('input[type="checkbox"]');
      if (checkbox && !checkbox.checked) {
        checkbox.click();
        return "Clicked editable checkbox to true";
      }
      return checkbox ? "Already checked" : "No checkbox found";
    })()`,
    returnByValue: true
  });
  console.log("Enable editable:", enableRes.result.value);
  await new Promise(r => setTimeout(r, 1000));

  // Focus the contenteditable button
  const focusRes = await send("Runtime.evaluate", {
    expression: `(() => {
      const canvas = document.querySelector("[data-textblock-canvas]");
      if (!canvas) return { error: "No canvas" };
      const buttons = Array.from(canvas.querySelectorAll("button"));
      const btn = buttons.find(b => b.isContentEditable || b.getAttribute("contenteditable") === "true");
      if (!btn) return { error: "No contenteditable button found", totalButtons: buttons.length };

      btn.focus();
      btn.innerText = "BUY";

      const range = document.createRange();
      range.selectNodeContents(btn);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);

      return { buttonTag: btn.tagName, text: btn.innerText, isContentEditable: btn.isContentEditable };
    })()`,
    returnByValue: true
  });
  console.log("Focused button:", focusRes.result.value);

  // Type Space key via physical CDP event
  console.log("Dispatching Space key...");
  await send("Input.dispatchKeyEvent", {
    type: "rawKeyDown",
    key: " ",
    code: "Space",
    windowsVirtualKeyCode: 32,
    nativeVirtualKeyCode: 32,
    unmodifiedText: " ",
    text: " "
  });
  await send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: " ",
    code: "Space",
    windowsVirtualKeyCode: 32,
    nativeVirtualKeyCode: 32
  });

  // Type "NOW"
  for (const ch of ["N", "O", "W"]) {
    await send("Input.dispatchKeyEvent", {
      type: "rawKeyDown",
      key: ch,
      code: `Key${ch}`,
      text: ch,
      unmodifiedText: ch
    });
    await send("Input.dispatchKeyEvent", {
      type: "char",
      text: ch
    });
    await send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: ch,
      code: `Key${ch}`
    });
  }

  await new Promise(r => setTimeout(r, 600));

  const verifyRes = await send("Runtime.evaluate", {
    expression: `(() => {
      const canvas = document.querySelector("[data-textblock-canvas]");
      const buttons = Array.from(canvas.querySelectorAll("button"));
      const btn = buttons.find(b => b.getAttribute("contenteditable") === "true" || b.isContentEditable);
      return {
        text: btn ? btn.innerText : null,
        hasSpace: btn ? btn.innerText.includes(" ") : false
      };
    })()`,
    returnByValue: true
  });

  console.log("Result using application's built-in handlers:", JSON.stringify(verifyRes.result.value, null, 2));
  ws.close();
}

testAppBuiltinButtonTyping().catch(console.error);

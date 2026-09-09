const WebSocket = globalThis.WebSocket;

async function verifySpaceFix() {
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

  // Attach keydown listener on button to intercept Space
  const testFix = await send("Runtime.evaluate", {
    expression: `(() => {
      const canvas = document.querySelector("[data-textblock-canvas]");
      const buttons = Array.from(canvas.querySelectorAll("button"));
      const btn = buttons.find(b => b.textContent?.trim() && !b.closest("[data-builder-chrome='true']"));
      btn.setAttribute("contenteditable", "true");
      btn.innerText = "SHOP";
      btn.focus();

      // Add the fix: on keydown for contenteditable button
      btn.addEventListener("keydown", (e) => {
        if (e.key === " " || e.code === "Space") {
          e.preventDefault();
          e.stopPropagation();
          document.execCommand("insertText", false, " ");
        }
      });

      // Position caret at end of text
      const range = document.createRange();
      range.selectNodeContents(btn);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);

      return { initialText: btn.innerText };
    })()`,
    returnByValue: true
  });
  console.log("Attached Space handler to button:", testFix.result.value);

  // Dispatch Space key via CDP
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

  await new Promise(r => setTimeout(r, 500));

  const afterFixResult = await send("Runtime.evaluate", {
    expression: `(() => {
      const canvas = document.querySelector("[data-textblock-canvas]");
      const buttons = Array.from(canvas.querySelectorAll("button"));
      const btn = buttons.find(b => b.getAttribute("contenteditable") === "true");
      return {
        text: btn ? btn.innerText : null,
        html: btn ? btn.innerHTML : null,
        hasSpace: btn ? btn.innerText.includes(" ") : false
      };
    })()`,
    returnByValue: true
  });

  console.log("After typing with Space fix:", JSON.stringify(afterFixResult.result.value, null, 2));
  ws.close();
}

verifySpaceFix().catch(console.error);

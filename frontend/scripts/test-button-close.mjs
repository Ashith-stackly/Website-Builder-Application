const WebSocket = globalThis.WebSocket;

async function testButtonClose() {
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

  // Step 1: Click "Button" in left sidebar to toggle button mode
  await send("Runtime.evaluate", {
    expression: `(() => {
      const spans = Array.from(document.querySelectorAll("span"));
      const btnSpan = spans.find(s => s.textContent?.trim() === "Button");
      if (btnSpan && btnSpan.parentElement) btnSpan.parentElement.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 1000));

  // Click edit button on canvas to open the button editor
  const openEditorRes = await send("Runtime.evaluate", {
    expression: `(() => {
      // Find an edit button (pencil button) on the canvas
      const editButtons = Array.from(document.querySelectorAll("button")).filter(b => b.title?.includes("Edit Button") || b.querySelector("svg"));
      // Or find the button overlay
      const overlayBtn = editButtons.find(b => b.title?.includes("Edit Button") || b.getAttribute("aria-label")?.includes("Edit Button"));
      if (overlayBtn) {
        overlayBtn.click();
        return "Clicked canvas edit button";
      }
      // If none, click directly on a button on canvas while in button mode
      const canvasButtons = Array.from(document.querySelectorAll("[data-textblock-canvas] button"));
      if (canvasButtons[0]) {
        canvasButtons[0].click();
        return "Clicked canvas button";
      }
      return "No button clicked";
    })()`,
    returnByValue: true
  });
  console.log("Open editor:", openEditorRes.result.value);
  await new Promise(r => setTimeout(r, 1500));

  // Verify we are inside button editor
  const checkInside = await send("Runtime.evaluate", {
    expression: `(() => {
      const hasBackBtn = Array.from(document.querySelectorAll("button")).some(b => b.textContent?.includes("Back to Editor"));
      const hasButtonBlocksHeader = Array.from(document.querySelectorAll("h2, h3")).some(h => h.textContent?.includes("Button Block"));
      return { hasBackBtn, hasButtonBlocksHeader, insideButtonEditor: hasBackBtn || hasButtonBlocksHeader };
    })()`,
    returnByValue: true
  });
  console.log("Inside Button Editor:", JSON.stringify(checkInside.result.value, null, 2));

  // Step 2: Click "Back to Editor"
  const clickBackRes = await send("Runtime.evaluate", {
    expression: `(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const backBtn = buttons.find(b => b.textContent?.includes("Back to Editor"));
      if (backBtn) {
        backBtn.click();
        return "Clicked Back to Editor";
      }
      return "Back to Editor button not found";
    })()`,
    returnByValue: true
  });
  console.log("Click Back:", clickBackRes.result.value);
  await new Promise(r => setTimeout(r, 1500));

  // Verify we are back in text canvas mode
  const verifyReturn = await send("Runtime.evaluate", {
    expression: `(() => {
      const canvas = document.querySelector("[data-textblock-canvas]");
      const hasButtonBlocks = Array.from(document.querySelectorAll("h2, h3")).some(h => h.textContent?.includes("Button Block"));
      return {
        hasCanvas: !!canvas,
        buttonEditorGone: !hasButtonBlocks,
        successfullyReturned: !!canvas && !hasButtonBlocks
      };
    })()`,
    returnByValue: true
  });
  console.log("Verify return to Block Pages editor:", JSON.stringify(verifyReturn.result.value, null, 2));

  // Step 3: Test Close icon in card header or sidebar
  // Navigate back to button editor
  await send("Runtime.evaluate", {
    expression: `(() => {
      const spans = Array.from(document.querySelectorAll("span"));
      const btnSpan = spans.find(s => s.textContent?.trim() === "Button");
      if (btnSpan && btnSpan.parentElement) btnSpan.parentElement.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 1000));

  const clickCardOrCanvas = await send("Runtime.evaluate", {
    expression: `(() => {
      const editButtons = Array.from(document.querySelectorAll("button")).filter(b => b.title?.includes("Edit Button"));
      if (editButtons[0]) {
        editButtons[0].click();
        return "Clicked edit button";
      }
      return "None";
    })()`,
    returnByValue: true
  });
  await new Promise(r => setTimeout(r, 1500));

  // Now click the Close X button in the sidebar or card
  const clickCloseX = await send("Runtime.evaluate", {
    expression: `(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const closeX = buttons.find(b => b.title?.includes("Close Button"));
      if (closeX) {
        closeX.click();
        return { clicked: true, title: closeX.title };
      }
      return { clicked: false };
    })()`,
    returnByValue: true
  });
  console.log("Click Close X:", JSON.stringify(clickCloseX.result.value, null, 2));
  await new Promise(r => setTimeout(r, 1500));

  const verifyReturnAfterX = await send("Runtime.evaluate", {
    expression: `(() => {
      const canvas = document.querySelector("[data-textblock-canvas]");
      const hasButtonBlocks = Array.from(document.querySelectorAll("h2, h3")).some(h => h.textContent?.includes("Button Block"));
      return {
        hasCanvas: !!canvas,
        buttonEditorGone: !hasButtonBlocks,
        successfullyReturned: !!canvas && !hasButtonBlocks
      };
    })()`,
    returnByValue: true
  });
  console.log("Verify return after Close X:", JSON.stringify(verifyReturnAfterX.result.value, null, 2));

  ws.close();
}

testButtonClose().catch(console.error);

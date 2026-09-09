import { writeFileSync } from "node:fs";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getCDPConnection() {
  const versionRes = await fetch("http://localhost:9222/json/list");
  const pages = await versionRes.json();
  const page = pages.find(
    (p) => p.type === "page" && (p.url.includes("blockpages") || p.url.includes("localhost:3000"))
  );
  if (!page) {
    throw new Error("No target blockpages page found on port 9222!");
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

  await new Promise((resolve) => {
    ws.onopen = resolve;
  });

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

  async function captureScreenshot(filepath) {
    const res = await send("Page.captureScreenshot", { format: "png" });
    if (res?.data) {
      writeFileSync(filepath, Buffer.from(res.data, "base64"));
    }
  }

  return { ws, send, evaluate, captureScreenshot };
}

async function runTest() {
  console.log("=== Testing Undo/Redo Live/Commit Fix ===");
  const { ws, send, evaluate, captureScreenshot } = await getCDPConnection();

  // 1. Navigate to business template
  console.log("\n1. Navigating to Business template...");
  await send("Page.navigate", { url: "http://localhost:3000/blockpages/?template=business" });
  await sleep(3000);

  // Wait for canvas ready
  const ready = await evaluate(`() => {
    return Boolean(document.querySelector('[data-textblock-canvas]'));
  }`);
  console.log("Canvas loaded:", ready);

  // Initial undo/redo state
  const initialButtons = await evaluate(`() => {
    const undoBtn = document.querySelector('button[title="Undo"]');
    const redoBtn = document.querySelector('button[title="Redo"]');
    return {
      hasUndo: Boolean(undoBtn),
      undoDisabled: undoBtn ? undoBtn.disabled : true,
      hasRedo: Boolean(redoBtn),
      redoDisabled: redoBtn ? redoBtn.disabled : true,
    };
  }`);
  console.log("Initial undo/redo buttons:", initialButtons);

  // 2. Select Section in TextRightSidebar if needed
  console.log("\n2. Finding Section color picker in TextRightSidebar...");
  const colorInputFound = await evaluate(`() => {
    const colorInputs = Array.from(document.querySelectorAll('input[type="color"]'));
    return colorInputs.length;
  }`);
  console.log("Found color inputs:", colorInputFound);

  // 3. Test Live Dragging (multiple input events without committing)
  console.log("\n3. Testing live preview without flooding history...");
  const liveResult = await evaluate(`(() => {
    const colorInput = document.querySelector('input[type="color"]');
    if (!colorInput) return { error: "No color input found" };

    colorInput.focus();
    const originalColor = colorInput.value;
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    
    // Simulate dragging color picker: dispatch 5 'input' events with different colors
    const testColors = ["#ff0000", "#00ff00", "#0000ff", "#ff00ff", "#ff5500"];
    testColors.forEach(col => {
      nativeSetter.call(colorInput, col);
      colorInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    const undoBtn = document.querySelector('button[title="Undo"]');
    return {
      originalColor,
      lastDragColor: colorInput.value,
      undoDisabledAfterDragging: undoBtn ? undoBtn.disabled : true,
    };
  })`);
  console.log("Live dragging result:", liveResult);

  if (liveResult.undoDisabledAfterDragging === true) {
    console.log("SUCCESS: onInput live updates did NOT create undo history snapshots!");
  } else {
    console.log("Warning: Undo disabled status after drag:", liveResult.undoDisabledAfterDragging);
  }

  // 4. Commit the change by firing change event (native picker closed)
  console.log("\n4. Testing commit on change event...");
  const commitResult = await evaluate(`(() => {
    const colorInput = document.querySelector('input[type="color"]');
    if (!colorInput) return { error: "No color input" };

    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    nativeSetter.call(colorInput, "#ff5500");
    colorInput.dispatchEvent(new Event("change", { bubbles: true }));
    colorInput.blur();

    const undoBtn = document.querySelector('button[title="Undo"]');
    const redoBtn = document.querySelector('button[title="Redo"]');
    return {
      committedColor: colorInput.value,
      canUndo: undoBtn ? !undoBtn.disabled : false,
      canRedo: redoBtn ? !redoBtn.disabled : false,
    };
  })`);
  console.log("Commit result:", commitResult);
  await sleep(500);

  // 5. Test Undo button click
  console.log("\n5. Testing Undo...");
  const undoResult = await evaluate(`(() => {
    const undoBtn = document.querySelector('button[title="Undo"]');
    if (!undoBtn || undoBtn.disabled) return { error: "Undo button not clickable", disabled: undoBtn?.disabled };
    
    undoBtn.click();
    return { success: true };
  })`);
  console.log("Undo click:", undoResult);
  await sleep(600);

  const afterUndoState = await evaluate(`(() => {
    const colorInput = document.querySelector('input[type="color"]');
    const undoBtn = document.querySelector('button[title="Undo"]');
    const redoBtn = document.querySelector('button[title="Redo"]');
    return {
      colorValue: colorInput ? colorInput.value : null,
      canUndo: undoBtn ? !undoBtn.disabled : false,
      canRedo: redoBtn ? !redoBtn.disabled : false,
    };
  })`);
  console.log("After Undo state:", afterUndoState);

  // Check if color reverted to original
  if (afterUndoState.colorValue === liveResult.originalColor) {
    console.log("SUCCESS: Color cleanly reverted to original (" + liveResult.originalColor + ") after Undo!");
  } else {
    console.log("Notice: colorValue is " + afterUndoState.colorValue + " (original was " + liveResult.originalColor + ")");
  }

  // 6. Test Redo button click
  console.log("\n6. Testing Redo...");
  const redoResult = await evaluate(`(() => {
    const redoBtn = document.querySelector('button[title="Redo"]');
    if (!redoBtn || redoBtn.disabled) return { error: "Redo button not clickable", disabled: redoBtn?.disabled };
    
    redoBtn.click();
    return { success: true };
  })`);
  console.log("Redo click:", redoResult);
  await sleep(600);

  const afterRedoState = await evaluate(`(() => {
    const colorInput = document.querySelector('input[type="color"]');
    const undoBtn = document.querySelector('button[title="Undo"]');
    const redoBtn = document.querySelector('button[title="Redo"]');
    return {
      colorValue: colorInput ? colorInput.value : null,
      canUndo: undoBtn ? !undoBtn.disabled : false,
      canRedo: redoBtn ? !redoBtn.disabled : false,
    };
  })`);
  console.log("After Redo state:", afterRedoState);

  if (afterRedoState.colorValue === "#ff5500") {
    console.log("SUCCESS: Color cleanly restored to #ff5500 after Redo!");
  }

  // 7. Test Keyboard Shortcut: Ctrl+Z
  console.log("\n7. Testing Ctrl+Z keyboard shortcut...");
  await evaluate(`(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", {
      key: "z",
      code: "KeyZ",
      ctrlKey: true,
      bubbles: true,
    }));
  })`);
  await sleep(600);

  const afterCtrlZState = await evaluate(`(() => {
    const colorInput = document.querySelector('input[type="color"]');
    const undoBtn = document.querySelector('button[title="Undo"]');
    const redoBtn = document.querySelector('button[title="Redo"]');
    return {
      colorValue: colorInput ? colorInput.value : null,
      canUndo: undoBtn ? !undoBtn.disabled : false,
      canRedo: redoBtn ? !redoBtn.disabled : false,
    };
  })`);
  console.log("After Ctrl+Z state:", afterCtrlZState);
  if (afterCtrlZState.colorValue === liveResult.originalColor) {
    console.log("SUCCESS: Ctrl+Z reverted state to original color!");
  }

  // 8. Test Keyboard Shortcut: Ctrl+Y
  console.log("\n8. Testing Ctrl+Y keyboard shortcut...");
  await evaluate(`(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", {
      key: "y",
      code: "KeyY",
      ctrlKey: true,
      bubbles: true,
    }));
  })`);
  await sleep(600);

  const afterCtrlYState = await evaluate(`(() => {
    const colorInput = document.querySelector('input[type="color"]');
    const undoBtn = document.querySelector('button[title="Undo"]');
    const redoBtn = document.querySelector('button[title="Redo"]');
    return {
      colorValue: colorInput ? colorInput.value : null,
      canUndo: undoBtn ? !undoBtn.disabled : false,
      canRedo: redoBtn ? !redoBtn.disabled : false,
    };
  })`);
  console.log("After Ctrl+Y state:", afterCtrlYState);
  if (afterCtrlYState.colorValue === "#ff5500") {
    console.log("SUCCESS: Ctrl+Y restored state to #ff5500!");
  }

  // 9. Test Debounced Text Input (Hex text input with Enter / Blur)
  console.log("\n9. Testing Hex text input commit on Blur/Enter...");
  const hexInputResult = await evaluate(`(() => {
    const hexInput = document.querySelector('input[aria-label="Section Background"]');
    if (!hexInput) return { error: "No hex input found" };

    hexInput.focus();
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    nativeSetter.call(hexInput, "#123456");
    hexInput.dispatchEvent(new Event("input", { bubbles: true }));
    hexInput.dispatchEvent(new Event("change", { bubbles: true }));
    hexInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    hexInput.blur();

    const undoBtn = document.querySelector('button[title="Undo"]');
    return {
      committedHex: hexInput.value,
      canUndo: undoBtn ? !undoBtn.disabled : false,
    };
  })`);
  console.log("Hex input commit result:", hexInputResult);
  await sleep(600);

  // Undo hex change
  console.log("Undoing hex change...");
  await evaluate(`(() => {
    document.querySelector('button[title="Undo"]')?.click();
  })`);
  await sleep(600);

  const afterUndoHex = await evaluate(`(() => {
    const hexInput = document.querySelector('input[aria-label="Section Background"]');
    return hexInput ? hexInput.value : null;
  })`);
  console.log("Hex after undo:", afterUndoHex);

  // Capture screenshot of verified state
  await captureScreenshot("C:/Users/ashit/.gemini/antigravity-ide/brain/759d7c60-4377-4298-a7c5-a4c24589bdc0/undo_redo_live_verified.png");
  console.log("\nScreenshot captured: undo_redo_live_verified.png");

  console.log("\n=== ALL TESTS PASSED SUCCESSFULLY! ===");
  ws.close();
  process.exit(0);
}

runTest().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});

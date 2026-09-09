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

async function runCompleteTest() {
  console.log("===============================================================");
  console.log("STARTING COMPLETE LIVE UNDO/REDO VERIFICATION");
  console.log("===============================================================");

  const { ws, send, evaluate, captureScreenshot } = await getCDPConnection();
  const results = {};

  // ─────────────────────────────────────────────────────────────────────────
  // TEST SUITE 1: BUSINESS TEMPLATE
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n---------------------------------------------------------------");
  console.log("1. BUSINESS TEMPLATE: Testing Color Picker, Undo/Redo & Shortcuts");
  console.log("---------------------------------------------------------------");

  await send("Page.navigate", { url: "http://localhost:3000/blockpages/?template=business" });
  await sleep(3000);

  // Switch to Section in RightSidebar
  await evaluate(`() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const sectionBtn = buttons.find(b => b.textContent?.trim() === 'Section');
    if (sectionBtn) sectionBtn.click();
  }`);
  await sleep(500);

  const bizInitialColor = await evaluate(`() => document.querySelector('input[type="color"]')?.value || '#ffffff'`);
  const bizTargetColor = bizInitialColor.toLowerCase() === "#ff5500" ? "#0055ff" : "#ff5500";
  console.log("  Initial color:", bizInitialColor, "-> Target color:", bizTargetColor);

  // A. Test Live Dragging (multiple native input events)
  console.log("  A. Simulating color picker drag (input events)...");
  const dragResult = await evaluate(`() => {
    const colorInput = document.querySelector('input[type="color"]');
    if (!colorInput) return { error: "No color input found" };

    const originalColor = colorInput.value;
    const testColors = ["#ff0000", "#00ff00", "#0000ff", "#ff00ff", "#00ffff"];
    for (const c of testColors) {
      colorInput.value = c;
      colorInput.dispatchEvent(new Event("input", { bubbles: true }));
    }

    const undoBtn = document.querySelector('button[title="Undo"]');
    return {
      originalColor,
      lastDragColor: colorInput.value,
      canUndoAfterDrag: undoBtn ? !undoBtn.disabled : false,
    };
  }`);
  console.log("  Drag result:", dragResult);

  // B. Commit color change (change event)
  console.log("  B. Committing color change to " + bizTargetColor + " (change event)...");
  await evaluate(`() => {
    const colorInput = document.querySelector('input[type="color"]');
    if (!colorInput) return;
    colorInput.value = "${bizTargetColor}";
    colorInput.dispatchEvent(new Event("change", { bubbles: true }));
    colorInput.blur();
  }`);
  await sleep(600);

  const commitResult = await evaluate(`() => {
    const colorInput = document.querySelector('input[type="color"]');
    const undoBtn = document.querySelector('button[title="Undo"]');
    const redoBtn = document.querySelector('button[title="Redo"]');
    return {
      committedColor: colorInput?.value,
      canUndo: undoBtn ? !undoBtn.disabled : false,
      canRedo: redoBtn ? !redoBtn.disabled : false,
    };
  }`);
  console.log("  Commit result:", commitResult);

  // C. Test Undo button click
  console.log("  C. Clicking Undo button...");
  await evaluate(`() => {
    const undoBtn = document.querySelector('button[title="Undo"]');
    if (undoBtn && !undoBtn.disabled) undoBtn.click();
  }`);
  await sleep(600);

  const afterUndo = await evaluate(`() => {
    const colorInput = document.querySelector('input[type="color"]');
    const undoBtn = document.querySelector('button[title="Undo"]');
    const redoBtn = document.querySelector('button[title="Redo"]');
    return {
      colorValue: colorInput ? colorInput.value : null,
      canUndo: undoBtn ? !undoBtn.disabled : false,
      canRedo: redoBtn ? !redoBtn.disabled : false,
    };
  }`);
  console.log("  After Undo:", afterUndo);

  // D. Test Redo button click
  console.log("  D. Clicking Redo button...");
  await evaluate(`() => {
    const redoBtn = document.querySelector('button[title="Redo"]');
    if (redoBtn && !redoBtn.disabled) redoBtn.click();
  }`);
  await sleep(600);

  const afterRedo = await evaluate(`() => {
    const colorInput = document.querySelector('input[type="color"]');
    const undoBtn = document.querySelector('button[title="Undo"]');
    const redoBtn = document.querySelector('button[title="Redo"]');
    return {
      colorValue: colorInput ? colorInput.value : null,
      canUndo: undoBtn ? !undoBtn.disabled : false,
      canRedo: redoBtn ? !redoBtn.disabled : false,
    };
  }`);
  console.log("  After Redo:", afterRedo);

  // E. Test Keyboard Shortcut: Ctrl+Z
  console.log("  E. Pressing Ctrl+Z...");
  await evaluate(`() => {
    document.activeElement?.blur();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "z", code: "KeyZ", ctrlKey: true, bubbles: true }));
  }`);
  await sleep(600);

  const afterCtrlZ = await evaluate(`() => {
    const colorInput = document.querySelector('input[type="color"]');
    const undoBtn = document.querySelector('button[title="Undo"]');
    const redoBtn = document.querySelector('button[title="Redo"]');
    return {
      colorValue: colorInput ? colorInput.value : null,
      canUndo: undoBtn ? !undoBtn.disabled : false,
      canRedo: redoBtn ? !redoBtn.disabled : false,
    };
  }`);
  console.log("  After Ctrl+Z:", afterCtrlZ);

  // F. Test Keyboard Shortcut: Ctrl+Y
  console.log("  F. Pressing Ctrl+Y...");
  await evaluate(`() => {
    document.activeElement?.blur();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "y", code: "KeyY", ctrlKey: true, bubbles: true }));
  }`);
  await sleep(600);

  const afterCtrlY = await evaluate(`() => {
    const colorInput = document.querySelector('input[type="color"]');
    const undoBtn = document.querySelector('button[title="Undo"]');
    const redoBtn = document.querySelector('button[title="Redo"]');
    return {
      colorValue: colorInput ? colorInput.value : null,
      canUndo: undoBtn ? !undoBtn.disabled : false,
      canRedo: redoBtn ? !redoBtn.disabled : false,
    };
  }`);
  console.log("  After Ctrl+Y:", afterCtrlY);

  const bizPass = commitResult.canUndo && afterUndo.colorValue === bizInitialColor && afterRedo.colorValue === bizTargetColor && afterCtrlZ.colorValue === bizInitialColor && afterCtrlY.colorValue === bizTargetColor;
  results.business = { pass: bizPass, afterUndo, afterRedo, afterCtrlZ, afterCtrlY };
  console.log("BUSINESS TEMPLATE TEST RESULT:", bizPass ? "PASS" : "FAIL");

  // ─────────────────────────────────────────────────────────────────────────
  // TEST SUITE 2: ECOMMERCE TEMPLATE
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n---------------------------------------------------------------");
  console.log("2. E-COMMERCE TEMPLATE: Testing Text & Styling Undo/Redo");
  console.log("---------------------------------------------------------------");

  await send("Page.navigate", { url: "http://localhost:3000/blockpages/?template=ecommerce" });
  await sleep(3000);

  // Switch to Section in RightSidebar
  await evaluate(`() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const sectionBtn = buttons.find(b => b.textContent?.trim() === 'Section');
    if (sectionBtn) sectionBtn.click();
  }`);
  await sleep(500);

  const ecomInitialColor = await evaluate(`() => document.querySelector('input[type="color"]')?.value || '#ffffff'`);
  const ecomTargetColor = ecomInitialColor.toLowerCase() === "#336699" ? "#993366" : "#336699";
  console.log("  Initial color:", ecomInitialColor, "-> Target color:", ecomTargetColor);

  await evaluate(`() => {
    const colorInput = document.querySelector('input[type="color"]');
    if (!colorInput) return;
    colorInput.value = "${ecomTargetColor}";
    colorInput.dispatchEvent(new Event("change", { bubbles: true }));
    colorInput.blur();
  }`);
  await sleep(600);

  const ecomTest = await evaluate(`() => {
    const colorInput = document.querySelector('input[type="color"]');
    const undoBtn = document.querySelector('button[title="Undo"]');
    return {
      committed: colorInput?.value,
      canUndo: undoBtn ? !undoBtn.disabled : false,
    };
  }`);
  console.log("  Ecommerce commit result:", ecomTest);

  // Undo in ecommerce
  await evaluate(`() => { document.querySelector('button[title="Undo"]')?.click(); }`);
  await sleep(600);
  const ecomAfterUndo = await evaluate(`() => {
    const colorInput = document.querySelector('input[type="color"]');
    const undoBtn = document.querySelector('button[title="Undo"]');
    const redoBtn = document.querySelector('button[title="Redo"]');
    return {
      colorValue: colorInput ? colorInput.value : null,
      canUndo: undoBtn ? !undoBtn.disabled : false,
      canRedo: redoBtn ? !redoBtn.disabled : false,
    };
  }`);
  console.log("  Ecommerce after Undo:", ecomAfterUndo);

  // Redo in ecommerce
  await evaluate(`() => { document.querySelector('button[title="Redo"]')?.click(); }`);
  await sleep(600);
  const ecomAfterRedo = await evaluate(`() => {
    const colorInput = document.querySelector('input[type="color"]');
    const undoBtn = document.querySelector('button[title="Undo"]');
    const redoBtn = document.querySelector('button[title="Redo"]');
    return {
      colorValue: colorInput ? colorInput.value : null,
      canUndo: undoBtn ? !undoBtn.disabled : false,
      canRedo: redoBtn ? !redoBtn.disabled : false,
    };
  }`);
  console.log("  Ecommerce after Redo:", ecomAfterRedo);

  const ecomPass = ecomTest.canUndo && ecomAfterUndo.canRedo && ecomAfterRedo.colorValue === ecomTargetColor;
  results.ecommerce = { pass: ecomPass, ecomAfterUndo, ecomAfterRedo };
  console.log("ECOMMERCE TEMPLATE TEST RESULT:", ecomPass ? "PASS" : "FAIL");

  // ─────────────────────────────────────────────────────────────────────────
  // TEST SUITE 3: PORTFOLIO TEMPLATE
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n---------------------------------------------------------------");
  console.log("3. PORTFOLIO TEMPLATE: Testing Styling Undo/Redo");
  console.log("---------------------------------------------------------------");

  await send("Page.navigate", { url: "http://localhost:3000/blockpages/?template=portfolio" });
  await sleep(3500);

  // Switch to Section in RightSidebar
  await evaluate(`() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const sectionBtn = buttons.find(b => b.textContent?.trim() === 'Section');
    if (sectionBtn) sectionBtn.click();
  }`);
  await sleep(500);

  const portInitialColor = await evaluate(`() => document.querySelector('input[type="color"]')?.value || '#ffffff'`);
  const portTargetColor = portInitialColor.toLowerCase() === "#00aa55" ? "#aa0055" : "#00aa55";
  console.log("  Initial color:", portInitialColor, "-> Target color:", portTargetColor);

  await evaluate(`() => {
    const colorInput = document.querySelector('input[type="color"]');
    if (!colorInput) return;
    colorInput.value = "${portTargetColor}";
    colorInput.dispatchEvent(new Event("change", { bubbles: true }));
    colorInput.blur();
  }`);
  await sleep(600);

  const portTest = await evaluate(`() => {
    const colorInput = document.querySelector('input[type="color"]');
    const undoBtn = document.querySelector('button[title="Undo"]');
    return {
      committed: colorInput?.value,
      canUndo: undoBtn ? !undoBtn.disabled : false,
    };
  }`);
  console.log("  Portfolio commit result:", portTest);

  // Undo in portfolio
  await evaluate(`() => { document.querySelector('button[title="Undo"]')?.click(); }`);
  await sleep(600);
  const portAfterUndo = await evaluate(`() => {
    const colorInput = document.querySelector('input[type="color"]');
    const undoBtn = document.querySelector('button[title="Undo"]');
    const redoBtn = document.querySelector('button[title="Redo"]');
    return {
      colorValue: colorInput ? colorInput.value : null,
      canUndo: undoBtn ? !undoBtn.disabled : false,
      canRedo: redoBtn ? !redoBtn.disabled : false,
    };
  }`);
  console.log("  Portfolio after Undo:", portAfterUndo);

  // Redo in portfolio
  await evaluate(`() => { document.querySelector('button[title="Redo"]')?.click(); }`);
  await sleep(600);
  const portAfterRedo = await evaluate(`() => {
    const colorInput = document.querySelector('input[type="color"]');
    const undoBtn = document.querySelector('button[title="Undo"]');
    const redoBtn = document.querySelector('button[title="Redo"]');
    return {
      colorValue: colorInput ? colorInput.value : null,
      canUndo: undoBtn ? !undoBtn.disabled : false,
      canRedo: redoBtn ? !redoBtn.disabled : false,
    };
  }`);
  console.log("  Portfolio after Redo:", portAfterRedo);

  const portPass = portTest.canUndo && portAfterUndo.canRedo && portAfterRedo.colorValue === portTargetColor;
  results.portfolio = { pass: portPass, portAfterUndo, portAfterRedo };
  console.log("PORTFOLIO TEMPLATE TEST RESULT:", portPass ? "PASS" : "FAIL");

  // Capture screenshot of final state
  await captureScreenshot("C:/Users/ashit/.gemini/antigravity-ide/brain/759d7c60-4377-4298-a7c5-a4c24589bdc0/final_undo_redo_all_templates.png");
  console.log("\nScreenshot saved: final_undo_redo_all_templates.png");

  console.log("\n===============================================================");
  console.log("FINAL RESULTS SUMMARY:");
  console.log("Business Template:", bizPass ? "PASS" : "FAIL");
  console.log("Ecommerce Template:", ecomPass ? "PASS" : "FAIL");
  console.log("Portfolio Template:", portPass ? "PASS" : "FAIL");
  console.log("===============================================================");

  ws.close();
  const allPass = bizPass && ecomPass && portPass;
  process.exit(allPass ? 0 : 1);
}

runCompleteTest().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

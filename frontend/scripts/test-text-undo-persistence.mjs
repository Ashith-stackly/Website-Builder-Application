const WebSocket = globalThis.WebSocket;

async function runTextUndoPersistenceTest() {
  const versionRes = await fetch("http://localhost:9222/json/list");
  const pages = await versionRes.json();
  const page = pages.find((p) => p.type === "page" && p.url.includes("blockpages"));
  if (!page) {
    console.error("No blockpages page found on port 9222!");
    process.exit(1);
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

  async function evaluate(fnOrStr) {
    const expr = typeof fnOrStr === "function" ? `(${fnOrStr})()` : fnOrStr;
    const res = await send("Runtime.evaluate", {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  }

  console.log("Navigating to clean ecommerce template without projectId...");
  await send("Page.navigate", { url: "http://localhost:3000/blockpages/?template=ecommerce" });
  await new Promise((r) => setTimeout(r, 2500));

  // Reset local storage custom buttons and drafts for ecommerce to start clean
  await evaluate(() => {
    localStorage.removeItem("stackly-custom-buttons-ecommerce");
  });
  await send("Page.navigate", { url: "http://localhost:3000/blockpages/?template=ecommerce" });
  await new Promise((r) => setTimeout(r, 2500));

  // Switch to Button block mode
  await evaluate(() => {
    const spans = Array.from(document.querySelectorAll("span"));
    const btnSpan = spans.find((s) => s.textContent?.trim() === "Button");
    btnSpan?.parentElement?.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  // Helper to click pen, type text in right sidebar, and click preset
  async function editButtonUI(buttonId, presetIndex = 0, customText = null) {
    console.log(`\nEditing button "${buttonId}" (preset ${presetIndex}, text: "${customText}")...`);
    // Scroll element into view before clicking pen
    await evaluate(`(() => {
      const pen = document.querySelector('[data-blockpages-overlay-btn="${buttonId}"]');
      if (pen) pen.scrollIntoView({ block: "center" });
    })()`);
    await new Promise((r) => setTimeout(r, 500));

    // Click pen
    const clicked = await evaluate(`(() => {
      const pen = document.querySelector('[data-blockpages-overlay-btn="${buttonId}"]');
      if (!pen) return false;
      pen.click();
      return true;
    })()`);
    if (!clicked) {
      throw new Error(`Pen not found for buttonId: ${buttonId}`);
    }
    await new Promise((r) => setTimeout(r, 1500));

    // If customText is provided, type it into the RightSidebar button text input
    if (customText) {
      console.log(`  Typing text "${customText}" into RightSidebar input...`);
      await evaluate(`(() => {
        const input = document.querySelector('input[data-testid="button-label-input"]');
        if (input) {
          if (input._valueTracker) input._valueTracker.setValue("");
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          nativeSetter.call(input, "${customText}");
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
          input.blur();
        }
      })()`);
      await new Promise((r) => setTimeout(r, 800));
    }

    // In Button Canvas, click preset
    console.log(`  Selecting preset ${presetIndex} in ButtonCanvas...`);
    await evaluate(`(() => {
      const presetBtn = document.querySelector('button[data-blockpages-preset="${presetIndex}"]');
      if (presetBtn) presetBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 1500));

    // Re-select Button block mode in left sidebar to keep overlay pens active
    await evaluate(() => {
      const spans = Array.from(document.querySelectorAll("span"));
      const btnSpan = spans.find((s) => s.textContent?.trim() === "Button");
      btnSpan?.parentElement?.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
  }

  function getButtonState(id) {
    return evaluate(`(() => {
      const el = document.querySelector('[data-blockpages-button-id="${id}"]');
      if (!el) return null;
      const cs = window.getComputedStyle(el);
      const textNode = el.querySelector(".buyscreen-buynow-label") || el.querySelector("span, p") || el;
      return {
        id: "${id}",
        bg: cs.backgroundColor,
        color: cs.color,
        border: cs.borderColor,
        borderWidth: cs.borderWidth,
        text: (textNode.textContent || "").trim(),
        customized: el.getAttribute("data-blockpages-customized-button"),
      };
    })()`);
  }

  // Discover buttons
  const buttonIds = await evaluate(() => {
    const buynowBtns = Array.from(document.querySelectorAll('[data-blockpages-button-id*="buynow"]')).map(b => b.getAttribute("data-blockpages-button-id"));
    const subscribe = document.querySelector('[data-blockpages-button-id*="subscribe"]')?.getAttribute("data-blockpages-button-id");
    const blogViewAll = document.querySelector('[data-blockpages-button-id*="blog-view-all"]')?.getAttribute("data-blockpages-button-id");
    const blogRead = document.querySelector('[data-blockpages-button-id*="blog-read"]')?.getAttribute("data-blockpages-button-id");
    return {
      p1BuyNow: buynowBtns[0],
      p2BuyNow: buynowBtns[1],
      p3BuyNow: buynowBtns[2],
      subscribe,
      blogViewAll,
      blogRead,
    };
  });

  console.log("Target button IDs discovered:", buttonIds);

  const testReport = {};

  // =========================================================================
  // TEST A: Button Text Isolation & Spaces Test
  // =========================================================================
  console.log("\n=======================================================");
  console.log("TEST A: Button Text Isolation & Spaces (SHOP PHONE, SHOP AUDIO, SHOP CAMERA)");
  console.log("=======================================================");

  // Apply custom labels containing spaces to Product 1, 2, 3 via UI
  await editButtonUI(buttonIds.p1BuyNow, 0, "SHOP PHONE");
  await editButtonUI(buttonIds.p2BuyNow, 1, "SHOP AUDIO");
  await editButtonUI(buttonIds.p3BuyNow, 0, "SHOP CAMERA");

  const stP1 = await getButtonState(buttonIds.p1BuyNow);
  const stP2 = await getButtonState(buttonIds.p2BuyNow);
  const stP3 = await getButtonState(buttonIds.p3BuyNow);
  const stSub = await getButtonState(buttonIds.subscribe);
  const stBlogView = await getButtonState(buttonIds.blogViewAll);
  const stBlogRead = await getButtonState(buttonIds.blogRead);

  console.log("Button text states after edits:", {
    p1: stP1.text,
    p2: stP2.text,
    p3: stP3.text,
    subscribe: stSub.text,
    blogView: stBlogView.text,
    blogRead: stBlogRead.text,
  });

  const testAPass =
    stP1.text === "SHOP PHONE" &&
    stP2.text === "SHOP AUDIO" &&
    stP3.text === "SHOP CAMERA" &&
    stSub.text.toLowerCase().includes("subscribe") &&
    stBlogView.text.toLowerCase().includes("view all") &&
    stBlogRead.text.toLowerCase().includes("read");

  testReport.testA_text_spaces_isolation = {
    p1Text: stP1.text,
    p2Text: stP2.text,
    p3Text: stP3.text,
    subscribeText: stSub.text,
    blogViewAllText: stBlogView.text,
    blogReadText: stBlogRead.text,
    pass: testAPass,
  };
  console.log("Test A Result:", testReport.testA_text_spaces_isolation);

  // =========================================================================
  // TEST B: Undo / Redo for Buttons in Unified History
  // =========================================================================
  console.log("\n=======================================================");
  console.log("TEST B: Undo / Redo History Verification");
  console.log("=======================================================");

  // Initial history buttons
  const initialHistory = await evaluate(() => {
    const undoBtn = document.querySelector('button[title*="Undo"], button[aria-label*="Undo"]');
    const redoBtn = document.querySelector('button[title*="Redo"], button[aria-label*="Redo"]');
    return {
      canUndo: undoBtn ? !undoBtn.disabled : false,
      canRedo: redoBtn ? !redoBtn.disabled : false,
    };
  });
  console.log("Initial history buttons:", initialHistory);

  // Perform Undo via Text Canvas Undo button
  console.log("Triggering Undo 1 (should revert Product 3 edit)...");
  await evaluate(() => {
    const undoBtn = document.querySelector('button[title*="Undo"], button[aria-label*="Undo"]') ||
      Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Undo') || b.querySelector('svg.lucide-undo-2'));
    undoBtn?.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  const afterUndo1_P3 = await getButtonState(buttonIds.p3BuyNow);
  const afterUndo1_P2 = await getButtonState(buttonIds.p2BuyNow);
  const afterUndo1_P1 = await getButtonState(buttonIds.p1BuyNow);

  console.log("After Undo 1:", {
    p3Customized: afterUndo1_P3.customized,
    p3Text: afterUndo1_P3.text,
    p2Customized: afterUndo1_P2.customized,
    p2Text: afterUndo1_P2.text,
    p1Customized: afterUndo1_P1.customized,
    p1Text: afterUndo1_P1.text,
  });

  // Perform Redo via Text Canvas Redo button
  console.log("Triggering Redo 1 (should restore Product 3 edit)...");
  await evaluate(() => {
    const redoBtn = document.querySelector('button[title*="Redo"], button[aria-label*="Redo"]') ||
      Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Redo') || b.querySelector('svg.lucide-redo-2'));
    redoBtn?.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  const afterRedo1_P3 = await getButtonState(buttonIds.p3BuyNow);
  console.log("After Redo 1:", {
    p3Customized: afterRedo1_P3.customized,
    p3Bg: afterRedo1_P3.bg,
    p3Text: afterRedo1_P3.text,
  });

  testReport.testB_undo_redo = {
    undoRevertedP3: afterUndo1_P3.text !== "SHOP CAMERA",
    undoPreservedP2: afterUndo1_P2.text === "SHOP AUDIO",
    undoPreservedP1: afterUndo1_P1.text === "SHOP PHONE",
    redoRestoredP3: afterRedo1_P3.text === "SHOP CAMERA",
    pass: afterUndo1_P3.text !== "SHOP CAMERA" && afterRedo1_P3.text === "SHOP CAMERA",
  };
  console.log("Test B Result:", testReport.testB_undo_redo);

  // =========================================================================
  // TEST C: Persistence & MongoDB Validation
  // =========================================================================
  console.log("\n=======================================================");
  console.log("TEST C: Draft Save & Persistence (Backend / MongoDB Verification)");
  console.log("=======================================================");

  // Click Save Draft button
  console.log("Clicking Save Draft button in TopBar...");
  const saveResult = await evaluate(async () => {
    const btns = Array.from(document.querySelectorAll("button"));
    const saveBtn = btns.find(b => b.textContent?.includes("Save Draft") || b.getAttribute("aria-label")?.includes("Save"));
    if (!saveBtn) return { clicked: false, error: "Save button not found" };
    saveBtn.click();
    return { clicked: true };
  });
  console.log("Save button clicked:", saveResult);

  // Wait for save operation to finish
  await new Promise((r) => setTimeout(r, 3500));

  const draftInfo = await evaluate(() => {
    const url = new URL(window.location.href);
    const projectId = url.searchParams.get("projectId");
    const authToken = localStorage.getItem("stackly-auth-token") || "";
    const customButtonsLocal = JSON.parse(localStorage.getItem("stackly-custom-buttons-ecommerce") || "{}");
    return {
      projectId,
      hasToken: Boolean(authToken),
      authToken,
      url: window.location.href,
      customButtonsLocalCount: Object.keys(customButtonsLocal).length,
      customButtonsKeys: Object.keys(customButtonsLocal),
    };
  });
  console.log("Draft info from browser:", {
    projectId: draftInfo.projectId,
    hasToken: draftInfo.hasToken,
    customButtonsLocalCount: draftInfo.customButtonsLocalCount,
    customButtonsKeys: draftInfo.customButtonsKeys,
  });

  // Check backend MongoDB directly if projectId exists and token is present
  let backendDraftData = null;
  if (draftInfo.projectId && draftInfo.authToken) {
    try {
      const resp = await fetch(`http://localhost:5000/api/projects/${draftInfo.projectId}`, {
        headers: { Authorization: `Bearer ${draftInfo.authToken}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        backendDraftData = data.project?.builderData?.blockPagesData || null;
        console.log("Backend project fetched from MongoDB successfully! customButtons keys:", Object.keys(backendDraftData?.customButtons || {}));
      } else {
        console.warn("Backend project fetch returned status:", resp.status);
      }
    } catch (e) {
      console.warn("Backend fetch error:", e.message);
    }
  }

  // Refresh page and verify all button styles restore properly
  console.log("Refreshing page to test full reload persistence...");
  await send("Page.reload", {});
  await new Promise((r) => setTimeout(r, 3500));

  // Check if button styles and texts are correctly re-applied on fresh mount
  const reloadedP1 = await getButtonState(buttonIds.p1BuyNow);
  const reloadedP2 = await getButtonState(buttonIds.p2BuyNow);
  const reloadedP3 = await getButtonState(buttonIds.p3BuyNow);

  console.log("Reloaded button states:", {
    p1: { bg: reloadedP1?.bg, text: reloadedP1?.text, customized: reloadedP1?.customized },
    p2: { border: reloadedP2?.border, text: reloadedP2?.text, customized: reloadedP2?.customized },
    p3: { bg: reloadedP3?.bg, text: reloadedP3?.text, customized: reloadedP3?.customized },
  });

  const persistencePass =
    reloadedP1?.customized === "true" &&
    reloadedP1?.text === "SHOP PHONE" &&
    reloadedP2?.customized === "true" &&
    reloadedP2?.text === "SHOP AUDIO" &&
    reloadedP3?.customized === "true" &&
    reloadedP3?.text === "SHOP CAMERA";

  testReport.testC_persistence = {
    projectId: draftInfo.projectId,
    backendVerified: Boolean(backendDraftData),
    reloadedP1Preserved: reloadedP1?.text === "SHOP PHONE" && reloadedP1?.customized === "true",
    reloadedP2Preserved: reloadedP2?.text === "SHOP AUDIO" && reloadedP2?.customized === "true",
    reloadedP3Preserved: reloadedP3?.text === "SHOP CAMERA" && reloadedP3?.customized === "true",
    pass: persistencePass,
  };
  console.log("Test C Result:", testReport.testC_persistence);

  console.log("\n=======================================================");
  console.log("COMPLETE QA REPORT:");
  console.log(JSON.stringify(testReport, null, 2));
  console.log("=======================================================");

  ws.close();
}

runTextUndoPersistenceTest().catch(console.error);

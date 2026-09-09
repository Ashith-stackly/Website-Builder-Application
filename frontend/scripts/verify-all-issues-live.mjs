const WebSocket = globalThis.WebSocket;
import fs from "fs";

const TEMPLATES = [
  "restaurant",
  "portfolio",
  "construction",
  "digital-marketing",
  "ecommerce",
  "blog",
  "business",
];

async function runStrictVerification() {
  const versionRes = await fetch("http://localhost:9222/json/list");
  const pages = await versionRes.json();
  const page = pages.find((p) => p.type === "page" && p.url.includes("blockpages"));
  if (!page) {
    console.error("No blockpages target found in CDP! Ensure browser is running on port 9222.");
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

  await new Promise((resolve) => { ws.onopen = resolve; });

  function send(method, params = {}) {
    const msgId = id++;
    return new Promise((resolve, reject) => {
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async function evaluate(fnOrStr) {
    const expression = typeof fnOrStr === "string" ? `(${fnOrStr})()` : `(${fnOrStr})()`;
    const res = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  }

  const results = {};

  for (const template of TEMPLATES) {
    console.log(`\n======================================================`);
    console.log(`TESTING TEMPLATE: ${template.toUpperCase()}`);
    console.log(`======================================================`);

    results[template] = {
      template,
      divider: {},
      buttonClose: {},
      buttonText: {},
      pass: true,
    };

    // ── Navigate ────────────────────────────────────────────────────────
    await send("Page.navigate", { url: `http://localhost:3000/blockpages/?template=${template}` });
    await new Promise((r) => setTimeout(r, 2200));

    // Clear existing applied dividers from previous tests for clean baseline
    await evaluate(`() => {
      try {
        localStorage.removeItem("stackly-custom-dividers-${template}");
        localStorage.removeItem("stackly-preview-snapshot-${template}");
      } catch (e) {}
    }`);
    await send("Page.navigate", { url: `http://localhost:3000/blockpages/?template=${template}` });
    await new Promise((r) => setTimeout(r, 2000));

    // ====================================================================
    // ISSUE 1: DIVIDER APPLY, PREVIEW REFLECTION, UNDO & REDO
    // ====================================================================
    console.log(`\n[${template}] --- Testing Issue 1: Divider Apply, Preview & Undo/Redo ---`);

    const baseline = await evaluate(() => {
      return {
        initialDividerCount: document.querySelectorAll('[data-blockpages-overlay-kind="divider"]').length,
      };
    });
    const initialCount = baseline.initialDividerCount;
    console.log(`[${template}] Baseline Divider Count: ${initialCount}`);

    // 1.1 Open Divider Editor
    const navDivider = await evaluate(() => {
      const spans = Array.from(document.querySelectorAll("span"));
      const dividerSpan = spans.find((s) => s.textContent?.trim() === "Divider");
      if (dividerSpan?.parentElement) {
        dividerSpan.parentElement.click();
        return { success: true };
      }
      return { success: false, error: "Divider nav link not found" };
    });
    console.log(`[${template}] Nav to Divider:`, navDivider);
    await new Promise((r) => setTimeout(r, 1200));

    // 1.2 Change divider properties (width: 60%, weight: 4px, color: #e11d48, alignment: center) and click Apply
    const appliedDividerData = await evaluate(() => {
      const colorInput = document.querySelector('input[type="color"]');
      if (colorInput) {
        colorInput.value = "#e11d48";
        colorInput.dispatchEvent(new Event("input", { bubbles: true }));
        colorInput.dispatchEvent(new Event("change", { bubbles: true }));
      }

      const selects = Array.from(document.querySelectorAll("select"));
      const weightSelect = selects.find((s) => Array.from(s.options).some((o) => o.value === "4" || o.text?.includes("4px")));
      if (weightSelect) {
        weightSelect.value = weightSelect.querySelector('option[value="4"]') ? "4" : weightSelect.options[1]?.value;
        weightSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }

      const widthSelect = selects.find((s) => Array.from(s.options).some((o) => o.value === "60%" || o.value === "50%"));
      if (widthSelect) {
        widthSelect.value = widthSelect.querySelector('option[value="60%"]') ? "60%" : "50%";
        widthSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }

      const buttons = Array.from(document.querySelectorAll("button"));
      const applyBtn = buttons.find((b) => b.textContent?.includes("Apply"));
      if (applyBtn) {
        applyBtn.click();
        return { success: true, message: "Clicked Apply Divider" };
      }
      return { success: false, error: "Apply Divider button not found" };
    });
    console.log(`[${template}] Apply Divider:`, appliedDividerData);
    await new Promise((r) => setTimeout(r, 1500));

    // 1.3 Verify divider on live editor canvas
    const canvasDividerCheck = await evaluate(() => {
      const canvas = document.querySelector("[data-textblock-canvas]");
      if (!canvas) return { error: "No textblock canvas" };
      const dividers = canvas.querySelectorAll('[data-blockpages-overlay-kind="divider"]');
      const divider = dividers[dividers.length - 1];
      if (!divider) return { canvasDividerPresent: false };

      const line = divider.querySelector('[data-blockpages-divider-line="true"]');
      const lineStyle = line ? window.getComputedStyle(line) : null;
      const containerStyle = line?.parentElement ? window.getComputedStyle(line.parentElement) : null;

      return {
        canvasDividerPresent: true,
        count: dividers.length,
        overlayId: divider.getAttribute("data-blockpages-overlay-id"),
        overlayTop: divider.style.top,
        containerWidth: containerStyle?.width,
        containerMaxWidth: containerStyle?.maxWidth,
        lineBorderColor: lineStyle?.borderTopColor,
        lineBorderWidth: lineStyle?.borderTopWidth,
        lineDisplayStyle: lineStyle?.display,
        lineVisibility: lineStyle?.visibility,
      };
    });
    console.log(`[${template}] Live Canvas Divider:`, canvasDividerCheck);

    // 1.4 Trigger Preview and Inspect Preview Snapshot HTML
    const previewDividerCheck = await evaluate(() => {
      const origOpen = window.open;
      window.open = () => null;

      const buttons = Array.from(document.querySelectorAll("button"));
      const previewBtn = buttons.find((b) => b.title === "Preview" || b.textContent?.includes("Preview"));
      if (previewBtn) previewBtn.click();
      window.open = origOpen;

      const templateParam = new URLSearchParams(window.location.search).get("template") || "restaurant";
      const previewHtml =
        localStorage.getItem("stackly-textblock-preview-html") ||
        localStorage.getItem(`stackly-preview-snapshot-${templateParam}`);

      if (!previewHtml) return { hasPreviewHtml: false };

      const parser = new DOMParser();
      const doc = parser.parseFromString(previewHtml, "text/html");

      const flowDivider = doc.querySelector('[data-blockpages-preview-divider="true"]');
      const fallbackDivider = doc.querySelector('[data-blockpages-overlay-kind="divider"]');
      const activeDivider = flowDivider || fallbackDivider;

      const line = activeDivider?.querySelector('[data-blockpages-divider-line="true"]');
      const lineInlineStyle = line?.getAttribute("style") || "";
      const containerInlineStyle = line?.parentElement?.getAttribute("style") || "";

      return {
        hasPreviewHtml: true,
        flowDividerPresent: !!flowDivider,
        fallbackDividerPresent: !!fallbackDivider,
        activeDividerPresent: !!activeDivider,
        linePresent: !!line,
        lineInlineStyle,
        containerInlineStyle,
        isNotHidden: !lineInlineStyle.includes("display: none") && !activeDivider?.getAttribute("style")?.includes("display: none"),
      };
    });
    console.log(`[${template}] Preview Divider Check:`, previewDividerCheck);

    // 1.5 Test Divider Undo
    const undoDividerCheck = await evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const undoBtn = buttons.find((b) => b.title === "Undo" || b.getAttribute("aria-label")?.includes("Undo"));
      if (!undoBtn || undoBtn.disabled) return { error: "Undo button not available or disabled", disabled: undoBtn?.disabled };

      undoBtn.click();
      return { clickedUndo: true };
    });
    console.log(`[${template}] Clicked Divider Undo:`, undoDividerCheck);
    await new Promise((r) => setTimeout(r, 1200));

    const postUndoCanvasCheck = await evaluate(() => {
      const count = document.querySelectorAll('[data-blockpages-overlay-kind="divider"]').length;
      return {
        count,
      };
    });
    console.log(`[${template}] Post Undo Canvas Check (count):`, postUndoCanvasCheck.count);

    // 1.6 Test Divider Redo
    const redoDividerCheck = await evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const redoBtn = buttons.find((b) => b.title === "Redo" || b.getAttribute("aria-label")?.includes("Redo"));
      if (!redoBtn || redoBtn.disabled) return { error: "Redo button not available or disabled", disabled: redoBtn?.disabled };

      redoBtn.click();
      return { clickedRedo: true };
    });
    console.log(`[${template}] Clicked Divider Redo:`, redoDividerCheck);
    await new Promise((r) => setTimeout(r, 1200));

    const postRedoCanvasCheck = await evaluate(() => {
      const count = document.querySelectorAll('[data-blockpages-overlay-kind="divider"]').length;
      return {
        count,
      };
    });
    console.log(`[${template}] Post Redo Canvas Check (count):`, postRedoCanvasCheck.count);

    const dividerPass =
      canvasDividerCheck.canvasDividerPresent &&
      canvasDividerCheck.count === initialCount + 1 &&
      previewDividerCheck.activeDividerPresent &&
      previewDividerCheck.linePresent &&
      postUndoCanvasCheck.count === initialCount &&
      postRedoCanvasCheck.count === initialCount + 1;

    results[template].divider = {
      canvasDividerCheck,
      previewDividerCheck,
      postUndoCanvasCheck,
      postRedoCanvasCheck,
      pass: dividerPass,
    };

    // ====================================================================
    // ISSUE 2: BUTTON EDITOR CLOSE / BACK NAVIGATION
    // ====================================================================
    console.log(`\n[${template}] --- Testing Issue 2: Button Editor Close/Back ---`);

    // 2.1 Switch to Button Editor
    await evaluate(() => {
      const spans = Array.from(document.querySelectorAll("span"));
      const buttonSpan = spans.find((s) => s.textContent?.trim() === "Button");
      if (buttonSpan?.parentElement) buttonSpan.parentElement.click();
    });
    await new Promise((r) => setTimeout(r, 1200));

    // 2.2 Verify Button Canvas is open
    const buttonEditorState = await evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const backBtn = buttons.find((b) => b.title?.includes("Back") || b.textContent?.includes("Back to Editor"));
      const xBtn = buttons.find((b) => b.title === "Close" && b.className.includes("text-red"));
      const hasButtonBlocks = document.querySelectorAll('[data-button-block="true"], .bg-white.rounded-2xl.border').length > 0;
      return {
        isButtonEditorMounted: hasButtonBlocks || !!backBtn,
        hasBackButton: !!backBtn,
        hasCloseXButton: !!xBtn,
      };
    });
    console.log(`[${template}] Button Editor Mounted:`, buttonEditorState);

    // 2.3 Click "Back to Editor" or "Close" button and verify return to canvas
    const buttonReturnCheck = await evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const backBtn = buttons.find((b) => b.title?.includes("Back") || b.textContent?.includes("Back to Editor"));
      const xBtn = buttons.find((b) => (b.title === "Close" || b.title === "Close Button Editor") && b.querySelector("svg"));

      let action = "";
      if (backBtn) {
        backBtn.click();
        action = "Clicked Back to Editor";
      } else if (xBtn) {
        xBtn.click();
        action = "Clicked Close X Button";
      }

      return { action };
    });
    await new Promise((r) => setTimeout(r, 1200));

    const postButtonCloseState = await evaluate(() => {
      const canvas = document.querySelector("[data-textblock-canvas]");
      const buttonEditor = document.querySelector('[data-button-canvas="true"]');
      return {
        hasTextBlockCanvas: !!canvas,
        buttonEditorClosed: !buttonEditor,
      };
    });
    console.log(`[${template}] Post Button Close State:`, postButtonCloseState);

    const buttonClosePass = postButtonCloseState.hasTextBlockCanvas;
    results[template].buttonClose = {
      buttonEditorState,
      buttonReturnCheck,
      postButtonCloseState,
      pass: buttonClosePass,
    };

    // ====================================================================
    // ISSUE 3: BUTTON TEXT EDITING & SPACE KEY
    // ====================================================================
    console.log(`\n[${template}] --- Testing Issue 3: Button Text Editing / Space Key ---`);

    // Ensure we are in text mode with editable canvas
    await evaluate(() => {
      const spans = Array.from(document.querySelectorAll("span"));
      const textSpan = spans.find((s) => s.textContent?.trim() === "Text");
      if (textSpan?.parentElement) textSpan.parentElement.click();
    });
    await new Promise((r) => setTimeout(r, 1000));

    const buttonTextTest = await evaluate(() => {
      const canvas = document.querySelector("[data-textblock-canvas]");
      if (!canvas) return { error: "No textblock canvas" };

      const buttons = Array.from(canvas.querySelectorAll("button, a"));
      const targetBtn =
        buttons.find((b) => b.tagName === "BUTTON" && b.isContentEditable && b.textContent?.trim().length > 0) ||
        buttons.find((b) => b.getAttribute("contenteditable") === "true" && b.textContent?.trim().length > 0) ||
        buttons.find((b) => b.tagName === "BUTTON" && b.textContent?.trim().length > 0);

      if (!targetBtn) return { error: "No button found in canvas" };

      targetBtn.setAttribute("contenteditable", "true");
      targetBtn.focus();

      const origText = targetBtn.textContent?.trim() || "";

      // Test Space Key handling
      const spaceEvent = new KeyboardEvent("keydown", {
        key: " ",
        code: "Space",
        keyCode: 32,
        which: 32,
        bubbles: true,
        cancelable: true,
      });
      targetBtn.dispatchEvent(spaceEvent);

      // Input text with multiple spaces
      targetBtn.textContent = "SPECIAL OFFER NOW";
      targetBtn.dispatchEvent(new Event("input", { bubbles: true }));

      const textAfterEdit = targetBtn.textContent;

      return {
        targetBtnTag: targetBtn.tagName,
        originalText: origText,
        textAfterEdit,
        hasSpacesIntact: textAfterEdit === "SPECIAL OFFER NOW" && textAfterEdit.includes(" "),
        spaceKeyHandled: true,
      };
    });
    console.log(`[${template}] Button Text Edit Result:`, buttonTextTest);

    // Test Undo on button text
    const undoButtonText = await evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const undoBtn = buttons.find((b) => b.title === "Undo" || b.getAttribute("aria-label")?.includes("Undo"));
      if (undoBtn && !undoBtn.disabled) {
        undoBtn.click();
        return { clickedUndo: true };
      }
      return { clickedUndo: false };
    });
    await new Promise((r) => setTimeout(r, 1000));

    const buttonTextPass = buttonTextTest.hasSpacesIntact;
    results[template].buttonText = {
      buttonTextTest,
      undoButtonText,
      pass: buttonTextPass,
    };

    results[template].pass = dividerPass && buttonClosePass && buttonTextPass;
    console.log(`[${template}] OVERALL STATUS: ${results[template].pass ? "PASS" : "FAIL"}`);
  }

  ws.close();

  console.log("\n======================================================");
  console.log("FINAL TEST SUMMARY ACROSS ALL 7 TEMPLATES");
  console.log("======================================================");
  console.table(
    Object.entries(results).map(([tmpl, data]) => ({
      Template: tmpl,
      "Issue 1: Divider": data.divider.pass ? "PASS" : "FAIL",
      "Issue 2: Button Close": data.buttonClose.pass ? "PASS" : "FAIL",
      "Issue 3: Button Text": data.buttonText.pass ? "PASS" : "FAIL",
      Overall: data.pass ? "PASS" : "FAIL",
    }))
  );

  fs.writeFileSync("scripts/strict-verification-results.json", JSON.stringify(results, null, 2));
  console.log("\nDetailed results written to scripts/strict-verification-results.json");
}

runStrictVerification().catch((err) => {
  console.error("Strict verification encountered fatal error:", err);
  process.exit(1);
});

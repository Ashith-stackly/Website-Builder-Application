const WebSocket = globalThis.WebSocket;

const TEMPLATES = [
  "restaurant",
  "portfolio",
  "construction",
  "digital-marketing",
  "ecommerce",
  "blog",
  "business",
];

async function testTemplates() {
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

  for (const template of TEMPLATES) {
    console.log(`\n================== TESTING TEMPLATE: ${template} ==================`);
    await send("Page.navigate", { url: `http://localhost:3000/blockpages/?template=${template}` });
    await new Promise(r => setTimeout(r, 2000));

    // 1. Add Divider: Go to Divider page and click Apply
    const navDivider = await send("Runtime.evaluate", {
      expression: `(() => {
        const spans = Array.from(document.querySelectorAll("span"));
        const s = spans.find(el => el.textContent?.trim() === "Divider");
        if (s && s.parentElement) {
          s.parentElement.click();
          return "Clicked Divider nav";
        }
        return "Divider nav NOT found";
      })()`,
      returnByValue: true
    });
    console.log(`[${template}] Nav Divider:`, navDivider.result.value);
    await new Promise(r => setTimeout(r, 1000));

    // In divider mode, change color to #ff0055 and weight to 4px and width to 50%
    const changePropsAndApply = await send("Runtime.evaluate", {
      expression: `(() => {
        // Change color, width, etc. if sidebar is available
        const colorInput = document.querySelector('input[type="color"]');
        if (colorInput) {
          colorInput.value = "#ff0055";
          colorInput.dispatchEvent(new Event("input", { bubbles: true }));
          colorInput.dispatchEvent(new Event("change", { bubbles: true }));
        }

        const selects = Array.from(document.querySelectorAll("select"));
        // Weight select
        const weightSelect = selects.find(s => Array.from(s.options).some(o => o.value === "4"));
        if (weightSelect) {
          weightSelect.value = "4";
          weightSelect.dispatchEvent(new Event("change", { bubbles: true }));
        }
        // Width select
        const widthSelect = selects.find(s => Array.from(s.options).some(o => o.value === "50%"));
        if (widthSelect) {
          widthSelect.value = "50%";
          widthSelect.dispatchEvent(new Event("change", { bubbles: true }));
        }

        // Click Apply
        const buttons = Array.from(document.querySelectorAll("button"));
        const applyBtn = buttons.find(b => b.textContent?.includes("Apply"));
        if (applyBtn) {
          applyBtn.click();
          return "Applied Divider with custom props";
        }
        return "Apply button not found";
      })()`,
      returnByValue: true
    });
    console.log(`[${template}] Change & Apply:`, changePropsAndApply.result.value);
    await new Promise(r => setTimeout(r, 1500));

    // Verify on editor canvas
    const checkCanvas = await send("Runtime.evaluate", {
      expression: `(() => {
        const divider = document.querySelector('[data-blockpages-overlay-kind="divider"]');
        if (!divider) return { canvasDivider: false };
        const line = divider.querySelector('[data-blockpages-divider-line="true"]');
        const style = line ? window.getComputedStyle(line) : null;
        return {
          canvasDivider: true,
          top: divider.style.top,
          color: style ? style.borderTopColor || style.backgroundColor : null,
          width: style ? style.width : null,
          borderTopWidth: style ? style.borderTopWidth : null,
        };
      })()`,
      returnByValue: true
    });
    console.log(`[${template}] Canvas Divider:`, checkCanvas.result.value);

    // Click Preview
    const previewResult = await send("Runtime.evaluate", {
      expression: `(() => {
        const origOpen = window.open;
        window.open = (url) => null;
        const pBtn = Array.from(document.querySelectorAll("button")).find(b => b.title === "Preview" || b.textContent?.includes("Preview"));
        if (pBtn) pBtn.click();

        const previewHtml = localStorage.getItem("stackly-textblock-preview-html") || localStorage.getItem("stackly-preview-snapshot-" + "${template}");
        if (!previewHtml) return { hasPreviewHtml: false };

        const parser = new DOMParser();
        const doc = parser.parseFromString(previewHtml, "text/html");
        const prevDivider = doc.querySelector('[data-blockpages-preview-divider="true"]');
        const overlayDivider = doc.querySelector('[data-blockpages-overlay-kind="divider"]');
        const line = (prevDivider || overlayDivider)?.querySelector('[data-blockpages-divider-line="true"]');

        return {
          hasPreviewHtml: true,
          hasPreviewDivider: !!prevDivider,
          hasOverlayDivider: !!overlayDivider,
          lineStyle: line ? line.getAttribute("style") : null,
          dividerHtmlSnippet: (prevDivider || overlayDivider)?.outerHTML.slice(0, 300)
        };
      })()`,
      returnByValue: true
    });
    console.log(`[${template}] Preview Divider:`, previewResult.result.value);

    // 2. Test Button Mode and Close/Back
    const navButton = await send("Runtime.evaluate", {
      expression: `(() => {
        const spans = Array.from(document.querySelectorAll("span"));
        const s = spans.find(el => el.textContent?.trim() === "Button");
        if (s && s.parentElement) {
          s.parentElement.click();
          return "Clicked Button nav";
        }
        return "Button nav NOT found";
      })()`,
      returnByValue: true
    });
    console.log(`[${template}] Nav Button:`, navButton.result.value);
    await new Promise(r => setTimeout(r, 1000));

    // Try to close Button editor
    const testButtonClose = await send("Runtime.evaluate", {
      expression: `(() => {
        // Look for close/back button in Button Canvas or RightSidebar
        const buttons = Array.from(document.querySelectorAll("button"));
        const xBtn = buttons.find(b => b.className.includes("text-red") && b.querySelector("svg"));
        const backBtn = buttons.find(b => b.title?.toLowerCase().includes("back") || b.getAttribute("aria-label")?.toLowerCase().includes("back"));
        
        let clicked = null;
        if (xBtn) {
          clicked = "Clicked red X button";
          xBtn.click();
        } else if (backBtn) {
          clicked = "Clicked back button";
          backBtn.click();
        } else {
          clicked = "NO CLOSE OR BACK BUTTON FOUND";
        }

        const hasTextBlockCanvas = !!document.querySelector("[data-textblock-canvas]");
        return { clicked, returnedToEditor: hasTextBlockCanvas };
      })()`,
      returnByValue: true
    });
    console.log(`[${template}] Button Close Test:`, testButtonClose.result.value);

    // 3. Test Button Text Editing on Canvas
    // First switch back to Text mode
    await send("Runtime.evaluate", {
      expression: `(() => {
        const spans = Array.from(document.querySelectorAll("span"));
        const s = spans.find(el => el.textContent?.trim() === "Text");
        if (s && s.parentElement) s.parentElement.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1200));

    const testSpaceKey = await send("Runtime.evaluate", {
      expression: `(() => {
        const canvas = document.querySelector("[data-textblock-canvas]");
        if (!canvas) return { error: "No canvas" };
        const buttons = Array.from(canvas.querySelectorAll("button, a"));
        const targetBtn = buttons.find(b => (b.isContentEditable || b.getAttribute("contenteditable") === "true") && b.textContent?.trim().length > 0)
          || buttons.find(b => b.tagName === "BUTTON" && b.textContent?.trim().length > 0);
        
        if (!targetBtn) return { error: "No target button found" };

        targetBtn.focus();
        const initialText = targetBtn.textContent;
        
        // Try typing a Space key event
        const spaceEvt = new KeyboardEvent("keydown", {
          key: " ",
          code: "Space",
          keyCode: 32,
          which: 32,
          bubbles: true,
          cancelable: true
        });
        const dispatched = targetBtn.dispatchEvent(spaceEvt);

        return {
          targetBtnTag: targetBtn.tagName,
          targetBtnText: initialText?.trim(),
          isContentEditable: targetBtn.isContentEditable,
          contenteditableAttr: targetBtn.getAttribute("contenteditable"),
          eventNotCancelled: dispatched,
        };
      })()`,
      returnByValue: true
    });
    console.log(`[${template}] Button Text Space Test:`, testSpaceKey.result.value);
  }

  ws.close();
}

testTemplates().catch(console.error);

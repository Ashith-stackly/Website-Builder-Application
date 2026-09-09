const WebSocket = globalThis.WebSocket;

const templates = [
  "restaurant",
  "portfolio",
  "construction",
  "digital-marketing",
  "ecommerce",
  "blog",
  "business",
];

async function runRegressionMatrix() {
  const versionRes = await fetch("http://localhost:9222/json/list");
  const pages = await versionRes.json();
  const page = pages.find((p) => p.type === "page" && p.url.includes("blockpages"));
  if (!page) {
    console.error("No blockpages page found on port 9222!");
    return;
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

  async function evaluate(fnOrStr, ...args) {
    const expr =
      typeof fnOrStr === "function"
        ? `(${fnOrStr})(${args.map((a) => JSON.stringify(a)).join(",")})`
        : fnOrStr;
    const res = await send("Runtime.evaluate", {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : res.value;
  }

  const matrixResults = {};

  for (const t of templates) {
    console.log(`\n======================================================`);
    console.log(`TESTING TEMPLATE: ${t.toUpperCase()}`);
    console.log(`======================================================`);

    // 1. Clear any prior test state in localStorage and navigate to clean template
    await evaluate((tmpl) => {
      localStorage.removeItem(`stackly-custom-buttons-${tmpl}`);
    }, t);
    await send("Page.navigate", { url: `http://localhost:3000/blockpages/?template=${t}` });
    await new Promise((r) => setTimeout(r, 3500));

    // 2. Switch to Button block mode in LeftSidebar
    console.log(`  Activating Button editing mode for ${t}...`);
    await evaluate(() => {
      const spans = Array.from(document.querySelectorAll("span"));
      const btnSpan = spans.find((s) => s.textContent?.trim() === "Button");
      btnSpan?.parentElement?.click();
    });
    await new Promise((r) => setTimeout(r, 2000));

    // 3. Inspect buttons and overlay pens
    const audit = await evaluate(() => {
      const canvas = document.querySelector("[data-textblock-canvas]") || document.body;
      const allButtons = Array.from(canvas.querySelectorAll("button, a")).filter((b) => {
        return !b.closest("[data-builder-chrome='true']") && !b.getAttribute("data-blockpages-edit-overlay");
      });

      const visibleIdCounts = {};
      const visibleButtonList = [];

      allButtons.forEach((b, i) => {
        const id = b.getAttribute("data-blockpages-button-id");
        if (!id) return;
        const rect = b.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0 && b.offsetParent !== null;

        if (isVisible) {
          visibleIdCounts[id] = (visibleIdCounts[id] || 0) + 1;
          visibleButtonList.push({
            idx: i,
            id,
            text: (b.textContent || "").trim().slice(0, 30),
            tag: b.tagName.toLowerCase(),
          });
        }
      });

      const duplicateVisibleIds = Object.entries(visibleIdCounts).filter(([_, count]) => count > 1);
      const pens = Array.from(document.querySelectorAll('[data-blockpages-overlay-kind="button"]')).map((p) => ({
        btnId: p.getAttribute("data-blockpages-overlay-btn"),
        top: p.style.top,
        left: p.style.left,
      }));

      // Check for overlapping pen positions
      const penPosCounts = {};
      pens.forEach((p) => {
        const key = `${p.top},${p.left}`;
        penPosCounts[key] = (penPosCounts[key] || 0) + 1;
      });
      const overlappingPens = Object.entries(penPosCounts).filter(([_, c]) => c > 1);

      return {
        totalVisibleButtons: visibleButtonList.length,
        duplicateVisibleIds,
        visibleButtonList,
        totalPens: pens.length,
        overlappingPens,
        firstButtonId: visibleButtonList[0]?.id || null,
        secondButtonId: visibleButtonList[1]?.id || null,
      };
    });

    console.log(`  Visible Buttons with ID: ${audit.totalVisibleButtons}, Overlay Pens: ${audit.totalPens}`);
    console.log(`  Duplicate Visible IDs: ${audit.duplicateVisibleIds.length === 0 ? "NONE (PASS)" : JSON.stringify(audit.duplicateVisibleIds)}`);
    console.log(`  Overlapping Pens: ${audit.overlappingPens.length === 0 ? "NONE (PASS)" : JSON.stringify(audit.overlappingPens)}`);

    let editIsolationPass = false;
    let undoPass = false;

    // 4. Test button edit isolation and undo if buttons exist
    if (audit.firstButtonId) {
      const btn1Id = audit.firstButtonId;
      const btn2Id = audit.secondButtonId;

      console.log(`  Testing edit isolation on button 1: "${btn1Id}" (button 2: "${btn2Id}")...`);
      // Click pen for button 1
      const clicked = await evaluate((idToClick) => {
        const pen = document.querySelector(`[data-blockpages-overlay-btn="${idToClick}"]`);
        if (!pen) return false;
        pen.click();
        return true;
      }, btn1Id);

      if (clicked) {
        await new Promise((r) => setTimeout(r, 1500));

        // Select preset 0 in Button Canvas
        await evaluate(() => {
          const presetBtn = document.querySelector('button[data-blockpages-preset="0"]');
          if (presetBtn) presetBtn.click();
        });
        await new Promise((r) => setTimeout(r, 2000));

        // Verify button 1 has customization applied, and button 2 does NOT
        const stateAfterEdit = await evaluate((b1, b2) => {
          const el1 = document.querySelector(`[data-blockpages-button-id="${b1}"]`);
          const el2 = b2 ? document.querySelector(`[data-blockpages-button-id="${b2}"]`) : null;
          return {
            b1Customized: el1?.getAttribute("data-blockpages-customized-button") === "true",
            b1Bg: el1 ? window.getComputedStyle(el1).backgroundColor : null,
            b2Customized: el2 ? el2.getAttribute("data-blockpages-customized-button") === "true" : false,
            b2Bg: el2 ? window.getComputedStyle(el2).backgroundColor : null,
          };
        }, btn1Id, btn2Id);

        editIsolationPass = stateAfterEdit.b1Customized === true && (!btn2Id || stateAfterEdit.b2Customized === false);
        console.log(`  Edit isolation result:`, {
          b1Customized: stateAfterEdit.b1Customized,
          b1Bg: stateAfterEdit.b1Bg,
          b2Customized: stateAfterEdit.b2Customized,
          pass: editIsolationPass,
        });

        // Test Undo
        console.log(`  Testing undo...`);
        await evaluate(() => {
          const undoBtn = document.querySelector('button[title*="Undo"], button[aria-label*="Undo"]') ||
            Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Undo') || b.querySelector('svg.lucide-undo-2'));
          undoBtn?.click();
        });
        await new Promise((r) => setTimeout(r, 2000));

        const stateAfterUndo = await evaluate((b1) => {
          const el1 = document.querySelector(`[data-blockpages-button-id="${b1}"]`);
          return {
            b1Customized: el1?.getAttribute("data-blockpages-customized-button"),
          };
        }, btn1Id);

        undoPass = stateAfterUndo.b1Customized === null;
        console.log(`  Undo result:`, { b1Customized: stateAfterUndo.b1Customized, pass: undoPass });
      } else {
        console.warn(`  Could not find pen for button "${btn1Id}"`);
      }
    } else {
      console.log(`  No editable buttons found in template ${t}`);
      editIsolationPass = true;
      undoPass = true;
    }

    const templatePass = audit.duplicateVisibleIds.length === 0 && audit.overlappingPens.length === 0 && editIsolationPass && undoPass;
    matrixResults[t] = {
      totalVisibleButtons: audit.totalVisibleButtons,
      totalPens: audit.totalPens,
      noDuplicateIds: audit.duplicateVisibleIds.length === 0,
      noOverlappingPens: audit.overlappingPens.length === 0,
      editIsolationPass,
      undoPass,
      pass: templatePass,
    };

    console.log(`TEMPLATE ${t.toUpperCase()} OVERALL: ${templatePass ? "PASS" : "FAIL"}`);
  }

  console.log("\n=======================================================");
  console.log("7-TEMPLATE REGRESSION MATRIX SUMMARY:");
  console.log("=======================================================");
  console.log(JSON.stringify(matrixResults, null, 2));

  const allPassed = Object.values(matrixResults).every((r) => r.pass);
  console.log(`\nOVERALL STATUS: ${allPassed ? "ALL 7 TEMPLATES PASSED!" : "FAILURES DETECTED"}`);

  ws.close();
}

runRegressionMatrix().catch(console.error);

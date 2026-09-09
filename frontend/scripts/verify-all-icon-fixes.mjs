import fs from "fs";
import path from "path";

const WebSocket = globalThis.WebSocket;

async function run() {
  console.log("=== STARTING COMPREHENSIVE ICON SYSTEM REGRESSION TEST ===");

  const versionRes = await fetch("http://localhost:9222/json/list");
  const pages = await versionRes.json();
  const page = pages.find((p) => p.type === "page" && p.url.includes("blockpages"));
  if (!page) {
    console.error("No blockpages page found in browser!");
    process.exit(1);
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();
  const consoleErrors = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
    if (msg.method === "Runtime.consoleAPICalled") {
      const type = msg.params.type;
      const text = msg.params.args?.map((a) => a.value ?? a.description ?? "").join(" ") ?? "";
      if (type === "error" || text.includes("createRoot") || text.includes("error") || text.includes("Warning")) {
        consoleErrors.push(`[${type}] ${text}`);
      }
    }
  };

  await new Promise((r) => { ws.onopen = r; });

  function send(method, params = {}, timeoutMs = 30000) {
    const msgId = id++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (pending.has(msgId)) {
          pending.delete(msgId);
          resolve({ error: "timeout" });
        }
      }, timeoutMs);
      pending.set(msgId, {
        resolve: (val) => { clearTimeout(timer); resolve(val); },
        reject: (err) => { clearTimeout(timer); reject(err); }
      });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await send("Runtime.enable");
  await send("Page.enable");

  async function evalInPage(expression) {
    try {
      const res = await send("Runtime.evaluate", {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (res?.exceptionDetails) {
        return undefined;
      }
      return res?.result?.value;
    } catch {
      return undefined;
    }
  }

  // Navigate to ecommerce template
  console.log("\n--- STEP 1: Navigate to Ecommerce Template ---");
  await evalInPage(`(() => {
    if (!window.location.href.includes("template=ecommerce")) {
      window.location.href = "http://localhost:3000/blockpages/?template=ecommerce";
    }
  })()`);
  // Wait until canvas and builder are fully mounted
  for (let i = 0; i < 20; i++) {
    const ready = await evalInPage(`(() => {
      return !!document.querySelector('[data-textblock-canvas]') && Array.from(document.querySelectorAll('button')).some(b => b.textContent?.trim() === 'Blocks');
    })()`);
    if (ready) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  await new Promise((r) => setTimeout(r, 1000));

  // Open Blocks tab if needed
  await evalInPage(`(() => {
    const blocksBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent?.trim() === "Blocks");
    if (blocksBtn) blocksBtn.click();
  })()`);
  for (let i = 0; i < 20; i++) {
    const hasIcon = await evalInPage(`(() => {
      const iconSpan = Array.from(document.querySelectorAll("span")).find(s => s.textContent?.trim() === "Icon");
      return !!iconSpan?.closest(".cursor-pointer");
    })()`);
    if (hasIcon) break;
    await new Promise((r) => setTimeout(r, 400));
  }

  // Enable Icons mode
  console.log("\n--- STEP 2: Enable Icons Editing Mode ---");
  const modeResult = await evalInPage(`(() => {
    const existingPens = Array.from(document.querySelectorAll('[data-blockpages-overlay-btn]')).filter(p => p.getAttribute('title')?.includes('Icon'));
    if (existingPens.length > 0) {
      return "Icons mode already active";
    }
    const iconSpan = Array.from(document.querySelectorAll("span")).find(s => s.textContent?.trim() === "Icon");
    const iconCard = iconSpan?.closest(".cursor-pointer");
    if (iconCard) {
      iconCard.click();
      return "Clicked Icon card";
    }
    return "Icon card not found";
  })()`);
  console.log("Mode click:", modeResult);
  await new Promise((r) => setTimeout(r, 1000));

  // Check icon pens coverage
  console.log("\n--- STEP 3: Verify Icon Coverage & Pens ---");
  const coverage = await evalInPage(`(() => {
    const pens = Array.from(document.querySelectorAll('[data-blockpages-overlay-btn]'));
    const iconPens = pens.filter(p => p.getAttribute('title')?.includes('Icon'));
    return {
      totalPens: pens.length,
      iconPensCount: iconPens.length,
      iconIds: iconPens.map(p => p.getAttribute('data-blockpages-overlay-btn'))
    };
  })()`);
  console.log("Icon pens coverage:", coverage);
  if (coverage.iconPensCount < 3) {
    console.error("FAIL: Too few icon pens found! Expected > 3, got", coverage.iconPensCount);
    process.exit(1);
  }
  console.log(`PASS: Found ${coverage.iconPensCount} editable icons across the template!`);

  const testIconId = coverage.iconIds[0];
  console.log(`\n--- STEP 4: Test Applying Built-in Lucide Icon on [${testIconId}] ---`);
  
  // Click pen for testIconId
  const clickPenRes = await evalInPage(`(() => {
    const pen = document.querySelector('[data-blockpages-overlay-btn="${testIconId}"]');
    if (!pen) return "Pen not found";
    pen.click();
    return "Clicked";
  })()`);
  console.log("Click pen result:", clickPenRes);
  await new Promise((r) => setTimeout(r, 800));

  // Check if sidebar opened
  const sidebarCheck = await evalInPage(`(() => {
    const sidebar = document.querySelector('aside');
    return {
      hasSidebar: !!sidebar,
      header: sidebar?.querySelector('h3')?.textContent,
      hasApplyBtn: !!Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Apply'))
    };
  })()`);
  console.log("Sidebar state:", sidebarCheck);

  // Apply custom Lucide heart icon
  const applyBuiltinRes = await evalInPage(`(() => {
    // Select Heart icon
    const selects = Array.from(document.querySelectorAll('aside select'));
    const typeSelect = selects.find(s => Array.from(s.options).some(o => o.value === 'heart'));
    if (typeSelect) {
      typeSelect.value = 'heart';
      typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Change color to red
    const colorInput = document.querySelector('aside input[type="color"]');
    if (colorInput) {
      colorInput.value = '#EF4444';
      colorInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Click Apply Icon button
    const applyBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Apply'));
    if (applyBtn) {
      applyBtn.click();
      return "Applied Heart icon";
    }
    return "Apply button not found";
  })()`);
  console.log("Apply Built-in Result:", applyBuiltinRes);
  await new Promise((r) => setTimeout(r, 1000));

  // Inspect canvas DOM for testIconId
  const domInspect1 = await evalInPage(`(() => {
    const mount = document.querySelector('[data-blockpages-custom-icon-mount][data-blockpages-mount-for="${testIconId}"]');
    const anchor = document.querySelector('[data-blockpages-icon-id="${testIconId}"]');
    return {
      hasMount: !!mount,
      mountFor: mount?.getAttribute('data-blockpages-mount-for'),
      mountHtml: mount?.innerHTML?.slice(0, 200),
      hasSvgInMount: !!mount?.querySelector('svg'),
      hasTextIdOnMount: mount?.hasAttribute('data-blockpages-text-id'),
      anchorTagName: anchor?.tagName,
      anchorOriginalHidden: anchor?.getAttribute('data-blockpages-original-icon') === 'true' || anchor?.style?.display === 'none'
    };
  })()`);
  console.log("DOM Inspect after built-in apply:", domInspect1);

  if (!domInspect1.hasMount || !domInspect1.hasSvgInMount) {
    console.error("FAIL: Built-in icon was not mounted or SVG is missing!");
    process.exit(1);
  }
  if (domInspect1.hasTextIdOnMount) {
    console.error("FAIL: Mount point was stamped with data-blockpages-text-id!");
    process.exit(1);
  }
  console.log("PASS: Built-in icon mounted cleanly with SVG rendered!");

  console.log("\n--- STEP 5: Test Text Sync Safety (Ensuring Icon Mount is NOT wiped) ---");
  const textSyncRes = await evalInPage(`(() => {
    // Dispatch input/keyup on an editable text element
    const textEl = document.querySelector('[contenteditable="true"], [data-blockpages-default-text]');
    if (textEl) {
      textEl.dispatchEvent(new Event('input', { bubbles: true }));
    }
    // Also check window storage and mounts
    const mountAfter = document.querySelector('[data-blockpages-custom-icon-mount][data-blockpages-mount-for="${testIconId}"]');
    return {
      hasMount: !!mountAfter,
      mountHtmlLen: mountAfter?.innerHTML?.length || 0,
      hasSvg: !!mountAfter?.querySelector('svg'),
      hasTextId: mountAfter?.hasAttribute('data-blockpages-text-id')
    };
  })()`);
  console.log("DOM state after text event:", textSyncRes);
  if (!textSyncRes.hasMount || !textSyncRes.hasSvg || textSyncRes.hasTextId) {
    console.error("FAIL: Text sync broke or stamped the custom icon mount!");
    process.exit(1);
  }
  console.log("PASS: Text sync did NOT overwrite or blank the custom icon mount!");

  console.log(`\n--- STEP 6: Test Custom Uploaded Image Icon on [${testIconId}] ---`);
  // Re-click pen to ensure sidebar is open
  await evalInPage(`(() => {
    const pen = document.querySelector('[data-blockpages-overlay-btn="${testIconId}"]');
    if (pen) pen.click();
  })()`);
  await new Promise((r) => setTimeout(r, 800));

  // Upload file via aside file input
  const uploadFileRes = await evalInPage(`(async () => {
    const fileInput = document.querySelector('aside input[type="file"]');
    if (!fileInput) return "No file input";

    const starSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="14" fill="%233B82F6"/></svg>';
    const dt = new DataTransfer();
    const file = new File([starSvg], "custom-circle.svg", { type: "image/svg+xml" });
    dt.items.add(file);
    fileInput.files = dt.files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    return "Dispatched file change event";
  })()`);
  console.log("Upload result:", uploadFileRes);
  await new Promise((r) => setTimeout(r, 1000));

  // Click Apply button
  const applyCustomImageRes = await evalInPage(`(() => {
    const applyBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Apply'));
    if (applyBtn) {
      applyBtn.click();
      return "Clicked Apply";
    }
    return "No Apply button";
  })()`);
  console.log("Apply result:", applyCustomImageRes);
  await new Promise((r) => setTimeout(r, 1200));

  const domInspect2 = await evalInPage(`(() => {
    const mount = document.querySelector('[data-blockpages-custom-icon-mount][data-blockpages-mount-for="${testIconId}"]');
    const img = mount?.querySelector('img');
    return {
      hasMount: !!mount,
      hasImg: !!img,
      imgSrc: img?.getAttribute('src')?.slice(0, 40),
      imgClasses: img?.className,
      imgNaturalWidth: img?.naturalWidth,
      mountHtml: mount?.innerHTML?.slice(0, 200),
      hasTextIdOnMount: mount?.hasAttribute('data-blockpages-text-id')
    };
  })()`);
  console.log("DOM Inspect after image apply:", domInspect2);

  if (!domInspect2.hasMount || !domInspect2.hasImg) {
    console.error("FAIL: Uploaded custom image icon was not mounted or img element is missing!");
    process.exit(1);
  }
  console.log("PASS: Custom image icon mounted successfully with valid <img> element!");

  console.log("\n--- STEP 7: Test Text Editing Keystrokes with Uploaded Image ---");
  const textSyncImageRes = await evalInPage(`(() => {
    // Find text elements and trigger text sync
    const textEls = Array.from(document.querySelectorAll('[data-blockpages-default-text]'));
    if (textEls.length > 0) {
      textEls[0].dispatchEvent(new Event('input', { bubbles: true }));
      textEls[0].dispatchEvent(new Event('blur', { bubbles: true }));
    }
    window.dispatchEvent(new CustomEvent('blockpages-canvas-restored'));

    const mount = document.querySelector('[data-blockpages-custom-icon-mount][data-blockpages-mount-for="${testIconId}"]');
    const img = mount?.querySelector('img');
    return {
      hasMount: !!mount,
      hasImg: !!img,
      mountEmpty: mount?.innerHTML === "",
      hasTextId: mount?.hasAttribute('data-blockpages-text-id')
    };
  })()`);
  console.log("Image mount after text sync:", textSyncImageRes);
  if (!textSyncImageRes.hasMount || !textSyncImageRes.hasImg || textSyncImageRes.mountEmpty) {
    console.error("FAIL: Uploaded image icon disappeared or became blank after text sync!");
    process.exit(1);
  }
  console.log("PASS: Uploaded image icon survived text sync and did NOT blank!");

  console.log("\n--- STEP 8: Test Page Reload & Persistence ---");
  await send("Page.reload");
  await new Promise((r) => setTimeout(r, 2000));
  for (let i = 0; i < 40; i++) {
    const ready = await evalInPage(`(() => {
      return !!document.querySelector('[data-textblock-canvas]') && document.querySelectorAll('[data-blockpages-custom-icon-mount]').length > 0;
    })()`);
    if (ready) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  await new Promise((r) => setTimeout(r, 1000));

  const reloadInspect = await evalInPage(`(() => {
    const mount = document.querySelector('[data-blockpages-custom-icon-mount][data-blockpages-mount-for="${testIconId}"]');
    const img = mount?.querySelector('img');
    return {
      hasMount: !!mount,
      hasImg: !!img,
      imgSrc: img?.getAttribute('src')?.slice(0, 40),
      storage: localStorage.getItem('stackly-blockpages-custom-static-icons-ecommerce')?.slice(0, 100)
    };
  })()`);
  console.log("DOM Inspect after reload:", reloadInspect);
  if (!reloadInspect.hasMount || !reloadInspect.hasImg) {
    console.error("FAIL: Custom icon was not restored after page reload!");
    process.exit(1);
  }
  console.log("PASS: Custom icon successfully persisted across page reload!");

  console.log("\n--- STEP 9: Test Construction Template Switch & Persistence Isolation ---");
  // Navigate to construction template
  await send("Page.navigate", { url: "http://localhost:3000/blockpages/?template=construction" });
  await new Promise((r) => setTimeout(r, 1500));
  for (let i = 0; i < 30; i++) {
    const ready = await evalInPage(`(() => {
      return window.location.href.includes("template=construction") &&
        !!document.querySelector('[data-textblock-canvas]') &&
        Array.from(document.querySelectorAll("button")).some(b => b.textContent?.trim() === "Blocks") &&
        document.querySelectorAll('[data-textblock-canvas] svg').length > 0;
    })()`);
    if (ready) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  await new Promise((r) => setTimeout(r, 1500));

  // Enable icons mode in construction
  await evalInPage(`(() => {
    const existing = Array.from(document.querySelectorAll('[data-blockpages-overlay-btn]')).filter(p => p.getAttribute('title')?.includes('Icon'));
    if (existing.length > 0) return;
    const blocksBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent?.trim() === "Blocks");
    if (blocksBtn) blocksBtn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 800));

  await evalInPage(`(() => {
    const existing = Array.from(document.querySelectorAll('[data-blockpages-overlay-btn]')).filter(p => p.getAttribute('title')?.includes('Icon'));
    if (existing.length > 0) return;
    const iconSpan = Array.from(document.querySelectorAll("span")).find(s => s.textContent?.trim() === "Icon");
    const iconCard = iconSpan?.closest(".cursor-pointer");
    if (iconCard) iconCard.click();
  })()`);
  await new Promise((r) => setTimeout(r, 1500));

  const constCoverage = (await evalInPage(`(() => {
    const pens = Array.from(document.querySelectorAll('[data-blockpages-overlay-btn]'));
    const iconPens = pens.filter(p => p.getAttribute('title')?.includes('Icon'));
    return {
      iconPensCount: iconPens.length,
      iconIds: iconPens.map(p => p.getAttribute('data-blockpages-overlay-btn')).slice(0, 10)
    };
  })()`)) || { iconPensCount: 0, iconIds: [] };
  console.log("Construction icon pens:", constCoverage);
  if (constCoverage.iconPensCount < 3) {
    console.error("FAIL: Too few icon pens in construction template! Got", constCoverage.iconPensCount);
    process.exit(1);
  }
  console.log(`PASS: Found ${constCoverage.iconPensCount} editable icons in construction template!`);

  // Switch back to ecommerce and verify icon is STILL intact
  console.log("\n--- STEP 10: Switch back to Ecommerce Template ---");
  await send("Page.navigate", { url: "http://localhost:3000/blockpages/?template=ecommerce" });
  await new Promise((r) => setTimeout(r, 1500));
  for (let i = 0; i < 30; i++) {
    const ready = await evalInPage(`(() => {
      return window.location.href.includes("template=ecommerce") &&
        !!document.querySelector('[data-textblock-canvas]') &&
        document.querySelectorAll('[data-blockpages-custom-icon-mount]').length > 0;
    })()`);
    if (ready) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  await new Promise((r) => setTimeout(r, 1500));

  const ecomBackInspect = await evalInPage(`(() => {
    const mount = document.querySelector('[data-blockpages-custom-icon-mount][data-blockpages-mount-for="${testIconId}"]');
    const img = mount?.querySelector('img');
    return {
      hasMount: !!mount,
      hasImg: !!img,
      imgSrc: img?.getAttribute('src')?.slice(0, 40)
    };
  })()`);
  console.log("Ecommerce DOM after switching back:", ecomBackInspect);
  if (!ecomBackInspect.hasMount || !ecomBackInspect.hasImg) {
    console.error("FAIL: Ecommerce custom icon was lost after template switch!");
    process.exit(1);
  }
  console.log("PASS: Ecommerce custom icon remained intact across template switch!");

  // Step 11: Check for createRoot console errors
  console.log("\n--- STEP 11: Check Console Errors ---");
  const createRootErrors = consoleErrors.filter(e => e.includes("createRoot"));
  console.log(`Captured ${consoleErrors.length} total console messages, ${createRootErrors.length} createRoot warnings/errors.`);
  if (createRootErrors.length > 0) {
    console.error("FAIL: Encountered createRoot errors:", createRootErrors);
    process.exit(1);
  }
  console.log("PASS: ZERO createRoot errors captured throughout the entire flow!");

  // Step 12: Capture Screenshot
  console.log("\n--- STEP 12: Capture Screenshot of Verified Live State ---");
  const screenshotRes = await send("Page.captureScreenshot", { format: "png" });
  const screenshotBuffer = Buffer.from(screenshotRes.data, "base64");
  const outPath = "C:\\Users\\ashit\\.gemini\\antigravity-ide\\brain\\759d7c60-4377-4298-a7c5-a4c24589bdc0\\custom_icon_system_verified.png";
  fs.writeFileSync(outPath, screenshotBuffer);
  console.log(`Screenshot saved to ${outPath}`);

  console.log("\n=== ALL ICON SYSTEM REGRESSION TESTS PASSED SUCCESSFULLY! ===");
  process.exit(0);
}

run().catch((err) => {
  console.error("FATAL ERROR in test runner:", err);
  process.exit(1);
});

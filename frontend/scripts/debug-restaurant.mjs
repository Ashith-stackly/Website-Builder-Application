const WebSocket = globalThis.WebSocket;

async function test() {
  const versionRes = await fetch("http://localhost:9222/json/list");
  const pages = await versionRes.json();
  const page = pages.find((p) => p.type === "page" && p.url.includes("blockpages"));
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

  const send = (method, params = {}) => {
    const msgId = id++;
    return new Promise((resolve, reject) => {
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  };

  const evaluate = async (fnOrStr) => {
    const expr = typeof fnOrStr === "function" ? `(${fnOrStr})()` : fnOrStr;
    const res = await send("Runtime.evaluate", {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) throw new Error(JSON.stringify(res.exceptionDetails));
    return res.result ? res.result.value : res.value;
  };

  await send("Page.navigate", { url: "http://localhost:3000/blockpages/?template=restaurant" });
  await new Promise((r) => setTimeout(r, 3000));

  // Switch to Button mode
  await evaluate(() => {
    const spans = Array.from(document.querySelectorAll("span"));
    const btnSpan = spans.find((s) => s.textContent?.trim() === "Button");
    btnSpan?.parentElement?.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  const pens = await evaluate(() => {
    return Array.from(document.querySelectorAll('[data-blockpages-overlay-kind="button"]')).map((p) => ({
      btn: p.getAttribute("data-blockpages-overlay-btn"),
      top: p.style.top,
      left: p.style.left,
      visible: !!p.offsetParent,
    }));
  });
  console.log("Restaurant pens:", pens);

  const clickResult = await evaluate(() => {
    const pen = document.querySelector('[data-blockpages-overlay-btn="btn-restaurant-hero-explore-food"]');
    if (!pen) return { found: false };
    pen.click();
    return { found: true };
  });
  console.log("Click pen result:", clickResult);

  await new Promise((r) => setTimeout(r, 1500));

  const pageState = await evaluate(() => {
    const preset0 = document.querySelector('button[data-blockpages-preset="0"]');
    const clickMeBtns = Array.from(document.querySelectorAll("button")).filter((b) =>
      b.textContent?.includes("Click Me !")
    );
    return {
      hasPreset0: !!preset0,
      clickMeCount: clickMeBtns.length,
      currentUrl: window.location.href,
    };
  });
  console.log("Page state after pen click:", pageState);

  // Click preset 0 in ButtonCanvas
  await evaluate(() => {
    const presetBtn = document.querySelector('button[data-blockpages-preset="0"]');
    if (presetBtn) presetBtn.click();
  });
  await new Promise((r) => setTimeout(r, 2000));

  const afterPresetState = await evaluate(() => {
    const el = document.querySelector('[data-blockpages-button-id="btn-restaurant-hero-explore-food"]');
    return {
      customized: el?.getAttribute("data-blockpages-customized-button"),
      bg: el ? window.getComputedStyle(el).backgroundColor : null,
      outerHTML: el?.outerHTML
    };
  });
  console.log("After preset state:", afterPresetState);

  ws.close();
}

test().catch(console.error);

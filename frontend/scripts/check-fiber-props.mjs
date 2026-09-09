const WebSocket = globalThis.WebSocket;

async function checkFiberProps() {
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

  function send(method, params = {}) {
    const msgId = id++;
    return new Promise((resolve, reject) => {
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  const res = await send("Runtime.evaluate", {
    expression: `(() => {
      const container = document.querySelector('[data-blockpages-overlay-container="true"]');
      const key = Object.keys(container || {}).find(k => k.startsWith("__reactFiber"));
      let fiber = key ? container[key] : null;
      let enhancerProps = null;
      while (fiber) {
        if (fiber.memoizedProps && ("customButtons" in fiber.memoizedProps)) {
          enhancerProps = fiber.memoizedProps;
          break;
        }
        fiber = fiber.return;
      }
      return {
        hasEnhancerProps: Boolean(enhancerProps),
        customButtonsInProps: enhancerProps ? enhancerProps.customButtons : null,
      };
    })()`,
    returnByValue: true,
  });

  console.log("Fiber Props:", JSON.stringify(res.result?.value, null, 2));
  ws.close();
}

checkFiberProps().catch(console.error);

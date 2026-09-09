const WebSocket = globalThis.WebSocket;

async function checkConsole() {
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

  // Check what happens if we execute loadBlockPagesDraft in the browser context!
  const res = await send("Runtime.evaluate", {
    expression: `(async () => {
      try {
        const token = localStorage.getItem("stackly-auth-token");
        const resp = await fetch("http://localhost:5000/api/projects/6aa03ba9cca2851f60f02901", {
          headers: token ? { Authorization: "Bearer " + token } : {},
        });
        const json = await resp.json();
        return {
          status: resp.status,
          hasBlockPagesData: Boolean(json.project?.builderData?.blockPagesData),
          customButtons: json.project?.builderData?.blockPagesData?.customButtons,
        };
      } catch (e) {
        return { error: e.message };
      }
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });

  console.log("In-browser draft fetch test:", JSON.stringify(res.result?.value, null, 2));
  ws.close();
}

checkConsole().catch(console.error);

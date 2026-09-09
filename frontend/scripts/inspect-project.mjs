const WebSocket = globalThis.WebSocket;

async function inspectProject() {
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
    expression: `localStorage.getItem("stackly-auth-token")`,
    returnByValue: true,
  });

  const token = res.result?.value;
  const resp = await fetch("http://localhost:5000/api/projects/6aa03ba9cca2851f60f02901", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await resp.json();
  console.log("builderData:", JSON.stringify(data.project?.builderData, null, 2));

  ws.close();
}

inspectProject().catch(console.error);

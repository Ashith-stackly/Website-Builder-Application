const WebSocket = globalThis.WebSocket;

async function checkConsoleLogs() {
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

  // Enable Log and Runtime domains
  await send("Log.enable");
  await send("Runtime.enable");

  // Reload page and collect console logs
  const logs = [];
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === "Runtime.consoleAPICalled") {
      logs.push({
        type: msg.params.type,
        args: msg.params.args?.map((a) => a.value || a.description),
      });
    }
    if (msg.method === "Log.entryAdded") {
      logs.push({
        type: msg.params.entry?.level,
        text: msg.params.entry?.text,
      });
    }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  console.log("Reloading page and capturing console logs...");
  await send("Page.reload", {});
  await new Promise((r) => setTimeout(r, 4000));

  console.log("Captured logs count:", logs.length);
  logs.forEach(l => console.log("LOG:", JSON.stringify(l)));

  ws.close();
}

checkConsoleLogs().catch(console.error);

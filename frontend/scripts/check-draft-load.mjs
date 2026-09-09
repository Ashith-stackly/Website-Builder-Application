const WebSocket = globalThis.WebSocket;

async function checkLoadDraft() {
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
    expression: `(async () => {
      const token = localStorage.getItem("stackly-auth-token");
      try {
        const res = await fetch("http://localhost:5000/api/projects/6aa03ba9cca2851f60f02901", {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: "Bearer " + token } : {}),
          },
        });
        const json = await res.json();
        return {
          status: res.status,
          hasDraft: Boolean(json.project?.builderData?.blockPagesData),
          customButtons: json.project?.builderData?.blockPagesData?.customButtons,
        };
      } catch (err) {
        return { error: err.message };
      }
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });

  console.log("Draft check result:", res.result?.value);
  ws.close();
}

checkLoadDraft().catch(console.error);

const WebSocket = globalThis.WebSocket;

async function checkToken() {
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
      return {
        token: localStorage.getItem("stackly-auth-token"),
      };
    })()`,
    returnByValue: true,
  });

  const token = res.result?.value?.token;
  console.log("Found stackly-auth-token in browser:", token ? token.slice(0, 20) + "..." : "NONE");

  if (token) {
    const resp = await fetch("http://localhost:5000/api/projects", {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Fetch /api/projects status:", resp.status);
    if (resp.ok) {
      const data = await resp.json();
      console.log("Projects count in backend:", data.projects?.length);
      const latest = data.projects?.[0];
      if (latest) {
        console.log("Latest project:", {
          id: latest._id,
          name: latest.projectName,
          category: latest.category,
          hasBlockPagesData: Boolean(latest.builderData?.blockPagesData),
          customButtonsKeys: Object.keys(latest.builderData?.blockPagesData?.customButtons || {}),
        });
      }
    }
  }

  ws.close();
}

checkToken().catch(console.error);

/**
 * Start Next.js dev + Razorpay API (port 3001) together for Website-Builder-Application.
 */
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function run(name, script) {
  const child = spawn(process.execPath, [resolve(ROOT, script)], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
  child.on("exit", (code) => {
    if (code && code !== 0) console.error(`[dev-with-razorpay] ${name} exited ${code}`);
  });
  return child;
}

console.log("[dev-with-razorpay] Starting Razorpay API on http://localhost:3001");
const api = run("razorpay-api", "scripts/razorpay-api-server.mjs");

console.log("[dev-with-razorpay] Starting Next.js dev on http://localhost:3000");
const next = run("dev-safe", "scripts/dev-safe.mjs");

function shutdown() {
  api.kill("SIGTERM");
  next.kill("SIGTERM");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

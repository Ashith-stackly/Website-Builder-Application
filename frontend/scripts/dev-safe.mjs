import { execSync, spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const PROJECT_ROOT = process.cwd();
const LOCK_PATH = resolve(PROJECT_ROOT, ".next", "dev", "lock");
const PORTS = [3000, 3001];

function execText(command) {
  try {
    return execSync(command, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return "";
  }
}

function killPid(pid) {
  if (!pid || pid <= 0 || pid === process.pid) return;
  try {
    if (process.platform === "win32") {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
    } else {
      execSync(`kill -9 ${pid}`, { stdio: "ignore" });
    }
    console.log(`[dev-safe] Stopped process ${pid}`);
  } catch {
    /* ignore kill failures */
  }
}

function collectPidsOnWindows() {
  const netstat = execText("netstat -ano -p tcp");
  const pids = new Set();
  const lines = netstat.split(/\r?\n/);

  for (const line of lines) {
    if (!line.includes("LISTENING")) continue;
    const cols = line.trim().split(/\s+/);
    if (cols.length < 5) continue;
    const localAddr = cols[1] || "";
    const pidRaw = cols[4] || "";
    const pid = Number.parseInt(pidRaw, 10);
    if (!Number.isFinite(pid)) continue;
    for (const port of PORTS) {
      if (localAddr.endsWith(`:${port}`)) pids.add(pid);
    }
  }

  return pids;
}

function collectPidsOnUnix() {
  const pids = new Set();
  for (const port of PORTS) {
    const out = execText(`lsof -ti tcp:${port}`);
    for (const row of out.split(/\r?\n/)) {
      const pid = Number.parseInt(row.trim(), 10);
      if (Number.isFinite(pid)) pids.add(pid);
    }
  }
  return pids;
}

function stopConflictingDevServers() {
  const pids = process.platform === "win32" ? collectPidsOnWindows() : collectPidsOnUnix();
  pids.forEach((pid) => killPid(pid));
}

function clearNextLockFile() {
  if (!existsSync(LOCK_PATH)) return;
  try {
    rmSync(LOCK_PATH, { force: true });
    console.log("[dev-safe] Removed stale .next/dev/lock");
  } catch {
    /* ignore lock removal failures */
  }
}

function configureLocalDevEnv() {
  /*
   * GitHub Pages sets NEXT_PUBLIC_BASE_PATH=/Website-Builder-Application in CI.
   * If that variable is also in your Windows user/shell env, localhost:3000/landing
   * returns 404 — you must use localhost:3000/Website-Builder-Application/landing.
   * Local dev clears it unless STACKLY_DEV_WITH_BASE_PATH=1.
   */
  if (process.env.STACKLY_DEV_WITH_BASE_PATH === "1") {
    return;
  }
  delete process.env.NEXT_PUBLIC_BASE_PATH;
}

function startNextDev() {
  configureLocalDevEnv();
  const nextCli = resolve(PROJECT_ROOT, "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextCli, "dev"], {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
    env: { ...process.env },
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

stopConflictingDevServers();
clearNextLockFile();
startNextDev();

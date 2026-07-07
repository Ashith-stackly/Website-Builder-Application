/**
 * Standalone Razorpay API for static GitHub Pages deploys.
 * Run: npm run razorpay-api
 * Set RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET in .env.local (loaded via dotenv optional) or env vars.
 */
import http from "node:http";
import crypto from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.RAZORPAY_API_PORT || 3001);

function loadEnvFile() {
  const envPath = resolve(__dirname, "../.env.local");
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const key = t.slice(0, i).trim();
    const val = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile();

const KEY_ID = process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

function corsHeaders(origin) {
  const allowed = process.env.RAZORPAY_CORS_ORIGIN ?? "*";
  const o = allowed === "*" ? origin ?? "*" : allowed;
  return {
    "Access-Control-Allow-Origin": o,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function sendJson(res, status, body, origin) {
  res.writeHead(status, { "Content-Type": "application/json", ...corsHeaders(origin) });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function razorpayRequest(path, method, body) {
  const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64");
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.description ?? data?.error?.reason ?? "Razorpay API error";
    throw new Error(msg);
  }
  return data;
}

function verifySignature(orderId, paymentId, signature) {
  const expected = crypto
    .createHmac("sha256", KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders(origin));
    res.end();
    return;
  }

  if (!KEY_ID || !KEY_SECRET) {
    sendJson(res, 500, { error: "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set" }, origin);
    return;
  }

  try {
    if (req.method === "POST" && req.url === "/api/razorpay/create-order") {
      const body = await readJson(req);
      const amountPaise = Number(body.amountPaise);
      if (!Number.isFinite(amountPaise) || amountPaise < 100) {
        sendJson(res, 400, { error: "Invalid amount" }, origin);
        return;
      }
      const order = await razorpayRequest("/orders", "POST", {
        amount: amountPaise,
        currency: "INR",
        receipt: `stackly_${Date.now()}`,
        notes: {
          planName: String(body.planName ?? ""),
          billingPeriod: String(body.billingPeriod ?? ""),
        },
      });
      sendJson(
        res,
        200,
        {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId: KEY_ID,
        },
        origin,
      );
      return;
    }

    if (req.method === "POST" && req.url === "/api/razorpay/verify") {
      const body = await readJson(req);
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        sendJson(res, 400, { error: "Missing payment fields" }, origin);
        return;
      }
      const verified = verifySignature(
        String(razorpay_order_id),
        String(razorpay_payment_id),
        String(razorpay_signature),
      );
      sendJson(res, 200, { verified }, origin);
      return;
    }

    sendJson(res, 404, { error: "Not found" }, origin);
  } catch (e) {
    sendJson(res, 500, { error: e instanceof Error ? e.message : "Server error" }, origin);
  }
});

server.listen(PORT, () => {
  console.log(`Razorpay API listening on http://localhost:${PORT}`);
});

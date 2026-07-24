"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ImagePlus, LoaderCircle, Sparkles, WandSparkles, X } from "lucide-react";
import { generateAIImage } from "@/lib/aiApi";
import { useAssetStore } from "@/store/assetStore";
import type { Asset } from "@/types/assets";

type ImageMode = "generate" | "placeholder";
type AspectRatio = "1:1" | "4:3" | "3:4" | "16:9" | "9:16";
type ImageSize = "small" | "medium" | "large";

const STYLES = [
  { value: "photorealistic", label: "Photo" },
  { value: "illustration", label: "Illustration" },
  { value: "editorial", label: "Editorial" },
  { value: "minimal", label: "Minimal" },
];

const RATIOS: Array<{ value: AspectRatio; label: string }> = [
  { value: "1:1", label: "Square" },
  { value: "4:3", label: "Landscape" },
  { value: "3:4", label: "Portrait" },
  { value: "16:9", label: "Wide" },
  { value: "9:16", label: "Tall" },
];

const SIZES: Array<{ value: ImageSize; label: string; detail: string }> = [
  { value: "small", label: "Small", detail: "Fast" },
  { value: "medium", label: "Medium", detail: "Balanced" },
  { value: "large", label: "Large", detail: "Detailed" },
];

const cleanFileStem = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "visual";

const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function useClientReady(): boolean {
  return useSyncExternalStore(subscribeToClient, getClientSnapshot, getServerSnapshot);
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/* ═══════════════════════════════════════════════════════════════════════
   Prompt-aware Canvas image generator — renders contextual scenes
   based on keyword detection from the user's prompt.
   ═══════════════════════════════════════════════════════════════════════ */

function resolveCanvasDimensions(aspectRatio: string, size: string): [number, number] {
  const scale = size === "small" ? 0.5 : size === "large" ? 1.5 : 1;
  const dims: Record<string, [number, number]> = {
    "1:1":  [800, 800],
    "4:3":  [1024, 768],
    "3:4":  [768, 1024],
    "16:9": [1280, 720],
    "9:16": [720, 1280],
  };
  const [w, h] = dims[aspectRatio] ?? [800, 800];
  return [Math.round(w * scale), Math.round(h * scale)];
}

/** Deterministic PRNG so the same prompt always produces the same image. */
function seededRandom(seed: number) {
  let s = (seed % 2147483647) || 1;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

type SceneTheme = "night" | "ocean" | "nature" | "sunset" | "city" | "abstract" | "food" | "tech" | "floral" | "mountain";

const THEME_KEYWORDS: Array<[SceneTheme, string[]]> = [
  ["night",    ["star", "night", "sky", "space", "galaxy", "moon", "dark", "cosmic", "universe", "constellation", "aurora", "nebula", "starry"]],
  ["ocean",    ["ocean", "sea", "water", "wave", "beach", "marine", "fish", "underwater", "coral", "surf", "lake", "river", "rain"]],
  ["nature",   ["nature", "tree", "forest", "leaf", "green", "park", "jungle", "garden", "grass", "plant", "bamboo", "fern", "woodland"]],
  ["sunset",   ["sunset", "sunrise", "dawn", "dusk", "warm", "golden", "horizon", "twilight", "evening", "morning"]],
  ["city",     ["city", "urban", "building", "skyline", "architecture", "tower", "bridge", "street", "downtown", "metro", "neon"]],
  ["mountain", ["mountain", "hill", "peak", "alpine", "snow", "valley", "cliff", "highland", "ridge", "volcano"]],
  ["floral",   ["flower", "floral", "rose", "petal", "bloom", "blossom", "botanical", "bouquet", "daisy", "tulip", "lily"]],
  ["food",     ["food", "bakery", "kitchen", "restaurant", "coffee", "cake", "bread", "cook", "meal", "dish", "fruit", "wine"]],
  ["tech",     ["tech", "digital", "code", "computer", "data", "cyber", "circuit", "network", "ai", "robot", "futuristic", "matrix"]],
  ["abstract", ["abstract", "pattern", "geometric", "minimal", "shape", "modern", "art", "creative", "design", "texture"]],
];

function detectTheme(prompt: string): SceneTheme {
  const lower = prompt.toLowerCase();
  for (const [theme, keywords] of THEME_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw))) return theme;
  }
  return "abstract";
}

interface ThemeColors { bg1: string; bg2: string; accent: string; fg: string; glow: string }

const THEME_COLORS: Record<SceneTheme, ThemeColors> = {
  night:    { bg1: "#020617", bg2: "#0c1029", accent: "#818cf8", fg: "#e0e7ff", glow: "#6366f1" },
  ocean:    { bg1: "#042f2e", bg2: "#0c4a6e", accent: "#22d3ee", fg: "#cffafe", glow: "#06b6d4" },
  nature:   { bg1: "#052e16", bg2: "#14532d", accent: "#4ade80", fg: "#dcfce7", glow: "#22c55e" },
  sunset:   { bg1: "#431407", bg2: "#7c2d12", accent: "#fb923c", fg: "#fff7ed", glow: "#f97316" },
  city:     { bg1: "#09090b", bg2: "#18181b", accent: "#a78bfa", fg: "#ede9fe", glow: "#8b5cf6" },
  mountain: { bg1: "#1e1b4b", bg2: "#312e81", accent: "#93c5fd", fg: "#dbeafe", glow: "#3b82f6" },
  floral:   { bg1: "#4a044e", bg2: "#701a75", accent: "#f0abfc", fg: "#fdf4ff", glow: "#d946ef" },
  food:     { bg1: "#451a03", bg2: "#78350f", accent: "#fbbf24", fg: "#fef3c7", glow: "#f59e0b" },
  tech:     { bg1: "#022c22", bg2: "#064e3b", accent: "#34d399", fg: "#d1fae5", glow: "#10b981" },
  abstract: { bg1: "#0f172a", bg2: "#1e293b", accent: "#60a5fa", fg: "#dbeafe", glow: "#3b82f6" },
};

/* ─── Night / Stars / Sky ──────────────────────────────────────────── */

function drawStarField(ctx: CanvasRenderingContext2D, w: number, h: number, rand: () => number) {
  // Milky-way nebula band
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 80; i++) {
    const cx = rand() * w;
    const cy = h * 0.3 + rand() * h * 0.25;
    const r = 60 + rand() * 180;
    const nebGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    nebGrad.addColorStop(0, i % 2 === 0 ? "#818cf8" : "#a78bfa");
    nebGrad.addColorStop(1, "transparent");
    ctx.fillStyle = nebGrad;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }

  // ~400 tiny stars spread across sky
  for (let i = 0; i < 400; i++) {
    const x = rand() * w;
    const y = rand() * h * 0.9;
    const brightness = 0.2 + rand() * 0.8;
    const radius = 0.3 + rand() * 1.8;
    ctx.globalAlpha = brightness;
    ctx.fillStyle = i % 15 === 0 ? "#fef9c3" : i % 8 === 0 ? "#bfdbfe" : "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // ~25 bright stars with glow halos
  for (let i = 0; i < 25; i++) {
    const x = rand() * w;
    const y = rand() * h * 0.75;
    const r = 1.5 + rand() * 3;
    // outer glow
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 8);
    glow.addColorStop(0, "rgba(255,255,255,0.5)");
    glow.addColorStop(0.3, "rgba(200,210,255,0.12)");
    glow.addColorStop(1, "transparent");
    ctx.globalAlpha = 1;
    ctx.fillStyle = glow;
    ctx.fillRect(x - r * 8, y - r * 8, r * 16, r * 16);
    // cross flare on the brightest ones
    if (i < 6) {
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 0.8;
      const flareLen = r * 10;
      ctx.beginPath(); ctx.moveTo(x - flareLen, y); ctx.lineTo(x + flareLen, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y - flareLen); ctx.lineTo(x, y + flareLen); ctx.stroke();
    }
    // star core
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // shooting star
  ctx.globalAlpha = 0.8;
  const sx = w * 0.15 + rand() * w * 0.4;
  const sy = h * 0.04 + rand() * h * 0.15;
  const angle = 0.3 + rand() * 0.4;
  const len = 100 + rand() * 80;
  const ex = sx + Math.cos(angle) * len;
  const ey = sy + Math.sin(angle) * len;
  const lineGrad = ctx.createLinearGradient(sx, sy, ex, ey);
  lineGrad.addColorStop(0, "#ffffff");
  lineGrad.addColorStop(1, "transparent");
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
  ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(sx - 1, sy + 2); ctx.lineTo(ex, ey + 4); ctx.stroke();

  // crescent moon
  ctx.globalAlpha = 1;
  const mx = w * 0.8 + rand() * w * 0.1;
  const my = h * 0.12 + rand() * h * 0.06;
  const mr = Math.min(w, h) * 0.055;
  // moon glow
  const moonGlow = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 4);
  moonGlow.addColorStop(0, "rgba(254,249,195,0.25)");
  moonGlow.addColorStop(1, "transparent");
  ctx.fillStyle = moonGlow;
  ctx.fillRect(mx - mr * 4, my - mr * 4, mr * 8, mr * 8);
  // moon body
  ctx.fillStyle = "#fef9c3";
  ctx.beginPath();
  ctx.arc(mx, my, mr, 0, Math.PI * 2);
  ctx.fill();
  // shadow to make crescent
  ctx.fillStyle = "#020617";
  ctx.beginPath();
  ctx.arc(mx - mr * 0.35, my - mr * 0.1, mr * 0.82, 0, Math.PI * 2);
  ctx.fill();

  // horizon glow
  ctx.globalAlpha = 0.15;
  const horizGlow = ctx.createLinearGradient(0, h * 0.85, 0, h);
  horizGlow.addColorStop(0, "transparent");
  horizGlow.addColorStop(1, "#312e81");
  ctx.fillStyle = horizGlow;
  ctx.fillRect(0, h * 0.85, w, h * 0.15);
}

/* ─── Ocean / Water ────────────────────────────────────────────────── */

function drawOceanScene(ctx: CanvasRenderingContext2D, w: number, h: number, rand: () => number) {
  // lighter sky at top
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.45);
  skyGrad.addColorStop(0, "#075985");
  skyGrad.addColorStop(1, "#0ea5e9");
  ctx.globalAlpha = 1;
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h * 0.45);
  // sun reflection shimmer
  ctx.globalAlpha = 0.25;
  const sunGlow = ctx.createRadialGradient(w * 0.5, h * 0.35, 0, w * 0.5, h * 0.35, w * 0.35);
  sunGlow.addColorStop(0, "#fde68a");
  sunGlow.addColorStop(1, "transparent");
  ctx.fillStyle = sunGlow;
  ctx.fillRect(0, 0, w, h * 0.6);
  // stacked wave layers
  for (let layer = 0; layer < 6; layer++) {
    const baseY = h * (0.38 + layer * 0.1);
    ctx.globalAlpha = 0.5 + layer * 0.1;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    for (let x = 0; x <= w; x += 2) {
      const y = baseY
        + Math.sin(x * 0.008 + layer * 1.8 + rand() * 0.2) * h * 0.025
        + Math.cos(x * 0.005 + layer * 0.7) * h * 0.018
        + Math.sin(x * 0.015 + layer * 3) * h * 0.008;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
    ctx.fillStyle = `hsl(${200 - layer * 6}, ${75 + layer * 3}%, ${18 + layer * 7}%)`;
    ctx.fill();
  }
  // foam / highlight streaks
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 50; i++) {
    const fx = rand() * w;
    const fy = h * 0.38 + rand() * h * 0.58;
    ctx.fillRect(fx, fy, 25 + rand() * 80, 1);
  }
  // distant clouds
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 5; i++) {
    const cx = rand() * w, cy = h * 0.08 + rand() * h * 0.15;
    const cw = 100 + rand() * 200, ch = 20 + rand() * 30;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(cx, cy, cw, ch, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ─── Nature / Forest / Trees ──────────────────────────────────────── */

function drawNatureScene(ctx: CanvasRenderingContext2D, w: number, h: number, rand: () => number) {
  // blue sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.5);
  skyGrad.addColorStop(0, "#7dd3fc");
  skyGrad.addColorStop(1, "#e0f2fe");
  ctx.globalAlpha = 1;
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h * 0.55);
  // sun
  ctx.globalAlpha = 0.35;
  const sunGlow = ctx.createRadialGradient(w * 0.75, h * 0.1, 0, w * 0.75, h * 0.1, w * 0.18);
  sunGlow.addColorStop(0, "#fef08a");
  sunGlow.addColorStop(1, "transparent");
  ctx.fillStyle = sunGlow;
  ctx.fillRect(w * 0.5, 0, w * 0.5, h * 0.35);
  // rolling hills
  for (let layer = 0; layer < 4; layer++) {
    ctx.globalAlpha = 1;
    ctx.beginPath();
    const hillBase = h * (0.38 + layer * 0.14);
    ctx.moveTo(0, hillBase);
    for (let x = 0; x <= w; x += 5) {
      const y = hillBase
        + Math.sin(x * 0.003 + layer * 2.5) * h * 0.06
        + Math.cos(x * 0.005 + layer * 1.2) * h * 0.03
        - layer * h * 0.02;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
    ctx.fillStyle = `hsl(${125 + layer * 12}, ${45 - layer * 4}%, ${22 + layer * 11}%)`;
    ctx.fill();
  }
  // trees (background → foreground)
  for (let pass = 0; pass < 2; pass++) {
    const count = pass === 0 ? 10 : 8;
    for (let i = 0; i < count; i++) {
      const tx = rand() * w;
      const ty = pass === 0 ? h * 0.35 + rand() * h * 0.2 : h * 0.55 + rand() * h * 0.25;
      const treeH = (pass === 0 ? 30 : 50) + rand() * (pass === 0 ? 50 : 80);
      ctx.globalAlpha = pass === 0 ? 0.5 : 0.75;
      // trunk
      ctx.fillStyle = `hsl(${25 + rand() * 15}, ${35 + rand() * 15}%, ${18 + rand() * 12}%)`;
      ctx.fillRect(tx - 3, ty, 6, treeH * 0.4);
      // canopy (2 triangles stacked)
      const canopyColor = `hsl(${115 + rand() * 35}, ${35 + rand() * 25}%, ${20 + rand() * 18}%)`;
      ctx.fillStyle = canopyColor;
      for (let t = 0; t < 2; t++) {
        const offset = t * treeH * 0.2;
        ctx.beginPath();
        ctx.moveTo(tx, ty - treeH * 0.6 + offset);
        ctx.lineTo(tx - treeH * 0.28, ty - offset * 0.3);
        ctx.lineTo(tx + treeH * 0.28, ty - offset * 0.3);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
}

/* ─── Sunset / Sunrise ─────────────────────────────────────────────── */

function drawSunsetScene(ctx: CanvasRenderingContext2D, w: number, h: number, rand: () => number) {
  // rich gradient
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#1e1b4b");
  grad.addColorStop(0.2, "#581c87");
  grad.addColorStop(0.38, "#9f1239");
  grad.addColorStop(0.48, "#ea580c");
  grad.addColorStop(0.56, "#fb923c");
  grad.addColorStop(0.65, "#fde68a");
  grad.addColorStop(0.8, "#78350f");
  grad.addColorStop(1, "#1c1917");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  // sun disk
  const sunY = h * 0.5;
  const sunR = Math.min(w, h) * 0.1;
  ctx.globalAlpha = 1;
  const sunGlow = ctx.createRadialGradient(w * 0.5, sunY, sunR * 0.2, w * 0.5, sunY, sunR * 5);
  sunGlow.addColorStop(0, "rgba(253,230,138,0.7)");
  sunGlow.addColorStop(0.4, "rgba(251,146,60,0.2)");
  sunGlow.addColorStop(1, "transparent");
  ctx.fillStyle = sunGlow;
  ctx.fillRect(0, sunY - sunR * 5, w, sunR * 10);
  ctx.fillStyle = "#fde68a";
  ctx.beginPath();
  ctx.arc(w * 0.5, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  // cloud silhouettes
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 8; i++) {
    const cx = rand() * w, cy = h * 0.15 + rand() * h * 0.3;
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 80 + rand() * 180, 12 + rand() * 25, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // water reflection
  ctx.globalAlpha = 0.2;
  for (let i = 0; i < 40; i++) {
    const ly = h * 0.6 + rand() * h * 0.38;
    const lx = w * 0.15 + rand() * w * 0.7;
    ctx.fillStyle = rand() > 0.5 ? "#fde68a" : "#fb923c";
    ctx.fillRect(lx, ly, 30 + rand() * 120, 1);
  }
}

/* ─── City / Urban / Neon ──────────────────────────────────────────── */

function drawCityScene(ctx: CanvasRenderingContext2D, w: number, h: number, rand: () => number, colors: ThemeColors) {
  // background buildings (far)
  for (let i = 0; i < 20; i++) {
    const bw = 15 + rand() * 40;
    const bh = h * 0.15 + rand() * h * 0.3;
    const bx = rand() * w;
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = `hsl(${240 + rand() * 20}, 12%, ${16 + rand() * 8}%)`;
    ctx.fillRect(bx, h - bh, bw, bh);
  }
  // foreground buildings
  for (let i = 0; i < 18; i++) {
    const bw = 25 + rand() * 65;
    const bh = h * 0.25 + rand() * h * 0.45;
    const bx = rand() * w;
    ctx.globalAlpha = 0.65 + rand() * 0.35;
    ctx.fillStyle = `hsl(${240 + rand() * 30}, ${8 + rand() * 12}%, ${10 + rand() * 12}%)`;
    ctx.fillRect(bx, h - bh, bw, bh);
    // lit windows
    for (let wy = h - bh + 10; wy < h - 10; wy += 14) {
      for (let wx = bx + 5; wx < bx + bw - 5; wx += 11) {
        if (rand() > 0.35) {
          ctx.globalAlpha = 0.4 + rand() * 0.6;
          ctx.fillStyle = rand() > 0.7
            ? `hsl(${200 + rand() * 80}, 80%, 70%)`
            : "#fef08a";
          ctx.fillRect(wx, wy, 5, 7);
        }
      }
    }
  }
  // neon glow on ground
  ctx.globalAlpha = 0.25;
  const neonGlow = ctx.createLinearGradient(0, h * 0.85, 0, h);
  neonGlow.addColorStop(0, "transparent");
  neonGlow.addColorStop(1, colors.glow);
  ctx.fillStyle = neonGlow;
  ctx.fillRect(0, h * 0.85, w, h * 0.15);
  // distant stars
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 60; i++) {
    const x = rand() * w, y = rand() * h * 0.3;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, 0.5 + rand() * 1, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ─── Mountain / Alpine ────────────────────────────────────────────── */

function drawMountainScene(ctx: CanvasRenderingContext2D, w: number, h: number, rand: () => number) {
  // sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.55);
  skyGrad.addColorStop(0, "#1e1b4b");
  skyGrad.addColorStop(0.6, "#4338ca");
  skyGrad.addColorStop(1, "#93c5fd");
  ctx.globalAlpha = 1;
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);
  // stars in sky
  for (let i = 0; i < 80; i++) {
    ctx.globalAlpha = 0.3 + rand() * 0.5;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(rand() * w, rand() * h * 0.35, 0.3 + rand() * 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  // mountain ranges
  for (let layer = 0; layer < 4; layer++) {
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(-10, h);
    const segW = w / (5 + layer * 2);
    const baseY = h * (0.4 + layer * 0.1);
    for (let x = -10; x <= w + 10; x += segW) {
      const peakH = baseY - (h * 0.12 + rand() * h * 0.22) * (1 - layer * 0.2);
      const midX = x + segW / 2;
      ctx.lineTo(midX, peakH);
      ctx.lineTo(x + segW, baseY + rand() * h * 0.04);
    }
    ctx.lineTo(w + 10, h);
    ctx.closePath();
    const lightness = 15 + layer * 10;
    ctx.fillStyle = `hsl(${225 + layer * 12}, ${35 + layer * 8}%, ${lightness}%)`;
    ctx.fill();
    // snow caps on first two layers
    if (layer < 2) {
      ctx.globalAlpha = 0.45 - layer * 0.15;
      ctx.fillStyle = "#e0e7ff";
      for (let x = -10; x <= w + 10; x += segW) {
        const peakH = baseY - (h * 0.12 + rand() * h * 0.18) * (1 - layer * 0.2);
        const midX = x + segW / 2;
        ctx.beginPath();
        ctx.moveTo(midX, peakH);
        ctx.lineTo(midX - 25 - rand() * 20, peakH + 30 + rand() * 20);
        ctx.lineTo(midX + 25 + rand() * 20, peakH + 30 + rand() * 20);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
  // foreground ground
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(0, h * 0.88, w, h * 0.12);
}

/* ─── Tech / Digital / Circuit ─────────────────────────────────────── */

function drawTechScene(ctx: CanvasRenderingContext2D, w: number, h: number, rand: () => number, colors: ThemeColors) {
  // dot grid
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = colors.accent;
  const gridSize = 30;
  for (let x = 0; x <= w; x += gridSize) {
    for (let y = 0; y <= h; y += gridSize) {
      ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill();
    }
  }
  // circuit paths
  for (let i = 0; i < 60; i++) {
    const nx = Math.round(rand() * w / gridSize) * gridSize;
    const ny = Math.round(rand() * h / gridSize) * gridSize;
    ctx.globalAlpha = 0.12 + rand() * 0.15;
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(nx, ny);
    const segments = 2 + Math.floor(rand() * 4);
    let cx = nx, cy = ny;
    for (let s = 0; s < segments; s++) {
      if (rand() > 0.5) { cx += (rand() > 0.5 ? 1 : -1) * gridSize * (1 + Math.floor(rand() * 4)); }
      else { cy += (rand() > 0.5 ? 1 : -1) * gridSize * (1 + Math.floor(rand() * 4)); }
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
    // node dot
    ctx.globalAlpha = 0.5 + rand() * 0.5;
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // glowing orbs
  for (let i = 0; i < 6; i++) {
    const ox = rand() * w, oy = rand() * h;
    const orR = 60 + rand() * 100;
    const orbGlow = ctx.createRadialGradient(ox, oy, 0, ox, oy, orR);
    orbGlow.addColorStop(0, colors.glow + "30");
    orbGlow.addColorStop(1, "transparent");
    ctx.globalAlpha = 1;
    ctx.fillStyle = orbGlow;
    ctx.beginPath();
    ctx.arc(ox, oy, orR, 0, Math.PI * 2);
    ctx.fill();
  }
  // hexagon pattern
  ctx.globalAlpha = 0.04;
  ctx.strokeStyle = colors.fg;
  ctx.lineWidth = 0.8;
  const hexR = 35;
  for (let row = 0; row < h / (hexR * 1.5); row++) {
    for (let col = 0; col < w / (hexR * 1.73); col++) {
      const hx = col * hexR * 1.73 + (row % 2 === 0 ? 0 : hexR * 0.87);
      const hy = row * hexR * 1.5;
      ctx.beginPath();
      for (let s = 0; s <= 6; s++) {
        const a = (s / 6) * Math.PI * 2 - Math.PI / 6;
        const px = hx + Math.cos(a) * hexR;
        const py = hy + Math.sin(a) * hexR;
        s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
}

/* ─── Floral / Botanical ───────────────────────────────────────────── */

function drawFloralScene(ctx: CanvasRenderingContext2D, w: number, h: number, rand: () => number) {
  const petalColors = ["#f9a8d4", "#c084fc", "#f472b6", "#e879f9", "#fb7185", "#fda4af", "#a78bfa"];
  // stems
  ctx.globalAlpha = 0.2;
  ctx.strokeStyle = "#4ade80";
  ctx.lineWidth = 2;
  for (let i = 0; i < 20; i++) {
    const sx = rand() * w;
    ctx.beginPath();
    ctx.moveTo(sx, h);
    let cy = h;
    for (let seg = 0; seg < 5; seg++) {
      cy -= 30 + rand() * 60;
      ctx.lineTo(sx + (rand() - 0.5) * 40, cy);
    }
    ctx.stroke();
  }
  // flowers
  for (let i = 0; i < 40; i++) {
    const cx = rand() * w, cy = rand() * h;
    const petalCount = 5 + Math.floor(rand() * 4);
    const petalR = 10 + rand() * 40;
    ctx.globalAlpha = 0.25 + rand() * 0.35;
    for (let p = 0; p < petalCount; p++) {
      const angle = (p / petalCount) * Math.PI * 2 + rand() * 0.2;
      const px = cx + Math.cos(angle) * petalR;
      const py = cy + Math.sin(angle) * petalR;
      ctx.fillStyle = petalColors[Math.floor(rand() * petalColors.length)];
      ctx.beginPath();
      ctx.ellipse(px, py, petalR * 0.5, petalR * 0.22, angle, 0, Math.PI * 2);
      ctx.fill();
    }
    // flower center
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.arc(cx, cy, petalR * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }
  // bokeh
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 15; i++) {
    const bx = rand() * w, by = rand() * h, br = 20 + rand() * 50;
    ctx.strokeStyle = petalColors[Math.floor(rand() * petalColors.length)];
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/* ─── Food / Bakery / Restaurant ───────────────────────────────────── */

function drawFoodScene(ctx: CanvasRenderingContext2D, w: number, h: number, rand: () => number, colors: ThemeColors) {
  const foodColors = ["#fbbf24", "#f97316", "#ef4444", "#a16207", "#dc2626", "#b45309", "#ca8a04"];
  // warm ambient
  ctx.globalAlpha = 0.15;
  const warmGlow = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, Math.max(w, h) * 0.5);
  warmGlow.addColorStop(0, "#fbbf24");
  warmGlow.addColorStop(1, "transparent");
  ctx.fillStyle = warmGlow;
  ctx.fillRect(0, 0, w, h);
  // plates
  for (let i = 0; i < 8; i++) {
    const cx = rand() * w, cy = rand() * h, r = 40 + rand() * 80;
    ctx.globalAlpha = 0.12 + rand() * 0.12;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.08;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    // food circles on plate
    for (let f = 0; f < 3 + Math.floor(rand() * 4); f++) {
      const fx = cx + (rand() - 0.5) * r * 1.2;
      const fy = cy + (rand() - 0.5) * r * 1.2;
      ctx.globalAlpha = 0.2 + rand() * 0.25;
      ctx.fillStyle = foodColors[Math.floor(rand() * foodColors.length)];
      ctx.beginPath();
      ctx.arc(fx, fy, 8 + rand() * 20, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // steam wisps
  ctx.globalAlpha = 0.06;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 15; i++) {
    const sx = rand() * w;
    ctx.beginPath();
    let y = rand() * h * 0.5;
    ctx.moveTo(sx, y);
    for (let s = 0; s < 8; s++) {
      y -= 15 + rand() * 20;
      ctx.lineTo(sx + Math.sin(y * 0.04) * 20, y);
    }
    ctx.stroke();
  }
}

/* ─── Abstract / Geometric ─────────────────────────────────────────── */

function drawAbstractScene(ctx: CanvasRenderingContext2D, w: number, h: number, rand: () => number, colors: ThemeColors) {
  // soft orbs
  for (let i = 0; i < 18; i++) {
    const x = rand() * w, y = rand() * h;
    const r = 30 + rand() * Math.min(w, h) * 0.22;
    ctx.globalAlpha = 0.06 + rand() * 0.1;
    const orbGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
    orbGrad.addColorStop(0, i % 3 === 0 ? colors.glow : colors.accent);
    orbGrad.addColorStop(1, "transparent");
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // geometric wireframes
  for (let i = 0; i < 10; i++) {
    ctx.globalAlpha = 0.05 + rand() * 0.08;
    ctx.strokeStyle = colors.fg;
    ctx.lineWidth = 1;
    const sx = rand() * w, sy = rand() * h, ss = 40 + rand() * 160;
    ctx.beginPath();
    const sides = 3 + Math.floor(rand() * 5);
    for (let s = 0; s <= sides; s++) {
      const a = (s / sides) * Math.PI * 2 - Math.PI / 2;
      const px = sx + Math.cos(a) * ss, py = sy + Math.sin(a) * ss;
      s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }
  // diagonal lines
  ctx.globalAlpha = 0.04;
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    ctx.moveTo(rand() * w, rand() * h);
    ctx.lineTo(rand() * w, rand() * h);
    ctx.stroke();
  }
}

/* ─── Main canvas renderer ─────────────────────────────────────────── */

async function createLocalImage(
  prompt: string,
  style: string,
  aspectRatio: string,
  size: string,
): Promise<{ imageUrl: string; mimeType: string; alt: string; source: string }> {
  const [w, h] = resolveCanvasDimensions(aspectRatio, size);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  const theme = detectTheme(prompt);
  const colors = THEME_COLORS[theme];
  const seedVal = Array.from(prompt).reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
  const rand = seededRandom(Math.abs(seedVal) || 42);

  // base gradient
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, colors.bg1);
  grad.addColorStop(1, colors.bg2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // draw theme-specific scene
  switch (theme) {
    case "night":    drawStarField(ctx, w, h, rand); break;
    case "ocean":    drawOceanScene(ctx, w, h, rand); break;
    case "nature":   drawNatureScene(ctx, w, h, rand); break;
    case "sunset":   drawSunsetScene(ctx, w, h, rand); break;
    case "city":     drawCityScene(ctx, w, h, rand, colors); break;
    case "mountain": drawMountainScene(ctx, w, h, rand); break;
    case "tech":     drawTechScene(ctx, w, h, rand, colors); break;
    case "floral":   drawFloralScene(ctx, w, h, rand); break;
    case "food":     drawFoodScene(ctx, w, h, rand, colors); break;
    default:         drawAbstractScene(ctx, w, h, rand, colors); break;
  }

  // subtle vignette
  ctx.globalAlpha = 1;
  const vignette = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.72);
  vignette.addColorStop(0, "transparent");
  vignette.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  // film grain effect
  ctx.globalAlpha = 0.025;
  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = rand() > 0.5 ? "#ffffff" : "#000000";
    ctx.fillRect(rand() * w, rand() * h, 1, 1);
  }

  // convert to PNG data URL
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas export failed"))), "image/png", 0.92);
  });
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  return { imageUrl: dataUrl, mimeType: "image/png", alt: prompt, source: "local-ai" };
}

/* ═══════════════════════════════════════════════════════════════════════
   Component types & form
   ═══════════════════════════════════════════════════════════════════════ */

export interface GeneratedAssetDetails {
  asset: Asset;
  alt?: string;
  source?: string;
}

interface AIGenerateImageFormProps {
  initialMode?: ImageMode;
  onSaved?: (details: GeneratedAssetDetails) => void | Promise<void>;
  onRequestClose?: () => void;
  compact?: boolean;
}

/**
 * Shared image generation form. Tries the backend AI endpoint first; if the
 * server is unavailable, unauthenticated, or the provider isn't configured,
 * falls back to a fully client-side Canvas-rendered PNG that is saved to the
 * asset library exactly like any other image.
 */
export function AIGenerateImageForm({
  initialMode = "generate",
  onSaved,
  onRequestClose,
  compact = false,
}: AIGenerateImageFormProps) {
  const saveGeneratedImage = useAssetStore((state) => state.saveGeneratedImage);
  const [mode, setMode] = useState<ImageMode>(initialMode);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("photorealistic");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("4:3");
  const [size, setSize] = useState<ImageSize>("medium");
  const [previewUrl, setPreviewUrl] = useState("");
  const [savedAsset, setSavedAsset] = useState<Asset | null>(null);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const requestRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => requestRef.current?.abort();
  }, []);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const generate = useCallback(async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setError(mode === "placeholder" ? "Describe the subject for the placeholder." : "Describe the image you want to create.");
      return;
    }

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const requestId = ++requestIdRef.current;
    setError("");
    setIsGenerating(true);
    setPreviewUrl("");
    setSavedAsset(null);

    try {
      let result: { imageUrl: string; mimeType?: string; alt?: string; source?: string };

      // Try backend first with a fast timeout, fall back to local Canvas generation
      try {
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        result = await generateAIImage(
          { prompt: trimmedPrompt, style, aspectRatio, size, mode },
          controller.signal,
        );
        clearTimeout(timeoutId);
      } catch (_serverError: unknown) {
        // Backend failed (auth, no API key, timeout, network) → generate locally
        result = await createLocalImage(trimmedPrompt, style, aspectRatio, size);
      }

      if (requestId !== requestIdRef.current) return;

      setPreviewUrl(result.imageUrl);

      // Use a fresh controller for save (the original may be aborted from timeout)
      const saveController = new AbortController();
      const asset = await saveGeneratedImage(
        {
          imageUrl: result.imageUrl,
          mimeType: result.mimeType,
          name: `${mode === "placeholder" ? "placeholder" : "ai"}-${cleanFileStem(trimmedPrompt)}`,
          tags: [mode, style, aspectRatio],
        },
        saveController.signal,
      );
      if (requestId !== requestIdRef.current) return;

      setSavedAsset(asset);
      await onSaved?.({ asset, alt: result.alt, source: result.source });
    } catch (generationError: unknown) {
      if (requestId !== requestIdRef.current) return;
      if (isAbortError(generationError)) return;
      const msg = generationError instanceof Error ? generationError.message : "Image generation failed. Please try again.";
      setError(msg);
    } finally {
      if (requestId === requestIdRef.current) setIsGenerating(false);
    }
  }, [aspectRatio, mode, onSaved, prompt, saveGeneratedImage, size, style]);

  const padding = compact ? "p-4" : "p-5 sm:p-6";

  return (
    <div className={`space-y-4 ${padding}`}>
      <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200/60 dark:border-slate-700/60">
        {([
          { value: "generate", label: "AI image", icon: Sparkles },
          { value: "placeholder", label: "Smart placeholder", icon: ImagePlus },
        ] as const).map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => { setMode(value); setError(""); }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-bold transition cursor-pointer ${
              mode === value
                ? "bg-white dark:bg-slate-900 text-violet-800 dark:text-violet-300 shadow-sm border border-slate-200/50 dark:border-slate-700/60"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Icon className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
            {label}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
          {mode === "placeholder" ? "What should this placeholder represent?" : "Describe the visual"}
        </span>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          maxLength={700}
          rows={compact ? 3 : 4}
          placeholder={mode === "placeholder" ? "e.g. a warm bakery counter with pastries" : "e.g. sunlit artisan bakery interior, inviting, natural textures"}
          className="w-full resize-y rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-violet-400 focus:ring-2 focus:ring-violet-100/20"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">Style</span>
          <select
            value={style}
            onChange={(event) => setStyle(event.target.value)}
            disabled={mode === "placeholder"}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100/20 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-400"
          >
            {STYLES.map((option) => (
              <option key={option.value} value={option.value} className="dark:bg-slate-900 dark:text-slate-100">
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">Shape</span>
          <select
            value={aspectRatio}
            onChange={(event) => setAspectRatio(event.target.value as AspectRatio)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100/20"
          >
            {RATIOS.map((option) => (
              <option key={option.value} value={option.value} className="dark:bg-slate-900 dark:text-slate-100">
                {option.label} ({option.value})
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset disabled={mode === "placeholder"}>
        <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Resolution</legend>
        <div className="grid grid-cols-3 gap-2">
          {SIZES.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={size === option.value}
              onClick={() => setSize(option.value)}
              className={`rounded-xl border p-2 text-left transition focus:outline-none focus:ring-2 focus:ring-violet-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                size === option.value
                  ? "border-violet-500 dark:border-violet-500 bg-violet-50 dark:bg-violet-950/60 text-violet-900 dark:text-violet-200"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-violet-300 dark:hover:border-violet-700"
              }`}
            >
              <span className="block text-xs font-extrabold">{option.label}</span>
              <span className="mt-0.5 block text-[10px] text-slate-500 dark:text-slate-400">{option.detail}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {previewUrl && (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Generated visual preview" className="max-h-52 w-full object-contain" />
          {savedAsset && (
            <p className="border-t border-slate-200 dark:border-slate-800 px-3 py-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              Saved to your asset library as {savedAsset.name}
            </p>
          )}
        </div>
      )}

      {error && (
        <div role="alert" className="flex gap-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/60 p-3 text-xs leading-5 text-rose-800 dark:text-rose-300">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        {onRequestClose && (
          <button
            type="button"
            onClick={onRequestClose}
            disabled={isGenerating}
            className="rounded-lg px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-50 cursor-pointer"
          >
            Close
          </button>
        )}
        <button
          type="button"
          onClick={() => void generate()}
          disabled={isGenerating}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:from-violet-800 hover:to-fuchsia-700 disabled:cursor-wait disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-violet-300 cursor-pointer"
        >
          {isGenerating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
          {isGenerating ? "Generating…" : savedAsset ? "Generate another" : mode === "placeholder" ? "Create placeholder" : "Generate image"}
        </button>
      </div>
      {isGenerating && (
        <button
          type="button"
          onClick={() => requestRef.current?.abort()}
          className="mx-auto block text-xs font-semibold text-slate-500 dark:text-slate-400 underline-offset-2 hover:text-slate-800 dark:hover:text-slate-200 hover:underline cursor-pointer"
        >
          Cancel generation
        </button>
      )}
    </div>
  );
}

export function AIImageGeneratorDialog({
  open,
  onClose,
  initialMode = "generate",
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initialMode?: ImageMode;
  onSaved?: (details: GeneratedAssetDetails) => void | Promise<void>;
}) {
  const mounted = useClientReady();
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[21000] flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
        >
          <motion.section
            aria-labelledby="ai-image-title"
            aria-modal="true"
            role="dialog"
            initial={{ opacity: 0, y: 24, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.985 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            onMouseDown={(event) => event.stopPropagation()}
            className="max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl"
          >
            <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-5 py-4 backdrop-blur sm:px-6">
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-sm">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h2 id="ai-image-title" className="text-[15px] font-extrabold text-slate-900 dark:text-slate-100">
                    Create a visual
                  </h2>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Generated images are saved to this project&apos;s reusable asset library.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close image generator"
                className="rounded-lg p-2 text-slate-400 dark:text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-300 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <AIGenerateImageForm initialMode={initialMode} onSaved={onSaved} onRequestClose={onClose} />
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

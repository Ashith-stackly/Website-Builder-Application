// Recompress key auth images to between 90–100 KB using sharp.
// NOTE: This will ENLARGE files that are currently smaller than 90 KB
// by increasing quality and, if needed, slightly upscaling dimensions.
// Run with: node scripts/compress-webp-to-100kb.cjs

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const images = [
  "public/login.webp",
  "public/illustration.webp",
  "public/password.webp",
  "public/email.webp",
  "public/mobile.webp",
  "public/tick.webp",
  "public/new.webp",
  "public/stackly-logo.webp",
];

async function adjustToRange(filePath, minKB = 90, maxKB = 100) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    console.warn(`Skipping missing file: ${filePath}`);
    return;
  }

  const input = fs.readFileSync(abs);
  const originalSizeKB = input.length / 1024;

  // Case 1: image is larger than desired max; compress down.
  if (originalSizeKB > maxKB) {
    let bestBuffer = input;
    let bestSizeKB = originalSizeKB;
    for (let quality = 90; quality >= 40; quality -= 5) {
      const output = await sharp(input).webp({ quality }).toBuffer();
      const sizeKB = output.length / 1024;
      bestBuffer = output;
      bestSizeKB = sizeKB;
      if (sizeKB <= maxKB && sizeKB >= minKB) break;
    }
    fs.writeFileSync(abs, bestBuffer);
    console.log(`${filePath}: ${bestSizeKB.toFixed(1)} KB (compressed)`);
    return;
  }

  // Case 2: image is smaller than desired min; increase quality / upscale slightly.
  let scale = 1.0;
  let quality = 95;
  let buf = input;
  let sizeKB = originalSizeKB;

  // Try increasing quality first (up to 100).
  while (quality <= 100 && sizeKB < minKB) {
    buf = await sharp(input).webp({ quality }).toBuffer();
    sizeKB = buf.length / 1024;
    quality += 2;
  }

  // If still too small, gently upscale dimensions while keeping quality high.
  while (sizeKB < minKB && scale < 1.6) {
    scale += 0.1;
    const image = sharp(input);
    const meta = await image.metadata();
    const width = meta.width ? Math.round(meta.width * scale) : undefined;
    const height = meta.height ? Math.round(meta.height * scale) : undefined;
    buf = await image.resize(width, height, { fit: "inside" }).webp({ quality: 95 }).toBuffer();
    sizeKB = buf.length / 1024;
  }

  fs.writeFileSync(abs, buf);
  console.log(`${filePath}: ${sizeKB.toFixed(1)} KB (was ${originalSizeKB.toFixed(1)} KB)`);
}

(async () => {
  for (const img of images) {
    await adjustToRange(img, 90, 100);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});


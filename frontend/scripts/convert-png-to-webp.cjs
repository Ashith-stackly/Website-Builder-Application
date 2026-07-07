const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const publicDir = path.join(__dirname, "..", "public");
const pngFiles = [
  "illustration.png",
  "illustration1.png",
  "new.png",
  "password.png",
  "mobile.png",
  "login.png",
  "login1.png",
  "tick.png",
  "email.png",
  "stackly-logo.png",
];

async function convert() {
  for (const file of pngFiles) {
    const inputPath = path.join(publicDir, file);
    const outputPath = path.join(publicDir, file.replace(/\.png$/i, ".webp"));
    if (!fs.existsSync(inputPath)) {
      console.warn("Skip (not found):", file);
      continue;
    }
    try {
      await sharp(inputPath)
        .webp({ quality: 85 })
        .toFile(outputPath);
      console.log("Converted:", file, "->", path.basename(outputPath));
    } catch (err) {
      console.error("Error converting", file, err.message);
    }
  }
}

convert();

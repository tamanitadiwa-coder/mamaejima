// Generates app icons and placeholder artwork. Run: npm run icons
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "fs";

const BROWN = "#3B2A1E";
const BRONZE = "#B08D5B";
const IVORY = "#F6F1E8";

// The mark: three stacked chevrons, after the chevron frieze on the walls of Great Zimbabwe.
function mark(cx, cy, w, stroke, color) {
  const h = w * 0.28;
  const gap = w * 0.24;
  let d = "";
  for (let i = -1; i <= 1; i++) {
    const y = cy + i * gap;
    d += `M ${cx - w / 2} ${y + h / 2} L ${cx - w / 4} ${y - h / 2} L ${cx} ${y + h / 2} L ${cx + w / 4} ${y - h / 2} L ${cx + w / 2} ${y + h / 2} `;
  }
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="square" stroke-linejoin="miter"/>`;
}

function iconSvg(size, { maskable = false } = {}) {
  const w = maskable ? size * 0.42 : size * 0.56;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BROWN}"/>
  ${mark(size / 2, size / 2, w, size * 0.045, BRONZE)}
</svg>`;
}

mkdirSync("public/icons", { recursive: true });
mkdirSync("public/placeholders", { recursive: true });

writeFileSync("public/icons/icon.svg", iconSvg(512));
writeFileSync("public/icons/mark.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${mark(50, 50, 80, 6, "currentColor")}</svg>`);

const out = [
  ["icon-192.png", 192, {}],
  ["icon-512.png", 512, {}],
  ["maskable-512.png", 512, { maskable: true }],
  ["maskable-192.png", 192, { maskable: true }],
  ["apple-touch-icon.png", 180, { maskable: true }],
  ["favicon-32.png", 32, {}],
];
for (const [name, size, o] of out) {
  await sharp(Buffer.from(iconSvg(size, o))).png().toFile(`public/icons/${name}`);
}

// Placeholder product art: flat earth tones + one chevron band. Clearly labelled.
const tones = [
  ["#E9DFCF", "#8A6A4A"], ["#DCCDB6", "#5A3E2B"], ["#EFE7DA", "#9C7A4E"], ["#D8C7AE", "#3B2A1E"],
  ["#E4D6C1", "#6E4F36"], ["#F1EADF", "#7A5A3C"], ["#D2BFA3", "#4A3424"], ["#E7DCCB", "#A3825A"],
];
tones.forEach(([bg, fg], i) => {
  const W = 800, H = 1000;
  let chev = "";
  for (let x = -40; x < W + 40; x += 80) chev += `M ${x} 560 L ${x + 40} 520 L ${x + 80} 560 `;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <path d="${chev}" fill="none" stroke="${fg}" stroke-opacity="0.35" stroke-width="6"/>
  <path d="${chev.replace(/ 560/g, " 600").replace(/ 520/g, " 560")}" fill="none" stroke="${fg}" stroke-opacity="0.2" stroke-width="6"/>
  <rect x="${W / 2 - 150}" y="300" width="300" height="160" fill="none" stroke="${fg}" stroke-opacity="0.45" stroke-width="2"/>
  <text x="${W / 2}" y="372" text-anchor="middle" font-family="Georgia, serif" font-size="30" letter-spacing="6" fill="${fg}">PLACEHOLDER</text>
  <text x="${W / 2}" y="414" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="18" letter-spacing="2" fill="${fg}" fill-opacity="0.8">PRODUCT PHOTO</text>
</svg>`;
  writeFileSync(`public/placeholders/product-${i + 1}.svg`, svg);
});

// Hero placeholder: an architectural composition, labelled.
{
  const W = 1600, H = 1200;
  let rows = "";
  for (let r = 0; r < 6; r++) {
    let d = "";
    const y = 760 + r * 46;
    for (let x = -60; x < W + 60; x += 120) d += `M ${x} ${y} L ${x + 60} ${y - 34} L ${x + 120} ${y} `;
    rows += `<path d="${d}" fill="none" stroke="#B08D5B" stroke-opacity="${0.5 - r * 0.06}" stroke-width="5"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#4A3424"/>
  <rect y="700" width="${W}" height="${H - 700}" fill="#3B2A1E"/>
  <circle cx="1120" cy="380" r="210" fill="#5A3E2B"/>
  <circle cx="1120" cy="380" r="210" fill="none" stroke="#B08D5B" stroke-opacity="0.35" stroke-width="2"/>
  ${rows}
  <text x="80" y="${H - 70}" font-family="Helvetica, Arial, sans-serif" font-size="20" letter-spacing="4" fill="#E9DFCF" fill-opacity="0.7">PLACEHOLDER — REPLACE WITH HERO PHOTOGRAPH</text>
</svg>`;
  writeFileSync("public/placeholders/hero.svg", svg);
}

// Splash-friendly monochrome mark for in-app splash
console.log("Icons and placeholders generated.");

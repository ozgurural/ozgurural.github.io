#!/usr/bin/env node
/*
 * Render OpenGraph share cards for each lab (1200x630 PNG).
 * Output: images/lab-og/og-<labkey>.png
 *
 * Run with `node scripts/build-lab-og.js`.
 */
const { Resvg } = require("@resvg/resvg-js");
const fs = require("fs");
const path = require("path");

const LABS = [
  {
    key: "lab",
    eyebrow: "Interactive research arcade",
    icon: "🧪",
    title: "Lab",
    sub: "Five test chambers from my research. Aim. Fire. Get graded.",
    tagline: "Distributed consensus · ML security · Fault tolerance · Optimization",
    bg: "#0c4a6e",
    accent: "#38bdf8",
  },
  {
    key: "tg",
    eyebrow: "Blockchain · Nakamoto consensus",
    icon: "⛏️",
    title: "Block Race",
    sub: "Mine. Attack. Defend. The math is whitepaper §11.",
    tagline: "Bitcoin double-spend, made playable",
    bg: "#0f172a",
    accent: "#f59e0b",
  },
  {
    key: "wm",
    eyebrow: "ML security · Model provenance",
    icon: "🕵️",
    title: "Model Heist Detector",
    sub: "Catch the thief without breaking the model.",
    tagline: "AI watermarks across thousands of weights",
    bg: "#1e1b4b",
    accent: "#a78bfa",
  },
  {
    key: "pol",
    eyebrow: "ML · Proof of Learning",
    icon: "🔬",
    title: "Training Fingerprint",
    sub: "Earn Gold Proof. Or don't.",
    tagline: "The journey is harder to fake than the destination",
    bg: "#064e3b",
    accent: "#10b981",
  },
  {
    key: "tmr",
    eyebrow: "Aerospace · Fault tolerance",
    icon: "✈️",
    title: "Redundancy Reactor",
    sub: "Three of the same thing is still one thing.",
    tagline: "Triple modular redundancy, with correlation that bites",
    bg: "#1f2937",
    accent: "#f43f5e",
  },
  {
    key: "gd",
    eyebrow: "Deep Learning · Optimization",
    icon: "⛰️",
    title: "Gradient Pinball",
    sub: "Land the optimizer in the global minimum.",
    tagline: "Loss landscapes, momentum, and the occasional saddle",
    bg: "#1e3a8a",
    accent: "#fbbf24",
  },
];

const W = 1200, H = 630;

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function svg(lab) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${lab.bg}" stop-opacity="1"/>
      <stop offset="100%" stop-color="#020617" stop-opacity="1"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"  stop-color="${lab.accent}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${lab.accent}" stop-opacity="0.2"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Subtle grid -->
  <g stroke="${lab.accent}" stroke-opacity="0.04" stroke-width="1">
    ${Array.from({ length: 12 }, (_, i) => `<line x1="${i * 100}" y1="0" x2="${i * 100}" y2="${H}"/>`).join("\n    ")}
    ${Array.from({ length: 7 },  (_, i) => `<line x1="0" y1="${i * 100}" x2="${W}" y2="${i * 100}"/>`).join("\n    ")}
  </g>

  <!-- Accent bar -->
  <rect x="0" y="0" width="${W}" height="6" fill="url(#accent)"/>

  <!-- Eyebrow -->
  <text x="80" y="120" font-family="ui-monospace, 'SF Mono', Menlo, monospace" font-size="22" font-weight="600" letter-spacing="3" fill="${lab.accent}" fill-opacity="0.85">${esc(lab.eyebrow.toUpperCase())}</text>

  <!-- Icon + Title block. Title font-size scales down for long titles
       so it never clips against the 5-star pip block on the right. -->
  <text x="80" y="270" font-family="ui-sans-serif, system-ui, sans-serif" font-size="140" font-weight="700">${esc(lab.icon)}</text>
  <text x="250" y="265" font-family="Georgia, 'Times New Roman', serif" font-size="${
    lab.title.length > 18 ? 70 : lab.title.length > 14 ? 80 : 96
  }" font-weight="800" fill="#f8fafc">${esc(lab.title)}</text>

  <!-- Subtitle -->
  <text x="80" y="365" font-family="ui-sans-serif, system-ui, sans-serif" font-size="36" font-weight="600" fill="#e2e8f0">${esc(lab.sub)}</text>

  <!-- Tagline -->
  <text x="80" y="420" font-family="ui-sans-serif, system-ui, sans-serif" font-size="24" font-weight="400" fill="#94a3b8">${esc(lab.tagline)}</text>

  <!-- Divider -->
  <line x1="80" y1="500" x2="${W - 80}" y2="500" stroke="${lab.accent}" stroke-opacity="0.35" stroke-width="2"/>

  <!-- Footer -->
  <text x="80" y="560" font-family="ui-sans-serif, system-ui, sans-serif" font-size="28" font-weight="600" fill="#cbd5e1">Ozgur Ural</text>
  <text x="80" y="595" font-family="ui-monospace, 'SF Mono', Menlo, monospace" font-size="22" fill="${lab.accent}">ozgurural.github.io/lab</text>

  <!-- 5-star pip indicator (top right) -->
  <g transform="translate(${W - 280}, 110)">
    <text x="0" y="0" font-family="ui-monospace, monospace" font-size="22" letter-spacing="2" fill="${lab.accent}" fill-opacity="0.85">5★ FRONTIER</text>
    <g transform="translate(0, 16)">
      ${Array.from({ length: 5 }, (_, i) => `<text x="${i * 40}" y="36" font-family="ui-sans-serif, sans-serif" font-size="44" fill="${lab.accent}" fill-opacity="0.9">★</text>`).join("\n      ")}
    </g>
  </g>
</svg>`;
}

const outDir = path.join(__dirname, "..", "images", "lab-og");
fs.mkdirSync(outDir, { recursive: true });

let total = 0;
for (const lab of LABS) {
  const xml = svg(lab);
  const r = new Resvg(xml, {
    background: lab.bg,
    fitTo: { mode: "width", value: W },
    font: { loadSystemFonts: true },
  });
  const png = r.render().asPng();
  const out = path.join(outDir, "og-" + lab.key + ".png");
  fs.writeFileSync(out, png);
  console.log("✓ " + path.relative(path.join(__dirname, ".."), out) + "  (" + png.length + " bytes)");
  total += png.length;
}
console.log("\nTotal: " + LABS.length + " images, " + total + " bytes");

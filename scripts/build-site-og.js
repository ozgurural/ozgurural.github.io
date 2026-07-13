#!/usr/bin/env node
/*
 * Render the site-wide OpenGraph share card (1200x630 PNG) used as the default
 * social preview for the homepage and any page without its own og_image.
 * Matches the visual language of scripts/build-lab-og.js.
 *
 * Output: images/og-default.png
 * Run with `node scripts/build-site-og.js`.
 */
const { Resvg } = require("@resvg/resvg-js");
const fs = require("fs");
const path = require("path");

const W = 1200, H = 630;
const BG = "#0c2a47";      // deep site blue
const ACCENT = "#38bdf8";  // brand sky, matches the flagship lab card + particles

const CARD = {
  eyebrow: "TRUSTWORTHY ML · MISSION-CRITICAL SYSTEMS",
  title: "Dr. Ozgur Ural",
  sub: "I build secure ML and systems that stay correct when things fail.",
  tagline: "Ph.D. in Machine Learning · Four IEEE Access papers · 12 years in production",
  role: "Senior Software Engineer · ML-Security Researcher",
  badge: "PH.D. · IEEE ACCESS",
};

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function svg(c) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BG}" stop-opacity="1"/>
      <stop offset="100%" stop-color="#020617" stop-opacity="1"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"  stop-color="${ACCENT}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${ACCENT}" stop-opacity="0.2"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <g stroke="${ACCENT}" stroke-opacity="0.04" stroke-width="1">
    ${Array.from({ length: 12 }, (_, i) => `<line x1="${i * 100}" y1="0" x2="${i * 100}" y2="${H}"/>`).join("\n    ")}
    ${Array.from({ length: 7 },  (_, i) => `<line x1="0" y1="${i * 100}" x2="${W}" y2="${i * 100}"/>`).join("\n    ")}
  </g>

  <rect x="0" y="0" width="${W}" height="6" fill="url(#accent)"/>

  <!-- Eyebrow -->
  <text x="80" y="120" font-family="ui-monospace, 'SF Mono', Menlo, monospace" font-size="22" font-weight="600" letter-spacing="3" fill="${ACCENT}" fill-opacity="0.85">${esc(c.eyebrow)}</text>

  <!-- Title (name) -->
  <text x="80" y="255" font-family="Georgia, 'Times New Roman', serif" font-size="96" font-weight="800" fill="#f8fafc">${esc(c.title)}</text>

  <!-- Subtitle -->
  <text x="80" y="345" font-family="ui-sans-serif, system-ui, sans-serif" font-size="36" font-weight="600" fill="#e2e8f0">${esc(c.sub)}</text>

  <!-- Tagline -->
  <text x="80" y="400" font-family="ui-sans-serif, system-ui, sans-serif" font-size="24" font-weight="400" fill="#94a3b8">${esc(c.tagline)}</text>

  <!-- Divider -->
  <line x1="80" y1="500" x2="${W - 80}" y2="500" stroke="${ACCENT}" stroke-opacity="0.35" stroke-width="2"/>

  <!-- Footer -->
  <text x="80" y="560" font-family="ui-sans-serif, system-ui, sans-serif" font-size="26" font-weight="600" fill="#cbd5e1">${esc(c.role)}</text>
  <text x="80" y="595" font-family="ui-monospace, 'SF Mono', Menlo, monospace" font-size="22" fill="${ACCENT}">ozgurural.github.io</text>

  <!-- Badge -->
  <g>
    <text x="${W - 80}" y="120" text-anchor="end" font-family="ui-monospace, 'SF Mono', Menlo, monospace" font-size="24" font-weight="600" letter-spacing="3" fill="${ACCENT}" fill-opacity="0.9">${esc(c.badge)}</text>
    <line x1="${W - 80 - c.badge.length * 16}" y1="136" x2="${W - 80}" y2="136" stroke="${ACCENT}" stroke-opacity="0.5" stroke-width="2"/>
  </g>
</svg>`;
}

const outDir = path.join(__dirname, "..", "images");
fs.mkdirSync(outDir, { recursive: true });
const r = new Resvg(svg(CARD), {
  background: BG,
  fitTo: { mode: "width", value: W },
  font: { loadSystemFonts: true },
});
const png = r.render().asPng();
const out = path.join(outDir, "og-default.png");
fs.writeFileSync(out, png);
console.log("✓ " + path.relative(path.join(__dirname, ".."), out) + "  (" + png.length + " bytes)");

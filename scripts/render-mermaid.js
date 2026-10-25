#!/usr/bin/env node
/*
 * Render a Mermaid diagram to a static SVG in the site's dark palette.
 *
 *   node scripts/render-mermaid.js images/diagrams/blockchain-ml-sequence.mmd
 *
 * The one post with a ```mermaid block used to load Mermaid 11.4.1 from
 * jsDelivr on every visit (about a megabyte of chunks, and the visitor's
 * address to a third party) to draw one diagram, and drew it in Mermaid's
 * light theme on this dark page, so the message labels were dark grey on
 * near-black and could not be read. Rendering once, here, fixes both: the
 * post shows the .svg written next to the .mmd as an ordinary image.
 *
 * The renderer is the same pinned Mermaid, loaded into headless Chrome for the
 * duration of the build only. The SVG is shown through <img>, where the page's
 * webfonts do not reach, so it names system fonts.
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const src = process.argv[2];
if (!src || !src.endsWith('.mmd')) { console.error('usage: render-mermaid.js <diagram.mmd>'); process.exit(2); }
const out = src.replace(/\.mmd$/, '.svg');
const code = fs.readFileSync(src, 'utf8');

// the site's tokens (_sass: --ds-surface, --ds-ink, --ds-body, --ds-muted, --ds-accent, --ds-line)
const C = { surface: '#0f172a', ink: '#f1f5f9', body: '#cbd5e1', muted: '#94a3b8', accent: '#38bdf8', line: '#334155' };
const config = {
  startOnLoad: false, theme: 'base', securityLevel: 'strict',
  fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
  themeVariables: {
    background: C.surface, fontSize: '15px',
    primaryColor: '#13243d', primaryBorderColor: C.accent, primaryTextColor: C.ink,
    lineColor: C.muted, textColor: C.body,
    actorBkg: '#13243d', actorBorder: C.accent, actorTextColor: C.ink, actorLineColor: C.line,
    signalColor: C.muted, signalTextColor: C.body,
    noteBkgColor: '#1e293b', noteBorderColor: C.line, noteTextColor: C.body,
    activationBkgColor: '#1e293b', activationBorderColor: C.accent,
  },
  sequence: { useMaxWidth: true, mirrorActors: false, actorMargin: 60, messageMargin: 38 },
};

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><html><body><div id="x"></div></body></html>');
    await page.addScriptTag({ type: 'module', content:
      "import m from 'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs'; window.mermaid = m;" });
    await page.waitForFunction(() => !!window.mermaid, { timeout: 60000 });
    let svg = await page.evaluate(async (code, config) => {
      window.mermaid.initialize(config);
      return (await window.mermaid.render('diagram', code)).svg;
    }, code, config);
    // a solid background, so nothing behind the image shows through the diagram
    svg = svg.replace(/<svg([^>]*)style="([^"]*)"/, (m, a, s) => `<svg${a}style="${s}background-color:${C.surface};"`);
    fs.writeFileSync(out, svg.endsWith('\n') ? svg : svg + '\n');
    console.log(`${path.relative(process.cwd(), out)}  ${(svg.length / 1024).toFixed(1)} KB`);
  } finally { await browser.close(); }
})();

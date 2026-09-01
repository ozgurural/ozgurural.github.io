#!/usr/bin/env node
/*
 * Structural and visual audit for every Research Lab film.
 *
 * The audit seeks through each film without playing it, which keeps the scan
 * deterministic and makes it practical to check every half-second on desktop
 * and mobile. It reports candidates for human review rather than silently
 * changing authored layouts.
 */
const puppeteer = require('puppeteer');

const BASE = process.env.FILM_BASE_URL || 'http://localhost:4000';
const STEP = Number(process.env.LAB_AUDIT_STEP || 0.5);
const FILMS = [
  'training-fingerprint', 'blockchain-ml', 'model-heist',
  'watermarking-comparison', 'cyber-events', 'determinism',
  'gradient-pinball', 'block-race', 'redundancy-reactor', 'oracles',
  'universal-jira',
];
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'mobile', width: 390, height: 844 },
];
const INTENTIONAL_CANVAS_CROSSFADE = new Set([
  ['SYSTEM FAILS', 'system OK'].sort().join('|'),
]);

function round(n) { return Math.round(n * 10) / 10; }

function printFinding(finding) {
  const where = [finding.viewport, finding.scene, `t=${finding.t}s`].filter(Boolean).join(', ');
  console.log(`    ${finding.type}: ${finding.text || '(unlabelled)'} (${where})`);
  if (finding.detail) console.log(`      ${finding.detail}`);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--hide-scrollbars',
           '--font-render-hinting=none', '--disable-lcd-text'],
  });
  const reports = [];

  try {
    for (const slug of FILMS) {
      const report = { slug, errors: [], metadata: null, findings: [], notices: [] };
      const findingKeys = new Set();

      for (const viewport of VIEWPORTS) {
        const page = await browser.newPage();
        await page.setViewport(viewport);
        page.on('pageerror', error => report.errors.push(`${viewport.name}: ${error.message}`));
        page.on('console', message => {
          if (message.type() === 'error') report.errors.push(`${viewport.name}: ${message.text()}`);
        });

        await page.evaluateOnNewDocument(() => {
          window.__labAuditText = [];
          const original = CanvasRenderingContext2D.prototype.fillText;
          CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
            try {
              const matrix = this.getTransform();
              const metrics = this.measureText(String(text));
              const point = new DOMPoint(x, y).matrixTransform(matrix);
              const scaleX = Math.hypot(matrix.a, matrix.b) || 1;
              const scaleY = Math.hypot(matrix.c, matrix.d) || 1;
              const width = Math.min(maxWidth || Infinity, metrics.width) * scaleX;
              const ascent = (metrics.actualBoundingBoxAscent || 0) * scaleY;
              const descent = (metrics.actualBoundingBoxDescent || 0) * scaleY;
              let left = point.x;
              if (this.textAlign === 'center') left -= width / 2;
              else if (this.textAlign === 'right' || this.textAlign === 'end') left -= width;
              let alpha = this.globalAlpha;
              const match = typeof this.fillStyle === 'string'
                ? this.fillStyle.match(/rgba?\([^)]*[,/]\s*([\d.]+)\s*\)$/i) : null;
              if (match) alpha *= Number(match[1]);
              window.__labAuditText.push({
                text: String(text), alpha, left, right: left + width,
                top: point.y - ascent, bottom: point.y + descent,
              });
            } catch (_) {}
            return original.apply(this, arguments);
          };
        });

        await page.goto(`${BASE}/lab/${slug}/embed/`, { waitUntil: 'networkidle0', timeout: 90000 });
        await page.waitForFunction(
          () => window.LabAnim && Object.keys(window.LabAnim.films).length > 0,
          { timeout: 60000 });

        const result = await page.evaluate(async (step) => {
          if (document.fonts) await document.fonts.ready;
          const films = window.LabAnim.films;
          const film = films[Object.keys(films)[0]];
          window.globalLabVoice = false;

          const audio = await Promise.all((film._audioCues || []).map(cue => new Promise(resolve => {
            const finish = () => resolve({ id: cue.id, at: cue.at, duration: cue.audio.duration || 0 });
            if (cue.audio.readyState >= 1) finish();
            else {
              cue.audio.addEventListener('loadedmetadata', finish, { once: true });
              cue.audio.addEventListener('error', () => resolve({ id: cue.id, at: cue.at, duration: 0, error: true }), { once: true });
              cue.audio.load();
            }
          })));

          function visible(element, stop) {
            for (let node = element; node && node !== stop; node = node.parentElement) {
              const style = getComputedStyle(node);
              if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) < 0.02) return false;
            }
            const rect = element.getBoundingClientRect();
            return rect.width > 0.5 && rect.height > 0.5;
          }

          function inkRect(element) {
            let target = element.querySelector && element.querySelector('.katex-html');
            if (!target) target = element;
            try {
              const range = document.createRange();
              range.selectNodeContents(target);
              const rects = Array.from(range.getClientRects()).filter(r => r.width > 0.2 && r.height > 0.2);
              if (rects.length) {
                return {
                  left: Math.min(...rects.map(r => r.left)),
                  right: Math.max(...rects.map(r => r.right)),
                  top: Math.min(...rects.map(r => r.top)),
                  bottom: Math.max(...rects.map(r => r.bottom)),
                };
              }
            } catch (_) {}
            const rect = element.getBoundingClientRect();
            return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
          }

          function intersects(a, b) {
            return a.left < b.right - 2 && a.right > b.left + 2 &&
                   a.top < b.bottom - 2 && a.bottom > b.top + 2;
          }

          const stage = film.stage;
          const stageRect = stage.getBoundingClientRect();
          const scaleX = film.W / stageRect.width;
          const scaleY = film.H / stageRect.height;
          const samples = [];

          for (let t = 0; t <= film.duration + 0.001; t += step) {
            window.__labAuditText.length = 0;
            film.seek(Math.min(t, film.duration));
            const scene = film.scenes[film._activeScene(film.t)];
            const caption = Array.from(stage.querySelectorAll('.labf__lower'))
              .find(node => visible(node, stage));
            const captionRect = caption ? inkRect(caption) : null;
            const transport = document.querySelector('.labf__transport');
            const transportRect = transport && visible(transport, document.body)
              ? transport.getBoundingClientRect() : null;
            const nodes = [];

            for (const element of stage.querySelectorAll('.labf__node, svg text')) {
              if (!visible(element, stage) || element.classList.contains('labf__lower')) continue;
              const rect = inkRect(element);
              nodes.push({
                text: (element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120),
                rect: {
                  left: (rect.left - stageRect.left) * scaleX,
                  right: (rect.right - stageRect.left) * scaleX,
                  top: (rect.top - stageRect.top) * scaleY,
                  bottom: (rect.bottom - stageRect.top) * scaleY,
                },
                captionOverlap: captionRect ? intersects(rect, captionRect) : false,
              });
            }

            samples.push({
              t: film.t,
              scene: scene ? scene.name : '',
              nodes,
              captionTransportOverlap: !!(captionRect && transportRect && intersects(captionRect, transportRect)),
              canvasText: window.__labAuditText
                .filter(item => item.alpha > 0.04 && item.text.trim().length > 2)
                .map(item => ({
                  ...item,
                  left: item.left * scaleX,
                  right: item.right * scaleX,
                  top: item.top * scaleY,
                  bottom: item.bottom * scaleY,
                })),
            });
          }

          return {
            duration: film.duration,
            width: film.W,
            height: film.H,
            stage: { width: stageRect.width, height: stageRect.height },
            scenes: film.scenes.map(scene => ({
              name: scene.name,
              start: scene.start,
              duration: scene.dur,
              objectCount: scene.objects.length,
              cueCount: scene.cues.length,
              lastCueEnd: scene.cues.reduce((end, cue) => Math.max(end, cue.start + cue.dur), 0),
              hasCanvas: !!scene._canvasDraw,
            })),
            audio,
            samples,
          };
        }, STEP);

        if (!report.metadata) {
          report.metadata = {
            duration: result.duration,
            width: result.width,
            height: result.height,
            scenes: result.scenes,
            audio: result.audio,
          };
        }

        const add = finding => {
          const key = [finding.type, finding.viewport, finding.scene, finding.text].join('|');
          if (!findingKeys.has(key)) {
            findingKeys.add(key);
            report.findings.push(finding);
          }
        };

        const aspect = result.stage.width / result.stage.height;
        const expectedAspect = result.width / result.height;
        if (Math.abs(aspect - expectedAspect) > 0.015) {
          add({ type: 'stage-aspect', viewport: viewport.name, t: 0,
                detail: `${round(result.stage.width)}x${round(result.stage.height)} renders at ${aspect.toFixed(3)}, expected ${expectedAspect.toFixed(3)}` });
        }

        for (const sample of result.samples) {
          if (sample.captionTransportOverlap) {
            add({ type: 'caption-under-transport', viewport: viewport.name,
                  scene: sample.scene, t: round(sample.t), text: 'lower-third narration' });
          }
          for (const node of sample.nodes) {
            if (node.rect.left < -2 || node.rect.right > result.width + 2 ||
                node.rect.top < -2 || node.rect.bottom > result.height + 2) {
              add({ type: 'html-outside-stage', viewport: viewport.name,
                    scene: sample.scene, t: round(sample.t), text: node.text,
                    detail: JSON.stringify(node.rect) });
            }
            if (node.rect.top < 46 && node.rect.bottom > 4) {
              add({ type: 'html-in-chrome-band', viewport: viewport.name,
                    scene: sample.scene, t: round(sample.t), text: node.text,
                    detail: `ink top ${round(node.rect.top)}, bottom ${round(node.rect.bottom)}` });
            }
            if (node.captionOverlap) {
              add({ type: 'html-under-caption', viewport: viewport.name,
                    scene: sample.scene, t: round(sample.t), text: node.text });
            }
          }

          for (const text of sample.canvasText) {
            if (text.left < -2 || text.right > result.width + 2 || text.top < -2 || text.bottom > result.height + 2) {
              add({ type: 'canvas-text-outside-stage', viewport: viewport.name,
                    scene: sample.scene, t: round(sample.t), text: text.text,
                    detail: JSON.stringify({ left: round(text.left), right: round(text.right), top: round(text.top), bottom: round(text.bottom) }) });
            }
            if (text.top < 46 && text.bottom > 4) {
              add({ type: 'canvas-text-in-chrome-band', viewport: viewport.name,
                    scene: sample.scene, t: round(sample.t), text: text.text,
                    detail: `ink top ${round(text.top)}, bottom ${round(text.bottom)}` });
            }
          }

          const substantialText = sample.canvasText.filter(item => item.text.trim().length > 5);
          for (let i = 0; i < substantialText.length; i++) {
            for (let j = i + 1; j < substantialText.length; j++) {
              const a = substantialText[i], b = substantialText[j];
              const pair = [a.text, b.text].sort().join('|');
              if (INTENTIONAL_CANVAS_CROSSFADE.has(pair)) continue;
              const overlapW = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
              const overlapH = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
              const overlapArea = overlapW * overlapH;
              const smallerArea = Math.min(
                Math.max(1, (a.right - a.left) * (a.bottom - a.top)),
                Math.max(1, (b.right - b.left) * (b.bottom - b.top)));
              if (overlapArea / smallerArea > 0.18) {
                add({ type: 'canvas-text-overlap', viewport: viewport.name,
                      scene: sample.scene, t: round(sample.t),
                      text: `${a.text} <> ${b.text}`,
                      detail: `${Math.round(overlapArea / smallerArea * 100)}% of the smaller ink box overlaps` });
              }
            }
          }
        }

        await page.close();
      }

      for (const scene of report.metadata.scenes) {
        if (!scene.hasCanvas && scene.lastCueEnd < scene.duration - 4) {
          report.findings.push({ type: 'static-tail-candidate', scene: scene.name,
            t: round(scene.start + scene.lastCueEnd),
            detail: `${round(scene.duration - scene.lastCueEnd)}s after the final authored cue` });
        }
      }

      const scenes = report.metadata.scenes;
      for (const cue of report.metadata.audio) {
        const scene = scenes.find(item => cue.at >= item.start && cue.at < item.start + item.duration + 0.001);
        if (!scene) continue;
        const boundary = Math.min(
          scene.start + scene.duration,
          ...report.metadata.audio.filter(next => next.at > cue.at).map(next => next.at));
        if (cue.error || !cue.duration) {
          report.findings.push({ type: 'audio-metadata-missing', scene: scene.name,
            t: round(cue.at), text: cue.id });
        } else if (cue.at + cue.duration > boundary + 0.05) {
          report.notices.push({ type: 'narration-hold-at-boundary', scene: scene.name,
            t: round(cue.at), text: cue.id,
            detail: `${round(cue.at + cue.duration - boundary)}s hold before the next cue or scene` });
        }
      }

      reports.push(report);
      console.log(`\n${slug}: ${report.metadata.duration}s, ${report.metadata.scenes.length} scenes, ${report.metadata.audio.length} narration cues`);
      for (const error of [...new Set(report.errors)]) console.log(`    runtime-error: ${error}`);
      for (const finding of report.findings) printFinding(finding);
      for (const notice of report.notices) printFinding(notice);
      if (!report.errors.length && !report.findings.length) console.log('    layout clean');
    }
  } finally {
    await browser.close();
  }

  const totals = reports.reduce((sum, report) => sum + report.errors.length + report.findings.length, 0);
  const notices = reports.reduce((sum, report) => sum + report.notices.length, 0);
  console.log(`\nAudited ${reports.length} films at ${STEP}s intervals across ${VIEWPORTS.length} viewports: ${totals} candidates, ${notices} expected narration holds.`);
})().catch(error => {
  console.error(error.stack || error.message);
  process.exit(1);
});

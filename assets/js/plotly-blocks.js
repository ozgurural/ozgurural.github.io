/* Renders ```plotly markdown code blocks as charts.
   Loaded as a <script type="module"> by _includes/scripts.html ONLY when the
   page contains a `language-plotly` block, so the heavy Plotly library is
   never shipped to pages that don't use it.

   This file used to `import { plotlyDarkLayout, plotlyLightLayout } from
   './theme.js'`, but theme.js was deleted in e631d6c ("remove unused Plotly
   dependency") while this file was left behind still importing it. An ES
   module that imports a missing file never executes at all, so the feature
   documented in CLAUDE.md had been dead since then: a post using a plotly
   block would 404 the import, run none of this, and render its raw JSON as a
   visible code block. Nothing caught it because no page uses a plotly block.

   So the layout is inlined here instead of imported, and only the dark one
   exists, because the site is dark only: head/custom.html hard-sets
   data-theme="dark" before first paint and _main.js's setTheme() ignores its
   argument. Asking determineComputedTheme() which theme to use, as this file
   did, could still answer "light" for a visitor whose OS is in light mode,
   which would have painted a white chart onto a dark page. The colours below
   are the site's own dark tokens from _sass/_design-system.scss rather than
   Plotly's generic plotly_dark (whose rgb(17,17,17) ground reads as a grey
   patch against this site's #0a0f1c). */

const PLOTLY_CDN = 'https://cdn.plot.ly/plotly-3.3.0.min.js';
/* Pinned version, so the bytes are immutable and the hash cannot go stale.
   Recompute with:
     curl -sSL https://cdn.plot.ly/plotly-3.3.0.min.js |
       openssl dgst -sha384 -binary | openssl base64 -A */
const PLOTLY_SRI = 'sha384-9j4dOnaStvA18a0L9YXraOfBpiADen+WXfxp1U03QguLoXMW9b5bKHada4AwQAxK';

/* --ds-bg, --ds-surface-elev, --ds-ink, --ds-body, --ds-muted, --ds-accent
   and friends, read off the dark block of _sass/_design-system.scss. */
const INK = '#f1f5f9';
const BODY = '#cbd5e1';
const MUTED = '#94a3b8';
const BG = '#0a0f1c';
const GRID = 'rgba(148, 163, 184, 0.18)';
const SANS = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const AXIS = {
  gridcolor: GRID,
  linecolor: GRID,
  zerolinecolor: 'rgba(148, 163, 184, 0.35)',
  zerolinewidth: 1,
  tickcolor: GRID,
  tickfont: { color: MUTED },
  title: { font: { color: BODY }, standoff: 12 },
  automargin: true,
  ticks: '',
};

const plotlyDarkLayout = {
  layout: {
    autotypenumbers: 'strict',
    // sky-400 first, so a single-series chart matches the site's accent
    colorway: ['#38bdf8', '#f472b6', '#34d399', '#c084fc', '#fbbf24',
               '#22d3ee', '#fb7185', '#a3e635', '#e879f9', '#94a3b8'],
    font: { family: SANS, color: BODY, size: 13 },
    paper_bgcolor: BG,
    plot_bgcolor: BG,
    title: { font: { color: INK, size: 17 }, x: 0.02, xanchor: 'left' },
    hovermode: 'closest',
    hoverlabel: { align: 'left', bgcolor: '#131c2f', bordercolor: GRID,
                  font: { family: SANS, color: INK } },
    legend: { font: { color: BODY }, bgcolor: 'rgba(0,0,0,0)' },
    xaxis: AXIS,
    yaxis: AXIS,
    margin: { l: 56, r: 20, t: 48, b: 48 },
    shapedefaults: { line: { color: MUTED } },
    annotationdefaults: { arrowcolor: MUTED, arrowhead: 0, arrowwidth: 1,
                          font: { color: BODY } },
  },
};

function loadPlotly() {
  return new Promise((resolve, reject) => {
    if (window.Plotly) return resolve(window.Plotly);
    const s = document.createElement('script');
    s.src = PLOTLY_CDN;
    // Third party, so it is pinned and hashed like the KaTeX tags in the
    // layouts: a CDN that served something else would be refused rather than
    // executed.
    s.integrity = PLOTLY_SRI;
    s.crossOrigin = 'anonymous';
    s.onload = () => (window.Plotly ? resolve(window.Plotly)
                                    : reject(new Error('Plotly loaded but window.Plotly is undefined')));
    s.onerror = () => reject(new Error('Plotly failed to load (blocked, offline, or SRI mismatch)'));
    document.head.appendChild(s);
  });
}

const blocks = document.querySelectorAll('pre>code.language-plotly');
if (blocks.length > 0) {
  loadPlotly().then(() => {
    blocks.forEach((elem) => {
      let jsonData;
      try {
        jsonData = JSON.parse(elem.textContent);
      } catch (e) {
        // Leave the block visible: a malformed chart should read as the
        // author's broken JSON, not silently vanish.
        console.error('plotly block is not valid JSON, leaving it as code:', e);
        return;
      }
      elem.parentElement.classList.add('hidden');

      const chartElement = document.createElement('div');
      elem.parentElement.after(chartElement);

      jsonData.layout = jsonData.layout || {};
      // The page's own template wins over the site default, so a chart can
      // still override any of this per block.
      jsonData.layout.template = jsonData.layout.template
        ? { ...plotlyDarkLayout, ...jsonData.layout.template }
        : plotlyDarkLayout;

      window.Plotly.react(chartElement, jsonData.data, jsonData.layout,
                          { responsive: true, displaylogo: false });
    });
  }).catch((e) => console.error('Plotly failed to load:', e));
}

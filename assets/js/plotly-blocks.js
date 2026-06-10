/* Renders ```plotly markdown code blocks as charts.
   Loaded as a <script type="module"> by _includes/scripts.html ONLY when the
   page contains a `language-plotly` block, so the heavy Plotly library is
   never shipped to pages that don't use it. */
import { plotlyDarkLayout, plotlyLightLayout } from './theme.js';

const PLOTLY_CDN = 'https://cdn.plot.ly/plotly-3.3.0.min.js';

function loadPlotly() {
  return new Promise((resolve, reject) => {
    if (window.Plotly) return resolve(window.Plotly);
    const s = document.createElement('script');
    s.src = PLOTLY_CDN;
    s.onload = () => resolve(window.Plotly);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function computedTheme() {
  if (typeof window.determineComputedTheme === 'function') return window.determineComputedTheme();
  const setting = localStorage.getItem('theme');
  if (setting === 'dark' || setting === 'light') return setting;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const blocks = document.querySelectorAll('pre>code.language-plotly');
if (blocks.length > 0) {
  loadPlotly().then(() => {
    blocks.forEach((elem) => {
      const jsonData = JSON.parse(elem.textContent);
      elem.parentElement.classList.add('hidden');

      const chartElement = document.createElement('div');
      elem.parentElement.after(chartElement);

      const theme = computedTheme() === 'dark' ? plotlyDarkLayout : plotlyLightLayout;
      if (jsonData.layout) {
        jsonData.layout.template = jsonData.layout.template ? { ...theme, ...jsonData.layout.template } : theme;
      } else {
        jsonData.layout = { template: theme };
      }
      window.Plotly.react(chartElement, jsonData.data, jsonData.layout);
    });
  }).catch((e) => console.error('Plotly failed to load:', e));
}

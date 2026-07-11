// Extract narration texts from each lab film in lower() call order.
// Output: scripts/narration.json  { "<film-prefix>": ["text0", ...], ... }
// Run `npm run build:narration` after editing any film's lower() text to
// regenerate the neural-TTS voice tracks (requires: pip install edge-tts).
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "assets", "js", "lab-films");
const OUT = path.join(__dirname, "narration.json");

const PREFIX = {
  "block-race.js": "block-race",
  "gradient-pinball.js": "gradient-pinball",
  "jira.js": "jira",
  "model-heist.js": "model-heist",
  "oracles.js": "oracles",
  "proof-of-learning.js": "proof-of-learning",
  "redundancy-reactor.js": "redundancy-reactor",
  "wm-compare.js": "wm-compare",
};

function speechify(html) {
  let t = html;
  // JS string escapes
  t = t.replace(/\\"/g, '"').replace(/\\n/g, " ");
  // HTML to speech
  t = t.replace(/<sup>([^<]*)<\/sup>/g, " to the $1 ");
  t = t.replace(/<[^>]+>/g, "");
  t = t.replace(/&amp;/g, " and ").replace(/&nbsp;/g, " ");
  // math / symbols to words
  t = t.replace(/\(q\/p\)/g, "q over p");
  t = t.replace(/70\/30/g, "seventy to thirty");
  t = t.replace(/√κ/g, "root kappa").replace(/κ/g, "kappa");
  t = t.replace(/ρq/g, "rho q").replace(/ρ\s*≈\s*1/g, "rho near one").replace(/ρ/g, "rho");
  t = t.replace(/ε\/σ/g, "epsilon over sigma").replace(/ε/g, "epsilon").replace(/σ/g, "sigma");
  t = t.replace(/√k/g, "root k");
  t = t.replace(/∇L/g, "the gradient").replace(/θ/g, "theta").replace(/δ/g, "delta").replace(/λ/g, "lambda");
  t = t.replace(/π/g, "pi").replace(/Φ/g, "phi").replace(/α/g, "alpha").replace(/β/g, "beta");
  t = t.replace(/≈/g, " about ").replace(/≤/g, " at most ").replace(/≥/g, " at least ");
  t = t.replace(/→/g, " to ").replace(/·/g, ", ").replace(/×/g, " times ").replace(/±/g, " plus or minus ");
  t = t.replace(/½/g, "one half").replace(/§/g, "section ");
  t = t.replace(/—|–/g, ", ").replace(/['']/g, "'").replace(/[""]/g, '"');
  t = t.replace(/72ms/g, "seventy-two milliseconds");
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

const out = {};
for (const [file, prefix] of Object.entries(PREFIX)) {
  const src = fs.readFileSync(path.join(DIR, file), "utf8");
  const texts = [];
  const re = /lower\(\s*s\s*,\s*"((?:[^"\\]|\\.)*)"\s*,/g;
  let m;
  while ((m = re.exec(src))) texts.push(speechify(m[1]));
  out[prefix] = texts;
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
for (const [k, v] of Object.entries(out)) console.log(k + ": " + v.length + " panels");
console.log("wrote " + OUT);

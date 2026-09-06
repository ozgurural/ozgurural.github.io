#!/usr/bin/env node
/*
 * Will Jekyll still build?
 *
 * A Liquid syntax error does not fail loudly. `jekyll serve` reports it once in
 * its own terminal, then keeps serving the last `_site/` build that succeeded,
 * so curl and the browser both keep returning a plausible, unchanged page. Every
 * check run against the dev server in that window is validating stale output
 * rather than the edit just made, and nothing about the served page says so.
 *
 * One real instance of this shipped into the working tree during the webfont
 * work: a comment explaining what the `if` guard below it did, written in prose
 * inside an HTML comment, with the tag's literal delimiters in it. Liquid parses
 * comments too (it runs long before a browser ever sees one), an `if` with no
 * expression is a syntax error, and every regeneration failed from that point
 * on. So both halves of that bug are checked here:
 *
 *   1. Block tags balance. Every if/unless/for/case/capture/comment/raw/tablerow
 *      has its matching end tag, in the right order.
 *   2. No literal {% or {{ inside an HTML comment, unless the comment wraps it
 *      in {% raw %}...{% endraw %}, which is the safe way to write one down.
 *
 * Both are cheap and neither needs the site built, so this runs against the
 * source tree rather than the server.
 *
 *   node scripts/check-liquid.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIRS = ['_includes', '_layouts', '_pages', '_posts', '_publications',
              '_teaching', '_data'];
const SKIP = new Set(['_site', 'node_modules', '.git', '.claude', 'dist', 'vendor']);

/* `else`, `elsif`, `when` and `break` sit inside a block without opening or
   closing one, so they are deliberately absent from both lists. */
const BLOCK_OPENERS = ['if', 'unless', 'for', 'case', 'capture', 'comment',
                       'raw', 'tablerow'];
const BLOCK_CLOSERS = new Set(BLOCK_OPENERS.map(t => 'end' + t));

function walk(dir) {
  const out = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return out; }
  for (const e of entries) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (/\.(html|md|markdown|yml|yaml)$/.test(e.name)) out.push(p);
  }
  return out;
}

const lineOf = (src, idx) => (src.slice(0, idx).match(/\n/g) || []).length + 1;

let problems = 0;

for (const dir of DIRS) {
  for (const file of walk(path.join(ROOT, dir))) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    let src;
    try { src = fs.readFileSync(file, 'utf8'); } catch (e) { continue; }

    /* ---- 1. do the block tags balance? ------------------------------------
       Everything inside a {% raw %} block is literal text to Liquid, including
       anything that looks like a tag, so that span is skipped rather than
       parsed. Not doing this reports every documented example as unbalanced. */
    const stack = [];
    const tagRe = /\{%-?\s*(\w+)([^%]*?)-?%\}/g;
    let m, rawDepth = 0;
    while ((m = tagRe.exec(src))) {
      const tag = m[1];
      if (tag === 'raw') { rawDepth++; stack.push({ tag, ln: lineOf(src, m.index) }); continue; }
      if (tag === 'endraw') {
        rawDepth = Math.max(0, rawDepth - 1);
        const top = stack.pop();
        if (!top || top.tag !== 'raw') {
          console.log(`${rel}:${lineOf(src, m.index)}  {% endraw %} with no matching {% raw %}`);
          problems++;
        }
        continue;
      }
      if (rawDepth > 0) continue;                    // literal text, not a tag
      if (BLOCK_OPENERS.includes(tag)) {
        stack.push({ tag, ln: lineOf(src, m.index) });
      } else if (BLOCK_CLOSERS.has(tag)) {
        const want = tag.slice(3);
        const top = stack.pop();
        if (!top || top.tag !== want) {
          console.log(`${rel}:${lineOf(src, m.index)}  {% ${tag} %} does not close the open ` +
            `block (${top ? `{% ${top.tag} %} at line ${top.ln}` : 'nothing is open'})`);
          problems++;
        }
      }
    }
    for (const t of stack) {
      console.log(`${rel}:${t.ln}  {% ${t.tag} %} is never closed`);
      problems++;
    }

    /* ---- 2. a Liquid tag written down inside an HTML comment -------------- */
    const commentRe = /<!--([\s\S]*?)-->/g;
    let cm;
    while ((cm = commentRe.exec(src))) {
      const body = cm[1];
      if (!body.includes('{%') && !body.includes('{{')) continue;
      if (/\{%-?\s*raw\s*-?%\}[\s\S]*?\{%-?\s*endraw\s*-?%\}/.test(body)) continue;
      console.log(`${rel}:${lineOf(src, cm.index)}  HTML comment contains a literal {% or {{ ` +
        `-- Liquid parses comments, so this is still a tag`);
      console.log(`    ${body.trim().replace(/\s+/g, ' ').slice(0, 96)}`);
      problems++;
    }
  }
}

console.log(`\n${problems} problem(s) found`);
process.exitCode = problems ? 1 : 0;

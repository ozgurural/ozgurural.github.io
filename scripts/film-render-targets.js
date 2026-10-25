const fs = require('node:fs');
const path = require('node:path');

// Keep target selection independent of Chrome/ffmpeg so it can be checked
// without starting a render or requiring the optional video dependencies.
function filmRenderTargets(embedDir, { all = false, film = null } = {}) {
  const films = fs.readdirSync(embedDir)
    .filter(file => file.endsWith('-embed.md'))
    .map(file => file.slice(0, -'-embed.md'.length))
    .sort();
  const skipped = films.filter(slug => {
    const source = fs.readFileSync(path.join(embedDir, slug + '-embed.md'), 'utf8');
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1] || '';
    return /^render:[\t ]*false[\t ]*(?:#.*)?\r?$/m.test(frontmatter);
  });
  return {
    films,
    skipped,
    targets: all ? films.filter(slug => !skipped.includes(slug)) : [film]
  };
}

module.exports = { filmRenderTargets };

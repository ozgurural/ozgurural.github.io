# AGENTS.md

Guidance for Codex and any other coding agent working in this repository.

**`CLAUDE.md` is the canonical guidance file. Read it first.** It documents the build
commands, the content collections, the styling token layer, and the debugging notes for
the animated Research Lab. This file deliberately does not repeat that material: two
copies drift apart, and the stale one then misleads whoever reads it.

The rules below are restated here only because they are the ones most often broken. The
full set lives under "House rules for content" in `CLAUDE.md`.

## Non-negotiables

**No em-dashes in anything a visitor can read.** This includes the film scripts, where
`lower(...)`, `s.caption(...)` and `ctx.fillText(...)` strings all render on screen.
Replace each with the punctuation the sentence actually needs (parentheses for a list
that already holds commas, a colon where the second half explains the first, a semicolon
between independent clauses, a comma for an appositive) rather than swapping every dash
for a comma, which creates comma splices. Code comments, range en-dashes (`2020–2021`)
and minus signs stay as they are.

```bash
grep -rn '—' _pages _posts _publications | grep -v _site   # must be empty
```

**A film may only name mechanisms its cited source actually contains.** Reconstructing a
paper from search summaries and then crediting that paper has produced invented
mechanisms twice. Read the source first. Unpublished thinking is labelled
`Open research direction of the author, not yet published`, never attached to the nearest
publication. Prefer a paper's measured numbers over an abstract description of it.

**No AI-tell phrasing and no self-praise.** Authority comes from named papers, venues and
measurements, not from adjectives.

**Verify before claiming.** Build with `bundle exec jekyll build` (PowerShell, with
`C:\Ruby33-x64\bin` prepended to PATH) and check the output in `_site/`. Note that the
local dev server links CSS and JS from the production domain, so local asset edits do not
show up in the browser preview unless you load the local stylesheet explicitly.

# Local artifacts

| Folder | Contents |
| --- | --- |
| `video/` | MP4 exports, caption files, LinkedIn drafts and delivery manifests. Existing video paths are preserved. |
| `reviews/` | Before/after screenshots, contact sheets, thumbnails, audit reports and logs. |
| `builds/` | Isolated Jekyll preview and production builds, including CI's `ci-site/`. |
| `cache/cinema/` | Resumable cinema render segments (`parts/` and older fingerprinted batches). |
| `cache/vertical/` | Temporary vertical-video composition assets. |
| `cache/tts/` | Local speech-generation dependencies. The previous `securepol-tts/` environment is now `cache/tts/securepol/`; update `PYTHONPATH` when using it. |
| `music/` | Licensed source music. Keep these inputs for soundtrack regeneration. |
| `archive/helpers/` | Historical one-off scripts, retained as reference. They contain old paths and are not maintained entry points; use the tracked scripts in the repository's `scripts/` folder. |
| `archive/migrations/` | File moves with original paths, sizes and SHA-256 hashes. |

## Find a video to share

Open `video/<film>-delivery.json` for the export's recorded validation and hashes.
The recent cinema films use `<film>-9x16.mp4` for portrait and
`<film>-film-16x9-narrated.mp4` for landscape, with a matching
`<film>-linkedin-post.md` draft and `<film>.srt` captions.
Silent `*-film-16x9.mp4` files are intermediate exports. Older `*-1920p.mp4`
files belong to the separate Research Lab renderer and retain their matching
`.timeline.json` metadata. A file's presence here does not establish freshness;
check its delivery manifest or renderer fingerprint before sharing it.

## Keep it organised

Run from the repository root:

```sh
npm run organize:dist             # preview known legacy moves, without writing
npm run organize:dist -- --apply  # move and verify, then refresh this README
```

The organiser never deletes or overwrites files. It refuses destination
collisions and linked paths, and verifies moved files against their pre-move
SHA-256 hashes. Unknown artifacts stay in place for review. The migration record
retains the old-to-new mapping for reversing a move if needed.

New script defaults put review images in `reviews/`, render work in `cache/`
and preview builds in `builds/`. Keep custom `--out` and Jekyll `--destination`
paths under those folders too. Everything under `dist/` remains local,
gitignored and excluded from the published Jekyll site. This layout is maintained
in `scripts/dist-layout.md`; the organiser copies it to `dist/README.md`.

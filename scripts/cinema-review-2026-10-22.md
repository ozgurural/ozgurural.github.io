# Cinema review, 22 October 2026

Reviewed baseline: `fa6032685111ebe26c7f26096af12db1ac42bac9`.

## Coverage

All nine `/films/` players were loaded from this checkout through a Jekyll
preview with local asset URLs. The review sampled 231 moments around 111
spoken lines, inspected 54 desktop stills and nine portrait phone stills,
compared the authored voice scripts with their built timelines, and measured
the committed soundtrack durations. Total film time is 19 minutes 24.671 seconds.

| Film | Duration (s) | Cue samples | Live GPU buffers over three phone-sized passes |
| --- | ---: | ---: | --- |
| Blockchain ML | 112.705 | 23 | 82 / 82 / 82 |
| Cyber events | 123.452 | 25 | 8 / 8 / 8 |
| Deadline | 102.066 | 21 | 29 / 29 / 29 |
| Gradient descent | 101.350 | 19 | 64 / 64 / 64 |
| Level D | 279.850 | 49 | 839 / 839 / 839 |
| Model heist | 101.850 | 19 | 9 / 9 / 9 |
| Redundancy | 121.426 | 21 | 126 / 126 / 126 |
| SecurePoL | 122.095 | 33 | 167 / 167 / 167 |
| Watermark | 99.877 | 21 | 50 / 50 / 50 |

## Confirmed bugs and repairs

1. **Pending audio playback could restart after Pause.** Calling play and pause
   in the same task produced a paused picture with an active, muted soundtrack.
   The promise rejection handler retried every failure, including the browser's
   cancellation. The handler now retries only autoplay denials belonging to the
   current request. A late denial from an older request cannot mute newer playback.
2. **Mute and pause intent could be lost.** Muting a paused film started it and
   immediately unmuted it. The Pause button on muted playback could also take the
   generic tap-for-sound path. The sound action now preserves a paused mute,
   explicit Play/Pause actions are handled directly, and resume/replay preserve
   a viewer's explicit mute choice. Initial tap-for-sound behavior remains available.
3. **Eight films showed a CC button with no captions.** The engine set `hidden`,
   but the button's author CSS `display: grid` overrode the browser's hidden style.
   An explicit hidden-button rule removes those inactive controls. Level D's
   working captions and CC control remain available.
4. **Level D's person annotation was clipped during the reveal.** At 17.167 s
   its lower text edge fell outside the 1080px stage. Pinning the annotation to
   the person's head keeps it inside the picture. The regression sweeps the
   annotation's visibility window in 0.2 s steps.
5. **The mobile fullscreen fallback briefly stayed offset inside its parent.**
   With native fullscreen disabled, the player initially landed at (16, 225.55)
   instead of (0, 0). Its ancestor's transition interpolated `transform: none`
   through an identity matrix for 0.6 s, retaining the fixed-position containing
   block. Disabling that transition during fullscreen removes the offset
   immediately. The regression checks the first fullscreen message, rotation
   to landscape, and restoration of the embedded player.

## Other observations

- No source-script/timeline text or cue-time differences were found.
- Soundtracks extend their film durations by 28-45 ms of MP3 padding.
- No sampled spoken-line end fell over an empty text layer.
- No missing local assets, uncaught page errors or portrait-page horizontal
  overflow were found across the nine players.
- After the annotation repair, no sampled text extended outside its stage.
- GPU buffer, geometry and texture counts stayed constant across three passes
  through each film's cue samples on a 375x812 touch viewport at 2x scale.
  This is a repeated-seek allocation check, not a real-device endurance test.
- The screenshots share a consistent visual language. The technical diagrams,
  illustrative-model labels, citations and end cards remain in place.

## Regression checks

With the local Jekyll preview running on port 4001:

```sh
npm run test:cinema-controls
npm run test:cinema-playback
```

Both commands run in the existing GitHub Actions build workflow on pushes to
`main`/`master` and on pull requests. The new playback check exercises real
browser audio cancellation and controls, plus scheduled autoplay rejections
to cover the older-request race deterministically.

Local verification passed for the safe production build, safe local preview
build, both cinema regression commands with CI browser flags, Liquid checks,
the existing search/deadline unit checks, and `git diff --check`. Targeted site
audits of SecurePoL, Level D and its enclosing lab page reported no issues,
broken URLs or browser errors.

The raw review measurements and screenshots are local artifacts under
`dist/cinema-review/`, excluded from the published site.

## Limits

This review did not re-read every cited paper or regulation, listen to every
sentence end to end, render every MP4 again, or test on physical iOS/Android
devices. The fullscreen test emulates the missing native API in Chromium; it
does not establish Safari compatibility. Scientific claims and narration
assets were not rewritten.

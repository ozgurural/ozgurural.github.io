# Regenerate all lab narration mp3s with a neural voice (edge-tts).
# Reads narration.json (film-prefix -> ordered panel texts) and writes
# assets/audio/lab/<prefix>_<i>.mp3, overwriting the old low-quality TTS.
import asyncio, json, os, sys

import edge_tts

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "assets", "audio", "lab")
VOICE = "en-US-AndrewMultilingualNeural"   # warm, natural documentary male
RATE = "-5%"

async def synth(text, path):
    tts = edge_tts.Communicate(text, VOICE, rate=RATE)
    await tts.save(path)

async def main():
    with open(os.path.join(HERE, "narration.json"), encoding="utf-8") as f:
        films = json.load(f)
    # Optional film-prefix filters: `python generate-narration.py pol wm`
    # regenerates matching films. `python generate-narration.py oracles:6`
    # regenerates one cue. No args regenerates all films.
    wanted = [a.lower() for a in sys.argv[1:]]
    jobs = []
    for prefix, texts in films.items():
        for i, text in enumerate(texts):
            selected = not wanted or any(
                (":" in item and item == f"{prefix}:{i}".lower()) or
                (":" not in item and item in prefix.lower())
                for item in wanted)
            if selected:
                jobs.append((prefix, i, text))
    if wanted:
        print("filtering to:", ", ".join(f"{p}_{i}" for p, i, _ in jobs) or "(none matched)")
    total = len(jobs)
    done = 0
    failed = []
    for prefix, i, text in jobs:
        path = os.path.join(OUT, f"{prefix}_{i}.mp3")
        temporary = path + ".tmp"
        ok = False
        for attempt in range(3):
            try:
                await synth(text, temporary)
                if os.path.getsize(temporary) < 2000:
                    raise ValueError("Suspiciously small narration output")
                # Preserve the last playable track if generation fails.
                os.replace(temporary, path)
                ok = True
                break
            except Exception as e:
                err = e
                await asyncio.sleep(1.5)
        done += 1
        if ok:
            size = os.path.getsize(path)
            print(f"[{done}/{total}] {prefix}_{i}.mp3  {size//1024} KB")
            if size < 2000:
                failed.append((path, "suspiciously small"))
        else:
            failed.append((path, repr(err)))
            print(f"[{done}/{total}] FAILED {prefix}_{i}.mp3: {err!r}")
        if os.path.exists(temporary):
            os.remove(temporary)
    if failed:
        print("\nFAILURES:")
        for p, e in failed:
            print(" ", p, e)
        sys.exit(1)
    print("\nAll narration regenerated.")

asyncio.run(main())

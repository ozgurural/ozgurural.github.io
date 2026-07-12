# Regenerate all lab narration mp3s with a neural voice (edge-tts).
# Reads narration.json (film-prefix -> ordered panel texts) and writes
# assets/audio/lab/<prefix>_<i>.mp3, overwriting the old low-quality TTS.
import asyncio, json, os, sys

import edge_tts

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "assets", "audio", "lab")
VOICE = "en-US-ChristopherNeural"   # calm, documentary male
RATE = "-8%"

async def synth(text, path):
    tts = edge_tts.Communicate(text, VOICE, rate=RATE)
    await tts.save(path)

async def main():
    with open(os.path.join(HERE, "narration.json"), encoding="utf-8") as f:
        films = json.load(f)
    # Optional film-prefix filters: `python generate-narration.py pol wm`
    # regenerates only matching films. No args → all films.
    wanted = [a.lower() for a in sys.argv[1:]]
    if wanted:
        films = {k: v for k, v in films.items()
                 if any(w in k.lower() for w in wanted)}
        print("filtering to:", ", ".join(films.keys()) or "(none matched)")
    total = sum(len(v) for v in films.values())
    done = 0
    failed = []
    for prefix, texts in films.items():
        for i, text in enumerate(texts):
            path = os.path.join(OUT, f"{prefix}_{i}.mp3")
            ok = False
            for attempt in range(3):
                try:
                    await synth(text, path)
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
    if failed:
        print("\nFAILURES:")
        for p, e in failed:
            print(" ", p, e)
        sys.exit(1)
    print("\nAll narration regenerated.")

asyncio.run(main())

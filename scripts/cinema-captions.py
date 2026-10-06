"""Write a caption file for a cinema film from its narration timeline.

    python scripts/cinema-captions.py level-d            # -> dist/video/level-d.srt

The films carry one short headline a scene and never the spoken sentence (the
owner found the screen too full when they did), so a feed that autoplays
muted needs captions. LinkedIn and X take an .srt beside a native upload.
Times come from the word timings the voice build records: each caption is a
run of words of at most MAXC characters, shown from its first word to just
after its last, never overlapping the next.
"""
import json, os, sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
MAXC = 42


def stamp(s):
    s = max(0.0, s)
    h, m = int(s // 3600), int(s % 3600 // 60)
    return f"{h:02d}:{m:02d}:{s % 60:06.3f}".replace('.', ',')


def main():
    film = sys.argv[1]
    tl = json.load(open(os.path.join(ROOT, 'assets', 'audio', 'cinema', film, 'timeline.json'), encoding='utf-8'))
    cues = []
    for ln in tl['lines']:
        if not ln.get('text') or not ln.get('words'):
            continue
        # the spoken words carry no punctuation; take each token from the text so it reads as written
        tokens = ln['text'].split()
        ws = ln['words']
        if len(tokens) != len(ws):
            tokens = [w[0] for w in ws]
        chunk, start = [], None
        for tok, (_, a, b) in zip(tokens, ws):
            t0, t1 = ln['real'] + a, ln['real'] + b
            if chunk and (len(' '.join(chunk + [tok])) > MAXC or chunk[-1][-1] in '.?!'):
                cues.append([start, prev_end, ' '.join(chunk)])
                chunk, start = [], None
            if start is None:
                start = t0
            chunk.append(tok)
            prev_end = t1
        if chunk:
            cues.append([start, prev_end, ' '.join(chunk)])
    for i in range(len(cues)):
        end = cues[i][1] + 0.35
        if i + 1 < len(cues):
            end = min(end, cues[i + 1][0] - 0.02)
        cues[i][1] = end
    out = os.path.join(ROOT, 'dist', 'video', f'{film}.srt')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, 'w', encoding='utf-8', newline='\n') as f:
        for i, (a, b, text) in enumerate(cues, 1):
            f.write(f"{i}\n{stamp(a)} --> {stamp(b)}\n{text}\n\n")
    print(f"{len(cues)} captions -> {os.path.relpath(out, ROOT)}")


if __name__ == '__main__':
    main()

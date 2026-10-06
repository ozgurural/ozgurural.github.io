"""Narrate a cinema film and build its soundtrack.

    python scripts/cinema-voice.py securepol            # edge voices: the system python is enough
    <bench venv python> scripts/cinema-voice.py securepol --voice chatterbox

Reads scripts/cinema/<film>.voice.json, the one source of truth for what is
said and when: each line carries `at`, the film time (as authored) at which
its sentence appears on screen. Writes to assets/audio/cinema/<film>/:

  <id>.mp3         one file per line, reused while its text and voice are unchanged
  timeline.json    the real schedule and the time warp the film plays through
  soundtrack.mp3   narration over the music, ducked and mastered to -14 LUFS

The warp is what keeps picture and voice together without re-authoring the
film. A line starts when its text appears. If the previous line is still being
spoken, it starts when that line ends plus a breath, and the film between the
two anchors plays slower to wait for it. Authored time never runs faster than
real time, so a scene can stretch but is never rushed, and no sentence is cut.

The music is placed so its own swell lands on a named line (`rise_on`), and
it is ducked under the voice with a sidechain compressor. A film longer than
its track loops it through joints chosen in the track's own time (`loops`,
see mix()); scripts/music-map.py finds the bars that can be joined. Licensed
stock music lives in dist/ (gitignored); only the mixed soundtrack is committed.
"""
import argparse, asyncio, hashlib, json, os, re, subprocess, sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
FFMPEG = os.path.join(ROOT, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe' if os.name == 'nt' else 'ffmpeg')
LEAD, BREATH, TAIL = 0.35, 0.4, 3.2
TARGET = '-14'


def ff(args, capture=True):
    r = subprocess.run([FFMPEG, '-hide_banner', *args], capture_output=True, text=True, encoding='utf-8', errors='replace')
    if r.returncode != 0:
        sys.stderr.write(r.stderr[-3000:])
        raise SystemExit('ffmpeg failed')
    return r.stderr


def duration(path):
    m = re.search(r'Duration: (\d+):(\d+):([\d.]+)', ff(['-i', path, '-f', 'null', '-']))
    return int(m[1]) * 3600 + int(m[2]) * 60 + float(m[3])


def music_end(path):
    """Where a track's last note has died away (below -55 dB for good), in seconds from its start."""
    log = ff(['-i', path, '-af', 'silencedetect=noise=-55dB:d=0.5', '-f', 'null', '-'])
    total = duration(path)
    starts = [float(x) for x in re.findall(r'silence_start: (-?[\d.]+)', log)]
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
    # the container's duration runs a few ms past the last decoded sample (144.04 against 144.00 here)
    if starts and (len(ends) < len(starts) or ends[-1] >= total - 0.1):
        return starts[-1]
    return total


def speech_span(path):
    """Seconds of leading and trailing silence, so placement follows the voice, not the file."""
    log = ff(['-i', path, '-af', 'silencedetect=noise=-45dB:d=0.05', '-f', 'null', '-'])
    total = duration(path)
    starts = [float(x) for x in re.findall(r'silence_start: (-?[\d.]+)', log)]
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
    head = ends[0] if starts and starts[0] <= 0.01 and ends else 0.0
    tail = total - starts[-1] if starts and (len(ends) < len(starts) or ends[-1] >= total - 0.01) else 0.0
    return head, max(0.0, tail), total


async def synth_edge(voice, text, out, rate):
    """Write the mp3 and return the word timings edge reports while it speaks:
    [[word, start, end], ...] in seconds from the start of the file."""
    import edge_tts
    words = []
    with open(out, 'wb') as f:
        async for chunk in edge_tts.Communicate(text, voice, rate=rate, boundary='WordBoundary').stream():
            if chunk['type'] == 'audio':
                f.write(chunk['data'])
            elif chunk['type'] == 'WordBoundary':
                s0 = chunk['offset'] / 1e7
                words.append([chunk['text'], round(s0, 3), round(s0 + chunk['duration'] / 1e7, 3)])
    return words


def synth(engine, text, out, rate='+0%'):
    kind, _, name = engine.partition(':')
    if kind == 'edge':
        return asyncio.run(synth_edge(name, text, out, rate))
    elif kind in ('chatterbox', 'kokoro'):
        import cinema_tts_models  # lives beside this script; needs the bench venv
        cinema_tts_models.synth(kind, name, text, out)
        return None
    else:
        raise SystemExit(f'unknown voice engine {engine}')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('film')
    ap.add_argument('--voice', help='override the voice in the .voice.json')
    ap.add_argument('--no-mix', action='store_true')
    ap.add_argument('--bed', help='also write the music alone (joints, no voice, no ducking) to this .wav, to check the joints')
    a = ap.parse_args()

    src = json.load(open(os.path.join(ROOT, 'scripts', 'cinema', f'{a.film}.voice.json'), encoding='utf-8'))
    engine = a.voice or src['voice']
    out_dir = os.path.join(ROOT, 'assets', 'audio', 'cinema', a.film)
    os.makedirs(out_dir, exist_ok=True)
    old = {}
    tl_path = os.path.join(out_dir, 'timeline.json')
    if os.path.exists(tl_path):
        old = {l['id']: l for l in json.load(open(tl_path, encoding='utf-8'))['lines']}
    # Word timings, so a film can cue a picture on the word that names it
    # rather than on a time read off a stopwatch. Kept per line with the hash
    # of what produced them, beside the mp3s they describe.
    words_path = os.path.join(out_dir, 'words.json')
    words = json.load(open(words_path, encoding='utf-8')) if os.path.exists(words_path) else {}

    lines = []
    for ln in src['lines']:
        if not ln['text']:
            # a silent anchor: holds its cue until the last sentence has finished
            lines.append({**ln, 'hash': '', 'file': '', 'head': 0.0, 'speech': 0.0, 'len': 0.0, 'words': []})
            continue
        path = os.path.join(out_dir, f"{ln['id']}.mp3")
        key = hashlib.sha1(f"{engine}\n{src.get('rate', '')}\n{ln['text']}".encode()).hexdigest()[:12]
        fresh = os.path.exists(path) and old.get(ln['id'], {}).get('hash') == key
        if engine.startswith('edge') and words.get(ln['id'], {}).get('hash') != key:
            fresh = False
        if not fresh:
            print(f"  voicing {ln['id']}")
            tmp = path + '.src'
            got = tmp + ('.mp3' if engine.startswith('edge') else '.wav')
            w = synth(engine, ln['text'], got, src.get('rate', '+0%'))
            ff(['-y', '-i', got, '-ar', '48000', '-ac', '1', '-b:a', '160k', path])
            os.remove(got)
            if w is not None:
                words[ln['id']] = {'hash': key, 'words': w}
        head, tail, total = speech_span(path)
        # times relative to the first spoken word, which is where `real` puts it
        wl = words.get(ln['id'], {}).get('words') or []
        w0 = wl[0][1] if wl else 0.0
        lines.append({**ln, 'hash': key, 'file': f"{ln['id']}.mp3", 'head': round(head, 3),
                      'speech': round(total - head - tail, 3), 'len': round(total, 3),
                      'words': [[w[0], round(w[1] - w0, 3), round(w[2] - w0, 3)] for w in wl]})

    # the schedule: a line starts with its text unless the last one is still talking.
    # A silent line with `jump_to` is a cut: the film dips to black over DIP seconds,
    # skips authored time from `at` to `jump_to` in the dark, and comes back up.
    DIP = 0.35
    anchors = [[0.0, 0.0]]
    prev_end, prev_at, prev_real = None, None, None
    for ln in lines:
        if prev_end is None:
            r = ln['at'] + LEAD
        else:
            r = max(prev_real + (ln['at'] - prev_at), prev_end + BREATH)
        ln['real'] = round(r, 3)
        ln['file_start'] = round(max(0.0, r - ln['head']), 3)   # the file starts before its first word
        if prev_end is not None:
            anchors.append([ln['real'], ln['at']])
        if 'jump_to' in ln:
            j = ln['jump_to']
            anchors += [[round(r + DIP, 3), ln['at'] + 0.5], [round(r + DIP + 0.05, 3), j - 0.5], [round(r + 2 * DIP + 0.05, 3), j]]
            prev_end, prev_at, prev_real = r + 2 * DIP + 0.05, j, r + 2 * DIP + 0.05
        else:
            prev_end, prev_at, prev_real = r + ln['speech'], ln['at'], r
    authored_end = src['authored_duration']
    dur = max(prev_end + TAIL, prev_real + (authored_end - prev_at))
    anchors.append([round(dur, 3), authored_end])

    timeline = {'film': a.film, 'voice': engine, 'duration': round(dur, 3), 'authored': authored_end,
                'anchors': anchors, 'audio': 'soundtrack.mp3',
                'lines': [{k: ln[k] for k in ('id', 'at', 'real', 'speech', 'len', 'head', 'file', 'file_start', 'hash', 'text', 'source', 'words')}
                          for ln in lines]}
    stretch = max((b[0] - a_[0]) / max(1e-6, b[1] - a_[1]) for a_, b in zip(anchors, anchors[1:]))
    print(f"  {len(lines)} lines, film {authored_end:.1f}s authored -> {dur:.1f}s real, worst stretch x{stretch:.2f}")

    if not a.no_mix:
        mix(src, lines, dur, out_dir, bed=a.bed and os.path.abspath(a.bed))
    # LF, as git stores it: on Windows a plain 'w' writes CRLF, and every voice
    # build showed the whole timeline as changed
    json.dump(timeline, open(tl_path, 'w', encoding='utf-8', newline='\n'), indent=1)
    keep = {l['id'] for l in lines}
    json.dump({k: words[k] for k in sorted(words) if k in keep},
              open(words_path, 'w', encoding='utf-8', newline='\n'), indent=1)
    print(f"  wrote {os.path.relpath(tl_path, ROOT)}")


def mix(src, lines, dur, out_dir, bed=None):
    music = src.get('music')
    inputs, chains = [], []
    lines = [ln for ln in lines if ln['file']]
    for i, ln in enumerate(lines):
        inputs += ['-i', os.path.join(out_dir, ln['file'])]
        ms = int(ln['file_start'] * 1000)
        chains.append(f"[{i}:a]adelay={ms}|{ms}[l{i}]")
    n = len(lines)
    # voice: a gentle high-pass and light, slow compression so lines sit at one level
    graph = ';'.join(chains) + ';' + ''.join(f'[l{i}]' for i in range(n)) + \
        f"amix=inputs={n}:normalize=0,highpass=f=70,acompressor=threshold=-20dB:ratio=2.2:attack=15:release=180," \
        f"apad=whole_dur={dur:.3f},atrim=0:{dur:.3f}[voice]"
    if music:
        rise_at = next(ln['real'] for ln in lines if ln['id'] == music['rise_on'])
        offset = music['rise'] - rise_at               # where in the track the film begins
        # A swell landing later than the track's own swell point means the track
        # has to start late, and the film opens in silence: deadline and level-d
        # did, for 8 and 7 seconds, before anyone heard it. Refuse it; pick an
        # earlier line (the series puts the swell between about 15 and 22 s).
        if offset < 0:
            raise SystemExit(f"music would start {-offset:.1f}s into the film: '{music['rise_on']}' is at "
                             f"{rise_at:.1f}s, after the track's swell at {music['rise']}s; choose an earlier rise_on")
        # A film longer than the track loops it, through joints in the track's own
        # time: when the music reaches `out` it carries on from `to`. Put both on
        # the beat grid with `out - to` a whole number of bars, between passages
        # that match, and the beat never stumbles (scripts/music-map.py lists the
        # bars and which of them repeat). `xfade` is an equal-power crossfade
        # across the joint and `pre` the share of it before the joint: a joint
        # into different material can let the old passage recede just ahead of
        # the downbeat instead of overlapping it. Because joints live in track
        # time, retiming the film moves them with the music rather than tearing
        # them apart; what retiming can still move is where the track's own
        # ending falls, so that is printed and checked. level-d's loops were once
        # set in film time and the film was later lengthened: the piano ending
        # moved ten seconds off its last scene and the end card played in silence.
        mfile = os.path.join(ROOT, music['file'])
        mlen, mend = duration(mfile), music_end(mfile)
        joints = music.get('loops', [])
        segs, film_t, pos = [], 0.0, offset
        for jn in joints:
            if jn['out'] <= pos + 1.0:
                raise SystemExit(f"music joint out={jn['out']}s is behind the playhead ({pos:.2f}s); list joints in the order they play")
            segs.append([film_t, pos, jn['out']])
            film_t += jn['out'] - pos
            pos = jn['to']
        segs.append([film_t, pos, mlen])
        died = segs[-1][0] + (mend - segs[-1][1])        # film time the last note has gone
        cut = died > dur - 0.2
        inputs += ['-i', mfile]
        mi = n
        mg = f"[{mi}:a]asetpts=PTS-STARTPTS,asplit={len(segs)}" + ''.join(f'[s{k}]' for k in range(len(segs)))
        names = []
        for k, (f0, t0, t1) in enumerate(segs):
            if k:
                x, pre = joints[k - 1].get('xfade', 0.5), joints[k - 1].get('pre', 0.5)
                fin, lead = x, x * pre
            else:
                fin, lead = 1.5, 0.0
            if k + 1 < len(segs):
                x, pre = joints[k].get('xfade', 0.5), joints[k].get('pre', 0.5)
                fout, tail = x, x * (1 - pre)
            else:
                fout, tail = 0.0, 0.0
            a0, a1 = t0 - lead, min(mlen, t1 + tail)
            length = a1 - a0
            fx = f"afade=t=in:st=0:d={fin:.3f}:curve=qsin"
            if fout:
                fx += f",afade=t=out:st={length - fout:.3f}:d={fout:.3f}:curve=qsin"
            ms = int(round((f0 - lead) * 1000))
            delay = f",adelay={ms}|{ms}" if ms > 0 else ''
            mg += f";[s{k}]atrim=start={a0:.4f}:end={a1:.4f},asetpts=PTS-STARTPTS,{fx}{delay}[m{k}]"
            names.append(f'[m{k}]')
        # the track's own ending is the ending; only a track still playing when the film stops is faded
        endfade = f",afade=t=out:st={dur - 4.0:.3f}:d=4.0" if cut else ''
        mg += f";{''.join(names)}amix=inputs={len(names)}:normalize=0,apad=whole_dur={dur:.3f},atrim=0:{dur:.3f}{endfade},volume=0.6[mus]"
        graph += ';' + mg
        if bed:     # the music alone, joints and all, before the voice ducks it
            ff(['-y', *inputs, '-filter_complex', mg, '-map', '[mus]', '-ar', '48000', '-ac', '2', bed])
            print(f"    music bed -> {os.path.relpath(bed, ROOT)}")

        def where(t):
            for ln in lines:
                if ln['real'] - 0.05 <= t <= ln['real'] + ln['speech'] + 0.05:
                    return f"under '{ln['id']}'"
            return 'in a pause'
        print(f"  music: track from {offset:.2f}s, swell on '{music['rise_on']}' at {rise_at:.2f}s")
        for k, jn in enumerate(joints):
            print(f"    joint {jn['out']:.3f}s -> {jn['to']:.3f}s at film {segs[k + 1][0]:.2f}s, {where(segs[k + 1][0])}")
        last = max(ln['real'] + ln['speech'] for ln in lines)
        print(f"    last note dies at film {died:.2f}s (last line ends {last:.2f}s, film ends {dur:.2f}s)")
        if cut:
            print("    WARNING: the film stops before the music ends, so the ending is faded rather than heard; adjust the joints")
        elif died < last or died < dur - 6.0:
            print("    WARNING: the music ends well before the film does; add a bar or two to a joint")
        graph += f";[voice]asplit=2[vo][key]" \
                 f";[mus][key]sidechaincompress=threshold=0.015:ratio=7:attack=40:release=650:makeup=1[bed]" \
                 f";[vo][bed]amix=inputs=2:normalize=0[mix]"
    else:
        graph += ';[voice]anull[mix]'
    raw = os.path.join(out_dir, 'soundtrack.raw.wav')
    ff(['-y', *inputs, '-filter_complex', graph, '-map', '[mix]', '-ar', '48000', '-ac', '2', raw])
    target = f'I={TARGET}:TP=-1.5:LRA=11'
    log = ff(['-i', raw, '-af', f'loudnorm={target}:print_format=json', '-f', 'null', '-'])
    j = json.loads(log[log.rindex('{'):log.rindex('}') + 1])
    second = f"loudnorm={target}:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}" \
             f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true"
    out = os.path.join(out_dir, 'soundtrack.mp3')
    ff(['-y', '-i', raw, '-af', second, '-ar', '48000', '-b:a', '192k', out])
    os.remove(raw)
    check = ff(['-i', out, '-af', 'ebur128=peak=true', '-f', 'null', '-'])
    I = re.findall(r'I:\s+(-?[\d.]+) LUFS', check)[-1]
    print(f"  soundtrack.mp3 {duration(out):.1f}s, {I} LUFS")


if __name__ == '__main__':
    main()

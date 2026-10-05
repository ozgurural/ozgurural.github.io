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
it is ducked under the voice with a sidechain compressor. Licensed stock music
lives in dist/ (gitignored); only the mixed soundtrack is committed.
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
    import edge_tts
    await edge_tts.Communicate(text, voice, rate=rate).save(out)


def synth(engine, text, out, rate='+0%'):
    kind, _, name = engine.partition(':')
    if kind == 'edge':
        asyncio.run(synth_edge(name, text, out, rate))
    elif kind in ('chatterbox', 'kokoro'):
        import cinema_tts_models  # lives beside this script; needs the bench venv
        cinema_tts_models.synth(kind, name, text, out)
    else:
        raise SystemExit(f'unknown voice engine {engine}')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('film')
    ap.add_argument('--voice', help='override the voice in the .voice.json')
    ap.add_argument('--no-mix', action='store_true')
    a = ap.parse_args()

    src = json.load(open(os.path.join(ROOT, 'scripts', 'cinema', f'{a.film}.voice.json'), encoding='utf-8'))
    engine = a.voice or src['voice']
    out_dir = os.path.join(ROOT, 'assets', 'audio', 'cinema', a.film)
    os.makedirs(out_dir, exist_ok=True)
    old = {}
    tl_path = os.path.join(out_dir, 'timeline.json')
    if os.path.exists(tl_path):
        old = {l['id']: l for l in json.load(open(tl_path, encoding='utf-8'))['lines']}

    lines = []
    for ln in src['lines']:
        if not ln['text']:
            # a silent anchor: holds its cue until the last sentence has finished
            lines.append({**ln, 'hash': '', 'file': '', 'head': 0.0, 'speech': 0.0, 'len': 0.0})
            continue
        path = os.path.join(out_dir, f"{ln['id']}.mp3")
        key = hashlib.sha1(f"{engine}\n{src.get('rate', '')}\n{ln['text']}".encode()).hexdigest()[:12]
        if not (os.path.exists(path) and old.get(ln['id'], {}).get('hash') == key):
            print(f"  voicing {ln['id']}")
            tmp = path + '.src'
            synth(engine, ln['text'], tmp + ('.mp3' if engine.startswith('edge') else '.wav'), src.get('rate', '+0%'))
            got = tmp + ('.mp3' if engine.startswith('edge') else '.wav')
            ff(['-y', '-i', got, '-ar', '48000', '-ac', '1', '-b:a', '160k', path])
            os.remove(got)
        head, tail, total = speech_span(path)
        lines.append({**ln, 'hash': key, 'file': f"{ln['id']}.mp3", 'head': round(head, 3),
                      'speech': round(total - head - tail, 3), 'len': round(total, 3)})

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
                'lines': [{k: ln[k] for k in ('id', 'at', 'real', 'speech', 'len', 'head', 'file', 'file_start', 'hash', 'text', 'source')}
                          for ln in lines]}
    stretch = max((b[0] - a_[0]) / max(1e-6, b[1] - a_[1]) for a_, b in zip(anchors, anchors[1:]))
    print(f"  {len(lines)} lines, film {authored_end:.1f}s authored -> {dur:.1f}s real, worst stretch x{stretch:.2f}")

    if not a.no_mix:
        mix(src, lines, dur, out_dir)
    # LF, as git stores it: on Windows a plain 'w' writes CRLF, and every voice
    # build showed the whole timeline as changed
    json.dump(timeline, open(tl_path, 'w', encoding='utf-8', newline='\n'), indent=1)
    print(f"  wrote {os.path.relpath(tl_path, ROOT)}")


def mix(src, lines, dur, out_dir):
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
        mi = n
        if offset >= 0:
            inputs += ['-ss', f'{offset:.3f}', '-i', os.path.join(ROOT, music['file'])]
            place = ''
        else:
            inputs += ['-i', os.path.join(ROOT, music['file'])]
            d = int(-offset * 1000)
            place = f'adelay={d}|{d},'
        graph += f";[{mi}:a]{place}atrim=0:{dur:.3f},afade=t=in:st=0:d=1.5,afade=t=out:st={dur - 4.0:.3f}:d=4.0,volume=0.6[mus]" \
                 f";[voice]asplit=2[vo][key]" \
                 f";[mus][key]sidechaincompress=threshold=0.015:ratio=7:attack=40:release=650:makeup=1[bed]" \
                 f";[vo][bed]amix=inputs=2:normalize=0[mix]"
        print(f"  music: track {'from %.2fs' % offset if offset >= 0 else 'delayed %.2fs' % -offset}, swell on '{music['rise_on']}' at {rise_at:.2f}s")
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

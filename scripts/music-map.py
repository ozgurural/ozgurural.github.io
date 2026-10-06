"""Map a music track for looping: its beat grid, loudness bar by bar, and which bars can be joined.

    python scripts/music-map.py dist/music/mixkit-587-discover.mp3

A cinema film longer than its track loops it through joints in the track's own
time (`music.loops` in a .voice.json, applied by cinema-voice.py): when the
music reaches `out` it carries on from `to`. A joint is inaudible when both
ends sit on the beat grid, `out - to` is a whole number of bars, and the bars
either side of it match. This prints what is needed to choose one:

  - the tempo and bar grid, fitted over the loud body of the track, where the
    beat is clear (a first pass with coarse frames put one joint 35 ms off);
  - each bar's loudness and how much its harmony changes, which shows the
    sections, the swell, and where the ending starts and the last note dies;
  - joints ranked by how well the bars either side match (chroma of the two
    bars before and after), with `out` and `to` ready to paste.

What it cannot hear is texture. In mixkit-587-discover the second statement of
the main section repeats the first's harmony almost exactly (0.95 to 0.99) but
carries a different rhythmic layer, so a joint between them changes the
arrangement even when the beat and chords carry on. Put joints on phrase
boundaries, where a change of texture is expected, and under a spoken line,
where the voice ducks the music; cinema-voice.py prints where each one lands.
"""
import subprocess, sys, os
import numpy as np

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
FFMPEG = os.path.join(ROOT, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe' if os.name == 'nt' else 'ffmpeg')
SR = 22050


def decode(path):
    raw = subprocess.run([FFMPEG, '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def spectrum(x, n, hop):
    fr = np.lib.stride_tricks.sliding_window_view(np.pad(x, (n // 2, n // 2)), n)[::hop] * np.hanning(n)
    return np.abs(np.fft.rfft(fr, axis=1)), np.fft.rfftfreq(n, 1 / SR)


def onsets(S, smooth):
    L = np.log1p(1000 * S)
    f = np.r_[0, np.maximum(0, np.diff(L, axis=0)).sum(axis=1)]
    return np.maximum(0, f - np.convolve(f, np.ones(smooth) / smooth, mode='same'))


def main():
    path = sys.argv[1]
    x = decode(path)
    length = len(x) / SR
    db = lambda a, b: 20 * np.log10(np.sqrt((x[int(a * SR):int(b * SR)] ** 2).mean()) + 1e-12)

    # tempo: autocorrelation for the neighbourhood, then a fine comb fit on 64-sample frames
    S, fq = spectrum(x, 1024, 64)
    fps = SR / 64
    f = onsets(S, 128)
    f = np.convolve(f, np.hanning(9) / np.hanning(9).sum(), mode='same')
    ac = np.correlate(f[::8], f[::8], mode='full')[len(f[::8]) - 1:]
    lags = np.arange(len(ac))
    bpm = 60 * fps / 8 / np.maximum(lags, 1)
    ok = (bpm > 60) & (bpm < 180)
    rough = 60 / bpm[ok][np.argmax(ac[ok])]
    # the loud body: where the track sits within 12 dB of its loudest second
    secs = np.array([db(t, t + 1) for t in range(int(length) - 1)])
    loud = np.where(secs > secs.max() - 12)[0]
    a, b = float(loud[0]), float(loud[-1])
    interp = lambda ts: np.interp(ts * fps, np.arange(len(f)), f)
    # the autocorrelation's lag steps are about 3% apart at this tempo, so search a band around it coarsely, then finely
    def comb(periods, phase_step):
        best = (0, 0, 0)
        for per in periods:
            for ph in np.arange(0, per, phase_step):
                e = interp(np.arange(a + ph, b, per)).mean()
                if e > best[0]:
                    best = (e, per, ph)
        return best
    _, coarse, _ = comb(np.arange(rough * 0.96, rough * 1.04, 0.0005), 0.01)
    _, beat, ph = comb(np.arange(coarse - 0.002, coarse + 0.002, 0.00002), 0.002)
    # A comb over the whole body is pulled by any stretch whose onsets sit early or late (this track's swell
    # sits up to 70 ms late, which moved sixteen bars by 20 ms). The autocorrelation at sixteen beats measures
    # the period from local repetition instead, which is what a joint needs.
    k = 16
    seg = f[int(a * fps):int(b * fps)]
    lo, hi = int(k * beat * 0.99 * fps), int(k * beat * 1.01 * fps)
    acs = np.array([np.dot(seg[:-lag], seg[lag:]) for lag in range(lo, hi + 1)])
    i = int(np.argmax(acs))
    d = 0.5 * (acs[i - 1] - acs[i + 1]) / (acs[i - 1] - 2 * acs[i] + acs[i + 1]) if 0 < i < len(acs) - 1 else 0.0
    beat = (lo + i + d) / fps / k
    _, _, ph = comb([beat], 0.002)
    g0 = a + ph

    # the downbeat: of the four phases, the one where harmony changes most and the bass speaks
    S2, fq2 = spectrum(x, 4096, 1024)
    ft = np.arange(S2.shape[0]) * 1024 / SR
    pc = np.full(len(fq2), -1)
    m = (fq2 > 55) & (fq2 < 4000)
    pc[m] = (np.round(12 * np.log2(fq2[m] / 440.0)) % 12).astype(int)
    C = np.stack([(S2[:, pc == k] ** 2).sum(axis=1) for k in range(12)], axis=1)
    beats = g0 + beat * np.arange(np.ceil(-g0 / beat), np.floor((length - g0) / beat))

    def chroma(t0, t1):
        v = C[np.searchsorted(ft, t0):np.searchsorted(ft, t1)].sum(axis=0)
        return v / (np.linalg.norm(v) + 1e-9)
    bc = np.array([chroma(t, t + beat) for t in beats[:-1]])
    chg = np.r_[0, 1 - (bc[1:] * bc[:-1]).sum(axis=1)]
    p4 = int(np.argmax([chg[k::4].mean() for k in range(4)]))
    bar = 4 * beat
    first = beats[p4]
    bars = np.arange(first - bar * np.floor(first / bar), length - 0.5, bar)
    print(f"{os.path.basename(path)}: {length:.2f}s, {60 / beat:.3f} bpm, beat {beat:.5f}s, bar {bar:.5f}s, a downbeat at {bars[0]:.3f}s")

    def drift(t0, t1):
        best = (0, 0)
        for dd in np.arange(-0.1, 0.1, 0.001):
            ts = g0 + dd + beat * np.arange(np.ceil((t0 - g0) / beat), np.floor((t1 - g0) / beat))
            e = interp(ts).mean()
            if e > best[0]:
                best = (e, dd)
        return best[1]
    print('onsets against that grid, ms per 8 bars (a joint wants both ends where this is steady): ' +
          ' '.join(f"{t0:.0f}s:{drift(t0, t0 + 8 * bar) * 1000:+.0f}" for t0 in np.arange(a, b - 8 * bar, 8 * bar)))

    vec = np.array([chroma(t, t + bar) for t in bars])
    sim = vec @ vec.T
    lvl = [db(t, t + bar) for t in bars]
    print('\nbar   start     dB  harmony-change')
    for i, t in enumerate(bars):
        c = 1 - float(sim[i, i - 1]) if i else 0.0
        print(f"{i:3d} {t:8.3f} {lvl[i]:6.1f}   {c:5.2f}  {'#' * max(0, int((lvl[i] + 50) / 1.2))}")

    # joints: leave at the end of bar i, enter bar j (j < i): the two bars before and after should match
    n = len(bars)
    out = []
    for i in range(2, n - 3):
        for j in range(2, i - 4):
            s = [sim[i, j - 1], sim[i - 1, j - 2], sim[i + 1, j], sim[i + 2, j + 1]]
            cost = 1 - float(np.mean(s)) + 0.05 * abs(lvl[i + 1] - lvl[j]) / 6
            out.append((cost, i, j))
    out.sort()
    print('\nbest joints back (cost under 0.1 is seamless harmonically; texture is not measured):')
    for cost, i, j in out[:24]:
        print(f"  {cost:.3f}  end of bar {i:2d} -> bar {j:2d}  ({i + 1 - j:2d} bars back)   \"out\": {bars[i + 1]:.3f}, \"to\": {bars[j]:.3f}")
    silent = np.where(np.array([db(t, t + 0.25) for t in np.arange(0, length - 0.25, 0.25)]) > -55)[0]
    print(f"\nlast sound above -55 dB ends near {(silent[-1] + 1) * 0.25:.2f}s")


if __name__ == '__main__':
    main()

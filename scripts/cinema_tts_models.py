"""Open-weight TTS engines for scripts/cinema-voice.py.

Needs the isolated environment described in CLAUDE.md (Python 3.11, torch 2.x,
chatterbox-tts, kokoro); the system Python cannot import these. Models load
once per process and are cached here.

  chatterbox:<ref.wav>   Resemble AI Chatterbox (MIT), voice conditioned on a
                         reference clip; empty name uses the built-in voice.
  kokoro:<voice>         hexgrad Kokoro-82M (Apache-2.0), e.g. am_michael.
"""
import os

_cache = {}
CHATTERBOX = dict(exaggeration=0.45, cfg_weight=0.5)


def synth(kind, name, text, out_wav):
    import soundfile as sf
    if kind == 'chatterbox':
        from chatterbox.tts import ChatterboxTTS
        if 'cb' not in _cache:
            _cache['cb'] = ChatterboxTTS.from_pretrained(device='cpu')
        m = _cache['cb']
        wav = m.generate(text, audio_prompt_path=(name or None), **CHATTERBOX)
        sf.write(out_wav, wav.squeeze(0).numpy(), m.sr)
    elif kind == 'kokoro':
        import numpy as np
        from kokoro import KPipeline
        lang = 'b' if name.startswith('b') else 'a'
        if ('kk', lang) not in _cache:
            _cache[('kk', lang)] = KPipeline(lang_code=lang, repo_id='hexgrad/Kokoro-82M')
        pipe = _cache[('kk', lang)]
        audio = np.concatenate([a.numpy() if hasattr(a, 'numpy') else a for _, _, a in pipe(text, voice=name, speed=1.0)])
        sf.write(out_wav, audio, 24000)
    else:
        raise ValueError(kind)

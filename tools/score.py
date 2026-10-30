"""Original ambient score for "Inside the iPhone Duo" (fully synthesized, no samples: monetization-safe).

Layers: evolving pad chords, a soft plucked arpeggio, a low pulse, and swells on cue times.
Usage: score.py <out.wav> <duration_s> <seed> [swell_t ...]
Each chapter uses its own seed (key and progression), so chapters sound related but not identical.
"""
import sys
import numpy as np
import soundfile as sf

out, DUR, SEED = sys.argv[1], float(sys.argv[2]), int(sys.argv[3])
SWELLS = [float(x) for x in sys.argv[4:]]
SR = 48000
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(SEED)
BPM = 84.0
BEAT = 60 / BPM
BAR = 4 * BEAT

# key and progression per seed (minor-ish, airy)
ROOT = 45 + (SEED * 5) % 7            # A2 .. E3 region
PROGS = [[0, 8, 3, 10], [0, 5, 8, 3], [0, 3, 10, 5], [0, 8, 5, 10]]
prog = PROGS[SEED % len(PROGS)]
CHORD = [0, 7, 12, 15, 19]            # root, fifth, octave, minor third, fifth up


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def lp(x, fc):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / np.sqrt(1 + (f / fc) ** 4), n=len(x))


def fade_env(t0, t1, a=2.0):
    e = np.clip((t - t0) / a, 0, 1) * np.clip((t1 - t) / a, 0, 1)
    return e


# ---------------------------------------------------------------- pads: each bar a chord, crossfaded
pad = np.zeros(N)
nb = int(np.ceil(DUR / (2 * BAR))) + 1
for i in range(nb):
    t0 = i * 2 * BAR - 1.0
    seg = (t >= t0) & (t < t0 + 2 * BAR + 3.0)
    if not seg.any():
        continue
    tt = t[seg] - t0
    env = np.clip(tt / 2.5, 0, 1) * np.clip((2 * BAR + 3.0 - tt) / 3.0, 0, 1)
    root = ROOT + prog[i % len(prog)]
    s = np.zeros(seg.sum())
    for k, iv in enumerate(CHORD):
        f = hz(root + iv)
        for det in (-0.07, 0.0, 0.07):
            ph = rng.uniform(0, 2 * np.pi)
            s += np.sin(2 * np.pi * f * (1 + det / 100) * tt + ph) * (0.5 if k else 0.8)
            s += 0.18 * np.sin(2 * np.pi * 2 * f * (1 + det / 100) * tt + ph)
    pad[seg] += s * env
pad = lp(pad, 1400) / 9.0

# ---------------------------------------------------------------- arpeggio: soft plucks on 8ths
arp = np.zeros(N)
step = BEAT / 2
pattern = [0, 12, 7, 15, 12, 19, 15, 7]
n = int(DUR / step)
for i in range(n):
    t0 = i * step
    bar_i = int(t0 // (2 * BAR))
    root = ROOT + 12 + prog[bar_i % len(prog)]
    f = hz(root + pattern[i % len(pattern)])
    L = int(SR * 0.9)
    a = int(SR * t0)
    if a >= N:
        break
    b = min(N, a + L)
    tt = np.arange(b - a) / SR
    v = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt)) * np.exp(-tt * 5.5) * (1 - np.exp(-tt * 300))
    arp[a:b] += v * (0.85 if i % 2 == 0 else 0.6)
arp = lp(arp, 3200) * 0.16
# arpeggio comes in after the opening and breathes with 16-bar phrases
arp *= np.clip((t - 6) / 6, 0, 1) * (0.75 + 0.25 * np.sin(2 * np.pi * t / (16 * BAR)))

# ---------------------------------------------------------------- pulse: low heartbeat on beats 1 and 3
pulse = np.zeros(N)
for i in range(int(DUR / (2 * BEAT))):
    a = int(SR * i * 2 * BEAT)
    if a >= N:
        break
    L = min(N - a, int(SR * 0.5))
    tt = np.arange(L) / SR
    bar_i = int(i * 2 * BEAT // (2 * BAR))
    f = hz(ROOT - 12 + prog[bar_i % len(prog)])
    pulse[a:a + L] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 7) * (1 - np.exp(-tt * 200))
pulse *= 0.22 * np.clip((t - 3) / 4, 0, 1)

# ---------------------------------------------------------------- swells (rising filtered noise + shimmer) before cue times
sw = np.zeros(N)
for ts in SWELLS:
    a, b = max(0, int(SR * (ts - 2.4))), min(N, int(SR * (ts + 1.6)))
    if b <= a:
        continue
    tt = t[a:b] - ts
    env = np.where(tt < 0, np.clip((tt + 2.4) / 2.4, 0, 1) ** 2, np.exp(-tt * 2.2))
    noise = rng.standard_normal(b - a)
    sh = sum(np.sin(2 * np.pi * hz(ROOT + 24 + iv) * t[a:b]) for iv in (0, 7, 12))
    sw[a:b] += (lp(noise, 2500) * 0.25 + sh * 0.05) * env
sw *= 0.6

mix = pad + arp + pulse + sw
# simple stereo: pad wide, arp panned by a slow LFO
L = mix + 0.15 * np.roll(pad, int(SR * 0.013)) + 0.08 * arp * np.sin(2 * np.pi * t / 7)
R = mix + 0.15 * np.roll(pad, int(SR * 0.021)) - 0.08 * arp * np.sin(2 * np.pi * t / 7)
st = np.stack([L, R], 1)
st *= fade_env(0, DUR, 2.5)[:, None]
st /= np.max(np.abs(st)) + 1e-9
st *= 0.7
sf.write(out, st.astype(np.float32), SR, subtype='PCM_16')
print('score', out, round(DUR, 1), 's, seed', SEED, 'swells', len(SWELLS))

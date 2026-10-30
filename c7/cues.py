"""Sound cues for c7 (Sound and touch)."""
TAIL = 3.4
SEED = 8


def cues(at, start, end, LAST):
    c = []
    a = lambda t, n, v=0.3: c.append((t, n, v))
    a(0.6, 'whoosh-short', 0.18)
    a(at('s2', 'taptic') - 1.2, 'whoosh', 0.24)
    a(at('s2', 'taptic') + 0.3, 'whoosh-short', 0.18)
    for w in ['magnet', 'springs', 'coil']:
        a(at('s2', w), 'click-soft', 0.2)
    a(at('s3', 'pushes'), 'click', 0.22)
    a(at('s3', 'reverse'), 'click', 0.22)
    for k in range(6):
        a(at('s3', 'shake') + k * 0.16, 'click-soft', 0.16)
    a(at('s3', 'tap'), 'click', 0.26)
    a(at('s3', 'buzz'), 'glitch-3', 0.12)
    a(at('s4', 'speakers') - 0.2, 'whoosh-short', 0.2)
    a(at('s4', 'music'), 'chime', 0.16)
    a(at('s5', 'chamber'), 'click-soft', 0.2)
    a(at('s5', 'stereo'), 'ping', 0.2)
    a(LAST + 1.8, 'whoosh-cinematic', 0.2)
    return c, [at('s2', 'taptic'), at('s4', 'music'), LAST + 2.4]

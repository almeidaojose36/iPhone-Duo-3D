"""Sound cues for c4 (Two batteries, v2)."""
TAIL = 3.4
SEED = 4


def cues(at, start, end, LAST):
    c = []
    a = lambda t, n, v=0.3: c.append((t, n, v))
    a(0.6, 'whoosh-short', 0.18)
    a(at('b1', 'room'), 'glitch-3', 0.1)
    a(at('b1', 'half') - 0.1, 'whoosh', 0.26)
    a(at('b2', 'l-shaped'), 'click-soft', 0.22)
    a(at('b2', 'larger'), 'click-soft', 0.22)
    a(at('b2', 'together'), 'ping', 0.22)
    a(at('b3', 'shell') - 0.2, 'whoosh-short', 0.22)
    a(at('b4', 'closer') - 0.4, 'whoosh', 0.24)
    a(at('b4', 'ions'), 'sparkle', 0.16)
    a(at('b5', 'flow'), 'whoosh-short', 0.16)
    a(at('b5', 'electron'), 'ping', 0.16)
    a(end('b5') - 0.4, 'whoosh-short', 0.2)
    a(at('b6', 'current') - 0.1, 'glitch-1', 0.14)
    a(at('b6', 'lets'), 'pop', 0.2)
    a(at('b6', '9'), 'ping', 0.2)
    a(start('b7') - 2.2, 'whoosh', 0.24)
    a(at('b7', 'charging') + 0.2, 'riser', 0.12)
    a(at('b7', 'hinge'), 'sparkle', 0.2)
    a(at('b7', '50%'), 'chime', 0.26)
    a(LAST + 1.8, 'whoosh-cinematic', 0.2)
    return c, [at('b1', 'half'), at('b4', 'closer'), at('b7', 'charging'), LAST + 2.4]

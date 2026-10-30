"""Sound cues for c3 (The screen, v2)."""
TAIL = 3.4
SEED = 3


def cues(at, start, end, LAST):
    c = []
    a = lambda t, n, v=0.3: c.append((t, n, v))
    a(0.6, 'whoosh-short', 0.18)
    a(at('d1', 'flexible') - 0.2, 'whoosh', 0.26)
    for k in range(11):
        a(at('d1', 'ten') - 0.3 + k * 0.12, 'click-soft', 0.1)
    a(at('d2', 'outside') - 0.3, 'whoosh-short', 0.16)
    a(at('d3', 'cover'), 'click-soft', 0.22)
    a(at('d3', 'microscope') - 0.2, 'glitch-3', 0.1)
    a(at('dg', 'glass'), 'click-soft', 0.22)
    a(at('dg', 'another'), 'click-soft', 0.2)
    a(at('d4', 'touch'), 'click-soft', 0.22)
    a(at('d4', 'finger'), 'ping', 0.16)
    a(at('d5', 'color'), 'click-soft', 0.22)
    a(at('d6', 'light'), 'sparkle', 0.2)
    a(at('d7', 'zoom') - 0.2, 'whoosh', 0.24)
    a(at('d7', 'meet'), 'sparkle', 0.2)
    a(end('d7') - 0.4, 'whoosh-short', 0.2)
    a(at('d8', 'transistors'), 'click-soft', 0.22)
    a(at('d9', 'camera'), 'whoosh-short', 0.2)
    a(at('d9', 'gaps'), 'ping', 0.18)
    for w in ['plastic', 'foam', 'support']:
        a(at('d10', w), 'click-soft', 0.22)
    a(at('d10', 'batteries') - 3.4, 'whoosh', 0.24)
    a(LAST + 1.8, 'whoosh-cinematic', 0.2)
    return c, [at('d1', 'flexible'), at('d7', 'zoom'), at('d10', 'batteries') - 3.0, LAST + 2.4]

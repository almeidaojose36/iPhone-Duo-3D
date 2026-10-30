"""Sound cues for c5 (The brains, v2)."""
TAIL = 3.4
SEED = 5


def cues(at, start, end, LAST):
    c = []
    a = lambda t, n, v=0.3: c.append((t, n, v))
    a(0.6, 'whoosh-short', 0.18)
    a(1.0, 'glitch-3', 0.1)
    a(at('l1', 'years') - 0.2, 'whoosh', 0.26)
    a(at('l1', 'stacked'), 'whoosh-short', 0.18)
    a(at('l1', 'single'), 'whoosh-short', 0.2)
    a(at('l2', 'a20'), 'click-soft', 0.22)
    a(at('l2', 'nanometer'), 'ping', 0.2)
    a(at('l3', 'inside') - 0.3, 'whoosh', 0.26)
    a(at('l3', 'billions'), 'sparkle', 0.16)
    a(at('l4', 'shape') - 0.3, 'whoosh-short', 0.2)
    a(at('l4', 'gate'), 'click-soft', 0.2)
    a(at('l5', 'voltage'), 'click', 0.24)
    a(at('l5', 'remove'), 'click-soft', 0.22)
    a(end('l5') - 0.4, 'whoosh-short', 0.2)
    for w in ['nand', 'c2', 'n1']:
        a(at('l6', w), 'click-soft', 0.22)
    a(at('l7', 'power'), 'click-soft', 0.22)
    a(at('l7', 'voltages') - 0.4, 'glitch-1', 0.12)
    a(at('l8', 'overfoam') - 0.2, 'whoosh-short', 0.2)
    a(at('l8', 'vapor') + 0.8, 'click', 0.24)
    a(start('l9') - 0.4, 'whoosh', 0.22)
    a(at('l9', 'boils'), 'sparkle', 0.16)
    a(end('l9') - 0.3, 'whoosh-short', 0.2)
    a(at('l10', 'graphite'), 'riser', 0.12)
    a(LAST + 1.8, 'whoosh-cinematic', 0.2)
    return c, [at('l1', 'years'), at('l3', 'inside'), at('l8', 'heat'), LAST + 2.4]

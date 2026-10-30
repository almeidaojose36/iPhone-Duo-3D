"""Sound cues for c1 (cold open + The fold). Times come from the narration word timings."""
TAIL = 3.4
SEED = 1


def cues(at, start, end, LAST):
    c = []
    a = lambda t, n, v=0.3: c.append((t, n, v))
    a(0.6, 'whoosh-short', 0.18)
    a(at('o1', 'thick') - 0.05, 'ping', 0.22)
    a(at('o1', 'folds'), 'whoosh', 0.26)
    a(at('o1', 'folds') + 1.6, 'click', 0.3)
    a(at('o2', 'hinge'), 'click-soft', 0.2)
    a(at('o2', 'battery'), 'glitch-3', 0.1)
    a(at('o2', 'take'), 'whoosh', 0.26)
    a(at('o2', 'apart') - 0.3, 'impact-bass-1', 0.3)
    a(end('o2') + 0.2, 'whoosh-cinematic', 0.22)
    a(start('f1') - 2.6, 'whoosh-short', 0.2)
    a(start('f1') - 0.6, 'click', 0.28)
    a(at('f1', 'open') - 0.1, 'whoosh', 0.24)
    a(at('f1', '7.6'), 'ping', 0.22)
    a(at('f2', 'halves'), 'click-soft', 0.2)
    a(at('f2', 'titanium'), 'sparkle', 0.2)
    a(start('f3') + 0.1, 'whoosh', 0.24)
    for w in ['battery', 'cameras', 'outer', 'hinge']:
        a(at('f3', w), 'click-soft', 0.2)
    a(end('f3') - 0.1, 'whoosh', 0.22)
    a(at('f4', 'open') - 0.5, 'whoosh-short', 0.2)
    a(at('f4', 'dozens'), 'impact-bass-2', 0.26)
    for w in ['turning', 'bending', 'power', 'waking']:
        a(at('f4', w), 'click-soft', 0.2)
    a(at('f4', 'starts') - 1.2, 'whoosh', 0.24)
    a(LAST + 1.8, 'whoosh-cinematic', 0.2)
    swells = [at('o2', 'apart'), start('f1'), at('f4', 'dozens'), LAST + 2.4]
    return c, swells

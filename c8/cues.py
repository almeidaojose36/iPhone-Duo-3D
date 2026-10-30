"""Sound cues for c8 (Outro): recap, reassembly and a 20 s end screen."""
TAIL = 20.6
SEED = 7


def cues(at, start, end, LAST):
    c = []
    a = lambda t, n, v=0.3: c.append((t, n, v))
    a(0.6, 'whoosh-short', 0.18)
    out0 = start('v1') + 0.6
    for k in range(6):
        a(out0 + k * 0.2 + 0.1, 'whoosh-short', 0.14)
    for k in range(6):
        a(out0 + k * 0.2 + 2.0, 'click-soft', 0.12)
    a(at('v1', 'hinge'), 'click-soft', 0.2)
    a(at('v2', 'screen'), 'click-soft', 0.2)
    a(at('v3', 'batteries'), 'click-soft', 0.2)
    a(at('v3', 'transistors'), 'sparkle', 0.16)
    a(at('v3', 'graphite'), 'click-soft', 0.2)
    mm = at('v4', 'millimeters')
    a(mm - 2.4, 'whoosh', 0.24)
    a(mm + 1.5, 'click', 0.3)
    a(at('v5', 'enjoyed') - 0.5, 'impact-bass-1', 0.26)
    a(end('v5') + 0.3, 'whoosh-cinematic', 0.18)
    return c, [start('v1') + 0.6, at('v3', 'power'), at('v5', 'enjoyed')]

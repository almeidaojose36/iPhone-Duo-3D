"""Sound cues for c6 (Cameras, v2)."""
TAIL = 3.4
SEED = 6


def cues(at, start, end, LAST):
    c = []
    a = lambda t, n, v=0.3: c.append((t, n, v))
    a(0.6, 'whoosh-short', 0.18)
    a(at('k1', 'four') - 0.3, 'whoosh', 0.26)
    a(at('k1', 'four'), 'ping', 0.2)
    a(at('k2', 'fusion'), 'click-soft', 0.22)
    a(at('k2', 'shifts'), 'glitch-3', 0.1)
    a(at('k3', 'ultra'), 'click-soft', 0.22)
    a(at('k3', '120'), 'ping', 0.2)
    a(at('k4', 'middle'), 'click-soft', 0.2)
    a(at('k4', 'zoom'), 'whoosh-short', 0.18)
    a(at('k5', 'stack') - 0.2, 'whoosh-short', 0.22)
    a(at('k6', 'zoom') - 0.2, 'whoosh', 0.24)
    a(at('k6', 'filter'), 'click-soft', 0.2)
    a(at('k7', 'hits'), 'sparkle', 0.18)
    a(end('k7') - 0.4, 'whoosh-short', 0.2)
    a(at('k8', 'center'), 'click-soft', 0.22)
    a(at('k8', 'inside', 2), 'click-soft', 0.22)
    a(at('k9', 'tent') - 0.6, 'whoosh', 0.22)
    a(at('k9', 'ready'), 'click', 0.26)
    a(at('k9', 'dual'), 'ping', 0.18)
    a(LAST + 1.8, 'whoosh-cinematic', 0.2)
    return c, [at('k1', 'four'), at('k6', 'zoom'), LAST + 2.4]

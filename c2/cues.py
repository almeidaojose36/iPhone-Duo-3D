"""Sound cues for c2 (The hinge, v2)."""
TAIL = 3.4
SEED = 2


def cues(at, start, end, LAST):
    c = []
    a = lambda t, n, v=0.3: c.append((t, n, v))
    a(0.6, 'whoosh-short', 0.18)
    a(at('h1', 'spine') - 0.5, 'whoosh', 0.24)
    a(at('h1', 'pins') - 0.3, 'glitch-3', 0.1)
    a(at('h1', 'chain') + 0.2, 'whoosh', 0.26)
    a(at('h1', 'joints'), 'click-soft', 0.22)
    a(at('h2', 'curved'), 'click-soft', 0.22)
    a(at('h2', 'pivot'), 'ping', 0.2)
    a(at('h3', 'gears'), 'click-soft', 0.22)
    for k in range(4):
        a(at('h3', 'push') + k * 0.45, 'click-soft', 0.12)
    a(at('h3', 'follows'), 'ping', 0.2)
    a(at('h4', 'springs'), 'click-soft', 0.22)
    a(at('h4', 'laptop') - 1.2, 'whoosh', 0.24)
    a(at('h4', 'tent') - 0.6, 'whoosh-short', 0.22)
    a(start('h5') - 0.2, 'whoosh', 0.22)
    a(at('h5', 'teardropshaped'), 'sparkle', 0.2)
    a(at('hs', 'six'), 'whoosh-short', 0.18)
    for w in ['rotate', 'springs', 'gears', 'channel']:
        a(at('hs', w), 'click-soft', 0.18)
    a(at('h4', 'cams'), 'click-soft', 0.2)
    a(at('h4', '165'), 'ping', 0.18)
    a(at('hm', 'magnets') + 0.4, 'click', 0.3)
    a(at('hp', 'paper'), 'whoosh-short', 0.16)
    a(at('hp', '48') - 0.3, 'sparkle', 0.18)
    a(start('h6') - 0.9, 'whoosh', 0.24)
    a(at('h6', 'support'), 'click-soft', 0.22)
    a(at('h6', 'drops'), 'click', 0.24)
    a(at('h7', 'accordion'), 'click-soft', 0.22)
    a(at('h7', 'power'), 'ping', 0.2)
    a(at('he', 'titanium'), 'click-soft', 0.2)
    a(at('he', 'sixty'), 'ping', 0.2)
    a(start('h8') - 0.8, 'whoosh', 0.24)
    a(at('h8', 'hall') - 0.5, 'whoosh-short', 0.22)
    a(at('h8', 'electrons'), 'glitch-3', 0.1)
    a(at('h8', 'voltage'), 'ping', 0.2)
    a(at('h9', 'hand') - 0.4, 'whoosh', 0.22)
    a(at('h9', 'hand') + 1.6, 'click', 0.24)
    a(LAST + 1.8, 'whoosh-cinematic', 0.2)
    return c, [at('h1', 'chain'), at('h4', 'laptop'), at('h8', 'hall'), LAST + 2.4]

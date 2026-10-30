"""Run inside a chapter project: writes compositions/stage.html and index.html (narration clips, score,
sound-effect cues) from assets/js/vo.js and the chapter's cues.py, and renders the score.
cues.py defines TAIL (seconds after the last word), SEED (score), and cues(at, start, end, LAST) -> (sfx, swells)
where sfx is a list of (time, name, volume)."""
import json, re, os, subprocess, sys, importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))
src = open('assets/js/vo.js').read()
VO = json.loads(re.search(r'export const VO = (\{.*?\});\n', src, re.S).group(1))
LAST = float(re.search(r'export const LAST = ([\d.]+);', src).group(1))


def at(beat, word, n=1):
    clean = lambda s: re.sub(r'[^a-z0-9]', '', s.lower())
    k = 0
    for w, s, _ in VO[beat]['words']:
        if clean(w) == clean(word):
            k += 1
            if k == n:
                return s
    raise KeyError((beat, word, [w for w, _, _ in VO[beat]['words']]))


start = lambda b: VO[b]['start']
end = lambda b: VO[b]['start'] + VO[b]['dur']
spec = importlib.util.spec_from_file_location('cues', 'cues.py')
C = importlib.util.module_from_spec(spec)
spec.loader.exec_module(C)
DUR = round(LAST + C.TAIL, 2)
sfx, swells = C.cues(at, start, end, LAST)
SFX_LEN = {'whoosh': 0.57, 'whoosh-short': 0.57, 'whoosh-cinematic': 5.54, 'click': 0.37, 'click-soft': 0.37, 'pop': 0.72,
           'ping': 1.32, 'sparkle': 1.8, 'chime': 2.5, 'impact-bass-1': 2.12, 'impact-bass-2': 2.59, 'riser': 10.03, 'glitch-3': 3.1, 'glitch-1': 2.64}

stage = open(os.path.join(HERE, 'stage_template.html')).read().replace('__DUR__', str(DUR))
os.makedirs('compositions', exist_ok=True)
open('compositions/stage.html', 'w').write(stage)

os.makedirs('assets/music', exist_ok=True)
if '--no-score' not in sys.argv:
    subprocess.run([os.path.expanduser('~/.venvs/kokoro-hf/bin/python'), os.path.join(HERE, 'score.py'), 'assets/music/score.wav', str(DUR), str(C.SEED)] + [str(round(x, 2)) for x in swells], check=True)

vo_tags = '\n'.join(
    f'      <audio id="vo-{k}" src="assets/vo/norm/{k}.wav" data-start="{v["start"]}" data-duration="{v["dur"]:.3f}" data-track-index="10" data-volume="1"></audio>'
    for k, v in VO.items())
lanes, rows = [], []
for t0, n, v in sorted(sfx):
    if t0 < 0 or t0 > DUR - 0.2:
        continue
    t1 = t0 + SFX_LEN[n]
    for i, busy in enumerate(lanes):
        if busy <= t0:
            lanes[i] = t1; lane = i; break
    else:
        lanes.append(t1); lane = len(lanes) - 1
    rows.append((round(t0, 2), n, v, lane))
sfx_tags = '\n'.join(
    f'      <audio id="sfx-{i:02d}" src="assets/sfx/{n}.mp3" data-start="{t}" data-duration="{min(SFX_LEN[n], round(DUR - t, 2))}" data-track-index="{12 + lane}" data-volume="{v}"></audio>'
    for i, (t, n, v, lane) in enumerate(rows))
music = f'      <audio id="music" src="assets/music/score.wav" data-start="0" data-duration="{DUR}" data-track-index="11" data-volume="0.36"></audio>'
html = f'''<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1920px; height: 1080px; overflow: hidden; background: #0d0e10; }}
      #root {{ position: relative; width: 100%; height: 100%; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="1920" data-height="1080">
      <div id="stage" data-composition-id="stage" data-composition-src="compositions/stage.html"
        data-start="0" data-duration="{DUR}" data-track-index="1" data-track-kind="graphics"
        data-width="1920" data-height="1080"></div>
{vo_tags}
{music}
{sfx_tags}
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
'''
open('index.html', 'w').write(html)
print('index.html:', DUR, 's,', len(rows), 'sfx cues')

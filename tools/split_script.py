"""Split ../script.md into each chapter project's assets/vo/beats.json (one entry per [id] clip)."""
import json, os, re

here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(here, '..', 'script.md')).read()
chapters = {}
proj = None
for line in src.splitlines():
    m = re.match(r'^## .*\(project `(c\d)`\)', line)
    if m:
        proj = m.group(1)
        continue
    m = re.match(r'^\*\*\[(\w+)\]\*\* (.+)$', line)
    if m and proj:
        chapters.setdefault(proj, []).append({'id': m.group(1), 'text': m.group(2).strip()})
for p, beats in chapters.items():
    d = os.path.join(here, '..', p, 'assets', 'vo')
    os.makedirs(d, exist_ok=True)
    json.dump(beats, open(os.path.join(d, 'beats.json'), 'w'), indent=1)
    print(p, len(beats), 'beats,', sum(len(b['text'].split()) for b in beats), 'words')

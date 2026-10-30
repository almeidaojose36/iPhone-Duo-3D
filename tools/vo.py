"""Kokoro narration (am_michael). Usage: vo.py <beats.json> <out_dir> <speed> [beat ids...]
The pronunciation dictionary changes the spoken text only; the script keeps normal spelling.
A pause marker such as [0.15] in the spoken text splits it there and inserts that many seconds of silence."""
import sys, json, re, os
import numpy as np
import kokoro_onnx, soundfile as sf

LEXICON = {
    r'\bOLED\b': 'oh-led', r'\bNAND\b': 'nand', r'\bI/O\b': 'I O', r'\b5G\b': 'five G', r'\bA20\b': 'A-20',
    r'\bC2\b': 'C two', r'\bN1\b': 'N one', r'\bWi-Fi\b': 'wifi', r'\bCPU\b': 'C P U', r'\bGPU\b': 'G P U',
    r'\bf one point six\b': 'f, one point six', r'\bpentalobe\b': 'penta-lobe', r'\bwatt-hours\b': 'watt hours',
    r'\bL-shaped\b': 'L shaped', r'\bnano-texture\b': 'nano texture', r'\bteardrop-shaped\b': 'teardrop shaped',
    # "live" as a verb (/lɪv/), not the adjective (/laɪv/)
    r'\bfiles live\b': 'files liv',
    # unstressed "it's" after "Closed," came out clipped ("Closed, 's a phone"): give it a fresh start
    r'\bClosed, it\'s\b': 'Closed, [0.15] It\'s'}
H = os.path.expanduser('~/.cache/hyperframes/tts/')
model = kokoro_onnx.Kokoro(H + 'models/kokoro-v1.0.onnx', H + 'voices/voices-v1.0.bin')
beats, out, speed = json.load(open(sys.argv[1])), sys.argv[2], float(sys.argv[3])
only = set(sys.argv[4:])
r = 24000
dur_path = f'{out}/durations.json'
durs = json.load(open(dur_path)) if os.path.exists(dur_path) else {}
for b in beats:
    if only and b['id'] not in only:
        continue
    text = b['text']
    for pat, rep in LEXICON.items():
        text = re.sub(pat, rep, text)
    parts = re.split(r'\s*\[(\d*\.?\d+)\]\s*', text)
    audio = []
    for i, part in enumerate(parts):
        if i % 2:
            audio.append(np.zeros(int(float(part) * r), dtype=np.float32))
        elif part.strip():
            a, r = model.create(part, voice='am_michael', speed=speed, lang='en-us')
            audio.append(a)
    s = np.concatenate(audio)
    sf.write(f"{out}/{b['id']}.wav", s, r)
    durs[b['id']] = round(len(s) / r, 3)
    print(b['id'], durs[b['id']], '|', text[:70])
json.dump(durs, open(dur_path, 'w'), indent=1)
